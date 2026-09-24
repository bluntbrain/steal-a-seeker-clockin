"""UI-only training playtest on an Android emulator. Does not sign in or pay."""
import subprocess,time,re,xml.etree.ElementTree as E,json,pathlib,sys
ADB='/Users/bluntbrain/Library/Android/sdk/platform-tools/adb'
DEVICE='emulator-5554'
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'verification/combat');root.mkdir(parents=True,exist_ok=True)
def adb(*args): return subprocess.check_output([ADB,'-s',DEVICE,*args],timeout=20)
def ui():
 adb('shell','uiautomator','dump','/sdcard/combat-ui.xml')
 return E.fromstring(adb('shell','cat','/sdcard/combat-ui.xml'))
def node(tree,key): return next((n for n in tree.iter('node') if n.get('resource-id')==key),None)
def tap(n):
 # A zero-duration injected tap can be missed under emulator load. Hold a
 # stationary touch for 140ms, well below the game's 650ms tap limit.
 x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')));x,y=str((x1+x2)//2),str((y1+y2)//2);adb('shell','input','swipe',x,y,x,y,'140')
steps=[]
for stage in range(8):
 t=ui();label=node(t,'tutorial-instruction');target=node(t,'tutorial-target')
 if label is None or target is None: raise RuntimeError('Tutorial target not visible')
 text=label.get('text');steps.append(text);print(stage,text,flush=True);tap(target)
 deadline=time.time()+90
 while time.time()<deadline:
  time.sleep(1);t=ui();next_label=node(t,'tutorial-instruction')
  if stage==7 and any(n.get('text')=='Seeker secured.' for n in t.iter('node')):break
  if next_label is not None and next_label.get('text')!=text:break
 else:raise RuntimeError('Tutorial failed to advance')
(root/'android-tutorial-complete.png').write_bytes(adb('exec-out','screencap','-p'))
(root/'android-tutorial.json').write_text(json.dumps({'device':DEVICE,'package':'com.bluntbrain.stealaseeker.judge','steps':steps,'completed':True,'walletTested':False},indent=2))
print('PASS Android tutorial',flush=True)
