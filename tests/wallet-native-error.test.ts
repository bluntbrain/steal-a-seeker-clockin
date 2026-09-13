import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SolanaMobileWalletAdapterProtocolError} from '@solana-mobile/mobile-wallet-adapter-protocol';
import {normalizeNativeProtocolError,protocolErrorCode} from '../src/wallet/protocolError';
import {walletFailure,walletReport} from '../src/wallet/diagnostics';
const normalize=(error:unknown)=>normalizeNativeProtocolError(error,code=>new SolanaMobileWalletAdapterProtocolError(0,code,'Wallet authorization request failed.'));
test('native rejected authorization becomes the protocol class used by SDK retry',()=>{
 const native=Object.assign(new Error('private message'),{code:'JSON_RPC_ERROR',userInfo:{jsonRpcErrorCode:-1,private:'secret-response'}});
 const normalized=normalize(native);
 assert.ok(normalized instanceof SolanaMobileWalletAdapterProtocolError);
 assert.equal(normalized.code,-1);
 assert.equal(protocolErrorCode(native),-1);
 walletFailure('test.native-authorization',native);
 assert.equal(walletReport().includes('secret-response'),false);
 assert.equal(walletReport().includes('private message'),false);
});
test('native decline retains -3 and is not eligible for authorization retry',()=>{
 const normalized=normalize({code:'JSON_RPC_ERROR',userInfo:{jsonRpcErrorCode:-3}});
 assert.ok(normalized instanceof SolanaMobileWalletAdapterProtocolError);assert.equal(normalized.code,-3);
});
test('already normalized, transport and malformed errors are preserved',()=>{
 for(const e of [new SolanaMobileWalletAdapterProtocolError(0,-1,'failure'),new Error('network'),{code:'JSON_RPC_ERROR',userInfo:{}},{code:'JSON_RPC_ERROR',userInfo:{jsonRpcErrorCode:'-1'}}])assert.equal(normalize(e),e);
});
