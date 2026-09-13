import {fromUint8Array,toUint8Array} from 'js-base64';
function decode(value:string){
 if(typeof value!=='string'||!value||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))throw new Error('Wallet returned invalid sign-in encoding.');
 const bytes=toUint8Array(value);
 if(fromUint8Array(bytes).replace(/=+$/,'')!==value.replace(/=+$/,''))throw new Error('Wallet returned invalid sign-in encoding.');
 return bytes;
}
// MWA wire fields are base64, not UTF-8. Read the original authorization result
// rather than Wallet UI 4.3.0's stringToUint8Array conversion (which encodes text).
export function decodeSignIn(result:{address:string;signature:string;signed_message:string},expectedAddressBase64:string){
 const publicKey=decode(result.address),expected=decode(expectedAddressBase64);
 if(publicKey.length!==32||expected.length!==32||publicKey.some((b,i)=>b!==expected[i]))throw new Error('Wallet changed. Sign in again.');
 const signature=decode(result.signature),signedMessage=decode(result.signed_message);
 if(signature.length!==64)throw new Error('Wallet returned an invalid sign-in signature.');
 return {signature,signedMessage};
}
