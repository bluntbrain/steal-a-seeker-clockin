// frozen published campaign levels. publishing inserts once; nothing updates a row after it is live.
import type {Pool} from 'pg';
import type {LevelDefinition} from '../src/game/level';
import type {CampaignRecipe} from '../shared/campaign-levels';
export type PublishedLevel={number:number;batch:number;recipe:CampaignRecipe;definition:LevelDefinition;rulesHash:string;engineHash:string;boss:string|null;title:string;zone:string;publishedAt:string};
export type PublicLevel={number:number;title:string;zone:string;boss:string|null;definition:LevelDefinition;rulesHash:string;engineHash:string};
export const LEVEL_PAGE=100;
const columns='number,batch,recipe,definition,rules_hash AS "rulesHash",engine_hash AS "engineHash",boss,title,zone,published_at AS "publishedAt"';
export class CampaignLevelStore{
 constructor(private pool:Pool){}
 async latest():Promise<number>{const r=await this.pool.query('SELECT COALESCE(MAX(number),12)::int AS n FROM campaign_levels');return r.rows[0].n;}
 async get(number:number):Promise<PublishedLevel|null>{const r=await this.pool.query(`SELECT ${columns} FROM campaign_levels WHERE number=$1`,[number]);return r.rows[0]??null;}
 async list(from:number,to:number):Promise<PublicLevel[]>{
  const r=await this.pool.query(`SELECT ${columns} FROM campaign_levels WHERE number BETWEEN $1 AND $2 ORDER BY number LIMIT ${LEVEL_PAGE}`,[from,to]);
  return r.rows.map((row:PublishedLevel)=>({number:row.number,title:row.title,zone:row.zone,boss:row.boss,definition:row.definition,rulesHash:row.rulesHash,engineHash:row.engineHash}));
 }
 /** inserts new rows only; an existing number is left exactly as published */
 async publish(rows:Omit<PublishedLevel,'publishedAt'>[]):Promise<number[]>{
  const inserted:number[]=[];
  for(const row of rows){const r=await this.pool.query('INSERT INTO campaign_levels(number,batch,recipe,definition,rules_hash,engine_hash,boss,title,zone) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(number) DO NOTHING RETURNING number',[row.number,row.batch,row.recipe,row.definition,row.rulesHash,row.engineHash,row.boss,row.title,row.zone]);if(r.rowCount)inserted.push(row.number);}
  return inserted;
 }
}
