import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {getBase58Decoder} from '@solana/kit';
import {createSignInMessage,verifySignIn} from '@solana/wallet-standard-util';
import {decodeSignIn} from '../src/wallet/decodeSignIn';
function fixture(){
 const keys=generateKeyPairSync('ed25519'),publicKey=new Uint8Array(keys.publicKey.export({type:'spki',format:'der'}).subarray(-32));
 const address=getBase58Decoder().decode(publicKey);
 const payload={domain:'github.com',address,uri:'https://github.com/bluntbrain',statement:'Sign in to Steal a Seeker on devnet. This does not authorize a payment.',version:'1',chainId:'solana:devnet',nonce:'123456789abcdef',issuedAt:new Date().toISOString()};
 const message=createSignInMessage(payload),signature=sign(null,message,keys.privateKey);
 const wire={address:Buffer.from(publicKey).toString('base64'),signature:signature.toString('base64'),signed_message:Buffer.from(message).toString('base64')};
 const account={address,publicKey,chains:['solana:devnet'] as const,features:['solana:signIn'] as const};
 return {payload,wire,account};
}
test('base64 MWA result passes the same SIWS verifier used by the server',()=>{
 const {payload,wire,account}=fixture();
 assert.equal(wire.signature.length,88);
 const decoded=decodeSignIn(wire,wire.address);
 assert.equal(decoded.signature.length,64);
 assert.equal(verifySignIn(payload,{account,...decoded}),true);
 // Regression: encoding the base64 strings as text is not a signature.
 assert.equal(verifySignIn(payload,{account,signature:new TextEncoder().encode(wire.signature),signedMessage:new TextEncoder().encode(wire.signed_message)}),false);
});
test('wrong wallet, malformed base64 and wrong signature length fail closed',()=>{
 const {wire}=fixture();
 assert.throws(()=>decodeSignIn(wire,Buffer.alloc(32).toString('base64')),/Wallet changed/);
 assert.throws(()=>decodeSignIn({...wire,signature:'***'},wire.address),/encoding/);
 assert.throws(()=>decodeSignIn({...wire,signature:Buffer.alloc(88).toString('base64')},wire.address),/signature/);
});
test('changed nonce and tampered signature still fail verification',()=>{
 const {payload,wire,account}=fixture(),decoded=decodeSignIn(wire,wire.address);
 assert.equal(verifySignIn({...payload,nonce:'differentNonce'},{account,...decoded}),false);
 decoded.signature[0]=decoded.signature[0]!^1;
 assert.equal(verifySignIn(payload,{account,...decoded}),false);
});
