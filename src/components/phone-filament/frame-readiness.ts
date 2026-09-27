type PickedEntity={id:number};
type PhoneView={getViewport:()=>{width:number;height:number};pickEntity:(x:number,y:number)=>Promise<PickedEntity|null|undefined>};

/** Wait for rendered phone geometry, not only a decoded model or a frame callback. */
export function watchPhoneFrame(view:PhoneView,ids:Set<number>,density:number,onReady:()=>void){
 let disposed=false,pending=false;
 const timer=setInterval(()=>void check(),250);
 async function check(){
  if(disposed||pending)return;
  pending=true;
  try{
   const viewport=view.getViewport();if(viewport.width<=0||viewport.height<=0)return;
   const entity=await view.pickEntity(viewport.width/(2*density),viewport.height/(2*density));
   if(!disposed&&entity&&ids.has(entity.id)){disposed=true;clearInterval(timer);onReady();}
  }catch{/* A recovering/released view stays covered until the parent's timeout. */}
  finally{pending=false;}
 }
 return ()=>{disposed=true;clearInterval(timer);};
}
