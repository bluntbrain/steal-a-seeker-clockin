import {MAINNET_SKR_MINT,type SolanaCluster} from '../../shared/network';
export const IS_MAINNET=process.env.EXPO_PUBLIC_SOLANA_NETWORK==='mainnet';
export const NETWORK_NAME=IS_MAINNET?'mainnet':'devnet';
export const NETWORK_LABEL=IS_MAINNET?'MAINNET · REAL MONEY':'DEVNET';
export const SKR_LABEL=IS_MAINNET?'SKR':'TEST SKR';
export const CHAIN={id:(IS_MAINNET?'solana:mainnet':'solana:devnet') as SolanaCluster,url:IS_MAINNET?(process.env.EXPO_PUBLIC_MAINNET_RPC_URL||'https://api.mainnet-beta.solana.com'):(process.env.EXPO_PUBLIC_DEVNET_RPC_URL||'https://api.devnet.solana.com')};
export const MAINNET_TREASURY='BNgBygzFkVLGw4ipkxXgt2kuNcME1YdAE2hK5s81ogdn';
export {MAINNET_SKR_MINT};
export const APP_IDENTITY = {name:'Steal a Seeker',icon:'app-icon.png',uri:process.env.EXPO_PUBLIC_APP_IDENTITY_URI || 'https://stealaseeker.bluntbrain.com'};
export function transactionLink(signature:string){return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}${IS_MAINNET?'':'?cluster=devnet'}`;}
