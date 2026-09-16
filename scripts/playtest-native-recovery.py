"""Exercise the dedicated synthetic-ticket build through Android touch and process death.
Requires EXPO_PUBLIC_NATIVE_RECOVERY=1; never authenticates or sends a payment.
"""
import subprocess,time,pathlib,xml.etree.ElementTree as ET,json,re,math
ADB='/Users/bluntbrain/Library/Android/sdk/platform-tools/adb';APP='com.krane.stealaseeker.mvp';OUT=pathlib.Path('verification')
def adb(*args):return subprocess.check_output([ADB,'-s','emulator-5554',*map(str,args)],timeout=30)
def ui():
 for attempt in range(3):
  adb('shell','rm','-f','/sdcard/recovery-test.xml')
  output=adb('shell','uiautomator','runtest','/data/local/tmp/recovery-ui.jar','/system/framework/android.test.base.jar','-c','seeker.diagnostics.RecoveryUiDump')
  if b'OK (1 test)' in output and b'Exception' not in output:
   return ET.fromstring(adb('shell','cat','/sdcard/recovery-test.xml'))
  time.sleep(.5)
 raise AssertionError('Android could not capture a fresh UI hierarchy')
def state(tree):
 value=next((n.get('content-desc','')[17:] for n in tree.iter('node') if n.get('content-desc','').startswith('DIAGNOSTIC_STATE ')),None)
 assert value is not None,'Recovery diagnostic is not active'
 return json.loads(value)
def bounds(node):return list(map(int,re.findall(r'\d+',node.get('bounds'))))
def center(node):
 a,b,c,d=bounds(node);return (a+c)//2,(b+d)//2
def node(tree,label):return next(n for n in tree.iter('node') if n.get('content-desc')==label)
def tap(tree,label):adb('shell','input','tap',*center(node(tree,label)))
def texts(tree):return ' '.join(n.get('text','') for n in tree.iter('node'))
def shot(name):(OUT/name).write_bytes(adb('exec-out','screencap','-p'))
def wait_state(predicate,seconds=15):
 end=time.time()+seconds
 while time.time()<end:
  tree=ui();s=state(tree)
  if predicate(s,tree):return s,tree
  time.sleep(.3)
 raise AssertionError('State deadline exceeded: '+str(s))
def restart():
 adb('shell','am','force-stop',APP);adb('shell','am','start','-n',APP+'/.MainActivity')
 time.sleep(1.5)
 return wait_state(lambda s,t:s.get('ticks') is not None and 'RUN PAUSED' in texts(t))
def move_and_pause(tree,duration=900):
 pause_point=center(node(tree,'Resume game'))
 joystick=next(n for n in tree.iter('node') if n.get('resource-id')=='joystick');cx,cy=center(joystick)
 tap(tree,'Resume run')
 time.sleep(.4)
 adb('shell','input','touchscreen','swipe',cx+65,cy-30,cx+65,cy-30,duration)
 adb('shell','input','tap',*pause_point)
 saved,tree=wait_state(lambda s,t:s['savedTicks']>0 and s['savedTicks']>=s['ticks'] and 'RUN PAUSED' in texts(t))
 time.sleep(.6)
 checked,tree=wait_state(lambda s,t:s['savedTicks']==saved['savedTicks'] and 'RUN PAUSED' in texts(t))
 return checked,tree
initial_tree=ui();old=state(initial_tree)
tap(initial_tree,'New diagnostic fixture')
initial,tree=wait_state(lambda s,t:s.get('entryId')!=old['entryId'] and s.get('ticks')==0 and s.get('savedTicks')==0 and 'RUN PAUSED' in texts(t) and 'Restoring saved inputs' not in texts(t) and node(t,'Resume run').get('enabled')=='true')
before,tree=move_and_pause(tree)
assert before['savedTicks']>0
first,tree=restart()
assert first['runId']==before['runId'] and first['entryId']==before['entryId'] and first['deadline']==before['deadline']
assert first['ticks']==before['savedTicks']==first['savedTicks'],(before,first)
assert math.hypot(first['x']-initial['x'],first['y']-initial['y'])>.2,'Touch input did not move the courier'
shot('native-recovery-after-restart.png')
second,tree=restart()
for field in ['entryId','runId','deadline','ticks','savedTicks','x','y','guards','carrying','status']:assert first[field]==second[field],field
# Fail the application's checkpoint dependency; actual SQLite remains intact.
tap(tree,'Fail saves');tree=ui();tap(tree,'Resume run')
failed,tree=wait_state(lambda s,t:'Simulated storage failure' in texts(t),seconds=20)
assert failed['failure'] and failed['savedTicks']==second['savedTicks']
frozen=failed['ticks'];later,tree=wait_state(lambda s,t:'Simulated storage failure' in texts(t));assert later['ticks']==frozen
shot('native-recovery-save-failure.png')
tap(tree,'Allow saves');tree=ui();tap(tree,'RETRY SAVE')
repaired,tree=wait_state(lambda s,t:s['savedTicks']>second['savedTicks'] and 'Simulated storage failure' not in texts(t))
assert 'RUN PAUSED' in texts(tree)
# Leaving must persist before unmounting; reopening uses the same saved ticket.
tap(tree,'Save and leave paid attempt');left,tree=wait_state(lambda s,t:s['left'])
tap(tree,'Reopen saved fixture');opened,tree=wait_state(lambda s,t:not s['left'] and s['ticks']==left['savedTicks'] and 'RUN PAUSED' in texts(t))
assert opened['runId']==initial['runId'] and opened['deadline']==initial['deadline']
shot('native-recovery-reopened.png')
result={'passed':True,'scope':'Native synthetic paid-ticket Game, actual SQLite, Android touch, force-stop and cold launch. No wallet session, server ticket or chain transfer.','device':'emulator-5554 Android 36 ARM64','checks':['native touch moves courier','SQLite checkpoint before process death','cold launch retains original ticket and deadline','two cold launches restore identical courier/guard state','save failure pauses gameplay and retains prior SQLite data','manual save retry succeeds without resetting run','save-and-leave/reopen retains same run'],'observed':{'initial':initial,'beforeForceStop':before,'firstColdLaunch':first,'secondColdLaunch':second,'saveFailed':failed,'saveRepaired':repaired,'reopened':opened}}
(OUT/'native-recovery-check.json').write_text(json.dumps(result,indent=2)+'\n');print('Native recovery integration checks passed.')
