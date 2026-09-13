export const DEVNET = {id:'solana:devnet',url:process.env.EXPO_PUBLIC_DEVNET_RPC_URL || 'https://api.devnet.solana.com'} as const;
export const APP_IDENTITY = {name:'Steal a Seeker',icon:'app-icon.png',uri:process.env.EXPO_PUBLIC_APP_IDENTITY_URI || 'https://stealaseeker.bluntbrain.com'};
export function transactionLink(signature:string){return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;}
