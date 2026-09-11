export type ReturnStatus = {
  id: string;
  wallet: string;
  outcome: 'success' | 'refund';
  state: 'queued' | 'pending' | 'settled' | 'review';
  amount: string;
  decimals: number;
  mint: string;
  cluster: 'solana:devnet';
  detail: string | null;
  receipt: {signature: string; slot: number; cluster: 'solana:devnet'} | null;
};
