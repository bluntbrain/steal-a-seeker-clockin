// local decision bridge for the jev pilot. holds the typesafe api key, forwards one choice question per
// decision to jev (model jev-1.13.0, docs.typesafe.ai/api) and returns the chosen key with probabilities.
// without TYPESAFE_API_KEY it answers with a stand in that walks toward the objective while avoiding cones,
// so the loop can be tested; the mode is always reported so the overlay can say which one is playing.
// usage: OPENROUTER_API_KEY=... node scripts/jev-bridge.mjs [port]   endpoints: POST /decide, GET /last, GET /overlay
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {URL} from 'node:url';
// two routes to the same model: openrouter's decisions api (OPENROUTER_API_KEY) or typesafe directly (TYPESAFE_API_KEY)
const port=Number(process.argv[2]||8791),orKey=process.env.OPENROUTER_API_KEY,tsKey=process.env.TYPESAFE_API_KEY,key=orKey||tsKey;
const endpoint=orKey?'https://openrouter.ai/api/alpha/decisions':'https://api.typesafe.ai/v1/systemone';
const model=process.env.JEV_MODEL||(orKey?'typesafe/jev-1.13':'jev-1.13.0');
let last={choice:null,probabilities:{},confidence:0,mode:key?'jev':'mock',ms:0,at:0,decisions:0,tokens:0,errors:0};const log=[];
function mock(criteria,meta){
 const keys=Object.keys(criteria);const score=k=>{const m=meta?.[k]??{};return (m.exposed?100:0)+(m.dist_to_goal??50)+(k==='wait'?20:0)+(k.startsWith('attack')?(m.exposed?30:-2):0);};
 const ranked=[...keys].sort((a,b)=>score(a)-score(b)),choice=ranked[0];
 const probabilities={};ranked.forEach((k,i)=>{probabilities[k]=i===0?.6:+(0.4/Math.max(1,keys.length-1)).toFixed(3);});
 return {choice,probabilities,confidence:.6};
}
async function jev(state,instructions,criteria){
 for(let attempt=0;;attempt++){
  const r=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,state,questions:{next_move:{type:'choice',instructions,criteria}}})});
  if((r.status===429||r.status===529)&&attempt<4){await new Promise(res=>setTimeout(res,300*2**attempt));continue;}
  if(!r.ok)throw new Error(`jev ${r.status}: ${(await r.text()).slice(0,200)}`);
  const j=await r.json(),a=j.answers?.next_move;if(!a)throw new Error('jev returned no answer');
  last.tokens+=j.usage?.input_tokens??0;return {choice:a.choice,probabilities:a.probabilities??{},confidence:a.confidence??0};
 }
}
const overlay=`<!doctype html><meta charset="utf-8"><title>Jev pilot</title><style>body{margin:0;background:transparent;color:#F0F6E8;font:600 18px/1.3 Inter,system-ui,sans-serif}.b{background:#091917EE;border:1px solid #2F4C43;border-radius:14px;padding:14px 18px;width:360px}.k{font-size:11px;letter-spacing:.14em;color:#A7DBC6}.bar{height:8px;background:#1C352C;border-radius:4px;overflow:hidden;margin:4px 0 8px}.bar i{display:block;height:100%;background:#C4F7DC}.m{color:#ADC5BA;font-size:12px}</style><div class="b"><div class="k">JEV DECIDES, THE GAME WALKS</div><div id="c">waiting</div><div id="p"></div><div class="m" id="m"></div></div><script>setInterval(async()=>{const d=await (await fetch('/last')).json();document.getElementById('c').textContent=d.choice?d.choice.replace(/_/g,' '):'waiting';const p=document.getElementById('p');p.replaceChildren();for(const [k,v] of Object.entries(d.probabilities).sort((a,b)=>b[1]-a[1]).slice(0,5)){const l=document.createElement('div');l.className='k';l.textContent=k.replace(/_/g,' ')+' '+Math.round(v*100)+'%';const bar=document.createElement('div');bar.className='bar';const i=document.createElement('i');i.style.width=Math.round(v*100)+'%';bar.append(i);p.append(l,bar);}document.getElementById('m').textContent=(d.mode==='jev'?'jev-1.13.0':'stand in, no api key')+' · '+d.ms+' ms · '+d.decisions+' decisions'+(d.tokens?' · '+d.tokens+' tokens':'');},400)</script>`;
http.createServer(async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type');
 if(req.method==='OPTIONS'){res.writeHead(204).end();return;}
 if(req.method==='GET'&&req.url==='/last'){res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(last));return;}
 if(req.method==='GET'&&req.url==='/overlay'){res.writeHead(200,{'Content-Type':'text/html'}).end(overlay);return;}
 if(req.method==='GET'&&req.url==='/log'){res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(log.slice(-60)));return;}
 // the stage page and its assets live in show/; the game itself is an iframe to the preview server
 if(req.method==='GET'&&(req.url==='/stage'||req.url.startsWith('/show/'))){try{const name=req.url==='/stage'?'stage.html':req.url.slice(6).split('?')[0];const file=await readFile(new URL('../show/'+name,import.meta.url));res.writeHead(200,{'Content-Type':name.endsWith('.png')?'image/png':name.endsWith('.css')?'text/css':'text/html'}).end(file);}catch{res.writeHead(404).end();}return;}
 if(req.method!=='POST'||req.url!=='/decide'){res.writeHead(404).end();return;}
 let body='';for await(const chunk of req)body+=chunk;
 const started=Date.now();
 try{const {state,instructions,criteria,meta}=JSON.parse(body);if(!criteria||!Object.keys(criteria).length)throw new Error('no options');
  const answer=key?await jev(state,instructions,criteria):mock(criteria,meta);
  last={...last,...answer,mode:key?'jev':'mock',ms:Date.now()-started,at:started,decisions:last.decisions+1};
  log.push({n:last.decisions,at:started,choice:answer.choice,p:Math.round((answer.probabilities?.[answer.choice]??0)*100),confidence:+answer.confidence.toFixed(2),ms:last.ms,level:state?.level?.number??null,hp:state?.courier?.hp??null});if(log.length>200)log.shift();
  res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({choice:answer.choice,probabilities:answer.probabilities,confidence:answer.confidence,mode:last.mode,ms:last.ms}));
 }catch(e){last.errors++;console.error('decide failed:',e instanceof Error?e.message:e);res.writeHead(502,{'Content-Type':'application/json'}).end(JSON.stringify({error:String(e instanceof Error?e.message:e)}));}
}).listen(port,'127.0.0.1',()=>console.log(`jev bridge on http://127.0.0.1:${port} (${key?model+' via '+(orKey?'openrouter':'typesafe'):'stand in, set OPENROUTER_API_KEY or TYPESAFE_API_KEY for jev'})`));
