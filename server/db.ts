import {URL} from 'node:url';
import {Pool,type PoolClient} from 'pg';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export function database(url:string){return new Pool({connectionString:url,max:6,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});}
export async function transaction<T>(pool:Pool,fn:(client:PoolClient)=>Promise<T>){const client=await pool.connect();try{await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}
export async function migrate(pool:Pool){
 const files=[['001-commerce','schema.sql'],['002-payment-lifetimes','002-payment-lifetimes.sql'],['003-ranked-runs','003-ranked-runs.sql'],['004-returns','004-returns.sql'],['005-paid-entries','005-paid-entries.sql'],['006-paid-start-key','006-paid-start-key.sql'],['007-operator-review','007-operator-review.sql'],['008-campaign-rewards','008-campaign-rewards.sql']] as const;
 await transaction(pool,async db=>{
  await db.query('SELECT pg_advisory_xact_lock(1936024939)');await db.query('CREATE TABLE IF NOT EXISTS schema_migrations(id text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  for(const [id,file]of files){const sql=await readFile(new URL(`./${file}`,import.meta.url),'utf8'),checksum=createHash('sha256').update(sql).digest('hex');const previous=await db.query('SELECT checksum FROM schema_migrations WHERE id=$1',[id]);if(previous.rowCount){if(previous.rows[0].checksum!==checksum)throw new Error('Applied migration changed. Add a new migration instead.');continue;}await db.query(sql);await db.query('INSERT INTO schema_migrations(id,checksum) VALUES($1,$2)',[id,checksum]);}
 });
}
