import {PRODUCTS} from '../shared/commerce';
import {MAINNET_SKR_MINT,type SolanaCluster} from '../shared/network';
import type {Pool} from 'pg';
export function networkConfig(env:Record<string,string|undefined>){
 const name=env.SOLANA_NETWORK??'devnet';if(!['devnet','mainnet'].includes(name))throw new Error('Unsupported Solana network.');
 const integer=(key:string,fallback:number,min:number,max:number)=>{const n=Number(env[key]??fallback);if(!Number.isSafeInteger(n)||n<min||n>max)throw new Error('Invalid pricing setting: '+key);return n;};
 let shopPrices:Record<string,string>={};if(env.SHOP_PRICES_SKR_JSON){let parsed:unknown;try{parsed=JSON.parse(env.SHOP_PRICES_SKR_JSON);}catch{throw new Error('Invalid SHOP_PRICES_SKR_JSON');}if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Invalid shop prices');for(const [sku,value] of Object.entries(parsed)){if(!PRODUCTS.some(p=>p.id===sku&&p.kind!=='access')||!/^\d+(\.\d{1,6})?$/.test(String(value))||Number(value)<=0||Number(value)>100000)throw new Error('Invalid shop price: '+sku);shopPrices[sku]=String(value);}}
 const testFlag=env.TEST_PRICING??'false';if(!['true','false'].includes(testFlag))throw new Error('TEST_PRICING must be true or false.');
 const testPricing=testFlag==='true';
 const livePriceDivisor=integer('SHOP_PRICE_DIVISOR',1,1,100),livePassCents=integer('GAME_PASS_USD_CENTS',1000,1,100000);
 const testPassCents=integer('TEST_GAME_PASS_USD_CENTS',10,1,100);
 if(testPricing){shopPrices=Object.fromEntries(PRODUCTS.filter(p=>p.kind!=='access').map(p=>[p.id,'0.1']));}
 const mainnet=name==='mainnet',cluster:SolanaCluster=mainnet?'solana:mainnet':'solana:devnet';
 const allowlist=(env.MAINNET_TEST_WALLETS??'').split(',').map(s=>s.trim()).filter(Boolean);
 const openFlag=env.MAINNET_ALLOW_ALL_WALLETS??'false';
 if(!['true','false'].includes(openFlag))throw new Error('MAINNET_ALLOW_ALL_WALLETS must be true or false.');
 const allowAllWallets=openFlag==='true';
 if(mainnet&&(!allowAllWallets&&!allowlist.length||env.MAINNET_TEST_ENABLED!=='1'))throw new Error('Mainnet testing requires explicit enablement and tester wallets or all-wallet access.');
 return {cluster,mainnet,allowlist,allowAllWallets,testPricing,shopPrices,priceDivisor:testPricing?100:livePriceDivisor,campaignUsdCents:testPricing?testPassCents:livePassCents,rebateSkr:integer('CAMPAIGN_REBATE_SKR',0,0,10000),
  mint:mainnet?MAINNET_SKR_MINT:env.DEVNET_TEST_MINT??'',recipient:mainnet?env.MAINNET_TREASURY??'':env.DEVNET_TREASURY??'',
  decimals:mainnet?6:Number(env.DEVNET_TOKEN_DECIMALS??6),rpcUrl:mainnet?env.MAINNET_RPC_URL??'https://api.mainnet-beta.solana.com':env.DEVNET_RPC_URL??'https://api.devnet.solana.com',
  signerPath:mainnet?env.MAINNET_SIGNER_PATH:env.DEVNET_SIGNER_PATH,signerJson:mainnet?env.MAINNET_SIGNER_JSON:env.DEVNET_SIGNER_JSON,
  returnsEnabled:(mainnet?env.MAINNET_RETURNS_ENABLED:env.DEVNET_RETURNS_ENABLED)==='1'};
}
/** Refuse to reinterpret any existing purchases/sessions as a different network. */
export async function bindDatabaseNetwork(pool:Pool,cluster:SolanaCluster){
 const client=await pool.connect();try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(1936024942)');
  await client.query('CREATE TABLE IF NOT EXISTS deployment_network(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), cluster text NOT NULL)');
  const saved=await client.query('SELECT cluster FROM deployment_network');
  if(saved.rowCount&&saved.rows[0].cluster!==cluster)throw new Error('Database belongs to a different Solana network. Use a separate database.');
  if(!saved.rowCount){const old=await client.query('SELECT 1 FROM wallets LIMIT 1');if(old.rowCount&&cluster!=='solana:devnet')throw new Error('Existing Devnet data cannot become Mainnet data.');await client.query('INSERT INTO deployment_network(cluster) VALUES($1)',[cluster]);}
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
