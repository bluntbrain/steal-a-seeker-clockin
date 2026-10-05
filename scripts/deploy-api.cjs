// Upload only the API Docker context, never local credentials or game media.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const args = process.argv.slice(2), dryRun = args.includes('--dry-run');
const [project, environment, service] = args.filter(arg => arg !== '--dry-run');
if (!dryRun && (!project || !environment || !service)) throw Error('Usage: node scripts/deploy-api.cjs PROJECT_ID ENVIRONMENT_ID SERVICE_ID');
const root = path.resolve(__dirname, '..');
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'seeker-api-deploy-'));
try {
  for (const name of ['server', 'shared', 'src/game']) {
    fs.cpSync(path.join(root, name), path.join(stage, name), {recursive: true,
      filter: source => !/^(node_modules|\.env.*)$/.test(path.basename(source)) && !/\.(pem|key|jks|keystore|p12|pfx|log)$/.test(source) && !/^(release-signing|mainnet-treasury|devnet-treasury)\.json$/.test(path.basename(source))});
  }
  // the server seeds the bundled campaign levels on boot, so the bundle ships with the api context
  fs.mkdirSync(path.join(stage, 'src/campaign'), {recursive: true});
  fs.copyFileSync(path.join(root, 'src/campaign/published-levels.json'), path.join(stage, 'src/campaign/published-levels.json'));
  // the api publishes levels itself, so the solver ships with it
  fs.mkdirSync(path.join(stage, 'scripts'), {recursive: true});
  for (const name of ['scripts/qa-combat.ts', 'scripts/qa-tactical.ts']) fs.copyFileSync(path.join(root, name), path.join(stage, name));
  for (const name of ['Dockerfile.api', 'railway.toml', '.dockerignore']) fs.copyFileSync(path.join(root, name), path.join(stage, name));
  const files = fs.readdirSync(stage, {recursive: true}).map(name => path.join(stage, name)).filter(file => fs.statSync(file).isFile());
  const bytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  console.log(JSON.stringify({files: files.length, bytes, megabytes: Number((bytes / 1e6).toFixed(2)), dryRun}));
  // This is our budget, not a claimed Railway platform limit.
  if (bytes > 25e6) throw Error('API context exceeds our 25 MB budget. Inspect the staged inputs before uploading.');
  if (!dryRun) {
  const result = cp.spawnSync('railway', ['up', stage, '--path-as-root', '--project', project,
    '--environment', environment, '--service', service, '--detach', '-m', 'Deploy Steal a Seeker API'], {
    cwd: root, stdio: 'inherit', env: {...process.env, RAILWAY_CALLER: 'skill:use-railway@1.2.0',
      RAILWAY_AGENT_SESSION: process.env.RAILWAY_AGENT_SESSION || crypto.randomUUID()}});
  process.exitCode = result.status ?? 1;
  }
} finally { fs.rmSync(stage, {recursive: true, force: true}); }
