// Explicit one-time migration for an empty TEST competition, never an active league.
import {Pool} from 'pg';
import {makeCombatContracts} from '../shared/contracts';
import {weekWindow} from '../shared/weekly';
import rules from '../shared/rules-manifest.json';
if(process.env.TEST_PRICING!=='true'||process.env.MAINNET_TEST_ENABLED!=='1')throw Error('Only the configured test deployment may migrate an empty week.');
const pool=new Pool({connectionString:process.env.DATABASE_URL});
async function migrate(){const db=await pool.connect();try{await db.query('BEGIN');const window=weekWindow();const row=(await db.query('SELECT manifest,finalized_at FROM league_weeks WHERE week=$1 FOR UPDATE',[window.week])).rows[0];if(!row||row.finalized_at)throw Error('No open test week');
 if(row.manifest.rulesHash===rules.rulesHash&&row.manifest.contracts.every((c:{level:{combat?:unknown}})=>c.level.combat)){console.log('Week already uses combat.');await db.query('ROLLBACK');return;}
 const busy=await db.query("SELECT 1 FROM ranked_runs WHERE manifest->'contract'->>'week'=$1 AND (status IN ('verified','verifying','error') OR (status='issued' AND expires_at>now())) LIMIT 1",[window.week]);if(busy.rowCount)throw Error('Refusing to change a week with a completed, pending, or recoverable result.');
 await db.query('CREATE TABLE IF NOT EXISTS league_manifest_backups (week date NOT NULL, rules_hash text NOT NULL, manifest jsonb NOT NULL, backed_up_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(week,rules_hash))');
 await db.query('INSERT INTO league_manifest_backups(week,rules_hash,manifest) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[window.week,row.manifest.rulesHash,row.manifest]);
 const manifest={...window,rulesHash:rules.rulesHash,contracts:makeCombatContracts()};await db.query('UPDATE league_weeks SET manifest=$2 WHERE week=$1',[window.week,manifest]);await db.query('COMMIT');console.log(JSON.stringify({week:window.week,rulesHash:rules.rulesHash,contracts:manifest.contracts.map(c=>c.id),oldManifestBackedUp:true,previousAttemptsPreserved:true}));
 }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();await pool.end();}}
migrate().catch(e=>{console.error(e.message);process.exitCode=1;});
