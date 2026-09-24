export type CreditReward={amount:number|null;message?:string;saved?:boolean};

/** Only a durable replay or a confirmed award permits leaving the claim screen. */
export function creditClaimState(reward:CreditReward,requiresWallet=false,connecting=false,slow=false){
 const unresolved=reward.amount===null;
 const waiting=unresolved&&!requiresWallet&&!reward.message&&!slow;
 return {
  waiting,
  canContinueLater:unresolved&&reward.saved===true&&!connecting&&!waiting,
  label:connecting?'Connecting wallet…':requiresWallet?'Connect wallet to claim':waiting?'Saving reward…':unresolved?(reward.saved?'Retry sync':'Retry save'):(reward.amount??0)>0?`Claim ${reward.amount} credits`:'Continue',
 };
}
