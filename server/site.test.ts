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
 }finally{await app.close();}
});
