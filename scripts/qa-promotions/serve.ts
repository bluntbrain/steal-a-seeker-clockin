/** Isolated local QA only. Never included in the API Docker context. */
import {generateKeyPairSync,randomBytes,sign} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getBase58Decoder} from '@solana/kit';
import {createSignInMessage} from '@solana/wallet-standard-util';
import {database,migrate} from '../../server/db';
import {CommerceService} from '../../server/service';
import {createApp} from '../../server/app';
import {parsePromotions} from '../../server/promotions';
async function main(){
 const pool=database('postgresql://localhost/seeker_coupon_ui');await migrate(pool);
 const b58=(v:Uint8Array)=>getBase58Decoder().decode(v),pub=()=>b58(randomBytes(32));
 const promos=parsePromotions(JSON.stringify([100,50,25].map(percentOff=>({id:`qa-ui-${percentOff}`,code:`TESTONLY${percentOff}`,label:'QA community offer',percentOff,sku:'campaign',bonusSkus:percentOff===100?['solana-toly','solana-mert','solana-chase','solana-lily','solana-vibhu','solana-akshay','solana-beeman']:[],startsAt:'2026-01-01T00:00:00Z',expiresAt:'2027-01-01T00:00:00Z',maxRedemptions:1000}))));
 const service=new CommerceService(pool,{ready:async()=>{},verify:async()=>({state:'pending',detail:'QA pending'}),find:async()=>[],height:async()=>1,lifetime:async()=>({blockhash:pub(),lastValidBlockHeight:'9999',contextSlot:'1'})},{promotions:promos,identityUri:'http://localhost',mint:pub(),recipient:pub(),destination:pub(),decimals:6,usdPricing:true,passSkr:500,campaignUsdCents:1000},{rates:async()=>({SKR:'0.02',SOL:'100',at:Date.now()})});
 const app=await createApp(service);
 app.get('/qa',async(_,r)=>r.type('text/html').send('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#071311}button{padding:12px;margin:5px}</style><div id="root"></div><script src="/ui.js"></script>'));
 app.get('/ui.js',async(_,r)=>r.type('application/javascript').send(await readFile('/tmp/seeker-promotion-ui.js','utf8')));
 app.post('/qa/login',async()=>{const k=generateKeyPairSync('ed25519'),wallet=b58(k.publicKey.export({type:'spki',format:'der'}).subarray(-32)),c=await service.challenge(wallet),m=createSignInMessage(c.payload);return {wallet,...await service.signIn({id:c.id,wallet,signedMessage:Buffer.from(m).toString('base64'),signature:sign(null,m,k.privateKey).toString('base64')})};});
 await app.listen({host:'127.0.0.1',port:8824});console.log('Isolated promotion QA: http://127.0.0.1:8824');
}
void main();
