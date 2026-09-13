/** Provision test assets using dedicated devnet-only signing files outside git. */
import {execFileSync} from 'node:child_process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {address} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import {rpc,DEVNET_GENESIS,TOKEN_PROGRAM} from './chain';
const url=process.env.DEVNET_RPC_URL||'https://api.devnet.solana.com';
const treasury=process.env.DEVNET_SIGNER_PATH||join(homedir(),'.config/steal-a-seeker/devnet-treasury.json');
const mintKey=process.env.DEVNET_MINT_KEY_PATH||join(homedir(),'.config/steal-a-seeker/devnet-mint.json');
function run(bin:string,args:string[]){return execFileSync(bin,args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:60000}).trim();}
async function main(){
 if(await rpc<string>(url,'getGenesisHash')!==DEVNET_GENESIS)throw new Error('Refusing to provision outside devnet.');
 const owner=run('solana',['address','--keypair',treasury]),mint=run('solana',['address','--keypair',mintKey]);
 const balance=await rpc<{value:number}>(url,'getBalance',[owner]);
 if(balance.value<10_000_000)throw new Error(`Fund ${owner} with at least 0.01 devnet SOL before provisioning. These are test assets only.`);
 const base=['--url',url,'--fee-payer',treasury,'--program-id',TOKEN_PROGRAM];
 const exists=await rpc<{value:unknown}>(url,'getAccountInfo',[mint,{encoding:'base64',commitment:'confirmed'}]);
 if(!exists.value)console.log(run('spl-token',[...base,'create-token','--mint-authority',owner,'--decimals','6',mintKey]));
 const [ata]=await findAssociatedTokenPda({owner:address(owner),mint:address(mint),tokenProgram:address(TOKEN_PROGRAM)});
 const account=await rpc<{value:unknown}>(url,'getAccountInfo',[ata,{encoding:'base64',commitment:'confirmed'}]);if(!account.value)console.log(run('spl-token',[...base,'create-account','--owner',owner,mint]));
 const tokens=await rpc<{value:{amount:string}}>(url,'getTokenAccountBalance',[ata,{commitment:'confirmed'}]);if(BigInt(tokens.value.amount)<1000000000n)console.log(run('spl-token',[...base,'mint','--mint-authority',treasury,mint,'100000',ata]));
 const recipient=process.argv[2];
 if(recipient){address(recipient);console.log(run('spl-token',[...base,'transfer','--owner',treasury,mint,'200',recipient,'--fund-recipient','--allow-unfunded-recipient']));}
 console.log(JSON.stringify({cluster:'solana:devnet',mint,treasury:owner,decimals:6,currency:'TEST SKR',realValue:false}));
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Devnet setup failed');process.exitCode=1;});
