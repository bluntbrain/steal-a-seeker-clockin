import {readFile} from 'node:fs/promises';
import {address} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import {z} from 'zod';
import {database} from './db';
import {DevnetChain,TOKEN_PROGRAM} from './chain';
import {ReturnService} from './returns';
import {OperatorReview,reviewRequest} from './operator-review';
async function main(){
 const [mode,target]=process.argv.slice(2);
 if(!target||!['entry','return','apply'].includes(mode??''))throw new Error('Usage: review.ts entry ID | return ID | apply REQUEST.json');
 const mint=address(process.env.DEVNET_TEST_MINT||''),treasury=address(process.env.DEVNET_TREASURY||''),decimals=Number(process.env.DEVNET_TOKEN_DECIMALS||6);
 const [source]=await findAssociatedTokenPda({owner:treasury,mint,tokenProgram:address(TOKEN_PROGRAM)});
 const pool=database(process.env.DATABASE_URL||'postgresql://localhost/seeker_clockin_devnet');
 try{
  const chain=new DevnetChain({rpcUrl:process.env.DEVNET_RPC_URL||'https://api.devnet.solana.com',mint,recipient:treasury,decimals,destination:source}),returns=new ReturnService(pool,undefined,{mint,treasury,source,decimals}),review=new OperatorReview(pool,chain,returns);
  const result=mode==='apply'?await review.apply(reviewRequest.parse(JSON.parse(await readFile(target,'utf8')))):mode==='entry'?await review.inspectEntry(z.string().uuid().parse(target)):await review.inspectReturn(z.string().uuid().parse(target));
  console.log(JSON.stringify(result,null,2));
 }finally{await pool.end();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Operator review failed.');process.exitCode=1;});
