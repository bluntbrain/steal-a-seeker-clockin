// Upload only the API Docker context, never local credentials or game media.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const [project, environment, service] = process.argv.slice(2);
if (!project || !environment || !service) throw Error('Usage: node scripts/deploy-api.cjs PROJECT_ID ENVIRONMENT_ID SERVICE_ID');
const root = path.resolve(__dirname, '..');
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'seeker-api-deploy-'));
try {
  for (const name of ['server', 'shared', 'src/game']) {
    fs.cpSync(path.join(root, name), path.join(stage, name), {recursive: true,
      filter: source => !/^(node_modules|\.env.*)$/.test(path.basename(source)) && !/\.(pem|key|jks|keystore|log)$/.test(source)});
  }
  for (const name of ['Dockerfile.api', 'railway.toml', '.dockerignore']) fs.copyFileSync(path.join(root, name), path.join(stage, name));
  const result = cp.spawnSync('railway', ['up', stage, '--path-as-root', '--project', project,
    '--environment', environment, '--service', service, '--detach', '-m', 'Deploy Steal a Seeker devnet API'], {
    cwd: root, stdio: 'inherit', env: {...process.env, RAILWAY_CALLER: 'skill:use-railway@1.2.0',
      RAILWAY_AGENT_SESSION: process.env.RAILWAY_AGENT_SESSION || crypto.randomUUID()}});
  process.exitCode = result.status ?? 1;
} finally { fs.rmSync(stage, {recursive: true, force: true}); }
