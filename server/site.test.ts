import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerSite} from './site';
test('public release pages are reachable without a wallet and expose account deletion',async()=>{
 const app=Fastify();registerSite(app);
 try{for(const path of ['/','/privacy','/terms','/support','/delete-account']){
  const response=await app.inject(path);assert.equal(response.statusCode,200);
  assert.match(response.headers['content-type']!,/text\/html/);
  assert.match(response.body,/hello@kraneapps\.com/);
  assert.match(response.body,/href="\/delete-account"/);
  assert.match(response.headers['content-security-policy']!,/frame-ancestors 'none'/);
 }
 const terms=(await app.inject('/terms')).body;
 assert.match(terms,/Weekly token prizes are not active/);
 assert.match((await app.inject('/privacy')).body,/cannot be erased/);
 const art=await app.inject('/release-banner.jpg');assert.equal(art.statusCode,200);assert.equal(art.headers['content-type'],'image/jpeg');
 const links=await app.inject('/.well-known/assetlinks.json');assert.equal(links.statusCode,200);assert.match(links.headers['content-type']!,/application\/json/);
 assert.deepEqual(links.json()[0].target,{namespace:'android_app',package_name:'com.bluntbrain.stealaseeker',sha256_cert_fingerprints:['4F:A3:E9:94:22:38:F1:10:82:4F:B6:7D:C9:94:38:FC:1D:70:EF:48:A2:73:E4:A7:93:31:D5:F8:A1:E1:E9:13']});
 }finally{await app.close();}
});
