import {useMobileWallet} from '@wallet-ui/react-native-kit';
import {getBase58Decoder} from '@solana/kit';
import type {PaymentQuote} from '../../shared/commerce';
import {paymentTransaction} from '../commerce/payment';
export function usePayment(){
 const wallet=useMobileWallet();
 return async(quote:PaymentQuote)=>{
  if(wallet.account?.address!==quote.wallet)throw new Error('Switch back to the wallet that owns this entry.');
  if(!quote.payment)throw new Error('Payment authorization is missing. Restore the entry before approving.');
  return getBase58Decoder().decode(await wallet.signAndSendTransactions(paymentTransaction(quote),BigInt(quote.payment.contextSlot)));
 };
}
