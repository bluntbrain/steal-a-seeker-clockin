import {CHAIN,IS_MAINNET,MAINNET_SKR_MINT,MAINNET_TREASURY} from '../wallet/config';
import {address,blockhash,AccountRole,appendTransactionMessageInstructions,compileTransaction,createTransactionMessage,pipe,setTransactionMessageFeePayer,setTransactionMessageLifetimeUsingBlockhash,type Instruction} from '@solana/kit';
import {getTransferCheckedInstruction} from '@solana-program/token';
import {getAddMemoInstruction} from '@solana-program/memo';
import type {PaymentQuote} from '../../shared/commerce';
// Supplying both instructions prevents Phantom from injecting a different fee
// budget on each signing attempt. A resumed order must produce identical bytes.
// https://docs.phantom.com/developer-powertools/solana-priority-fees
export const PAYMENT_COMPUTE_UNITS=200000;
export const PAYMENT_MICROLAMPORTS_PER_UNIT=5000n;
export const PAYMENT_NETWORK_FEE_LAMPORTS=6000n; // One signature + 1,000 priority lamports.
function paymentBudget():Instruction[]{
 const programAddress=address('ComputeBudget111111111111111111111111111111');
 const limit=new Uint8Array(5);limit[0]=2;new DataView(limit.buffer).setUint32(1,PAYMENT_COMPUTE_UNITS,true);
 const price=new Uint8Array(9);price[0]=3;new DataView(price.buffer).setBigUint64(1,PAYMENT_MICROLAMPORTS_PER_UNIT,true);
 return [{programAddress,data:limit},{programAddress,data:price}];
}
export function paymentTransaction(order:PaymentQuote){
 if(order.cluster!==CHAIN.id)throw new Error('Payment belongs to a different network. Nothing was signed.');
 if(IS_MAINNET&&(order.recipient!==MAINNET_TREASURY||order.currency!=='SOL'&&order.mint!==MAINNET_SKR_MINT))throw new Error('Unexpected Mainnet payment recipient or token.');
 if(!order.payment)throw new Error('Prepare the payment before opening Phantom.');
 const native=order.currency==='SOL';
 const data=new Uint8Array(12);new DataView(data.buffer).setUint32(0,2,true);new DataView(data.buffer).setBigUint64(4,BigInt(order.amount),true);
 const transfer:Instruction=native?{programAddress:address('11111111111111111111111111111111'),accounts:[{address:address(order.wallet),role:AccountRole.WRITABLE_SIGNER},{address:address(order.recipient),role:AccountRole.WRITABLE}],data}:getTransferCheckedInstruction({source:address(order.source),mint:address(order.mint),destination:address(order.destination),authority:address(order.wallet),amount:BigInt(order.amount),decimals:order.decimals},{programAddress:address(order.tokenProgram)});
 const payment:Instruction={...transfer,accounts:[...(transfer.accounts??[]),{address:address(order.reference),role:AccountRole.READONLY}]};
 return compileTransaction(pipe(createTransactionMessage({version:0}),m=>setTransactionMessageFeePayer(address(order.wallet),m),m=>setTransactionMessageLifetimeUsingBlockhash({blockhash:blockhash(order.payment!.blockhash),lastValidBlockHeight:BigInt(order.payment!.lastValidBlockHeight)},m),m=>appendTransactionMessageInstructions([...paymentBudget(),payment,getAddMemoInstruction({memo:order.memo})],m)));
}
