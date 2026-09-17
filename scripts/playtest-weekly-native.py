"""Touch QA in the isolated .qa package with synthetic tickets; never uses wallets."""
import subprocess,time,xml.etree.ElementTree as ET,re,pathlib,json
ADB='/Users/bluntbrain/Library/Android/sdk/platform-tools/adb'
APP='com.bluntbrain.stealaseeker.qa'
def adb(*a):return subprocess.check_output([ADB,'-s','emulator-5554',*map(str,a)],timeout=30)
def ui():
 adb('shell','uiautomator','dump','/sdcard/seeker-quick-qa.xml')
 return ET.fromstring(adb('shell','cat','/sdcard/seeker-quick-qa.xml'))
def find(root,label):return next((n for n in root.iter('node') if n.get('content-desc')==label),None)
def tap(label):
 root=ui();n=find(root,label)
 assert n is not None,label
 x,y,r,b=map(int,re.findall(r'\d+',n.get('bounds')))
 assert r>x and b>y,(label,n.attrib)
 adb('shell','input','tap',(x+r)//2,(y+b)//2)
def texts():return ' '.join(n.get('text','') for n in ui().iter('node'))
def shot(name):pathlib.Path('/tmp/'+name).write_bytes(adb('exec-out','screencap','-p'))
start=time.strftime('%m-%d %H:%M:%S')
for name in ['Ghost Freight','Skyline Relay','Pulse Vault']:
 tap('Play this week');tap('Play '+name+' for score');time.sleep(1)
 before=texts();assert 'RANKED' in before and name in before,before
 time.sleep(1);after=texts();assert 'Let’s get you back.' not in after,after
 shot('seeker-native-ranked-'+name.split()[0]+'.png')
 tap('Pause game');tap('Resume run');tap('Leave daily challenge')
 assert 'Make your move.' in texts()
# Paywall playback must stay mounted while toggling and backgrounding.
tap('QA paywall');time.sleep(3);assert find(ui(),'Pause trailer') is not None
shot('seeker-native-video.png');tap('Pause trailer');assert find(ui(),'Play trailer') is not None
tap('Play trailer');adb('shell','input','keyevent','3');adb('shell','am','start','-n',APP+'/com.bluntbrain.stealaseeker.MainActivity');time.sleep(1)
assert find(ui(),'Pause trailer') is not None
tap('QA campaign');root=ui();scroll=next((n for n in root.iter('node') if n.get('resource-id')=='mission-districts'),None)
assert scroll is not None and scroll.get('scrollable')=='true','Native mission list must scroll'
x,y,r,b=map(int,re.findall(r'\d+',scroll.get('bounds')))
adb('shell','input','swipe',(x+r)//2,b-80,(x+r)//2,y+80,650);adb('shell','input','swipe',(x+r)//2,b-80,(x+r)//2,y+80,650)
assert find(ui(),'Mission 12: Last Vault. Locked') is not None
shot('seeker-native-missions-scroll.png')
logs=adb('logcat','-d','-T',start,'-s','ReactNativeJS:E','AndroidRuntime:E').decode()
pathlib.Path('/tmp/seeker-weekly-native-errors.log').write_text(logs)
assert 'FATAL EXCEPTION' not in logs and '[SeekerRecovery]' not in logs,logs[-2000:]
print(json.dumps({'passed':True,'scope':'Android emulator, isolated QA package with synthetic tickets','checks':['3 direct ranked starts','pause/resume/return','video pause/background','mission scroll to level 12','no fatal or recovery errors']},indent=2))
