const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../dist'),port=Number(process.env.PORT||8787);
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.wav':'audio/wav','.txt':'text/plain'};
http.createServer(async(req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 // Local preview exposes only public challenge reads, never authenticated actions.
 if(req.method==='GET'&&/^\/api\/(?:daily(?:\/\d{4}-\d{2}-\d{2}\/leaderboard)?|paid\/challenge)$/.test(name)){
  try{const response=await fetch(`http://127.0.0.1:8790${name.slice(4)}`,{signal:AbortSignal.timeout(12000)});res.writeHead(response.status,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(await response.text());}
  catch{res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'The local daily service is unavailable. Try refreshing later.'}));}
 }
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);});
}).listen(port,'127.0.0.1',()=>console.log(`Steal a Seeker: http://127.0.0.1:${port}`));
