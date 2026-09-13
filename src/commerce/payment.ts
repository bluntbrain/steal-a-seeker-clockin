import {address,blockhash,AccountRole,appendTransactionMessageInstructions,compileTransaction,createTransactionMessage,pipe,setTransactionMessageFeePayer,setTransactionMessageLifetimeUsingBlockhash,type Instruction} from '@solana/kit';
import {getTransferCheckedInstruction} from '@solana-program/token';
import {getAddMemoInstruction} from '@solana-program/memo';
import type {PaymentQuote} from '../../shared/commerce';
export function paymentTransaction(order:PaymentQuote){
 if(!order.payment)throw new Error('Prepare the payment before opening Phantom.');
 const native=order.currency==='SOL';
 const data=new Uint8Array(12);new DataView(data.buffer).setUint32(0,2,true);new DataView(data.buffer).setBigUint64(4,BigInt(order.amount),true);
 const transfer:Instruction=native?{programAddress:address('11111111111111111111111111111111'),accounts:[{address:address(order.wallet),role:AccountRole.WRITABLE_SIGNER},{address:address(order.recipient),role:AccountRole.WRITABLE}],data}:getTransferCheckedInstruction({source:address(order.source),mint:address(order.mint),destination:address(order.destination),authority:address(order.wallet),amount:BigInt(order.amount),decimals:order.decimals},{programAddress:address(order.tokenProgram)});
 const payment:Instruction={...transfer,accounts:[...(transfer.accounts??[]),{address:address(order.reference),role:AccountRole.READONLY}]};
 return compileTransaction(pipe(createTransactionMessage({version:0}),m=>setTransactionMessageFeePayer(address(order.wallet),m),m=>setTransactionMessageLifetimeUsingBlockhash({blockhash:blockhash(order.payment!.blockhash),lastValidBlockHeight:BigInt(order.payment!.lastValidBlockHeight)},m),m=>appendTransactionMessageInstructions([payment,getAddMemoInstruction({memo:order.memo})],m)));
}
