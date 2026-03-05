#!/usr/bin/env node
// Seed script — 30 realistic commands from today's sprint

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'commands.db'));

// Sessions
const sessions = [
  { id: 'rex-sprint-259-deploy', agent: 'rex', description: 'TKT-259 deployment sprint' },
  { id: 'rex-sprint-259-git', agent: 'rex', description: 'TKT-259 git ops' },
  { id: 'quinn-qa-259', agent: 'quinn', description: 'QA checks TKT-259' },
  { id: 'dick-ticket-ops', agent: 'dick', description: 'Ticket management & config' },
  { id: 'sentry-health-20260305', agent: 'sentry', description: 'Daily health sweep' },
];

const insertSession = db.prepare(`INSERT OR IGNORE INTO sessions (id, agent, description, commandCount) VALUES (?, ?, ?, ?)`);
sessions.forEach(s => insertSession.run(s.id, s.agent, s.description, 0));

// Helper to get timestamp minutes ago
function minsAgo(n) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - n);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

const commands = [
  // ── rex: ssh deploys (10) ──────────────────────────────────────────────
  {
    agent: 'rex', commandType: 'ssh', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-259',
    command: 'ssh deploy@192.168.1.166 "docker compose -p commandlog up -d --build"',
    target: '192.168.1.166', result: 'Building commandlog-backend\nBuilding commandlog-frontend\nStarting commandlog-backend ... done\nStarting commandlog-frontend ... done',
    exitCode: 0, success: 1, duration: 14230, createdAt: minsAgo(58)
  },
  {
    agent: 'rex', commandType: 'ssh', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-259',
    command: 'ssh deploy@192.168.1.166 "mkdir -p /mnt/TrueNASShare2/Project\\ Data/CommandLog/app/data"',
    target: '192.168.1.166', result: '', exitCode: 0, success: 1, duration: 342, createdAt: minsAgo(62)
  },
  {
    agent: 'rex', commandType: 'ssh', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-259',
    command: 'ssh deploy@192.168.1.166 "curl -s http://localhost:3085/api/health"',
    target: '192.168.1.166', result: '{"status":"ok","ts":"2026-03-05T17:42:00.000Z"}',
    exitCode: 0, success: 1, duration: 89, createdAt: minsAgo(55)
  },
  {
    agent: 'rex', commandType: 'ssh', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-259',
    command: 'ssh deploy@192.168.1.166 "docker logs commandlog-backend --tail 20"',
    target: '192.168.1.166', result: 'CommandLog backend running on port 3085',
    exitCode: 0, success: 1, duration: 211, createdAt: minsAgo(54)
  },
  {
    agent: 'rex', commandType: 'ssh', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-259',
    command: 'ssh deploy@192.168.1.166 "docker ps --filter name=commandlog"',
    target: '192.168.1.166', result: 'CONTAINER ID   IMAGE                    STATUS\nabc123   commandlog-backend   Up 2 minutes\ndef456   commandlog-frontend  Up 2 minutes',
    exitCode: 0, success: 1, duration: 156, createdAt: minsAgo(53)
  },
  {
    agent: 'rex', commandType: 'ssh', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-245',
    command: 'ssh deploy@192.168.1.166 "docker compose -p appaccountmanager pull"',
    target: '192.168.1.166', result: 'Pulling backend ... done\nPulling frontend ... done',
    exitCode: 0, success: 1, duration: 8940, createdAt: minsAgo(90)
  },
  {
    agent: 'rex', commandType: 'ssh', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-245',
    command: 'ssh deploy@192.168.1.166 "docker compose -p appaccountmanager up -d"',
    target: '192.168.1.166', result: 'Starting appaccountmanager-backend ... done\nStarting appaccountmanager-frontend ... done',
    exitCode: 0, success: 1, duration: 4210, createdAt: minsAgo(88)
  },
  {
    agent: 'rex', commandType: 'ssh', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-251',
    command: 'ssh deploy@192.168.1.166 "docker compose -p gc-manager up -d --build"',
    target: '192.168.1.166', result: 'ERROR: Build failed — node_modules not found',
    exitCode: 1, success: 0, duration: 3100, createdAt: minsAgo(100)
  },
  {
    agent: 'rex', commandType: 'ssh', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-251',
    command: 'ssh deploy@192.168.1.166 "docker compose -p gc-manager up -d --build --no-cache"',
    target: '192.168.1.166', result: 'Building gc-manager-backend\nBuilding gc-manager-frontend\nStarting gc-manager-backend ... done',
    exitCode: 0, success: 1, duration: 28400, createdAt: minsAgo(97)
  },
  {
    agent: 'rex', commandType: 'ssh', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-259',
    command: 'ssh deploy@192.168.1.166 "node /mnt/TrueNASShare2/Project\\ Data/CommandLog/app/seed.js"',
    target: '192.168.1.166', result: 'Seeded 30 commands successfully',
    exitCode: 0, success: 1, duration: 1240, createdAt: minsAgo(50)
  },

  // ── rex: docker compose (5) ───────────────────────────────────────────
  {
    agent: 'rex', commandType: 'docker', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-259',
    command: 'docker compose -p commandlog build --no-cache',
    target: 'localhost', result: 'Successfully built commandlog-backend\nSuccessfully built commandlog-frontend',
    exitCode: 0, success: 1, duration: 23100, createdAt: minsAgo(70)
  },
  {
    agent: 'rex', commandType: 'docker', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-259',
    command: 'docker compose -p commandlog up -d',
    target: 'localhost', result: 'Creating commandlog-backend ... done\nCreating commandlog-frontend ... done',
    exitCode: 0, success: 1, duration: 2890, createdAt: minsAgo(68)
  },
  {
    agent: 'rex', commandType: 'docker', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-259',
    command: 'docker compose -p commandlog ps',
    target: 'localhost', result: 'NAME                   STATUS\ncommandlog-backend     Up\ncommandlog-frontend    Up',
    exitCode: 0, success: 1, duration: 178, createdAt: minsAgo(67)
  },
  {
    agent: 'rex', commandType: 'docker', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-248',
    command: 'docker system prune -f --volumes',
    target: 'localhost', result: 'Deleted Volumes:\nlocal_vol_abc\nTotal reclaimed space: 2.3GB',
    exitCode: 0, success: 1, duration: 4400, createdAt: minsAgo(110)
  },
  {
    agent: 'rex', commandType: 'docker', sessionId: 'rex-sprint-259-deploy', ticketId: 'TKT-259',
    command: 'docker compose -p commandlog logs backend --tail 50',
    target: 'localhost', result: 'commandlog-backend | CommandLog backend running on port 3085',
    exitCode: 0, success: 1, duration: 220, createdAt: minsAgo(52)
  },

  // ── rex: git (3) ─────────────────────────────────────────────────────
  {
    agent: 'rex', commandType: 'git', sessionId: 'rex-sprint-259-git', ticketId: 'TKT-259',
    command: 'git add . && git commit -m "feat: CommandLog initial build (TKT-259)"',
    target: '/workspace/commandlog', result: '[main abc1234] feat: CommandLog initial build (TKT-259)\n 14 files changed, 892 insertions(+)',
    exitCode: 0, success: 1, duration: 890, createdAt: minsAgo(48)
  },
  {
    agent: 'rex', commandType: 'git', sessionId: 'rex-sprint-259-git', ticketId: 'TKT-259',
    command: 'git push origin main',
    target: 'github.com/yujiezhang/commandlog', result: 'Enumerating objects: 18\nTo github.com:yujiezhang/commandlog.git\n   abc1234..def5678  main -> main',
    exitCode: 0, success: 1, duration: 3200, createdAt: minsAgo(46)
  },
  {
    agent: 'rex', commandType: 'git', sessionId: 'rex-sprint-259-git', ticketId: 'TKT-245',
    command: 'git push origin main --tags',
    target: 'github.com/yujiezhang/appaccountmanager', result: 'To github.com:yujiezhang/appaccountmanager.git\n * [new tag] v1.3.2 -> v1.3.2',
    exitCode: 0, success: 1, duration: 2800, createdAt: minsAgo(85)
  },

  // ── quinn: curl QA (5) ────────────────────────────────────────────────
  {
    agent: 'quinn', commandType: 'api_call', sessionId: 'quinn-qa-259', ticketId: 'TKT-259',
    command: 'curl -s http://192.168.1.166:3085/api/health | jq',
    target: 'http://192.168.1.166:3085/api/health', result: '{"status":"ok","ts":"2026-03-05T22:44:00.000Z"}',
    exitCode: 0, success: 1, duration: 112, createdAt: minsAgo(45)
  },
  {
    agent: 'quinn', commandType: 'api_call', sessionId: 'quinn-qa-259', ticketId: 'TKT-259',
    command: 'curl -s "http://192.168.1.166:3085/api/commands?limit=10" | jq .total',
    target: 'http://192.168.1.166:3085/api/commands', result: '30',
    exitCode: 0, success: 1, duration: 134, createdAt: minsAgo(44)
  },
  {
    agent: 'quinn', commandType: 'api_call', sessionId: 'quinn-qa-259', ticketId: 'TKT-259',
    command: 'curl -s http://192.168.1.166:3085/api/stats | jq .successRate',
    target: 'http://192.168.1.166:3085/api/stats', result: '87',
    exitCode: 0, success: 1, duration: 98, createdAt: minsAgo(43)
  },
  {
    agent: 'quinn', commandType: 'api_call', sessionId: 'quinn-qa-259', ticketId: 'TKT-259',
    command: 'curl -s http://192.168.1.166:8270/ | grep -c "CommandLog"',
    target: 'http://192.168.1.166:8270', result: '3',
    exitCode: 0, success: 1, duration: 201, createdAt: minsAgo(42)
  },
  {
    agent: 'quinn', commandType: 'api_call', sessionId: 'quinn-qa-259', ticketId: 'TKT-259',
    command: 'curl -X POST http://192.168.1.166:3085/api/commands -H "Content-Type: application/json" -d \'{"agent":"test","commandType":"ssh","command":"echo test"}\'',
    target: 'http://192.168.1.166:3085/api/commands', result: 'ERROR: Connection refused',
    exitCode: 7, success: 0, duration: 5000, createdAt: minsAgo(47)
  },

  // ── dick: API calls (3) & config changes (2) ─────────────────────────
  {
    agent: 'dick', commandType: 'api_call', sessionId: 'dick-ticket-ops', ticketId: 'TKT-259',
    command: 'POST http://192.168.1.166:3008/api/tickets {title: "TKT-259: CommandLog", status: "in_progress"}',
    target: 'http://192.168.1.166:3008/api/tickets', result: '{"id":"TKT-259","status":"created"}',
    exitCode: 0, success: 1, duration: 445, createdAt: minsAgo(120)
  },
  {
    agent: 'dick', commandType: 'api_call', sessionId: 'dick-ticket-ops', ticketId: 'TKT-258',
    command: 'POST http://192.168.1.166:3008/api/tickets {title: "TKT-258: Infra cleanup", status: "open"}',
    target: 'http://192.168.1.166:3008/api/tickets', result: '{"id":"TKT-258","status":"created"}',
    exitCode: 0, success: 1, duration: 312, createdAt: minsAgo(140)
  },
  {
    agent: 'dick', commandType: 'api_call', sessionId: 'dick-ticket-ops', ticketId: 'TKT-257',
    command: 'PATCH http://192.168.1.166:3008/api/tickets/TKT-257 {status: "done"}',
    target: 'http://192.168.1.166:3008/api/tickets/TKT-257', result: '{"id":"TKT-257","status":"done"}',
    exitCode: 0, success: 1, duration: 289, createdAt: minsAgo(130)
  },
  {
    agent: 'dick', commandType: 'config_change', sessionId: 'dick-ticket-ops', ticketId: '',
    command: 'update /etc/nginx/sites-enabled/commandlog.conf — add upstream proxy_pass',
    target: '/etc/nginx/sites-enabled/commandlog.conf', result: 'nginx: configuration file /etc/nginx/nginx.conf test is successful',
    exitCode: 0, success: 1, duration: 1100, createdAt: minsAgo(115)
  },
  {
    agent: 'dick', commandType: 'config_change', sessionId: 'dick-ticket-ops', ticketId: '',
    command: 'update /home/node/.openclaw/workspace-shared/CONTEXT.md — add CommandLog port 8270/3085',
    target: '/home/node/.openclaw/workspace-shared/CONTEXT.md', result: 'File updated successfully',
    exitCode: 0, success: 1, duration: 180, createdAt: minsAgo(48)
  },

  // ── sentry: health checks (2) ─────────────────────────────────────────
  {
    agent: 'sentry', commandType: 'api_call', sessionId: 'sentry-health-20260305', ticketId: '',
    command: 'curl -s http://192.168.1.166:3085/api/health && curl -s http://192.168.1.166:8270/',
    target: '192.168.1.166', result: '{"status":"ok"} — HTTP 200 OK',
    exitCode: 0, success: 1, duration: 230, createdAt: minsAgo(30)
  },
  {
    agent: 'sentry', commandType: 'ssh', sessionId: 'sentry-health-20260305', ticketId: '',
    command: 'ssh monitor@192.168.1.166 "df -h | awk \'$5>90{print $0}\'"',
    target: '192.168.1.166', result: 'No volumes above 90% — all clear',
    exitCode: 0, success: 1, duration: 310, createdAt: minsAgo(29)
  },
];

const insertCmd = db.prepare(`
  INSERT INTO commands (agent, commandType, command, target, result, exitCode, success, duration, sessionId, ticketId, metadata, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let count = 0;
const insertMany = db.transaction(() => {
  for (const c of commands) {
    insertCmd.run(
      c.agent, c.commandType, c.command, c.target || '', c.result || '',
      c.exitCode ?? 0, c.success ?? 1, c.duration ?? 0,
      c.sessionId || '', c.ticketId || '', '{}', c.createdAt
    );
    count++;
  }
});

insertMany();

// Update session command counts
const updateCount = db.prepare(`
  UPDATE sessions SET commandCount = (SELECT COUNT(*) FROM commands WHERE sessionId = sessions.id)
`);
updateCount.run();

console.log(`Seeded ${count} commands successfully`);
db.close();
