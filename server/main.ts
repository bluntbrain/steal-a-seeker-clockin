import {address} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import {database,migrate} from './db';
import {DevnetChain,TOKEN_PROGRAM} from './chain';
import {CommerceService} from './service';
import {createApp} from './app';
async function main(){
 const mint=address(process.env.DEVNET_TEST_MINT||''),recipient=address(process.env.DEVNET_TREASURY||''),decimals=Number(process.env.DEVNET_TOKEN_DECIMALS||6);
 if(!Number.isInteger(decimals)||decimals<0||decimals>9)throw new Error('Invalid mint decimals.');
 const [destination]=await findAssociatedTokenPda({owner:recipient,mint,tokenProgram:address(TOKEN_PROGRAM)});
 const config={mint,recipient,decimals,destination,identityUri:process.env.APP_IDENTITY_URI||'https://github.com/bluntbrain'};
 const chain=new DevnetChain({...config,rpcUrl:process.env.DEVNET_RPC_URL||'https://api.devnet.solana.com'});
 const pool=database(process.env.DATABASE_URL||'postgresql://localhost/seeker_clockin_devnet');await migrate(pool);const service=new CommerceService(pool,chain,config),app=await createApp(service);
 let working=false;const timer=setInterval(async()=>{if(working)return;working=true;try{const rows=await pool.query("SELECT id FROM orders WHERE status IN ('quoted','verifying') AND created_at>now()-interval '2 days' ORDER BY checked_at NULLS FIRST LIMIT 8");for(const row of rows.rows){try{await service.reconcile(row.id);}catch{app.log.warn('Payment reconciliation will retry.');}}}catch{app.log.warn('Reconciliation database unavailable; will retry.');}finally{working=false;}},15000);
 const stop=async()=>{clearInterval(timer);await app.close();await pool.end();};process.on('SIGTERM',stop);process.on('SIGINT',stop);
 await app.listen({port:Number(process.env.PORT||8790),host:process.env.HOST||'127.0.0.1'});console.log('Steal a Seeker devnet API ready.');
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Startup failed');process.exitCode=1;});
