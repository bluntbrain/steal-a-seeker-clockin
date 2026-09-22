/** Durable queue plus shared uploads. A win uploads directly, not behind old runs. */
export function createOutbox<T,R>(io:{read:(wallet:string)=>Promise<T[]>;write:(wallet:string,items:T[])=>Promise<void>;send:(token:string,item:T)=>Promise<R>}){
 let writes=Promise.resolve();
 const uploads=new Map<string,Promise<R>>(),receipts=new Map<string,R>();
 const id=(item:T)=>JSON.stringify(item);
 function change(wallet:string,fn:(items:T[])=>T[]){const next=writes.catch(()=>{}).then(async()=>io.write(wallet,fn(await io.read(wallet))));writes=next;return next;}
 async function enqueue(wallet:string,item:T){await change(wallet,items=>items.some(i=>id(i)===id(item))?items:[...items,item]);}
 async function submit(wallet:string,token:string,item:T):Promise<R>{
  const key=JSON.stringify([wallet,token,id(item)]),cached=receipts.get(key);
  if(cached!==undefined){await change(wallet,items=>items.filter(i=>id(i)!==id(item))).catch(()=>{});return cached;}
  const active=uploads.get(key);if(active)return active;
  const task=(async()=>{
   const receipt=await io.send(token,item);
   // A disk cleanup failure must not turn a confirmed server award into a failure.
   receipts.set(key,receipt);if(receipts.size>32)receipts.delete(receipts.keys().next().value!);
   await change(wallet,items=>items.filter(i=>id(i)!==id(item))).catch(()=>{});
   return receipt;
  })();
  uploads.set(key,task);try{return await task;}finally{uploads.delete(key);}
 }
 async function flush(wallet:string,token:string,onReceipt?:(item:T,receipt:R)=>void){await writes.catch(()=>{});for(const item of await io.read(wallet)){const receipt=await submit(wallet,token,item);onReceipt?.(item,receipt);}}
 return {enqueue,submit,flush};
}
