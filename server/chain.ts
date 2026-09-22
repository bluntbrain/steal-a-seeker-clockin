import {GENESIS,type SolanaCluster} from '../shared/network';
import {z} from 'zod';
import {getBase58Encoder} from '@solana/kit';
import type {Order,PaymentAuthorization} from '../shared/commerce';
export const SYSTEM_PROGRAM='11111111111111111111111111111111';
export const TOKEN_PROGRAM='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const MEMO_PROGRAM='MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
export const DEVNET_GENESIS='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
export type Verification={state:'verified';instructionIndex:number;slot:number}|{state:'pending'|'invalid'|'needs_review';detail:string};
export interface PaymentChain {verify(order:TransferBinding,signature:string):Promise<Verification>;find(reference:string,minContextSlot?:number):Promise<string[]>;ready():Promise<void>;lifetime():Promise<Omit<PaymentAuthorization,'id'>>;height(minContextSlot:number):Promise<number>}
const tokenBalance=z.object({accountIndex:z.number().int(),mint:z.string(),owner:z.string().optional(),uiTokenAmount:z.object({amount:z.string().regex(/^\d+$/),decimals:z.number().int()})});
const txSchema=z.object({slot:z.number().int().nonnegative(),blockTime:z.number().nullable(),meta:z.object({err:z.unknown().nullable(),preTokenBalances:z.array(tokenBalance).default([]),postTokenBalances:z.array(tokenBalance).default([]),preBalances:z.array(z.number().int().nonnegative()).optional(),postBalances:z.array(z.number().int().nonnegative()).optional(),loadedAddresses:z.object({writable:z.array(z.string()),readonly:z.array(z.string())}).optional()}),transaction:z.object({signatures:z.array(z.string()),message:z.object({header:z.object({numRequiredSignatures:z.number().int()}),accountKeys:z.array(z.string()),instructions:z.array(z.object({programIdIndex:z.number().int(),accounts:z.array(z.number().int()),data:z.string()}))})})});
export type TransferBinding=Pick<Order,'currency'|'wallet'|'source'|'mint'|'destination'|'recipient'|'tokenProgram'|'decimals'|'amount'|'reference'|'memo'|'createdAt'|'expiresAt'>;
export function verifyPayment(order:TransferBinding,signature:string,value:unknown,checkQuoteWindow=true):Verification{
 if(value===null)return {state:'pending',detail:'Waiting for a finalized transaction.'};
 const parsed=txSchema.safeParse(value);if(!parsed.success)return {state:'pending',detail:'Finalized transaction data is incomplete; reconciliation must retry.'};
 const tx=parsed.data;if(tx.meta.err!==null)return {state:'invalid',detail:'Transaction failed on chain.'};
 if(tx.transaction.signatures[0]!==signature)return {state:'invalid',detail:'Transaction signature mismatch.'};
 const message=tx.transaction.message,keys=[...message.accountKeys,...(tx.meta.loadedAddresses?.writable||[]),...(tx.meta.loadedAddresses?.readonly||[])];
 const walletIndex=message.accountKeys.indexOf(order.wallet);
 if(walletIndex<0||walletIndex>=message.header.numRequiredSignatures)return {state:'invalid',detail:'The buyer did not sign this transaction.'};
 const hasMemo=message.instructions.some(i=>{try{return keys[i.programIdIndex]===MEMO_PROGRAM&&Buffer.from(getBase58Encoder().encode(i.data)).toString('utf8')===order.memo;}catch{return false;}});
 if(!hasMemo)return {state:'invalid',detail:'Order memo is missing.'};
 if(order.currency==='SOL'){
  if(order.tokenProgram!==SYSTEM_PROGRAM||order.decimals!==9||order.source!==order.wallet||order.destination!==order.recipient||order.wallet===order.recipient)return {state:'invalid',detail:'Invalid native SOL payment binding.'};
  for(let index=0;index<message.instructions.length;index++){
   const i=message.instructions[index]!;if(keys[i.programIdIndex]!==SYSTEM_PROGRAM)continue;
   let data:Uint8Array;try{data=new Uint8Array(getBase58Encoder().encode(i.data));}catch{continue;}
   if(data.length!==12)continue;const view=new DataView(data.buffer,data.byteOffset,data.byteLength);
   if(view.getUint32(0,true)!==2||view.getBigUint64(4,true)!==BigInt(order.amount))continue;
   if(keys[i.accounts[0]!]!==order.wallet||keys[i.accounts[1]!]!==order.recipient||!i.accounts.slice(2).some(a=>keys[a]===order.reference))continue;
   const recipientIndex=keys.indexOf(order.recipient),before=tx.meta.preBalances?.[recipientIndex],after=tx.meta.postBalances?.[recipientIndex];
   if(before===undefined||after===undefined)return {state:'pending',detail:'Finalized SOL balances are missing.'};
   if(!Number.isSafeInteger(before)||!Number.isSafeInteger(after))return {state:'needs_review',detail:'SOL balance exceeds verifier precision.'};
   if(BigInt(after)-BigInt(before)<BigInt(order.amount))continue;
   if(checkQuoteWindow&&(tx.blockTime===null||tx.blockTime*1000<new Date(order.createdAt).getTime()-30000||tx.blockTime*1000>new Date(order.expiresAt).getTime()))return {state:'needs_review',detail:'Payment found outside the quote window; review for fulfillment or refund.'};
   return {state:'verified',instructionIndex:index,slot:tx.slot};
  }
  return {state:'invalid',detail:'No matching native SOL transfer for this order.'};
 }
 for(let index=0;index<message.instructions.length;index++){
  const i=message.instructions[index]!;if(keys[i.programIdIndex]!==order.tokenProgram)continue;
  let data:Uint8Array;try{data=new Uint8Array(getBase58Encoder().encode(i.data));}catch{continue;}
  if(data.length!==10||data[0]!==12)continue;
  const amount=new DataView(data.buffer,data.byteOffset,data.byteLength).getBigUint64(1,true);
  const [source,mint,destination,authority]=i.accounts.map(a=>keys[a]);
  if(source!==order.source||mint!==order.mint||destination!==order.destination||authority!==order.wallet||amount!==BigInt(order.amount)||data[9]!==order.decimals)continue;
  if(!i.accounts.slice(4).some(a=>keys[a]===order.reference))continue;
  const src=tx.meta.preTokenBalances.find(b=>keys[b.accountIndex]===source),dstBefore=tx.meta.preTokenBalances.find(b=>keys[b.accountIndex]===destination),dst=tx.meta.postTokenBalances.find(b=>keys[b.accountIndex]===destination);
  if(!src||src.owner!==order.wallet||src.mint!==order.mint||src.uiTokenAmount.decimals!==order.decimals||!dst||dst.owner!==order.recipient||dst.mint!==order.mint||dst.uiTokenAmount.decimals!==order.decimals)continue;
  if(BigInt(dst.uiTokenAmount.amount)-BigInt(dstBefore?.uiTokenAmount.amount||'0')<amount)continue;
  if(checkQuoteWindow&&(tx.blockTime===null||tx.blockTime*1000<new Date(order.createdAt).getTime()-30000||tx.blockTime*1000>new Date(order.expiresAt).getTime()))return {state:'needs_review',detail:'Payment found outside the quote window; review for fulfillment or refund.'};
  return {state:'verified',instructionIndex:index,slot:tx.slot};
 }
 return {state:'invalid',detail:'No matching transfer with the quoted mint, amount, buyer, recipient and reference.'};
}
/** Safe diagnostics: never include provider URLs, API keys, or RPC payloads. */
export class RpcError extends Error {
 constructor(public method:string,public code:number|string){super(`Solana RPC ${method} failed (${code}).`);}
}
export async function rpc<T>(url:string,method:string,params:unknown[]=[],fetcher:typeof fetch=fetch):Promise<T>{
 for(let attempt=0;attempt<2;attempt++){
  let failure:RpcError;
  try{
   const response=await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(5000)});
   if(!response.ok)throw new RpcError(method,response.status);
   const body=await response.json() as {error?:{code:number};result:T};
   if(body.error)throw new RpcError(method,body.error.code);
   if(!Object.hasOwn(body,'result'))throw new RpcError(method,'invalid-response');
   return body.result;
  }catch(error){failure=error instanceof RpcError?error:new RpcError(method,'network');}
  // Retry transient read failures once. Never automatically rebroadcast a payment.
  const retryable=[429,500,502,503,504,-32005,-32016,-32029,'network'].includes(failure.code);
  if(attempt||!method.startsWith('get')||!retryable)throw failure;
  await new Promise(resolve=>setTimeout(resolve,400));
 }
 throw new RpcError(method,'unavailable');
}
export class DevnetChain implements PaymentChain{
 private readyUntil=0;private checking?:Promise<void>;
 constructor(private config:{rpcUrl:string;mint:string;recipient:string;decimals:number;destination:string;cluster?:SolanaCluster},private now=Date.now){}
 async ready(){
  if(this.now()<this.readyUntil)return;
  if(this.checking)return this.checking;
  this.checking=this.checkReady().then(()=>{this.readyUntil=this.now()+15000;});
  try{await this.checking;}finally{this.checking=undefined;}
 }
 private async checkReady(){
  if(await rpc<string>(this.config.rpcUrl,'getGenesisHash')!==GENESIS[this.config.cluster??'solana:devnet'])throw new Error('Payment RPC network does not match this deployment.');
  const result=await rpc<{value:{owner:string;data:{parsed:{type:string;info:{decimals:number}}}}|null}>(this.config.rpcUrl,'getAccountInfo',[this.config.mint,{encoding:'jsonParsed',commitment:'finalized'}]);
  if(!result.value||result.value.owner!==TOKEN_PROGRAM||result.value.data.parsed.type!=='mint'||result.value.data.parsed.info.decimals!==this.config.decimals)throw new Error('The configured payment mint is not ready.');
  const account=await rpc<{value:{owner:string;data:{parsed:{info:{owner:string;mint:string;state:string}}}}|null}>(this.config.rpcUrl,'getAccountInfo',[this.config.destination,{encoding:'jsonParsed',commitment:'finalized'}]);
  if(!account.value||account.value.owner!==TOKEN_PROGRAM||account.value.data.parsed.info.owner!==this.config.recipient||account.value.data.parsed.info.mint!==this.config.mint||account.value.data.parsed.info.state!=='initialized')throw new Error('The treasury token account is not ready.');
 }
 async verify(order:TransferBinding,signature:string){return verifyPayment(order,signature,await rpc(this.config.rpcUrl,'getTransaction',[signature,{encoding:'json',commitment:'finalized',maxSupportedTransactionVersion:0}]));}
 async lifetime(){const r=await rpc<{context:{slot:number};value:{blockhash:string;lastValidBlockHeight:number}}>(this.config.rpcUrl,'getLatestBlockhash',[{commitment:'finalized'}]);return {blockhash:r.value.blockhash,lastValidBlockHeight:String(r.value.lastValidBlockHeight),contextSlot:String(r.context.slot)};}
 async height(minContextSlot:number){return rpc<number>(this.config.rpcUrl,'getBlockHeight',[{commitment:'finalized',minContextSlot}]);}
 async find(reference:string,minContextSlot?:number){const rows=await rpc<{signature:string;err:unknown}[]>(this.config.rpcUrl,'getSignaturesForAddress',[reference,{limit:1000,commitment:'finalized',...(minContextSlot?{minContextSlot}:{})}]);if(rows.length===1000)throw new Error('Reference history needs manual reconciliation.');return rows.filter(s=>!s.err).map(s=>s.signature);}
}
