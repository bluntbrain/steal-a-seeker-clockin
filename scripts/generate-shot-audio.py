"""Generate original firing cues; credentials stay outside the repository."""
import array
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys
import urllib.error
import urllib.request
import wave

ROOT = Path(__file__).resolve().parents[1] / 'assets/audio-shots-v4'
ROOT.mkdir(exist_ok=True)
key = next(line.split('=', 1)[1].strip().strip('"\'') for line in
           Path('/Users/bluntbrain/.config/elevenlabs/credentials.env').read_text().splitlines()
           if line.startswith('ELEVENLABS_API_KEY='))
manifest = []
for name, detail in [
    ('shot-a', 'A sharp dry pistol report: crisp explosive CRACK with a solid low-mid punch and a tiny mechanical slide clack.'),
    ('shot-b', 'A tight compact carbine report: crisp ballistic BANG with a chunky midrange punch and a brief metallic action click.'),
]:
    prompt = ('Exactly ONE isolated single firearm shot, close perspective, immediate attack. ' + detail +
              ' Real gunpowder percussion, satisfying action game weapon sound. Fast decay, all action within 0.3 seconds.'
              ' No silencer, no laser, no sci-fi chirp, no ricochet, no shell dropping, no additional shots,'
              ' no echo, no long reverb, no speech, no music, no ambience.')
    if name == 'shot-b':
        prompt = 'One isolated single pistol gunshot. Sharp dry explosive crack with a solid low mid punch. Close recording, immediate attack, rapid decay within 0.3 seconds. No speech, no music, no ambience, no echo.'
    raw = ROOT / (name + '-source.mp3')
    out = ROOT / (name + '.wav')
    if not raw.exists():
        request = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation',
            data=json.dumps(dict(text=prompt, duration_seconds=1, loop=False,
                                 model_id='eleven_text_to_sound_v2', prompt_influence=.8)).encode(),
            headers={'xi-api-key': key, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                raw.write_bytes(response.read())
        except urllib.error.HTTPError as error:
            raise SystemExit(f'Sound generation failed: HTTP {error.code}')
    decoded = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(raw), '-af',
        'highpass=f=75,lowpass=f=10500', '-ar', '32000', '-ac', '1', '-f', 'f32le', '-'],
        capture_output=True, check=True).stdout
    samples = array.array('f')
    samples.frombytes(decoded)
    if sys.byteorder != 'little':
        samples.byteswap()
    peak = max(abs(v) for v in samples)
    if peak < 1e-6:
        raise SystemExit('Silent generated sound: ' + name)
    # Preserve the attack with 1 ms of pre-roll and only a 0.25 ms fade-in.
    onset = max(0, next(i for i, v in enumerate(samples) if abs(v) > peak * .025) - 32)
    count = 11200  # 350 ms, short enough for alternating rapid shots.
    selected = list(samples[onset:onset + count])
    selected += [0.] * (count - len(selected))
    for i in range(8):
        selected[i] *= i / 8
    for i in range(1920):
        selected[-i - 1] *= i / 1920
    gain = 10 ** (-3 / 20) / max(abs(v) for v in selected)
    pcm = array.array('h', (round(v * gain * 32767) for v in selected))
    rms = math.sqrt(sum((v / 32768) ** 2 for v in pcm) / len(pcm))
    if sys.byteorder != 'little':
        pcm.byteswap()
    with wave.open(str(out), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(32000)
        wav.writeframes(pcm.tobytes())
    manifest.append(dict(file=out.name, prompt=prompt, provider='ElevenLabs',
        model='eleven_text_to_sound_v2', durationSeconds=.35, sourceOnsetSeconds=onset / 32000,
        peakDbFS=-3, rmsDbFS=round(20 * math.log10(rms), 2),
        sha256=hashlib.sha256(out.read_bytes()).hexdigest()))
    print('Ready:', out.name, flush=True)
(ROOT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
