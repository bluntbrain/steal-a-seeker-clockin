import subprocess,time,json,sys,pathlib,datetime,os
ROOT=pathlib.Path(__file__).resolve().parents[1]; SERIAL='emulator-5556'; PKG='com.bluntbrain.stealaseeker'
def adb(*a):return subprocess.run(['adb','-s',SERIAL,*map(str,a)],capture_output=True,check=True).stdout
def log(action,detail):
 with (ROOT/'actions.jsonl').open('a') as f:f.write(json.dumps({'time':datetime.datetime.now().astimezone().isoformat(),'action':action,'detail':detail})+'\n')
def shot(name):
 (ROOT/'screenshots'/f'{name}.png').write_bytes(adb('exec-out','screencap','-p'));log('screenshot',name)
 subprocess.run(['sips','-Z','1100',str(ROOT/'screenshots'/f'{name}.png'),'--out','/tmp/code27-view.png'],capture_output=True)
def dump(name):
 adb('shell','uiautomator','dump','/sdcard/qa.xml');b=adb('exec-out','cat','/sdcard/qa.xml');(ROOT/'support'/f'{name}.xml').write_bytes(b)
 import xml.etree.ElementTree as E
 for e in E.fromstring(b).iter('node'):
  if e.get('text') or e.get('content-desc'):print(e.get('text'), '|', e.get('content-desc'),'|',e.get('bounds'),'|',e.get('selected'),e.get('checked'))
if __name__=='__main__':
 cmd=sys.argv[1];args=sys.argv[2:];log(cmd,args)
 if cmd=='tap': adb('shell','input','tap',*args[:2]);time.sleep(float(args[2]) if len(args)>2 else .5)
 elif cmd=='swipe': adb('shell','input','swipe',*args)
 elif cmd=='key':adb('shell','input','keyevent',*args)
 elif cmd=='shot':shot(args[0])
 elif cmd=='dump':dump(args[0])
 elif cmd=='launch':adb('shell','am','start','-n',PKG+'/.MainActivity')
 elif cmd=='cold':adb('shell','am','force-stop',PKG);adb('shell','am','start','-n',PKG+'/.MainActivity')
 elif cmd=='record':
  name=args[0]; proc=subprocess.Popen(['adb','-s',SERIAL,'shell','screenrecord','--size','540x1200','--bit-rate','1500000','--time-limit','180','/sdcard/'+name+'.mp4'],stdout=open(ROOT/'logs'/f'{name}-record.log','w'),stderr=subprocess.STDOUT,start_new_session=True);(ROOT/'support/recording.json').write_text(json.dumps({'name':name,'pid':proc.pid,'start':time.time()}));print(proc.pid)
 elif cmd=='stop':
  d=json.loads((ROOT/'support/recording.json').read_text());subprocess.run(['adb','-s',SERIAL,'shell','pkill','-2','screenrecord'],capture_output=True);time.sleep(1);adb('pull','/sdcard/'+d['name']+'.mp4',ROOT/'videos'/f"{d['name']}.mp4");adb('shell','rm','/sdcard/'+d['name']+'.mp4');print('duration',time.time()-d['start'])
