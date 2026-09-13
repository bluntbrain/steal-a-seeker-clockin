// Android's native bridge rejects invoke() before MWA's outer transact() converts
// JSON_RPC_ERROR to a protocol error. Read only the numeric code, never userInfo.
export function protocolErrorCode(error:unknown):number|undefined{
 if(!error||typeof error!=='object')return undefined;
 const e=error as {code?:unknown;userInfo?:{jsonRpcErrorCode?:unknown}};
 const code=e.code==='JSON_RPC_ERROR'?e.userInfo?.jsonRpcErrorCode:e.code;
 return typeof code==='number'&&Number.isFinite(code)?code:undefined;
}
export function normalizeNativeProtocolError(error:unknown,create:(code:number)=>Error):unknown{
 if(error&&typeof error==='object'&&(error as {code?:unknown}).code==='JSON_RPC_ERROR'){
  const code=protocolErrorCode(error);if(code!==undefined)return create(code);
 }
 return error;
}
