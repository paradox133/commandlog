const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3085;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Database setup
const db = new Database(path.join(dataDir, 'commands.db'));
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    commandType TEXT NOT NULL,
    command TEXT NOT NULL,
    target TEXT DEFAULT '',
    result TEXT DEFAULT '',
    exitCode INTEGER DEFAULT 0,
    success INTEGER DEFAULT 1,
    duration INTEGER DEFAULT 0,
    sessionId TEXT DEFAULT '',
    ticketId TEXT DEFAULT '',
    metadata TEXT DEFAULT '{}',
    createdAt TEXT DEFAULT (datetime('now','localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_cmd_agent ON commands(agent);
  CREATE INDEX IF NOT EXISTS idx_cmd_type ON commands(commandType);
  CREATE INDEX IF NOT EXISTS idx_cmd_created ON commands(createdAt);
  CREATE INDEX IF NOT EXISTS idx_cmd_ticket ON commands(ticketId);

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    agent TEXT NOT NULL,
    startedAt TEXT DEFAULT (datetime('now','localtime')),
    endedAt TEXT DEFAULT '',
    commandCount INTEGER DEFAULT 0,
    description TEXT DEFAULT ''
  );
`);

app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// POST /api/commands — log a command
app.post('/api/commands', (req, res) => {
  try {
    const {
      agent, commandType, command, target = '', result = '',
      exitCode = 0, success = 1, duration = 0,
      sessionId = '', ticketId = '', metadata = '{}'
    } = req.body;

    if (!agent || !commandType || !command) {
      return res.status(400).json({ error: 'agent, commandType, command are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO commands (agent, commandType, command, target, result, exitCode, success, duration, sessionId, ticketId, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(agent, commandType, command, target, result, exitCode, success ? 1 : 0, duration, sessionId, ticketId,
      typeof metadata === 'object' ? JSON.stringify(metadata) : metadata);

    // Update session command count
    if (sessionId) {
      db.prepare(`UPDATE sessions SET commandCount = commandCount + 1 WHERE id = ?`).run(sessionId);
    }

    res.status(201).json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/commands — search
app.get('/api/commands', (req, res) => {
  try {
    const { agent, type, ticket, from, to, q, limit = 50, offset = 0 } = req.query;

    let where = [];
    let params = [];

    if (agent) { where.push('agent = ?'); params.push(agent); }
    if (type) { where.push('commandType = ?'); params.push(type); }
    if (ticket) { where.push('ticketId = ?'); params.push(ticket); }
    if (from) { where.push('createdAt >= ?'); params.push(from); }
    if (to) { where.push('createdAt <= ?'); params.push(to); }
    if (q) { where.push('(command LIKE ? OR result LIKE ? OR target LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM commands ${whereClause}`).get(...params);
    const rows = db.prepare(`
      SELECT * FROM commands ${whereClause}
      ORDER BY createdAt DESC, id DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), parseInt(offset));

    res.json({ total: countRow.total, rows, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/commands/replay/:sessionId — MUST be before /:id
app.get('/api/commands/replay/:sessionId', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM commands WHERE sessionId = ?
      ORDER BY createdAt ASC, id ASC
    `).all(req.params.sessionId);
    const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(req.params.sessionId);
    res.json({ session: session || null, commands: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/commands/:id
app.get('/api/commands/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM commands WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats
app.get('/api/stats', (req, res) => {
  try {
    const total = db.prepare(`SELECT COUNT(*) as count FROM commands`).get().count;
    const successCount = db.prepare(`SELECT COUNT(*) as count FROM commands WHERE success = 1`).get().count;
    const avgDuration = db.prepare(`SELECT AVG(duration) as avg FROM commands`).get().avg || 0;
    const byAgent = db.prepare(`SELECT agent, COUNT(*) as count FROM commands GROUP BY agent ORDER BY count DESC`).all();
    const byType = db.prepare(`SELECT commandType, COUNT(*) as count FROM commands GROUP BY commandType ORDER BY count DESC`).all();
    const failedRecent = db.prepare(`SELECT * FROM commands WHERE success = 0 ORDER BY createdAt DESC LIMIT 10`).all();
    res.json({
      total,
      successCount,
      failCount: total - successCount,
      successRate: total > 0 ? Math.round((successCount / total) * 100) : 0,
      avgDuration: Math.round(avgDuration),
      byAgent,
      byType,
      failedRecent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/timeline
app.get('/api/stats/timeline', (req, res) => {
  try {
    const { mode } = req.query; // 'hour' or 'day'
    let rows;
    if (mode === 'day') {
      rows = db.prepare(`
        SELECT strftime('%Y-%m-%d', createdAt) as period, COUNT(*) as count
        FROM commands
        WHERE createdAt >= datetime('now', '-30 days', 'localtime')
        GROUP BY period ORDER BY period ASC
      `).all();
    } else {
      rows = db.prepare(`
        SELECT strftime('%Y-%m-%d %H:00', createdAt) as period, COUNT(*) as count
        FROM commands
        WHERE createdAt >= datetime('now', '-1 day', 'localtime')
        GROUP BY period ORDER BY period ASC
      `).all();
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents
app.get('/api/agents', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT agent, COUNT(*) as commandCount,
             SUM(CASE WHEN success=1 THEN 1 ELSE 0 END) as successCount,
             MAX(createdAt) as lastActive
      FROM commands GROUP BY agent ORDER BY commandCount DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sessions API
app.post('/api/sessions', (req, res) => {
  try {
    const { id, agent, description = '' } = req.body;
    db.prepare(`INSERT OR REPLACE INTO sessions (id, agent, description) VALUES (?, ?, ?)`).run(id, agent, description);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM sessions ORDER BY startedAt DESC LIMIT 50`).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`CommandLog backend running on port ${PORT}`);
});
