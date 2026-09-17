import Fastify from 'fastify';
import {registerSite} from '../server/site';
const app=Fastify();registerSite(app);
app.listen({host:'127.0.0.1',port:8792}).then(url=>console.log('Local website preview: '+url)).catch(error=>{console.error(error.message);process.exitCode=1;});
