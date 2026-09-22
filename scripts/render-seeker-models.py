"""Render the shared Three.js Seeker geometry with Blender; no native live-GL dependency.
Run export-seeker-geometry.ts first, then blender -b -t 4 --python this-file.
"""
import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/phone-models'
FRAMES=Path('/tmp/seeker-model-renders')
OUT.mkdir(exist_ok=True);FRAMES.mkdir(exist_ok=True)
editions=json.loads(Path('/tmp/seeker-model-source/editions.json').read_text())
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
indices=[int(args[0])] if args else range(12)
for idx in indices:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=f'/tmp/seeker-model-source/{idx}.glb')
 objects=list(bpy.context.scene.objects)
 screen=next(o for o in objects if o.name=='Seeker display')
 # The intermediate GLB has no texture; undo the glTF-import UV convention
 # before attaching the original top-left-origin atlas.
 for uv in screen.data.uv_layers.active.data:uv.uv.y=1-uv.uv.y
 mat=bpy.data.materials.new('Edition screen artwork');mat.use_nodes=True
 nodes=mat.node_tree.nodes;nodes.clear();tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'assets/world-v3/phones.png'));tex.image.pack()
 emission=nodes.new('ShaderNodeEmission');mat.node_tree.links.new(tex.outputs['Color'],emission.inputs['Color']);emission.inputs['Strength'].default_value=.75
 output=nodes.new('ShaderNodeOutputMaterial');mat.node_tree.links.new(emission.outputs[0],output.inputs['Surface']);screen.data.materials.clear();screen.data.materials.append(mat)
 slug=editions[idx]['name'].lower()
 # Export only model objects; retain front artwork and readable geometry labels.
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'{slug}.glb'),export_format='GLB',use_selection=True,export_yup=True)
 pivot=bpy.data.objects.new('Turntable',None);bpy.context.collection.objects.link(pivot)
 for o in objects:
  if not o.parent:o.parent=pivot
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True
 scene.render.resolution_x=512;scene.render.resolution_y=640;scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
 scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.026,.043,.056,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
 scene.view_settings.view_transform='Standard';scene.view_settings.look='Medium High Contrast' if 'Medium High Contrast' in [i.name for i in bpy.types.ColorManagedViewSettings.bl_rna.properties['look'].enum_items] else 'None'
 # Transparent render composited on the exact app background by the atlas packer.
 scene.render.film_transparent=True
 cam_data=bpy.data.cameras.new('Camera');cam=bpy.data.objects.new('Camera',cam_data);bpy.context.collection.objects.link(cam)
 cam.location=(0,-5.9,0);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam_data.type='ORTHO';cam_data.ortho_scale=3.95;scene.camera=cam
 for name,pos,power,size,color in [('Key',(3,-4,5),380,4,(1,.96,.9)),('Rim',(-3,2,3),460,3,(.67,.88,1)),('Fill',(-3,-3,-1),230,3,(.8,1,.96))]:
  data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color;o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=pos;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
 d=FRAMES/slug;d.mkdir(exist_ok=True)
 for frame in range(18):
  pivot.rotation_euler=(0,0,frame*math.pi/8) if frame<16 else ((math.pi/2 if frame==16 else -math.pi/2),0,0)
  scene.render.filepath=str(d/f'{frame:02}.png');bpy.ops.render.render(write_still=True)
 print('EDITION COMPLETE',slug,flush=True)
