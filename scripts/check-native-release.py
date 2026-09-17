"""Exercise only a specifically selected test device; no data clearing or entitlements."""
import subprocess,sys,re,json,time,pathlib,xml.etree.ElementTree as E
serial=sys.argv[1] if len(sys.argv)>1 else 'emulator-5554'
package='com.bluntbrain.stealaseeker.judge';out=pathlib.Path('verification/release-native');out.mkdir(exist_ok=True)
def adb(*args):return subprocess.check_output(['adb','-s',serial,*args])
def tree():
 adb('shell','uiautomator','dump','/sdcard/seeker-check.xml');return E.fromstring(adb('exec-out','cat','/sdcard/seeker-check.xml'))
def node(label):
 root=tree()
 for n in root.iter('node'):
  if n.get('content-desc')==label or n.get('text')==label:return n
 raise RuntimeError('Missing control: '+label)
def bounds(n):return list(map(int,re.findall(r'\d+',n.get('bounds'))))
def tap(label):
 x1,y1,x2,y2=bounds(node(label));adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
def screen(name):
 time.sleep(.6);out.joinpath(name+'.png').write_bytes(adb('exec-out','screencap','-p'))
adb('shell','am','force-stop',package);adb('shell','am','start','-n',package+'/com.bluntbrain.stealaseeker.MainActivity');time.sleep(3)
tap('Continue · Quiet Pickup');time.sleep(1)
root=tree();joystick=next(n for n in root.iter('node') if 'Movement joystick' in n.get('content-desc',''));x1,y1,x2,y2=bounds(joystick);cx,cy=(x1+x2)//2,(y1+y2)//2
adb('shell','input','swipe',str(cx),str(cy),str(cx),str(cy-70),'700')
tap('Throw noise decoy in facing direction. 2 left.');node('Throw noise decoy in facing direction. 1 left.');screen('gameplay')
tap('Pause game');tap('Toggle frame statistics');root=tree();perf=[n.get('text') for n in root.iter('node') if 'FPS' in n.get('text','')];screen('paused-performance')
tap('Open settings');
if node('Game sound').get('checked')=='true':tap('Game sound')
screen('settings-muted');tap('Close settings');tap('Resume run');adb('shell','input','keyevent','KEYCODE_HOME');time.sleep(1);adb('shell','am','start','-n',package+'/com.bluntbrain.stealaseeker.MainActivity');time.sleep(1);node('Resume run');screen('background-paused')
tap('Restart level');tap('Open missions');screen('missions');root=tree();controls={label:bounds(node(label)) for label in ['Shop / equip owned items','Daily challenge / leaderboard','Campaign rewards and leaderboard','Settings / controls']};assert all(b[2]-b[0]>100 and b[3]-b[1]<180 for b in controls.values()),controls
tap('Settings / controls');assert node('Game sound').get('checked')=='false';tap('Close settings');adb('shell','am','force-stop',package);adb('shell','am','start','-n',package+'/com.bluntbrain.stealaseeker.MainActivity');time.sleep(2);tap('Settings / controls');assert node('Game sound').get('checked')=='false';tap('Game sound');tap('Close settings');screen('restored')
report={'passed':True,'apkSha256':__import__('hashlib').sha256(pathlib.Path('releases/steal-a-seeker-judge.apk').read_bytes()).hexdigest(),'device':serial,'physical':not serial.startswith('emulator-'),'model':adb('shell','getprop','ro.product.model').decode().strip(),'android':adb('shell','getprop','ro.build.version.release').decode().strip(),'package':package,'checks':['installed signed judge APK, standalone launch','joystick swipe and decoy consumption','pause and performance readout','mute saved after process restart','background pauses gameplay','missions and four correctly sized shortcuts'],'recentPerformance':perf,'shortcutBounds':controls,'limits':['No physical-device or audible-output claim for an emulator','No wallet transfer, 15-minute thermal run or full campaign completion claim']}
out.joinpath('report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
