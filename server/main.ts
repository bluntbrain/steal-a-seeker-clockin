import {WalletNames,allDomainsLookup,importSkrDirectoryOnce} from './wallet-names';
import {parsePromotions} from './promotions';
import {reconcileOrders} from './order-worker';
import {paymentDiagnostic} from './payment-errors';
import {networkConfig,bindDatabaseNetwork} from './network';
import {address} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import {database,migrate} from './db';
import {seedCampaignLevels} from './campaign-levels';
import {publishToTarget} from './campaign-publisher';
import {DevnetChain,TOKEN_PROGRAM} from './chain';
import {CommerceService,backfillPassBundle} from './service';
import {createApp} from './app';
import {assertRulesCurrent} from './rules-version';
import {ReturnService} from './returns';
import {DevnetReturnChain,loadReturnSigner,loadReturnSignerJson} from './return-chain';
import {CoinbasePriceFeed} from './pricing';
async function main(){
 const network=networkConfig(process.env);
 const mint=address(network.mint),recipient=address(network.recipient),decimals=network.decimals;
 if(!Number.isInteger(decimals)||decimals<0||decimals>9)throw new Error('Invalid mint decimals.');
 const [destination]=await findAssociatedTokenPda({owner:recipient,mint,tokenProgram:address(TOKEN_PROGRAM)});
 const config={promotions:parsePromotions(process.env.PROMOTIONS_JSON),creditPackPrices:network.creditPackPrices,storeCreditPrices:network.storeCreditPrices,passSkr:network.passSkr,testPricing:network.testPricing,cluster:network.cluster,shopPrices:network.shopPrices,priceDivisor:network.priceDivisor,campaignUsdCents:network.campaignUsdCents,rebateSkr:network.rebateSkr,allowlist:network.allowlist,allowAllWallets:network.allowAllWallets,mint,recipient,decimals,destination,campaignOffer:true,usdPricing:true,identityUri:process.env.APP_IDENTITY_URI||'https://stealaseeker.bluntbrain.com'};
 const chain=new DevnetChain({...config,rpcUrl:network.rpcUrl});
 await assertRulesCurrent();const pool=database(process.env.DATABASE_URL||'postgresql://localhost/seeker_clockin_devnet');await migrate(pool);await bindDatabaseNetwork(pool,network.cluster);const seeded=await seedCampaignLevels(pool);if(seeded)console.log(`published ${seeded} bundled campaign levels`);const bundled=await backfillPassBundle(pool);if(bundled)console.log(`granted the pass bundle to ${bundled} existing pass owners`);const service=new CommerceService(pool,chain,config,config.usdPricing?new CoinbasePriceFeed().warm():new CoinbasePriceFeed());
 const returnConfig={cluster:network.cluster,mint,treasury:recipient,source:destination,decimals},returns=new ReturnService(pool,undefined,returnConfig);
 if(network.returnsEnabled){
  const path=network.signerPath,json=network.signerJson;
  if(!path&&!json)throw new Error('Configure a dedicated signer before enabling return processing.');
  if(path&&json)throw new Error('Configure only one signer source.');
  const signer=json?await loadReturnSignerJson(json,recipient):await loadReturnSigner(path!,recipient);
  returns.chain=new DevnetReturnChain({...returnConfig,rpcUrl:network.rpcUrl},signer);
 }
 service.campaignReturns=returns;
 // Identity lives on mainnet even when payments are tested on devnet. Never send identity queries to devnet.
 const nameRpc=process.env.SKR_RPC_URL||(network.mainnet?network.rpcUrl:process.env.MAINNET_RPC_URL)||'https://api.mainnet.solana.com';
 const names=process.env.SKR_NAMES_ENABLED==='false'?undefined:new WalletNames(allDomainsLookup(nameRpc));
 const app=await createApp(service,names);
 let working=false;const timer=setInterval(async()=>{if(working)return;working=true;try{await reconcileOrders(service,(fields,message)=>app.log.warn(fields,message));await service.releaseUnpaidCampaignReservations();}catch(error){app.log.warn({diagnostic:paymentDiagnostic(error)},'Reconciliation worker will retry.');}finally{working=false;}},15000);
 let settling=false;const returnTimer=setInterval(async()=>{if(settling||!returns)return;settling=true;try{await returns.process();}catch{app.log.warn('Return reconciliation will retry.');}finally{settling=false;}},1000);
 const stop=async()=>{clearInterval(timer);clearInterval(returnTimer);await app.close();await pool.end();};process.on('SIGTERM',stop);process.on('SIGINT',stop);
 await app.listen({port:Number(process.env.PORT||8790),host:process.env.HOST||'127.0.0.1'});console.log('Steal a Seeker API ready on '+network.cluster);
 // our own copy of every .skr name for friend search: copied once into an empty table, never fetched on a request
 if(process.env.SKR_DIRECTORY_IMPORT!=='false')void importSkrDirectoryOnce(pool).then(n=>{if(n)console.log(`skr directory: ${n} names stored`);},e=>console.warn('skr directory import failed, the next boot retries: '+(e instanceof Error?e.message:String(e))));
 // CAMPAIGN_TARGET_LEVEL publishes more levels in the background: build, solve, verify, insert, one at a time
 const target=Number(process.env.CAMPAIGN_TARGET_LEVEL);if(target>12)void publishToTarget(pool,target,message=>console.log(message)).catch(e=>console.warn('campaign publisher stopped: '+(e instanceof Error?e.message:String(e))));
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Startup failed');process.exitCode=1;});
