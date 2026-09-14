import {createHash} from 'node:crypto';
import {address,getAddressEncoder,getAddressDecoder,getProgramDerivedAddress,createSolanaRpc} from '@solana/kit';
const program=address('ALTNSZ46uaAUU7XUV6awvdorLGqAsPwa9shm7h4uP2FK'),root=address('3mX9b4AZaQehNoQGfckVcmgmA6bkBoFcbLj9RMmMyNcU');
const enc=getAddressEncoder(),dec=getAddressDecoder();
export function decodeSkrOwner(data:Uint8Array,owner:string,now=Date.now()){
 if(owner!==program||data.length<200)return null;const expires=new DataView(data.buffer,data.byteOffset,data.byteLength).getBigUint64(104,true);
 if(expires!==0n&&expires*1000n<=BigInt(now))return null;return dec.decode(data.subarray(40,72));
}
export async function resolveSkr(input:string){
 const name=input.trim().toLowerCase();if(!/^[a-z0-9-]{1,63}\.skr$/.test(name))throw new Error('Enter your full .skr name.');
 const derive=async(label:string,parent:string)=>(await getProgramDerivedAddress({programAddress:program,seeds:[createHash('sha256').update('ALT Name Service'+label).digest(),new Uint8Array(32),enc.encode(address(parent))]}))[0];
 const parent=await derive('.skr',root),record=await derive(name.slice(0,-4),parent);
 const rpc=createSolanaRpc(process.env.SOLANA_MAINNET_RPC_URL||'https://api.mainnet-beta.solana.com');
 if(await rpc.getGenesisHash().send({abortSignal:AbortSignal.timeout(8000)})!=='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d')throw new Error('Name lookup requires Solana mainnet.');
 const {value}=await rpc.getAccountInfo(record,{encoding:'base64',commitment:'confirmed'}).send({abortSignal:AbortSignal.timeout(8000)});
 return value?decodeSkrOwner(Buffer.from(value.data[0],'base64'),value.owner):null;
}
