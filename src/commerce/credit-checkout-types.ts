import type {CreditPackId} from '../../shared/store';
export type CreditCheckoutProps={selected:CreditPackId;onSelect:(id:CreditPackId)=>void;onClose:()=>void;onDemoPurchase:(id:CreditPackId)=>Promise<void>;fullScreen?:boolean};
