import {address} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import {database,migrate} from './db';
import {DevnetChain,TOKEN_PROGRAM} from './chain';
import {CommerceService} from './service';
import {createApp} from './app';
import {RankedService} from './ranked-service';
import {assertRulesCurrent} from './rules-version';
import {ReturnService} from './returns';
import {DevnetReturnChain,loadReturnSigner} from './return-chain';
import {PaidService} from './paid-service';
async function main(){
 const mint=address(process.env.DEVNET_TEST_MINT||''),recipient=address(process.env.DEVNET_TREASURY||''),decimals=Number(process.env.DEVNET_TOKEN_DECIMALS||6);
 if(!Number.isInteger(decimals)||decimals<0||decimals>9)throw new Error('Invalid mint decimals.');
 const [destination]=await findAssociatedTokenPda({owner:recipient,mint,tokenProgram:address(TOKEN_PROGRAM)});
 const config={mint,recipient,decimals,destination,identityUri:process.env.APP_IDENTITY_URI||'https://github.com/bluntbrain'};
 const chain=new DevnetChain({...config,rpcUrl:process.env.DEVNET_RPC_URL||'https://api.devnet.solana.com'});
 await assertRulesCurrent();const pool=database(process.env.DATABASE_URL||'postgresql://localhost/seeker_clockin_devnet');await migrate(pool);const service=new CommerceService(pool,chain,config),ranked=new RankedService(pool);
 const returnConfig={mint,treasury:recipient,source:destination,decimals},returns=new ReturnService(pool,undefined,returnConfig);
 if(process.env.DEVNET_RETURNS_ENABLED==='1'){
  const path=process.env.DEVNET_SIGNER_PATH;if(!path)throw new Error('Set the dedicated devnet signer path before enabling return processing.');
  const signer=await loadReturnSigner(path,recipient);
  returns.chain=new DevnetReturnChain({...returnConfig,rpcUrl:process.env.DEVNET_RPC_URL||'https://api.devnet.solana.com'},signer);
 }
 const paidEnabled=process.env.DEVNET_PAID_ENTRIES_ENABLED==='1';
 if(paidEnabled&&!returns.chain)throw new Error('Paid entries require the devnet return worker and dedicated signer.');
 const paid=new PaidService(pool,chain,config,returns,{enabled:paidEnabled}),app=await createApp(service,ranked,paid);
 let working=false;const timer=setInterval(async()=>{if(working)return;working=true;try{const rows=await pool.query("SELECT id FROM orders WHERE status IN ('quoted','verifying') AND created_at>now()-interval '2 days' ORDER BY checked_at NULLS FIRST LIMIT 8");for(const row of rows.rows){try{await service.reconcile(row.id);}catch{app.log.warn('Payment reconciliation will retry.');}}}catch{app.log.warn('Reconciliation database unavailable; will retry.');}finally{working=false;}},15000);
 let verifying=false;const gameTimer=setInterval(async()=>{if(verifying)return;verifying=true;try{const results=await Promise.allSettled([ranked.process(1),paid.process()]);if(results.some(r=>r.status==='rejected'))app.log.warn('Game verification will retry.');}catch{app.log.warn('Game verification will retry.');}finally{verifying=false;}},1000);
 let settling=false;const returnTimer=setInterval(async()=>{if(settling||!returns)return;settling=true;try{await returns.process();}catch{app.log.warn('Return reconciliation will retry.');}finally{settling=false;}},1000);
 let entriesWorking=false;const entryTimer=setInterval(async()=>{if(entriesWorking)return;entriesWorking=true;try{const rows=await pool.query("SELECT id,wallet FROM paid_entries WHERE status IN ('quoted','verifying_payment') OR (status='expired' AND created_at>now()-interval '7 days') ORDER BY checked_at NULLS FIRST LIMIT 8");for(const row of rows.rows){try{await paid.reconcile(row.wallet,row.id);}catch{await pool.query('UPDATE paid_entries SET checked_at=now() WHERE id=$1',[row.id]);app.log.warn('Paid-entry payment reconciliation will retry.');}}}catch{app.log.warn('Paid-entry queue will retry.');}finally{entriesWorking=false;}},15000);
 const stop=async()=>{clearInterval(timer);clearInterval(gameTimer);clearInterval(returnTimer);clearInterval(entryTimer);await app.close();await pool.end();};process.on('SIGTERM',stop);process.on('SIGINT',stop);
 await app.listen({port:Number(process.env.PORT||8790),host:process.env.HOST||'127.0.0.1'});console.log('Steal a Seeker devnet API ready.');
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Startup failed');process.exitCode=1;});
