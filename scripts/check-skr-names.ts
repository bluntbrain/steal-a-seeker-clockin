/** Read-only mainnet lookup smoke test. No wallet secrets/signatures. */
import {allDomainsLookup} from '../server/wallet-names';
async function main(){
const url=process.env.SKR_RPC_URL||process.env.MAINNET_RPC_URL||'https://api.mainnet.solana.com';
const board=await fetch('https://seeker-api-production-41b3.up.railway.app/campaign/leaderboard').then(r=>{if(!r.ok)throw Error(`Leaderboard HTTP ${r.status}`);return r.json();}) as {board:{wallet:string}[]};
const wallets=process.argv.slice(2).length?process.argv.slice(2):board.board.slice(0,3).map(r=>r.wallet);
const signal=AbortSignal.timeout(12000),start=Date.now();
try{const names=await allDomainsLookup(url)(wallets,signal,(wallet,name)=>console.log(JSON.stringify({wallet,name})));console.log(JSON.stringify({wallets:wallets.length,resolved:names.size,elapsedMs:Date.now()-start}));if(names.size!==wallets.length)process.exitCode=1;}catch{console.error('Mainnet name lookup failed or timed out. Check RPC access.');process.exitCode=1;}

}
main().catch(()=>{console.error("Name lookup smoke test failed before completion.");process.exitCode=1;});
