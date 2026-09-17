"""Actual touch playtest for the observed Pixel 9 Pro 1280x2856 emulator layout."""
import subprocess,time,pathlib,xml.etree.ElementTree as ET,json
ADB='/Users/bluntbrain/Library/Android/sdk/platform-tools/adb'
OUT=pathlib.Path('verification');commands=[]
def adb(*args):
 return subprocess.check_output([ADB,'-s','emulator-5554',*map(str,args)])
def tap(x,y):
 commands.append(['tap',x,y]);adb('shell','input','tap',x,y)
def hold(x,y,ms):
 commands.append(['hold',x,y,ms]);adb('shell','input','touchscreen','swipe',x,y,x,y,ms);time.sleep(.13)
def shot(name):
 (OUT/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'))
def ui(name):
 adb('shell','uiautomator','dump','/sdcard/clockin-mvp-window.xml')
 xml=adb('shell','cat','/sdcard/clockin-mvp-window.xml');(OUT/(name+'.xml')).write_bytes(xml)
 return [(n.get('text'),n.get('content-desc'),n.get('bounds')) for n in ET.fromstring(xml).iter('node') if n.get('text') or n.get('content-desc')]
# Coordinates were read from the native accessibility tree. Timings are a
# recorded route, not portable across densities or emulator load; inspect
# screenshots if a route assertion fails. No gameplay-state injection.
tap(1100,2729);time.sleep(.3);shot('android-level-01')
adb('shell','dumpsys','gfxinfo','com.bluntbrain.stealaseeker','reset')
for x,y,ms in [(395,2511,481),(279,2395,2184),(395,2511,919),(279,2395,1153),(395,2511,731),(279,2395,184),(395,2511,790),(279,2395,420)]:hold(x,y,ms)
hold(761,2515,650)
r=ui('android-carrying');shot('android-carrying')
assert any(t=='TAKEN' for t,c,b in r),'Route missed pickup: inspect android-carrying.png'
tap(1030,2511);hold(395,2511,130);hold(279,2395,1050);time.sleep(1.4)
r=ui('android-extracted');shot('android-extracted')
assert any(t=='EXTRACTION COMPLETE' for t,c,b in r),'Route missed exit'
assert any('80% charge' in t for t,c,b in r),'Dash charge mismatch'
(OUT/'android-touch-commands.json').write_text(json.dumps(commands,indent=2))
(OUT/'android-gfxinfo.txt').write_bytes(adb('shell','dumpsys','gfxinfo','com.bluntbrain.stealaseeker'))
print('Android touch route passed')
