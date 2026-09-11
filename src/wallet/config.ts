export const DEVNET = {id:'solana:devnet',url:process.env.EXPO_PUBLIC_DEVNET_RPC_URL || 'https://api.devnet.solana.com'} as const;
export const APP_IDENTITY = {name:'Steal a Seeker · Devnet',uri:process.env.EXPO_PUBLIC_APP_IDENTITY_URI || 'https://github.com/bluntbrain'};
export function transactionLink(signature:string){return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;}
