/** Display labels only. Wallet addresses remain the identity used for scores and payments. */
export function isSkrName(value:unknown):value is string{
 if(typeof value!=='string'||!value.endsWith('.skr'))return false;
 const label=value.slice(0,-4);
 return [...label].length>0&&[...label].length<=64&&!/[.\s\p{C}]/u.test(label);
}
export function leaderboardName(row:{wallet:string;displayName?:string},ownWallet?:string|null){
 if(isSkrName(row.displayName))return row.displayName;
 return row.wallet===ownWallet?'You':`${row.wallet.slice(0,5)}…${row.wallet.slice(-5)}`;
}
