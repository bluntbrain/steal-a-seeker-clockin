import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,URL} from 'node:url';
import {build} from 'esbuild';
import {currentRules,assertRulesCurrent,currentWeeklyEngine} from '../server/rules-version';
import {checkRuleBundle} from '../server/rule-bundle';
async function main(){
 const engine=await currentWeeklyEngine(),engineFile=new URL('../shared/weekly-engine.json',import.meta.url);
 if(process.argv.includes('--check')){await assertRulesCurrent();if(JSON.stringify(JSON.parse(await readFile(engineFile,'utf8')))!==JSON.stringify(engine))throw Error('Weekly engine fingerprint is stale. Run rules:generate.');console.log('Rules manifest and weekly engine match simulation source.');return;}
 await writeFile(engineFile,JSON.stringify(engine)+'\n');
 const rules=await currentRules(),directory=new URL('../server/rule-bundles/',import.meta.url),registryFile=new URL('registry.json',directory),out=new URL(`${rules.rulesHash}.mjs`,directory);
 await mkdir(directory,{recursive:true});
 let registry:Record<string,string>={};try{registry=JSON.parse(await readFile(registryFile,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 if(registry[rules.rulesHash]){await checkRuleBundle(rules.rulesHash);await writeFile(new URL('../shared/rules-manifest.json',import.meta.url),JSON.stringify(rules)+'\n');console.log('Existing pinned rules bundle retained.');return;}
 const result=await build({entryPoints:[fileURLToPath(new URL('../server/replay.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',target:'node22',external:['zod'],outfile:fileURLToPath(out),legalComments:'none',write:false});
 const bytes=result.outputFiles[0]!.contents,checksum=createHash('sha256').update(bytes).digest('hex');if(registry[rules.rulesHash]&&registry[rules.rulesHash]!==checksum)throw new Error('A pinned rule bundle changed. Do not overwrite historical rules.');
 await writeFile(out,bytes);
 registry[rules.rulesHash]=checksum;await writeFile(registryFile,JSON.stringify(registry,null,2)+'\n');
 await writeFile(new URL('../shared/rules-manifest.json',import.meta.url),JSON.stringify(rules)+'\n');console.log('Rules manifest and pinned replay bundle generated.');
}
void main().catch(e=>{console.error(e instanceof Error?e.message:'Rules manifest failed');process.exitCode=1;});
