import {address,blockhash,AccountRole,appendTransactionMessageInstructions,compileTransaction,createTransactionMessage,pipe,setTransactionMessageFeePayer,setTransactionMessageLifetimeUsingBlockhash,type Instruction} from '@solana/kit';
import {getTransferCheckedInstruction} from '@solana-program/token';
import {getAddMemoInstruction} from '@solana-program/memo';
import type {Order} from '../../shared/commerce';
export function paymentTransaction(order:Order){
 if(!order.payment)throw new Error('Prepare the payment before opening Phantom.');
 const transfer=getTransferCheckedInstruction({source:address(order.source),mint:address(order.mint),destination:address(order.destination),authority:address(order.wallet),amount:BigInt(order.amount),decimals:order.decimals},{programAddress:address(order.tokenProgram)});
 const payment:Instruction={...transfer,accounts:[...transfer.accounts,{address:address(order.reference),role:AccountRole.READONLY}]};
 return compileTransaction(pipe(createTransactionMessage({version:0}),m=>setTransactionMessageFeePayer(address(order.wallet),m),m=>setTransactionMessageLifetimeUsingBlockhash({blockhash:blockhash(order.payment!.blockhash),lastValidBlockHeight:BigInt(order.payment!.lastValidBlockHeight)},m),m=>appendTransactionMessageInstructions([payment,getAddMemoInstruction({memo:order.memo})],m)));
}
