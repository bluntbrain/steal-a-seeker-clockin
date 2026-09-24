// Derived mobile assets only. Keep the source GLBs and all hardware geometry intact.
import {NodeIO, PropertyType} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup, flatten, join, prune, getBounds} from '@gltf-transform/functions';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'assets/phone-models-mobile');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const names = ['frost','graphite','tide','static','mist','orbit','pearl','circuit','relic','flux','archive','ghost'];
const stats = (doc, bytes) => {
  const r=doc.getRoot(), primitives=r.listMeshes().flatMap(m=>m.listPrimitives());
  return {bytes, meshes:r.listMeshes().length, primitives:primitives.length, materials:r.listMaterials().length,
    triangles:primitives.reduce((n,p)=>n+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0),
    textures:r.listTextures().map(t=>({name:t.getName(),size:t.getSize()})), bounds:getBounds(r.listScenes()[0])};
};
await fs.mkdir(output,{recursive:true});
const receipt=[];
for(const name of (process.argv[2]?[process.argv[2]]:names)){
  if(!names.includes(name))throw Error('Unknown edition');
  const input=path.join(root,'assets/phone-models',`${name}.glb`), source=await fs.readFile(input);
  const doc=await io.read(input), before=stats(doc,source.length);
  for(const texture of doc.getRoot().listTextures()){
    const [width,height]=texture.getSize(), uvs=new Set();
    for(const mesh of doc.getRoot().listMeshes())for(const primitive of mesh.listPrimitives()){
      const material=primitive.getMaterial();
      if(material?.getEmissiveTexture()===texture||material?.getBaseColorTexture()===texture){
        const uv=primitive.getAttribute('TEXCOORD_0');if(!uv)throw Error('Textured primitive lacks UVs');uvs.add(uv);
      }
    }
    if(!uvs.size)continue;
    const min=[1,1],max=[0,0];
    for(const uv of uvs){const lo=uv.getMin([]),hi=uv.getMax([]);for(let i=0;i<2;i++){min[i]=Math.min(min[i],lo[i]);max[i]=Math.max(max[i],hi[i]);}}
    // glTF UV (0,0) is image top-left; preserve a two-pixel filter gutter.
    const left=Math.max(0,Math.floor(min[0]*width)-2),top=Math.max(0,Math.floor(min[1]*height)-2);
    const cropWidth=Math.min(width,Math.ceil(max[0]*width)+2)-left,cropHeight=Math.min(height,Math.ceil(max[1]*height)+2)-top;
    texture.setImage(await sharp(texture.getImage()).extract({left,top,width:cropWidth,height:cropHeight}).png().toBuffer()).setMimeType('image/png');
    for(const uv of uvs)for(let i=0;i<uv.getCount();i++){const v=uv.getElement(i,[]);uv.setElement(i,[(v[0]*width-left)/cropWidth,(v[1]*height-top)/cropHeight]);}
  }
  await doc.transform(dedup({propertyTypes:[PropertyType.MATERIAL]}),flatten(),join(),prune());
  const dest=path.join(output,`${name}.glb`);await io.write(dest,doc);
  const bytes=await fs.readFile(dest), after=stats(await io.read(dest),bytes.length);
  if(before.triangles!==after.triangles)throw Error(`${name}: geometry lost`);
  for(const side of ['min','max'])for(let axis=0;axis<3;axis++)if(Math.abs(before.bounds[side][axis]-after.bounds[side][axis])>0.0001)throw Error(`${name}: bounds changed`);
  receipt.push({name,sourceSha256:createHash('sha256').update(source).digest('hex'),sha256:createHash('sha256').update(bytes).digest('hex'),before,after});
  console.log(`${name}: ${before.primitives} → ${after.primitives} primitives, ${before.bytes} → ${after.bytes} bytes; ${after.triangles} triangles retained`);
}
await fs.writeFile(path.join(output,process.argv[2]?`${process.argv[2]}-audit.json`:'manifest.json'),JSON.stringify(receipt,null,2)+'\n');
