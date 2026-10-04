// frozen published campaign levels. publishing inserts once; nothing updates a row after it is live.
import type {Pool} from 'pg';
import type {LevelDefinition} from '../src/game/level';
import {buildCampaignLevel,type CampaignRecipe} from '../shared/campaign-levels';
import bundled from '../src/campaign/published-levels.json';
import rules from '../shared/rules-manifest.json';
import engine from '../shared/weekly-engine.json';
export type PublishedLevel={number:number;batch:number;recipe:CampaignRecipe;definition:LevelDefinition;rulesHash:string;engineHash:string;boss:string|null;title:string;zone:string;publishedAt:string};
export type PublicLevel={number:number;title:string;zone:string;boss:string|null;definition:LevelDefinition;rulesHash:string;engineHash:string};
export const LEVEL_PAGE=100;
/** the batch shipped inside the app is published on boot so a fresh database serves what the client already shows.
 * rows are regenerated from their recipes and must match the bundle bit for bit, otherwise nothing is inserted */
export async function seedCampaignLevels(pool:Pool,warn:(message:string)=>void=console.warn):Promise<number>{
 if(bundled.rulesHash!==rules.rulesHash||bundled.engineHash!==engine.engineHash){warn('Bundled campaign levels were built for another rules hash; nothing seeded.');return 0;}
 const rows:Omit<PublishedLevel,'publishedAt'>[]=[];
 for(const level of bundled.levels){
  const recipe=level.recipe as CampaignRecipe;
  if(recipe?.number!==level.number||JSON.stringify(buildCampaignLevel(recipe))!==JSON.stringify(level.definition)){warn(`Bundled level ${level.number} no longer matches its recipe; nothing seeded.`);return 0;}
  rows.push({number:level.number,batch:Math.ceil((level.number-12)/50),recipe,definition:level.definition as LevelDefinition,rulesHash:bundled.rulesHash,engineHash:bundled.engineHash,boss:level.boss,title:level.title,zone:level.zone});
 }
 return (await new CampaignLevelStore(pool).publish(rows)).length;
}
const columns='number,batch,recipe,definition,rules_hash AS "rulesHash",engine_hash AS "engineHash",boss,title,zone,published_at AS "publishedAt"';
export class CampaignLevelStore{
 constructor(private pool:Pool){}
 async latest():Promise<number>{const r=await this.pool.query('SELECT COALESCE(MAX(number),12)::int AS n FROM campaign_levels');return r.rows[0].n;}
 async get(number:number):Promise<PublishedLevel|null>{const r=await this.pool.query(`SELECT ${columns} FROM campaign_levels WHERE number=$1`,[number]);return r.rows[0]??null;}
 async list(from:number,to:number):Promise<PublicLevel[]>{
  const r=await this.pool.query(`SELECT ${columns} FROM campaign_levels WHERE number BETWEEN $1 AND $2 ORDER BY number LIMIT ${LEVEL_PAGE}`,[from,to]);
  return r.rows.map((row:PublishedLevel)=>({number:row.number,title:row.title,zone:row.zone,boss:row.boss,definition:row.definition,rulesHash:row.rulesHash,engineHash:row.engineHash}));
 }
 /** inserts new rows only; an existing number is left exactly as published. levels are published in one
  * contiguous run from the latest row so the map never has a hole */
 async publish(rows:Omit<PublishedLevel,'publishedAt'>[]):Promise<number[]>{
  if(!rows.length)return [];
  rows=[...rows].sort((a,b)=>a.number-b.number);
  for(let i=1;i<rows.length;i++)if(rows[i]!.number!==rows[i-1]!.number+1)throw new Error('Campaign levels must be published as one contiguous run.');
  const latest=await this.latest();if(rows[0]!.number>latest+1)throw new Error(`Campaign levels must continue from ${latest+1}.`);
  const inserted:number[]=[];
  for(const row of rows){const r=await this.pool.query('INSERT INTO campaign_levels(number,batch,recipe,definition,rules_hash,engine_hash,boss,title,zone) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(number) DO NOTHING RETURNING number',[row.number,row.batch,row.recipe,row.definition,row.rulesHash,row.engineHash,row.boss,row.title,row.zone]);if(r.rowCount)inserted.push(row.number);}
  return inserted;
 }
}
