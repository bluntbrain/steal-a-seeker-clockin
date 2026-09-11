"""Native smoke check for observed emulator bounds; no simulation-state injection."""
import subprocess,time,pathlib,xml.etree.ElementTree as ET,json
ADB='/Users/bluntbrain/Library/Android/sdk/platform-tools/adb';OUT=pathlib.Path('verification')
def adb(*a):return subprocess.check_output([ADB,'-s','emulator-5554',*map(str,a)])
def tap(x,y):adb('shell','input','tap',x,y)
def hold(x,y,ms):adb('shell','input','touchscreen','swipe',x,y,x,y,ms)
def ui(name):
 adb('shell','uiautomator','dump','/sdcard/patrol.xml');raw=adb('shell','cat','/sdcard/patrol.xml');(OUT/(name+'.xml')).write_bytes(raw)
 return ET.fromstring(raw)
def texts(tree):return [n.get('text','') for n in tree.iter('node')]
def shot(name):(OUT/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'))
tap(890,426);time.sleep(.3);tap(1180,275)
a=ui('night-shift-native-paused');time.sleep(.6);b=ui('night-shift-native-paused-later')
assert 'RUN PAUSED' in texts(a)
assert [x for x in texts(a) if len(x)==5 and x[2]==':']==[x for x in texts(b) if len(x)==5 and x[2]==':']
# Resume via header then select mission again to start a clean patrol.
tap(1180,275);tap(890,426);time.sleep(.2)
hold(423,2511,470);time.sleep(.15);hold(315,2403,2200);time.sleep(.15);hold(423,2511,450)
for i in range(12):
 state=ui('night-shift-native-movement')
 if any('CAUGHT BY PATROL' in x for x in texts(state)):break
 time.sleep(1)
shot('night-shift-native-caught')
assert any('CAUGHT BY PATROL' in x for x in texts(state)),'No capture; inspect native movement screenshot'
# Retry through its observed accessible button bounds.
n=next(n for n in state.iter('node') if n.get('content-desc')=='Retry level')
import re
x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')));tap((x1+x2)//2,(y1+y2)//2)
state=ui('night-shift-native-retry');assert 'NIGHT SHIFT' in ' '.join(texts(state));assert not any('CAUGHT BY PATROL' in x for x in texts(state))
adb('shell','input','keyevent','3');time.sleep(.4);adb('shell','monkey','-p','com.krane.stealaseeker.mvp','-c','android.intent.category.LAUNCHER','1')
state=ui('night-shift-native-background');assert 'RUN PAUSED' in texts(state)
(OUT/'night-shift-native-check.json').write_text(json.dumps({'status':'passed','device':'Pixel 9 Pro Android 36 emulator','checks':['mission selection','pause freezes timer','touch movement into patrol','caught screen','retry retains Night Shift','background pauses run'],'physicalSeekerTested':False},indent=2))
print('Native patrol smoke check passed')
