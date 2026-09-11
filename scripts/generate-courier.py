from pathlib import Path
import subprocess,json,urllib.request,hashlib
root=Path(__file__).resolve().parents[1]
args=['higgsfield','generate','create','gpt_image_2_5','--prompt',(root/'assets/courier.prompt.txt').read_text(),'--image',str(root.parent/'assets/seeker/originals/01-character-sheet.png'),'--background','transparent','--resolution','2k','--quality','xhigh','--aspect_ratio','16:9','--wait','--json']
p=subprocess.run(args,capture_output=True,text=True)
(root/'assets/courier.result.json').write_text(p.stdout)
(root/'assets/courier.stderr.txt').write_text(p.stderr)
if p.returncode:raise SystemExit(p.stderr)
r=json.loads(p.stdout);r=r[0] if isinstance(r,list)else r
url=r.get('result_url')
if not url:raise SystemExit('No completed image URL in saved result')
file=root/'assets/courier.png';urllib.request.urlretrieve(url,file)
(root/'assets/provenance.json').write_text(json.dumps({'model':'gpt_image_2_5','source_url':url,'job_id':r.get('id'),'file':'courier.png','sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'prompt':'courier.prompt.txt','reference':'../../assets/seeker/originals/01-character-sheet.png','purpose':'Eight directional poses for the one-level gameplay MVP'},indent=2))
print('Courier sprite sheet saved:',file)
