// Signing credentials stay outside the repository and are never logged.
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const mode=process.argv[2]||'mainnet';if(!['devnet','judge','mainnet'].includes(mode))throw Error('Use devnet, judge or mainnet');
const config=path.join(os.homedir(),'.config/steal-a-seeker/release-signing.json');
if(!fs.existsSync(config))throw Error('Create the private signing configuration described in docs/RELEASE.md');
const signing=JSON.parse(fs.readFileSync(config,'utf8'));
for(const field of ['storeFile','storePassword','keyAlias','keyPassword'])if(!signing[field])throw Error('Missing signing field: '+field);
const env={...process.env,EXPO_PUBLIC_SOLANA_NETWORK:mode==='mainnet'?'mainnet':'devnet',SEEKER_KEYSTORE:signing.storeFile,SEEKER_STORE_PASSWORD:signing.storePassword,SEEKER_KEY_ALIAS:signing.keyAlias,SEEKER_KEY_PASSWORD:signing.keyPassword,EXPO_PUBLIC_JUDGE_PREVIEW:mode==='judge'?'1':'0',EXPO_NO_DOTENV:'1'};
if(mode==='mainnet'&&!env.EXPO_PUBLIC_API_URL)env.EXPO_PUBLIC_API_URL='https://seeker-api-production-41b3.up.railway.app';
env.EXPO_PUBLIC_PHONE_RENDERER=env.EXPO_PUBLIC_PHONE_RENDERER||'filament';
if(!['filament','turntable'].includes(env.EXPO_PUBLIC_PHONE_RENDERER))throw Error('Invalid phone renderer');
delete env.EXPO_PUBLIC_NATIVE_WEEKLY;delete env.EXPO_PUBLIC_NATIVE_RECOVERY;delete env.EXPO_PUBLIC_NATIVE_PARITY;
function run(cmd,args,cwd){const r=cp.spawnSync(cmd,args,{cwd,env,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
// the android manifest takes its version from build.gradle; sync it from app.json so the installed app matches the upload name
{const appJson=require('../app.json').expo,gradlePath='android/app/build.gradle',gradle=fs.readFileSync(gradlePath,'utf8');
 const synced=gradle.replace(/^(\s*)versionCode \d+$/m,`$1versionCode ${appJson.android.versionCode}`).replace(/^(\s*)versionName "[^"]*"$/m,`$1versionName "${appJson.version}"`);
 if(synced!==gradle){fs.writeFileSync(gradlePath,synced);console.log(`Synced android version to ${appJson.version} (${appJson.android.versionCode})`);}}
run('npm',['run','rules:check'],process.cwd());
run('./gradlew',[':app:cleanCreateBundleReleaseJsAndAssets',':app:assembleRelease','--no-daemon','-PreactNativeArchitectures=arm64-v8a','-PseekerDiagnostic=false',`-PseekerJudge=${mode==='judge'}`],path.join(process.cwd(),'android'));
fs.mkdirSync('releases',{recursive:true});const out=`releases/steal-a-seeker-${mode}.apk`;fs.copyFileSync('android/app/build/outputs/apk/release/app-release.apk',out);
const crypto=require('crypto'),sourceFiles=Object.fromEntries(cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(f=>/^(src\/|shared\/|patches\/|android\/app\/src\/|App\.tsx$|index\.ts$|app\.json$|package.*\.json$|babel\.config|metro\.config|android\/app\/build\.gradle$)/.test(f)&&fs.existsSync(f)&&fs.statSync(f).isFile()).map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),sha256=crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex');
fs.writeFileSync(out+'.json',JSON.stringify({mode,application:{package:require('../app.json').expo.android.package+(mode==='judge'?'.judge':''),version:require('../app.json').expo.version,versionCode:require('../app.json').expo.android.versionCode},publicConfig:{phoneRenderer:env.EXPO_PUBLIC_PHONE_RENDERER,phoneModelManifestSha256:crypto.createHash('sha256').update(fs.readFileSync('assets/phone-models-mobile/manifest.json')).digest('hex'),apiUrl:env.EXPO_PUBLIC_API_URL||null,cluster:mode==='mainnet'?'solana:mainnet':'solana:devnet',identityUri:env.EXPO_PUBLIC_APP_IDENTITY_URI||'https://stealaseeker.bluntbrain.com'},sourceFiles,sha256,bytes:fs.statSync(out).size,builtAt:new Date().toISOString(),head:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:cp.execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim().split('\n'),architectures:['arm64-v8a'],diagnostics:false},null,2));console.log('Built '+out+' SHA256 '+sha256);
// Keep the stable filename for local tooling and a labelled file for uploads.
const app=require('../app.json').expo;
const upload=`releases/steal-a-seeker-${mode}-v${app.version}-code${app.android.versionCode}.apk`;
fs.copyFileSync(out,upload,fs.constants.COPYFILE_FICLONE);
fs.copyFileSync(out+'.json',upload+'.json');
console.log('Upload file: '+upload);
