import { createPicture, Skia, type SkCanvas, type SkImage } from '@shopify/react-native-skia';
import { LEVEL,type LevelDefinition } from './level';
import {districtFor} from './environment';
import {drawWallPanels} from '../art/walls';
import {interiorWalls,type WallStyle} from '../art/wall-depth';
import {drawRaisedWalls} from '../art/wall-depth-art';
const palette={ floor:'#20292c', line:'#293337', mint:'#cfe6e4', edge:'#465054' };
// Code-native environment art is recorded once, not recreated on each animation frame.
export function makeWarehouse(drawFloor=true,level:LevelDefinition=LEVEL,wallTexture?:SkImage|null,wallStyle:WallStyle='flat'){
  return createPicture((c:SkCanvas)=>{
    const district=districtFor(level.number),rooftop=district==='rooftops',power=district==='powerworks';
    const p=Skia.Paint();p.setAntiAlias(true);
    const rect=(x:number,y:number,w:number,h:number,color:string)=>{p.setColor(Skia.Color(color));c.drawRect(Skia.XYWHRect(x,y,w,h),p);};
    const round=(x:number,y:number,w:number,h:number,r:number,color:string)=>{p.setColor(Skia.Color(color));c.drawRRect(Skia.RRectXY(Skia.XYWHRect(x,y,w,h),r,r),p);};
    const line=(x:number,y:number,x2:number,y2:number,color:string,width=.025)=>{p.setColor(Skia.Color(color));p.setStrokeWidth(width);c.drawLine(x,y,x2,y2,p);};
    const circle=(x:number,y:number,r:number,color:string)=>{p.setColor(Skia.Color(color));c.drawCircle(x,y,r,p);};
    if(drawFloor){
    rect(0,0,12,20,'#131b1e');
    for(let y=0;y<20;y++)for(let x=0;x<12;x++){
      rect(x+.025,y+.025,.95,.95,rooftop?'#344E64':power?'#69776E':(x*3+y*7)%6===0?'#263033':palette.floor);
      line(x+.04,y+.04,x+.95,y+.04,'#303b3e',.025);
      if((x*13+y*17)%11===0){line(x+.17,y+.7,x+.48,y+.7,'#2e393b',.015);line(x+.36,y+.22,x+.7,y+.22,'#1b2427',.025);}
    }
    // Painted loading lanes; a path indication, not an automatic solution line.
    for(let y=4;y<18;y+=1.2){rect(3.95,y,.035,.45,'#52635f');rect(10.7,y,.035,.45,'#3d4f4d');}
    }
    // District floor markings and perimeter depth remain outside walking geometry.
    if(!rooftop&&!power){
      // Flat loading-bay paint: never looks like raised, collidable cover.
      const bayY=[15.8,12.1,16.2,13][Math.max(0,level.number-1)%4]!;
      for(const x of [1,7.6]){line(x,bayY,x+3.3,bayY,'#B49D6A',.055);line(x,bayY,x,bayY+1.7,'#B49D6A',.055);}
      if(level.number===3)for(let y=2;y<19;y+=.9){rect(7.8,y,.065,.48,'#CCB776');rect(10.95,y,.065,.48,'#CCB776');}
      if(level.number===4)for(let x=1;x<11;x+=.55){rect(x,12.8,.28,.07,'#AB9670');rect(x,4,.28,.07,'#AB9670');}
    }
    if(power){
      // Recessed cable traces connect the real control pads to real door channels.
      for(const sw of level.switches??[]){const gate=level.gates?.find(g=>sw.kind==='power'?g.mode==='power':g.relay===(sw.channel??0));if(!gate)continue;
        const xx=gate.box.x+gate.box.w/2,yy=gate.box.y+gate.box.h/2;
        line(sw.x,sw.y,xx,sw.y,'#3C4A50',.13);line(xx,sw.y,xx,yy,'#3C4A50',.13);
        line(sw.x,sw.y,xx,sw.y,sw.kind==='power'?'#72928A':'#8D789F',.045);line(xx,sw.y,xx,yy,sw.kind==='power'?'#72928A':'#8D789F',.045);
      }
      if(level.number===10||level.number===12)for(const target of level.targets??[]){
        for(const radius of [1.05,1.2]){p.setColor(Skia.Color(level.number===12?'#B6A071':'#827098'));p.setStyle(1);p.setStrokeWidth(.045);c.drawCircle(target.x,target.y,radius,p);p.setStyle(0);}
      }
    }
    if(rooftop){
      rect(0,0,.55,20,'#090F18');rect(11.45,0,.55,20,'#090F18');
      for(let y=1;y<20;y+=1.3)for(const x of [.08,11.62]){rect(x,y,.3,.7,'#25303D');rect(x+.07,y+.1,.06,.08,'#78AAAE');rect(x+.18,y+.3,.05,.07,'#416B7E');}
      for(let y=3;y<19;y+=5){line(.65,y,11.35,y,'#344B55',.045);for(let x=.8;x<11.3;x+=.3)line(x,y-.12,x,y+.12,'#435A60',.02);}
      if(level.number===8){ // Worn landing-zone paint, underneath all game objects.
        p.setColor(Skia.Color('#A6B6B45A'));p.setStyle(1);p.setStrokeWidth(.09);c.drawCircle(6,9.5,2.6,p);p.setStyle(0);
        line(5,8.3,5,10.7,'#A6B6B45A',.14);line(7,8.3,7,10.7,'#A6B6B45A',.14);line(5,9.5,7,9.5,'#A6B6B45A',.14);
      }
    }else{
      for(let y=1.4;y<19;y+=1.1){rect(1.1,y,.045,.48,power?'#6F637D':'#536960');rect(10.85,y,.045,.48,'#3C5151');}
      for(let y=4;y<19;y+=6){rect(.64,y,1,.05,'#677B7D');for(let x=.7;x<1.6;x+=.16)line(x,y-.16,x+.1,y-.06,'#7D8F87',.025);}
    }
    if(level.mission==='narrow-crossing'){
      rect(.7,9.4,10.6,1.2,'#080E19');
      for(let x=.8;x<11.2;x+=.55){rect(x,9.6,.36,.65,'#1D2939');rect(x+.08,9.75,.06,.06,'#598490');rect(x+.2,10,.05,.08,'#8BA8A5');}
      for(const x of [1.8,8]){rect(x,9.4,2.2,1.2,'#53666A');for(let y=9.48;y<10.6;y+=.15)line(x+.1,y,x+2.1,y,'#182C36',.045);line(x+.07,9.4,x+.07,10.6,'#B4E9DA',.06);line(x+2.13,9.4,x+2.13,10.6,'#B4E9DA',.06);}
    }
    const raised=wallStyle!=='flat'&&wallTexture?interiorWalls(level.blockers,level.width,level.height):[];
    for(const [index,b] of level.blockers.entries()){
      if(raised.includes(b))continue;
      // In Narrow Crossing these blocked spans become fenced roof gaps;
      // only the two actual timed doorways are traversable bridges.
      if(level.mission==='narrow-crossing'&&b.kind==='rack'&&b.y===9.4){
        rect(b.x,b.y,b.w,.16,'#526871');rect(b.x,b.y+b.h-.16,b.w,.16,'#32474F');
        line(b.x,b.y+.03,b.x+b.w,b.y+.03,'#A6DED1',.05);
        line(b.x,b.y+b.h-.03,b.x+b.w,b.y+b.h-.03,'#81B8B1',.05);
        for(let x=b.x+.1;x<b.x+b.w;x+=.35){rect(x,b.y,.06,.24,'#BDDDD4');rect(x,b.y+b.h-.24,.06,.24,'#8EBFB8');}
        continue;
      }
      if(b.kind==='wall'){
        if(index>=4&&wallTexture){
          round(b.x+.06,b.y+.14,b.w,b.h,.07,'#070D11A8');
          round(b.x,b.y,b.w,b.h,.065,'#172329');
          rect(b.x+.04,b.y+b.h-.16,b.w-.08,.12,'#243239');
          line(b.x+.08,b.y+b.h-.13,b.x+b.w-.08,b.y+b.h-.13,'#41565B',.025);
          drawWallPanels(c,wallTexture,b);
          continue;
        }
        if(rooftop){
          // City depth occupies the existing boundary collider. Inner rail marks its edge.
          rect(b.x,b.y,b.w,b.h,'#0B1729');
          if(b.h>b.w){for(let yy=b.y+.3;yy<b.y+b.h-.3;yy+=1.25){rect(b.x+.06,yy,b.w-.13,.95,'#243649');rect(b.x+.12,yy+.18,.09,.25,'#608D99');}
            const xx=b.x<6?b.x+b.w-.14:b.x+.03;rect(xx,b.y,.11,b.h,'#789FA3');rect(xx+.015,b.y,.035,b.h,'#B9E6DD');
          }else{rect(b.x,b.y+(b.y<10?b.h-.18:0),b.w,.16,'#8AAEAD');}
          continue;
        }
        rect(b.x,b.y+.16,b.w,b.h,'#080d10');rect(b.x,b.y,b.w,b.h,'#333f43');
        rect(b.x+.08,b.y+.08,Math.max(.1,b.w-.16),Math.max(.1,b.h-.16),'#343B41');line(b.x+.06,b.y+.04,b.x+b.w-.06,b.y+.04,rooftop?'#ACE5D8':'#B4C2C4',.055);
        if(rooftop){line(b.x+.06,b.y+.13,b.x+b.w-.06,b.y+.13,'#527F80',.03);if(b.w<1)line(b.x+.28,b.y+.1,b.x+.28,b.y+b.h-.1,'#8DC8C1',.05);}
        else for(let y=b.y+.4;y<b.y+b.h-.2;y+=1.5){rect(b.x+.08,y,Math.max(.05,b.w-.16),.04,'#19232A');}
        if(power&&b.h>b.w){line(b.x+b.w*.4,b.y+.1,b.x+b.w*.4,b.y+b.h-.1,'#9B8AAE',.07);line(b.x+b.w*.7,b.y+.1,b.x+b.w*.7,b.y+b.h-.1,'#798C83',.06);}
        continue;
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
      if(rooftop){
        // HVAC housings, fan grills and aerial equipment use the same collider footprint.
        round(b.x+.12,b.y+.12,b.w-.24,b.h-.42,.08,index%2?'#546971':'#AABBB8');
        const count=Math.max(1,Math.floor(b.h/1.25)),r=Math.min((b.w-.38)/2,(b.h-.5)/count/2)*.82;
        for(let k=0;k<count;k++){const cx=b.x+b.w/2,cy=b.y+.28+(b.h-.62)*(k+.5)/count;circle(cx,cy,r,'#283B43');circle(cx,cy,r*.88,'#526870');circle(cx,cy,r*.7,'#1F303A');
          for(let j=0;j<8;j++){const angle=j*Math.PI/4;line(cx,cy,cx+Math.cos(angle)*r*.9,cy+Math.sin(angle)*r*.9,'#9AAFAC',.035);}
          circle(cx,cy,r*.22,'#A8BBB7');
          for(let j=-2;j<=2;j++)line(cx-r*.8,cy+j*r*.27,cx+r*.8,cy+j*r*.27,'#77918D',.025);
        }
        rect(b.x+.2,b.y+b.h-.25,b.w-.4,.08,'#BDE7D9');
        if(index%3===0){circle(b.x+b.w-.28,b.y+.3,.13,'#D6E2D5');line(b.x+b.w-.28,b.y+.3,b.x+b.w-.18,b.y+.1,'#BDD3C9',.045);}
        if(level.number===7&&b.kind==='rack'){
          const cx=b.x+b.w/2,cy=b.y+b.h/2,r=Math.min(b.w,b.h)*.36;
          circle(cx+.05,cy+.1,r,'#263B49');circle(cx,cy,r,'#B7C9C8');circle(cx,cy,r*.78,'#829EA6');
          line(cx,cy,cx+r*.85,cy-r*.85,'#DCE7DD',.09);circle(cx+r*.85,cy-r*.85,.085,'#C4F0DE');
        }
      }else if(power){
        round(b.x+.13,b.y+.15,b.w-.26,b.h-.46,.045,'#202C38');
        const cols=Math.max(1,Math.floor(b.w/.5));
        for(let col=0;col<cols;col++)for(let y=b.y+.3;y<b.y+b.h-.4;y+=.34){const x=b.x+.21+col*(b.w-.4)/cols;rect(x,y,(b.w-.4)/cols-.07,.19,'#3D485C');rect(x+.035,y+.04,.04,.04,(Math.floor(y*3)+col)%3?'#B7A2D7':'#A7E0D2');line(x+.12,y+.13,x+(b.w-.4)/cols-.1,y+.13,'#17242C',.03);}
        rect(b.x+.18,b.y+b.h-.27,b.w-.36,.055,'#B397D6');
        if((level.number===9||level.number===12)&&b.kind==='crate'){
          const cx=b.x+b.w/2,cy=b.y+(b.h-.2)/2,r=Math.min(b.w-.3,b.h-.5)/2;
          circle(cx,cy,r,'#8DA59F');circle(cx,cy,r*.8,'#263C43');circle(cx,cy,r*.59,level.number===12?'#B3A77E':'#8CC7B3');circle(cx,cy,r*.3,'#344E52');
          for(let k=0;k<8;k++){const a=k*Math.PI/4;line(cx+Math.cos(a)*r*.65,cy+Math.sin(a)*r*.65,cx+Math.cos(a)*r*.92,cy+Math.sin(a)*r*.92,'#D3DBCC',.07);}
        }
      }else if(b.kind==='crate'){
        // Shipping straps, paper labels and inset handles.
        rect(b.x+b.w*.26,b.y+.12,.085,b.h-.42,'#A9B9A9');rect(b.x+b.w*.73,b.y+.12,.085,b.h-.42,'#7F9389');
        round(b.x+b.w*.4,b.y+.3,b.w*.21,.3,.025,'#D5DFCA');
        for(let j=0;j<5;j++)line(b.x+b.w*.42+j*.04,b.y+.35,b.x+b.w*.42+j*.04,b.y+.52,'#4A5D58',.018);
      }
      for(const [x,y]of [[b.x+.16,b.y+.17],[b.x+b.w-.16,b.y+.17],[b.x+.16,b.y+b.h-.35],[b.x+b.w-.16,b.y+b.h-.35]]){p.setColor(Skia.Color('#97a09a'));c.drawCircle(x!,y!,.035,p);}
    }
    if(raised.length&&wallTexture)drawRaisedWalls(c,raised,wallTexture,wallStyle,district);
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
