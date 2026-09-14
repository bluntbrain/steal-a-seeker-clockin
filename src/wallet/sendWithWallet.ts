import {getTransactionEncoder,getBase58Encoder,type Transaction,type TransactionWithBlockhashLifetime} from '@solana/kit';
import {VersionedTransaction} from '@solana/web3.js';
import type {Web3MobileWallet} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

// Official MWA sign-and-send flow. The wallet submits; the backend independently
// verifies the resulting treasury transfer. Never locally broadcast a second copy.
export async function sendWithWallet(wallet:Pick<Web3MobileWallet,'signAndSendTransactions'>,transaction:Transaction&TransactionWithBlockhashLifetime,expectedAccount:string,minContextSlot:bigint){
 const prepared=VersionedTransaction.deserialize(Uint8Array.from(getTransactionEncoder().encode(transaction)));
 if(prepared.message.staticAccountKeys[0]!.toBase58()!==expectedAccount)throw new Error('Payment belongs to a different wallet.');
 const signatures=await wallet.signAndSendTransactions({transactions:[prepared],minContextSlot:Number(minContextSlot),commitment:'confirmed',skipPreflight:false,maxRetries:2});
 if(signatures.length!==1)throw new Error('Wallet did not return one payment receipt. Check payment before trying again.');
 const bytes=Uint8Array.from(getBase58Encoder().encode(signatures[0]!));
 if(bytes.length!==64||bytes.every(b=>b===0))throw new Error('Wallet returned an invalid receipt. Check payment before trying again.');
 return bytes;
}
