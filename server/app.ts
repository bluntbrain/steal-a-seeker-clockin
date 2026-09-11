import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {z,ZodError} from 'zod';
import {address,signature as validateSignature} from '@solana/kit';
import {PRODUCTS,type ProductId} from '../shared/commerce';
import {progressInput} from './progress';
import {CommerceService,ServiceError} from './service';
const wallet=z.string().refine(v=>{try{address(v);return true;}catch{return false;}}),uuid=z.string().uuid(),sku=z.enum(PRODUCTS.map(p=>p.id) as [ProductId,...ProductId[]]);
const bytes=z.string().max(8192).regex(/^[A-Za-z0-9+/]*={0,2}$/);
export async function createApp(service:CommerceService){
 const app=Fastify({bodyLimit:16*1024,logger:{level:'warn',redact:['req.headers.authorization']}});await app.register(rateLimit,{max:180,timeWindow:'1 minute'});
 app.setErrorHandler((error,req,reply)=>{if(error instanceof ZodError)return reply.code(400).send({error:'Invalid request.'});if(error instanceof ServiceError)return reply.code(error.status).send({error:error.message});const e=error as {statusCode?:number};if(e.statusCode&&e.statusCode<500)return reply.code(e.statusCode).send({error:'Request could not be accepted.'});req.log.error({message:error instanceof Error?error.message:'Service error'},'Request failed');return reply.code(503).send({error:'Service temporarily unavailable. Your payment will be reconciled; do not pay again.'});});
 async function account(header:string|undefined){if(!header?.startsWith('Bearer '))throw new ServiceError(401,'Wallet sign-in required.');const token=header.slice(7);if(!/^[0-9a-f]{64}$/.test(token))throw new ServiceError(401,'Invalid session.');return {wallet:await service.authenticate(token),token};}
 app.get('/health',async()=>{await service.pool.query('SELECT 1');return {ok:true,cluster:'solana:devnet'};});
 app.get('/catalog',async()=>({cluster:'solana:devnet',currency:'TEST SKR',disclaimer:'Test tokens have no monetary value.',products:PRODUCTS}));
 app.post('/auth/challenge',async req=>service.challenge(z.object({wallet}).strict().parse(req.body).wallet));
 app.post('/auth/verify',async req=>service.signIn(z.object({id:uuid,wallet,signedMessage:bytes,signature:bytes}).strict().parse(req.body)));
 app.post('/auth/logout',async req=>{const a=await account(req.headers.authorization);await service.logout(a.token);return {ok:true};});
 app.get('/me',async req=>service.me((await account(req.headers.authorization)).wallet));
 app.get('/orders',async req=>service.orders((await account(req.headers.authorization)).wallet));
 app.post('/orders',async req=>{const a=await account(req.headers.authorization),b=z.object({sku,idempotencyKey:uuid}).strict().parse(req.body);return service.createOrder(a.wallet,b.sku,b.idempotencyKey);});
 app.get('/orders/:id',async req=>{const a=await account(req.headers.authorization),{id}=z.object({id:uuid}).parse(req.params);return service.getOrder(a.wallet,id);});
 app.post('/orders/:id/prepare',async req=>{const a=await account(req.headers.authorization),{id}=z.object({id:uuid}).parse(req.params);z.object({}).strict().parse(req.body);return service.preparePayment(a.wallet,id);});
 app.post('/orders/:id/transaction',async req=>{const a=await account(req.headers.authorization),{id}=z.object({id:uuid}).parse(req.params),body=z.object({signature:z.string().refine(v=>{try{validateSignature(v);return true;}catch{return false;}})}).strict().parse(req.body);return service.attach(a.wallet,id,body.signature);});
 app.post('/orders/:id/reconcile',async req=>{const a=await account(req.headers.authorization),{id}=z.object({id:uuid}).parse(req.params);await service.getOrder(a.wallet,id);await service.reconcile(id);return service.getOrder(a.wallet,id);});
 app.put('/me/progress',async req=>service.syncProgress((await account(req.headers.authorization)).wallet,progressInput.parse(req.body)));
 app.put('/me/equipment',async req=>service.equip((await account(req.headers.authorization)).wallet,z.object({sku}).strict().parse(req.body).sku));
 return app;
}
