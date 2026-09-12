import type {PaymentQuote} from '../../shared/commerce';
export function usePayment(){return async(_quote:PaymentQuote):Promise<string>=>{throw new Error('Use the Android app with Phantom for devnet payments.');};}
