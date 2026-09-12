import { createPicture, Skia, type SkCanvas } from '@shopify/react-native-skia';
import { LEVEL,type LevelDefinition } from './level';
const palette={ floor:'#20292c', line:'#293337', mint:'#cfe6e4', edge:'#465054' };
// Code-native environment art is recorded once, not recreated on each animation frame.
export function makeWarehouse(drawFloor=true,level:LevelDefinition=LEVEL){
  return createPicture((c:SkCanvas)=>{
    const p=Skia.Paint();p.setAntiAlias(true);
    const rect=(x:number,y:number,w:number,h:number,color:string)=>{p.setColor(Skia.Color(color));c.drawRect(Skia.XYWHRect(x,y,w,h),p);};
    const round=(x:number,y:number,w:number,h:number,r:number,color:string)=>{p.setColor(Skia.Color(color));c.drawRRect(Skia.RRectXY(Skia.XYWHRect(x,y,w,h),r,r),p);};
    const line=(x:number,y:number,x2:number,y2:number,color:string,width=.025)=>{p.setColor(Skia.Color(color));p.setStrokeWidth(width);c.drawLine(x,y,x2,y2,p);};
    if(drawFloor){
    rect(0,0,12,20,'#131b1e');
    for(let y=0;y<20;y++)for(let x=0;x<12;x++){
      rect(x+.025,y+.025,.95,.95,(x*3+y*7)%6===0?'#263033':palette.floor);
      line(x+.04,y+.04,x+.95,y+.04,'#303b3e',.025);
      if((x*13+y*17)%11===0){line(x+.17,y+.7,x+.48,y+.7,'#2e393b',.015);line(x+.36,y+.22,x+.7,y+.22,'#1b2427',.025);}
    }
    // Painted loading lanes; a path indication, not an automatic solution line.
    for(let y=4;y<18;y+=1.2){rect(3.95,y,.035,.45,'#52635f');rect(10.7,y,.035,.45,'#3d4f4d');}
    }
    for(const b of level.blockers){
      if(b.kind==='wall'){
        rect(b.x,b.y+.16,b.w,b.h,'#080d10');rect(b.x,b.y,b.w,b.h,'#333f43');
        rect(b.x+.08,b.y+.08,Math.max(.1,b.w-.16),Math.max(.1,b.h-.16),'#343B41');line(b.x+.06,b.y+.04,b.x+b.w-.06,b.y+.04,'#B4C2C4',.055);continue;
      }
      round(b.x+.11,b.y+.2,b.w,b.h,.08,'#11191bc9');
      round(b.x,b.y,b.w,b.h,.07,'#0d1417');
      round(b.x+.04,b.y+.04,b.w-.08,b.h-.20,.06,'#465155');
      round(b.x+.11,b.y+.10,b.w-.22,b.h-.36,.045,b.kind==='rack'?'#293438':'#354045');
      rect(b.x+.11,b.y+b.h-.3,b.w-.22,.11,'#20292d');
      line(b.x+.15,b.y+.12,b.x+b.w-.15,b.y+.12,'#77837f',.04);
      if(b.kind==='crate'){
        rect(b.x+.25,b.y+.2,.11,b.h-.7,'#475256');rect(b.x+b.w-.37,b.y+.2,.11,b.h-.7,'#475256');
        line(b.x+.48,b.y+.38,b.x+b.w-.48,b.y+b.h-.55,'#222d31',.055);
        line(b.x+b.w-.48,b.y+.38,b.x+.48,b.y+b.h-.55,'#222d31',.055);
        rect(b.x+b.w/2-.24,b.y+b.h-.27,.48,.065,'#CFE6E4');
        for(const xx of [b.x+.05,b.x+b.w-.26]){rect(xx,b.y+.04,.21,.19,'#CBD4D4');rect(xx,b.y+b.h-.36,.21,.17,'#9AA9AF');}
      }else{
        for(let y=b.y+.36;y<b.y+b.h-.4;y+=.5){rect(b.x+.22,y,b.w-.44,.25,'#121d21');line(b.x+.25,y+.03,b.x+b.w-.25,y+.03,'#56625f',.02);rect(b.x+.28,y+.08,.055,.055,'#8aac9d');}
      }
      for(const [x,y]of [[b.x+.16,b.y+.17],[b.x+b.w-.16,b.y+.17],[b.x+.16,b.y+b.h-.35],[b.x+b.w-.16,b.y+b.h-.35]]){p.setColor(Skia.Color('#97a09a'));c.drawCircle(x!,y!,.035,p);}
    }
    // Mint-lit exit bay and target pedestal. Effects and changing state are drawn separately.
    const e=level.exit;
    round(e.x-.15,e.y-.16,e.w+.3,e.h+.3,.15,'#101b1d');
    round(e.x,e.y,e.w,e.h,.10,'#2b4b48');
    rect(e.x+.10,e.y+.10,e.w-.20,.035,'#b3dfd2');
    rect(e.x+.10,e.y+.10,.035,e.h-.2,'#88b8ab');rect(e.x+e.w-.14,e.y+.10,.035,e.h-.2,'#88b8ab');
    for(let y=0;y<3;y++){const yy=e.y+1.35-y*.22;line(e.x+.9,yy,e.x+e.w/2,yy-.17,'#acd2c6',.06);line(e.x+e.w/2,yy-.17,e.x+e.w-.9,yy,'#acd2c6',.06);}
    for(const phone of level.targets??[level.phone]){
    round(phone.x-.68,phone.y-.34,1.36,.96,.14,'#111b1e');
    round(phone.x-.60,phone.y-.39,1.20,.73,.12,'#596660');
    round(phone.x-.51,phone.y-.34,1.02,.54,.08,'#263b39');
    rect(phone.x-.3,phone.y+.34,.6,.035,'#b8ded0');
    }
    // Boundary lights and entrance hatch.
    for(const y of [2.8,10.8,17.7]){rect(.55,y,.08,.8,'#adc6b6');rect(11.37,y,.08,.8,'#697f72');}
    round(level.spawn.x-.85,level.spawn.y+.7,1.7,.3,.06,'#0e171b');
    for(let x=level.spawn.x-.75;x<level.spawn.x+.65;x+=.25)line(x,level.spawn.y+.73,x+.1,level.spawn.y+.95,'#A5B9BA',.04);
  },{width:12,height:20});
}
