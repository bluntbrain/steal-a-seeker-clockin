import {parsePromotions} from './promotions';
import {reconcileOrders} from './order-worker';
import {paymentDiagnostic} from './payment-errors';
import {networkConfig,bindDatabaseNetwork} from './network';
import {address} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import {database,migrate} from './db';
import {seedCampaignLevels} from './campaign-levels';
import {DevnetChain,TOKEN_PROGRAM} from './chain';
import {CommerceService} from './service';
import {createApp} from './app';
import {RankedService} from './ranked-service';
import {assertRulesCurrent} from './rules-version';
import {ReturnService} from './returns';
import {DevnetReturnChain,loadReturnSigner,loadReturnSignerJson} from './return-chain';
import {PaidService} from './paid-service';
import {CoinbasePriceFeed} from './pricing';
async function main(){
 const network=networkConfig(process.env);
 const mint=address(network.mint),recipient=address(network.recipient),decimals=network.decimals;
 if(!Number.isInteger(decimals)||decimals<0||decimals>9)throw new Error('Invalid mint decimals.');
 const [destination]=await findAssociatedTokenPda({owner:recipient,mint,tokenProgram:address(TOKEN_PROGRAM)});
 const config={promotions:parsePromotions(process.env.PROMOTIONS_JSON),creditPackPrices:network.creditPackPrices,storeCreditPrices:network.storeCreditPrices,passSkr:network.passSkr,testPricing:network.testPricing,cluster:network.cluster,shopPrices:network.shopPrices,priceDivisor:network.priceDivisor,campaignUsdCents:network.campaignUsdCents,rebateSkr:network.rebateSkr,allowlist:network.allowlist,allowAllWallets:network.allowAllWallets,mint,recipient,decimals,destination,campaignOffer:true,usdPricing:true,identityUri:process.env.APP_IDENTITY_URI||'https://stealaseeker.bluntbrain.com'};
 const chain=new DevnetChain({...config,rpcUrl:network.rpcUrl});
 await assertRulesCurrent();const pool=database(process.env.DATABASE_URL||'postgresql://localhost/seeker_clockin_devnet');await migrate(pool);await bindDatabaseNetwork(pool,network.cluster);const seeded=await seedCampaignLevels(pool);if(seeded)console.log(`published ${seeded} bundled campaign levels`);const service=new CommerceService(pool,chain,config,config.usdPricing?new CoinbasePriceFeed().warm():new CoinbasePriceFeed()),ranked=new RankedService(pool);
 const returnConfig={cluster:network.cluster,mint,treasury:recipient,source:destination,decimals},returns=new ReturnService(pool,undefined,returnConfig);
 if(network.returnsEnabled){
  const path=network.signerPath,json=network.signerJson;
  if(!path&&!json)throw new Error('Configure a dedicated signer before enabling return processing.');
  if(path&&json)throw new Error('Configure only one signer source.');
  const signer=json?await loadReturnSignerJson(json,recipient):await loadReturnSigner(path!,recipient);
  returns.chain=new DevnetReturnChain({...returnConfig,rpcUrl:network.rpcUrl},signer);
 }
 service.campaignReturns=returns;
 const paidEnabled=false; // v2 sells campaign access once; legacy entries still reconcile.
 if(paidEnabled&&!returns.chain)throw new Error('Paid entries require the devnet return worker and dedicated signer.');
 const paid=new PaidService(pool,chain,config,returns,{enabled:paidEnabled}),app=await createApp(service,ranked,paid);
 let working=false;const timer=setInterval(async()=>{if(working)return;working=true;try{await reconcileOrders(service,(fields,message)=>app.log.warn(fields,message));await service.releaseUnpaidCampaignReservations();}catch(error){app.log.warn({diagnostic:paymentDiagnostic(error)},'Reconciliation worker will retry.');}finally{working=false;}},15000);
 let verifying=false;const gameTimer=setInterval(async()=>{if(verifying)return;verifying=true;try{const results=await Promise.allSettled([ranked.process(1),paid.process()]);if(results.some(r=>r.status==='rejected'))app.log.warn('Game verification will retry.');}catch{app.log.warn('Game verification will retry.');}finally{verifying=false;}},1000);
 let settling=false;const returnTimer=setInterval(async()=>{if(settling||!returns)return;settling=true;try{await returns.process();}catch{app.log.warn('Return reconciliation will retry.');}finally{settling=false;}},1000);
 let entriesWorking=false;const entryTimer=setInterval(async()=>{if(entriesWorking)return;entriesWorking=true;try{const rows=await pool.query("SELECT id,wallet FROM paid_entries WHERE status IN ('quoted','verifying_payment') OR (status='expired' AND created_at>now()-interval '7 days') ORDER BY checked_at NULLS FIRST LIMIT 8");for(const row of rows.rows){try{await paid.reconcile(row.wallet,row.id);}catch{await pool.query('UPDATE paid_entries SET checked_at=now() WHERE id=$1',[row.id]);app.log.warn('Paid-entry payment reconciliation will retry.');}}}catch{app.log.warn('Paid-entry queue will retry.');}finally{entriesWorking=false;}},15000);
 const stop=async()=>{clearInterval(timer);clearInterval(gameTimer);clearInterval(returnTimer);clearInterval(entryTimer);await app.close();await pool.end();};process.on('SIGTERM',stop);process.on('SIGINT',stop);
 await app.listen({port:Number(process.env.PORT||8790),host:process.env.HOST||'127.0.0.1'});console.log('Steal a Seeker API ready on '+network.cluster);
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Startup failed');process.exitCode=1;});
