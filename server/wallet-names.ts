import {PublicKey,Connection} from '@solana/web3.js';
import {TldParser} from '@onsol/tldparser';
import {isSkrName} from '../shared/wallet-name';
import type {CampaignBoard} from '../shared/economy';
import type {Pool} from 'pg';

export type NameLookup=(wallets:string[],signal:AbortSignal,onResult?:(wallet:string,name:string|null)=>void)=>Promise<Map<string,string|null>>;
type Parser={getMainDomains(wallets:string[]):Promise<(string|null)[]>;getParsedAllUserDomainsFromTld(wallet:string,tld:string,concurrency?:number):Promise<{domain:string}[]>;getOwnerFromDomainTld(name:string):Promise<{toString():string}|string|undefined>};
/** Missing entries are failed reads, distinct from a confirmed absence (null). */
export async function lookupSkrNames(parser:Parser,wallets:string[],signal:AbortSignal,onResult?:(wallet:string,name:string|null)=>void):Promise<Map<string,string|null>>{
 const result=new Map<string,string|null>();
 const record=(wallet:string,name:string|null)=>{if(!signal.aborted){result.set(wallet,name);onResult?.(wallet,name);}};
 let main:(string|null)[]=[];
 try{main=await parser.getMainDomains(wallets);}catch{/* Owned-name fallback can still succeed. */}
 let next=0;
 await Promise.all(Array.from({length:Math.min(3,wallets.length)},async()=>{
  while(next<wallets.length&&!signal.aborted){
   const index=next++,wallet=wallets[index]!;
   try{
    const primary=main[index];
    if(isSkrName(primary)&&(await parser.getOwnerFromDomainTld(primary))?.toString()===wallet){record(wallet,primary);continue;}
    if(signal.aborted)break;
    const owned=await parser.getParsedAllUserDomainsFromTld(wallet,'skr',2);
    const candidates=[...new Set(owned.map(r=>r.domain).filter(isSkrName))].sort();
    // Bound verification work for wallets holding many names. Unchecked is not absent.
    let found=false;
    for(const name of candidates.slice(0,8)){
     if(signal.aborted)break;
     if((await parser.getOwnerFromDomainTld(name))?.toString()===wallet){record(wallet,name);found=true;break;}
    }
    if(!found&&!signal.aborted&&candidates.length<=8)record(wallet,null);
   }catch{/* Do not cache an RPC error as "no name". */}
  }
 }));
 return result;
}
export function allDomainsLookup(rpcUrl:string):NameLookup{
 return async(wallets,signal,onResult)=>{
  const connection=new Connection(rpcUrl,{commitment:'confirmed',disableRetryOnRateLimit:true,
   fetch:async(input,init)=>fetch(input,{...init,signal})});
  return lookupSkrNames(new TldParser(connection),wallets,signal,onResult);
 };
}

type CacheEntry={name:string|null;until:number};
export class WalletNames{
 private cache=new Map<string,CacheEntry>();
 private queued=new Set<string>();
 private pending=new Set<string>();
 private busy=false;
 private stopped=false;
 private active?:AbortController;
 constructor(private lookup:NameLookup,private options:{now?:()=>number;positiveMs?:number;negativeMs?:number;retryMs?:number;timeoutMs?:number;maxEntries?:number;maxPending?:number}={}){}
 private now(){return (this.options.now??Date.now)();}
 private queue(wallet:string){
  if(this.stopped||this.pending.has(wallet)||this.pending.size>=(this.options.maxPending??500))return;
  const cached=this.cache.get(wallet);if(cached&&cached.until>this.now())return;
  try{if(new PublicKey(wallet).toBase58()!==wallet)return;}catch{return;}
  this.queued.add(wallet);this.pending.add(wallet);
  if(!this.busy){this.busy=true;queueMicrotask(()=>void this.pump());}
 }
 private async pump(){
  try{
   while(this.queued.size&&!this.stopped){
    const wallets=[...this.queued].slice(0,20);wallets.forEach(w=>this.queued.delete(w));
    const controller=new AbortController();this.active=controller;
    let timer:ReturnType<typeof setTimeout>|undefined;
    const names=new Map<string,string|null>();
    try{
     const completed=await Promise.race([this.lookup(wallets,controller.signal,(wallet,name)=>{if(!controller.signal.aborted&&wallets.includes(wallet))names.set(wallet,name);}),new Promise<Map<string,string|null>>(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(new Map());},this.options.timeoutMs??8000);})]);
     for(const [wallet,name] of completed)names.set(wallet,name);
    }catch{/* Scores remain available during name-service outages. */}
    finally{clearTimeout(timer);controller.abort();this.active=undefined;}
    for(const wallet of wallets){
     const candidate=names.get(wallet),verified=candidate===null||isSkrName(candidate);
     const name=verified?candidate!:null;
     const ttl=verified?(name?this.options.positiveMs??86400000:this.options.negativeMs??900000):this.options.retryMs??30000;
     // Expired names are deliberately dropped on failed refresh; never keep a transferred name indefinitely.
     this.cache.delete(wallet);this.cache.set(wallet,{name,until:this.now()+ttl});this.pending.delete(wallet);
    }
    while(this.cache.size>(this.options.maxEntries??2048))this.cache.delete(this.cache.keys().next().value!);
   }
  }finally{this.busy=false;}
 }
 /** Never wait on the RPC in a scoreboard request. Client refreshes while namesPending is true. */
 enrich(board:CampaignBoard):CampaignBoard{
  const wallets=[...new Set([...board.board.map(r=>r.wallet),...(board.personal?[board.personal.wallet]:[])])];
  wallets.forEach(wallet=>this.queue(wallet));
  const decorate=<T extends {wallet:string;displayName?:string}>(row:T):T=>{
   const {displayName:_old,...rest}=row,cached=this.cache.get(row.wallet);
   return {...rest,...(cached&&cached.until>this.now()&&cached.name?{displayName:cached.name}:{})} as T;
  };
  return {...board,board:board.board.map(decorate),personal:board.personal?decorate(board.personal):null,namesPending:wallets.some(w=>this.pending.has(w))};
 }
 close(){this.stopped=true;this.queued.clear();this.pending.clear();this.active?.abort();}
}

// the public .skr list from seekertracker.com, copied once page by page into skr_domains. every field the api returns
// is kept, the original record in raw. names grow slowly, so there is no scheduled refresh
const UPSERT=`INSERT INTO skr_domains(name,owner,rank,created_at,subdomain_tx,subdomain_tx_blocktime,name_account,tld_account,non_transferable,raw,synced_at)
 SELECT name,owner,rank,created_at,subdomain_tx,subdomain_tx_blocktime,name_account,tld_account,non_transferable,raw,now()
 FROM jsonb_to_recordset($1::jsonb) AS r(name text,owner text,rank integer,created_at timestamptz,subdomain_tx text,subdomain_tx_blocktime timestamptz,name_account text,tld_account text,non_transferable boolean,raw jsonb)
 ON CONFLICT(name) DO UPDATE SET owner=excluded.owner,rank=excluded.rank,created_at=excluded.created_at,subdomain_tx=excluded.subdomain_tx,subdomain_tx_blocktime=excluded.subdomain_tx_blocktime,
  name_account=excluded.name_account,tld_account=excluded.tld_account,non_transferable=excluded.non_transferable,raw=excluded.raw,synced_at=now()`;
const text=(v:unknown)=>typeof v==='string'&&v?v:null,base58=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
/** one api record to a row, or null when it is not a well-formed .skr name with an owner wallet */
export function directoryRow(raw:unknown){
 if(!raw||typeof raw!=='object')return null;
 const r=raw as Record<string,unknown>,name=`${r.subdomain??''}${r.domain??''}`;
 if(r.domain!=='.skr'||!isSkrName(name)||typeof r.owner!=='string'||!base58.test(r.owner))return null;
 return {name,owner:r.owner,rank:Number.isInteger(r.rank)?r.rank as number:null,created_at:text(r.created_at),subdomain_tx:text(r.subdomain_tx),subdomain_tx_blocktime:text(r.subdomain_tx_blocktime),
  name_account:text(r.name_account),tld_account:text(r.tld_account),non_transferable:typeof r.non_transferable==='boolean'?r.non_transferable:null,raw:r};
}
export async function syncSkrDirectory(pool:Pool,options:{fetch?:typeof fetch;pageSize?:number;pauseMs?:number}={}):Promise<number>{
 const get=options.fetch??fetch,size=options.pageSize??5000;
 let page=1,pages=1,stored=0;
 while(page<=pages){
  const response=await get(`https://seekertracker.com/api/domains?page=${page}&pageSize=${size}&sortBy=oldest`,{signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw new Error(`page ${page} returned HTTP ${response.status}`);
  const body=await response.json() as {pagination?:{totalPages?:unknown};data?:unknown};
  pages=Math.min(1000,Math.max(1,Number(body.pagination?.totalPages)||1));
  // one row per name: a repeated name inside one statement would make the upsert fail
  const rows=[...new Map((Array.isArray(body.data)?body.data:[]).map(directoryRow).filter(r=>!!r).map(r=>[r.name,r])).values()];
  if(rows.length)stored+=(await pool.query(UPSERT,[JSON.stringify(rows)])).rowCount??0;
  page++;
  if(page<=pages)await new Promise(r=>setTimeout(r,options.pauseMs??400));
 }
 return stored;
}
/** the one-time copy: runs only while the table is empty. a failed copy is removed so the next boot starts clean */
export async function importSkrDirectoryOnce(pool:Pool,options:Parameters<typeof syncSkrDirectory>[1]={}):Promise<number>{
 if((await pool.query('SELECT 1 FROM skr_domains LIMIT 1')).rowCount)return 0;
 try{return await syncSkrDirectory(pool,options);}
 catch(error){await pool.query('TRUNCATE skr_domains');throw error;}
}
