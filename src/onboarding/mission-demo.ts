/** Presentation-only choreography. Never creates a game, run, claim or wallet request. */
export const DEMO_DURATION = 12.8;
export const DEMO_STEPS = [
 {label:'Move', start:0, still:1.8, caption:'Tap the floor. Your courier follows the path.'},
 {label:'Shoot', start:3.6, still:4.6, caption:'Tap a guard. Your courier stops and keeps firing.'},
 {label:'Escape', start:7, still:10.6, caption:'Tap the phone to collect it. Then tap the exit.'},
] as const;
export const DEMO_COVER = [{x:68,y:174,width:88,height:49},{x:188,y:66,width:78,height:40}] as const;
const lerp=(a:number,b:number,t:number)=>{'worklet';return a+(b-a)*Math.max(0,Math.min(1,t));};
export function demoFrame(seconds:number){
 'worklet';
 const t=Math.max(0,Math.min(DEMO_DURATION,seconds));
 let x=48,y=248,facing=2,walking=false;
 if(t>=.65&&t<2.15){y=lerp(248,132,(t-.65)/1.5);walking=true;}
 else if(t>=2.15&&t<3.25){y=132;x=lerp(48,132,(t-2.15)/1.1);facing=3;walking=true;}
 else if(t>=3.25){x=132;y=132;facing=3;}
 if(t>=7.7&&t<9.2){x=lerp(132,250,(t-7.7)/1.5);y=lerp(132,212,(t-7.7)/1.5);facing=3;walking=true;}
 else if(t>=9.2){x=250;y=212;facing=0;}
 if(t>=10.15&&t<11.65){x=lerp(250,273,(t-10.15)/1.5);y=lerp(212,267,(t-10.15)/1.5);facing=0;walking=true;}
 else if(t>=11.65){x=273;y=267;}
 let bullet=-1;
 for(const start of [4.45,4.9,5.35])if(t>=start&&t<start+.28)bullet=(t-start)/.28;
 const hp=t<4.73?1:t<5.18?2/3:t<5.63?1/3:0;
 const step=t<3.6?0:t<7?1:2;
 const tapStart=step===0?0:step===1?3.65:t<9.6?7.05:9.6;
 const tapAge=t-tapStart;
 return {x,y,facing,walking,step,bullet,hp,dead:t>=5.63,
  defeat:Math.max(0,Math.min(1,(t-5.63)/.6)),
  carried:t>=9.2&&t<11.65,phoneVisible:t<9.2,extracted:t>=11.65,
  tapX:step===0?132:step===1?252:t<9.6?250:273,
  tapY:step===0?132:step===1?132:t<9.6?212:267,
  tap:tapAge>=0&&tapAge<.7?1:0,ring:Math.max(0,Math.min(1,tapAge/.7)),
  frame:facing+(walking&&Math.floor(t*7)%2===1?4:0)};
}
