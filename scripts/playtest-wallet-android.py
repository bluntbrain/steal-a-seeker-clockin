"""Native wallet UI / no-wallet failure test. Does not claim Phantom approval."""
import subprocess,time,pathlib,xml.etree.ElementTree as ET,re,json
ADB='/Users/bluntbrain/Library/Android/sdk/platform-tools/adb'
OUT=pathlib.Path('verification')
def adb(*args):return subprocess.check_output([ADB,'-s','emulator-5554',*map(str,args)],timeout=30)
def ui(name):
 adb('shell','uiautomator','dump','/sdcard/seeker-wallet.xml')
 data=adb('shell','cat','/sdcard/seeker-wallet.xml');(OUT/(name+'.xml')).write_bytes(data)
 return ET.fromstring(data)
def tap(tree,label):
 n=next(n for n in tree.iter('node') if n.get('content-desc')==label or n.get('text')==label)
 a,b,c,d=map(int,re.findall(r'\d+',n.get('bounds')));adb('shell','input','tap',(a+c)//2,(b+d)//2)
def texts(tree):return ' '.join(n.get('text','') for n in tree.iter('node'))
start=ui('3d-wallet-native-start');tap(start,'Open devnet wallet');panel=ui('3d-wallet-native-panel')
assert 'Your wallet' in texts(panel) and 'SOLANA DEVNET' in texts(panel)
assert 'No wallet connected' in texts(panel)
(OUT/'3d-wallet-native-panel.png').write_bytes(adb('exec-out','screencap','-p'))
tap(panel,'CONNECT PHANTOM / WALLET');time.sleep(2)
missing=ui('3d-wallet-native-no-wallet');(OUT/'3d-wallet-native-no-wallet.png').write_bytes(adb('exec-out','screencap','-p'))
assert 'found' in texts(missing).lower() or 'available' in texts(missing).lower(),texts(missing)
tap(missing,'Back to game');back=ui('3d-wallet-native-back');assert 'RUN PAUSED' in texts(back)
report={'status':'passed','environment':'Android 36 emulator','checks':['native wallet panel opens','devnet label','no wallet connected state','missing wallet error displayed','back returns to paused game'],'phantomInstalled':False,'phantomApprovalVerified':False}
(OUT/'3d-wallet-native-check.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
