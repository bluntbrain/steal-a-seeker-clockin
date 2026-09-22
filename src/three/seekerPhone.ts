import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {PHONE_EDITIONS} from '../game/collection';
import atlas from '../../assets/world-v3/phones.frames.json';

function outline(w:number,h:number,r:number){
 const s=new THREE.Shape(),x=-w/2,y=-h/2;
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
/** One hardware source for the live viewer, downloadable GLBs and Android turntables.
 * Back details use their own outward-facing coordinates, so text/logo never mirror.
 */
export function createSeekerPhone(index:number,texture?:THREE.Texture){
 const edition=PHONE_EDITIONS[index]!,root=new THREE.Group();root.name='Collectible '+edition.name;
 const material=(color:string,metalness=.5,roughness=.3)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const add=(parent:THREE.Group,name:string,g:THREE.BufferGeometry,m:THREE.Material,at:number[])=>{const o=new THREE.Mesh(g,m);o.name=name;o.position.set(at[0]!,at[1]!,at[2]!);parent.add(o);return o;};
 const slab=(parent:THREE.Group,name:string,w:number,h:number,d:number,r:number,at:number[],m:THREE.Material)=>{
  const b=Math.min(.009,d/4),g=new THREE.ExtrudeGeometry(outline(w-b*2,h-b*2,r),{depth:d-b*2,bevelEnabled:true,bevelSegments:3,bevelSize:b,bevelThickness:b,steps:1,curveSegments:20});g.translate(0,0,-d/2+b);return add(parent,name,g,m,at);
 };
 const box=(name:string,size:[number,number,number],at:number[],color:string)=>add(root,name,new RoundedBoxGeometry(...size,3,.006),material(color,.8),at);
 slab(root,'Metal rail',1.6,3.1,.19,.18,[0,0,0],material(edition.shell,.8,.26));
 slab(root,'Back glass',1.56,3.06,.036,.17,[0,0,-.104],material(edition.shell,.35,.33));
 slab(root,'Front bezel',1.54,3.04,.025,.17,[0,0,.106],material('#080E13',.25,.2));
 const face=new THREE.ShapeGeometry(outline(1.42,2.87,.13),24),pos=face.getAttribute('position'),uv=face.getAttribute('uv'),f=atlas.frames[index]!;
 for(let i=0;i<pos.count;i++)uv.setXY(i,(f.x+28+(pos.getX(i)/1.42+.5)*144)/atlas.width,1-(f.y+58+(1-(pos.getY(i)/2.87+.5))*295)/atlas.height);
 add(root,'Seeker display',face,new THREE.MeshBasicMaterial({map:texture??null,color:texture?'#FFFFFF':edition.screen,toneMapped:false}),[0,0,.123]);
 const disk=(p:THREE.Group,name:string,r:number,z:number,x:number,y:number,m:THREE.Material)=>{const g=new THREE.CylinderGeometry(r,r,.008,48);g.rotateX(Math.PI/2);return add(p,name,g,m,[x,y,z]);};
 disk(root,'Front punch hole',.034,.13,0,1.34,material('#070B10',.1));
 box('Earpiece',[.23,.012,.008],[0,1.466,.126],'#18252B');
 box('Power fingerprint key',[.019,.25,.075],[.805,.27,0],'#61747C');
 box('Volume rocker',[.019,.43,.065],[.805,.79,0],'#61747C');
 for(const x of [-.796,.796])for(const y of [-1.16,1.16])box('Antenna band',[.014,.022,.17],[x,y,0],'#667B81');
 box('USB-C recess',[.22,.013,.058],[0,-1.55,0],'#070D12');
 for(const x of [-.55,-.46,-.37,.37,.46,.55]){const hole=disk(root,'Speaker port',.017,0,x,0,material('#060B10'));hole.rotation.x=Math.PI/2;hole.position.y=-1.55;}
 // Straight back view: separate upper camera, two sensors in a lower pill, flash on right.
 const back=new THREE.Group();back.name='Seeker rear hardware';back.rotation.y=Math.PI;root.add(back);
 const silver=material('#A4B8C0',.9,.2),black=material('#101920',.65,.26),glass=material('#112737',.65,.12);
 slab(back,'Lower camera pill',.25,.57,.049,.12,[-.46,.68,.153],black);
 const lens=(name:string,x:number,y:number,r:number,z:number)=>{
  disk(back,name+' machined ring',r,z,x,y,silver);disk(back,name+' black bezel',r*.89,z+.009,x,y,black);disk(back,name+' optical glass',r*.72,z+.018,x,y,glass);
  disk(back,name+' aperture',r*.38,z+.024,x,y,material('#080E18',.3,.18));
  disk(back,name+' coating glint',r*.14,z+.028,x-r*.25,y+r*.27,material('#7094A4',.55,.2));
 };
 lens('Main camera',-.46,1.17,.145,.169);lens('Secondary camera',-.46,.81,.092,.181);lens('Lower sensor',-.46,.52,.066,.181);
 disk(back,'Flash bezel',.045,.142,-.18,.98,silver);disk(back,'Flash diffuser',.034,.15,-.18,.98,material('#E5E5CB',.1,.35));
 slab(back,'Seed Vault security panel',.55,.78,.009,.035,[-.505,-.19,.128],material('#13242D',.48,.24));
 // Small vector-letter label is geometry: crisp at any zoom, embedded in exported models.
 const glyphs:Record<string,string[]>={S:['111','100','111','001','111'],E:['111','100','110','100','111'],D:['110','101','101','101','110'],V:['101','101','101','101','010'],A:['010','101','111','101','101'],U:['101','101','101','101','111'],L:['100','100','100','100','111'],T:['111','010','010','010','010']};
 const label=new THREE.Group();label.name='SEED VAULT engraved lettering';label.position.set(-.68,-.48,.136);label.rotation.z=Math.PI/2;back.add(label);
 const ink=material('#B7C6CC',.25,.3),text='SEED VAULT',unit=.009;
 [...text].forEach((letter,n)=>glyphs[letter]?.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1')add(label,'Label '+letter,new THREE.BoxGeometry(unit*.86,unit*.86,.001),ink,[n*unit*4+x*unit,-y*unit,0]);})));
 const seal=add(back,'Seed Vault seal',new THREE.TorusGeometry(.041,.004,6,32),ink,[-.665,.095,.137]);
 add(back,'Seed Vault core',new THREE.CircleGeometry(.013,20),ink,[-.665,.095,.138]);
 // Solana's three alternating slanted bars; positioned low on the back like the real device.
 const logo=new THREE.Group();logo.name='Solana rear logo';logo.position.set(0,-1.05,.13);back.add(logo);
 for(let i=0;i<3;i++){const shape=new THREE.Shape(),y=(1-i)*.054,w=.17,h=.033,skew=i===1?-.03:.03;shape.moveTo(-w/2-skew/2,y-h/2);shape.lineTo(w/2-skew/2,y-h/2);shape.lineTo(w/2+skew/2,y+h/2);shape.lineTo(-w/2+skew/2,y+h/2);shape.closePath();add(logo,'Solana bar '+i,new THREE.ShapeGeometry(shape),material('#BDCBCD',.35,.3),[0,0,0]);}
 return root;
}
export function disposeSeekerPhone(root:THREE.Group){root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
