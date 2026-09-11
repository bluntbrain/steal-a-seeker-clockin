import {readFile} from 'node:fs/promises';
import {URL} from 'node:url';
import {createHash} from 'node:crypto';
export async function checkRuleBundle(hash:string){
 if(!/^[a-f0-9]{64}$/.test(hash))throw new Error('Invalid rules version.');
 const directory=new URL('./rule-bundles/',import.meta.url),registry=JSON.parse(await readFile(new URL('registry.json',directory),'utf8')) as Record<string,string>;
 const file=new URL(`${hash}.mjs`,directory),actual=createHash('sha256').update(await readFile(file)).digest('hex');
 if(!registry[hash]||registry[hash]!==actual)throw new Error('Pinned rules bundle is missing or changed.');return file;
}
