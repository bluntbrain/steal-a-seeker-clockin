// Serialize MWA sessions across hooks. Never keep two wallet activities open.
let tail:Promise<unknown>=Promise.resolve();
export function exclusiveWalletSession<T>(run:()=>Promise<T>):Promise<T>{
 const result=tail.then(run,run);tail=result.then(()=>undefined,()=>undefined);return result;
}
let connecting:Promise<unknown>|undefined;
/** Rapid Connect taps across screens join one request instead of queuing popups. */
export function joinWalletConnection<T>(run:()=>Promise<T>):Promise<T>{
 if(connecting)return connecting as Promise<T>;
 const result=Promise.resolve().then(run);
 connecting=result;
 void result.then(()=>{if(connecting===result)connecting=undefined;},()=>{if(connecting===result)connecting=undefined;});
 return result;
}
// A previous sign-in can rotate its token while an async checkout still holds
// an older hook closure. Payment authorization follows the fresh-auth flow.
export function freshPaymentAuthorization<T extends {auth_token?:string}>(params:T):Omit<T,'auth_token'>{
 const {auth_token:_,...request}=params;return request;
}
