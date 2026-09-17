"""Generate original courier footsteps using the shared private ElevenLabs key."""
from pathlib import Path
import array, hashlib, json, math, subprocess, sys, urllib.error, urllib.request, wave

ROOT = Path(__file__).resolve().parents[1] / 'assets/audio-footsteps'
RATE = 32000
CUES = [
    ('step-a', 'One single light sneaker footstep onto a dry concrete floor. Soft rubber sole landing, a short firm heel tap and tiny sandy scuff. Close dry foley for a small agile courier in a stealth game. Immediate attack and short natural decay. Only one step, no repeated walking, no music, no voice, no background ambience, no echo.'),
    ('step-b', 'One single alternate sneaker footstep onto a dry concrete floor. Slightly softer rounded sole thump with a crisp light toe scuff. Close dry foley for a small agile courier in a stealth game. Immediate attack and short natural decay. Only one step, no repeated walking, no music, no voice, no background ambience, no echo.'),
]

def write_wave(path, samples):
    pcm = array.array('h', (round(max(-1, min(1, v)) * 32767) for v in samples))
    if sys.byteorder != 'little': pcm.byteswap()
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(RATE); f.writeframes(pcm.tobytes())

def main():
    ROOT.mkdir(exist_ok=True)
    key = None
    for line in Path('/Users/bluntbrain/.config/elevenlabs/credentials.env').read_text().splitlines():
        if line.startswith('ELEVENLABS_API_KEY='):
            key = line.split('=', 1)[1].strip().strip('"').strip("'")
    if not key: raise SystemExit('Shared ElevenLabs credential missing')
    manifest, clips = [], []
    for name, prompt in CUES:
        raw, out = ROOT / (name + '.mp3'), ROOT / (name + '.wav')
        if not raw.exists():
            request = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation',
                data=json.dumps(dict(text=prompt, duration_seconds=2, loop=False,
                    model_id='eleven_text_to_sound_v2', prompt_influence=.7)).encode(),
                headers={'xi-api-key': key, 'Content-Type': 'application/json'})
            try:
                with urllib.request.urlopen(request, timeout=100) as response:
                    raw.write_bytes(response.read())
            except urllib.error.HTTPError as error:
                raise SystemExit(f'ElevenLabs HTTP {error.code}; credentials omitted')
            print('Generated', name, flush=True)
        decoded = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(raw), '-af',
            'highpass=f=110,lowpass=f=6500', '-ar', str(RATE), '-ac', '1', '-f', 'f32le', '-'],
            capture_output=True, check=True).stdout
        samples = array.array('f'); samples.frombytes(decoded)
        if sys.byteorder != 'little': samples.byteswap()
        peak = max(abs(v) for v in samples)
        if peak < 1e-6: raise SystemExit('Silent generated cue: ' + name)
        onset = max(0, next(i for i, v in enumerate(samples) if abs(v) > peak * .06) - 96)
        count = round(.24 * RATE)
        selected = list(samples[onset:onset + count]); selected += [0.] * (count - len(selected))
        for i in range(96): selected[i] *= i / 96
        for i in range(960): selected[-i-1] *= i / 960
        gain = 10 ** (-6 / 20) / max(abs(v) for v in selected)
        selected = [v * gain for v in selected]
        write_wave(out, selected); clips.append(selected)
        manifest.append(dict(name=name, prompt=prompt, provider='ElevenLabs', model='eleven_text_to_sound_v2',
            file=out.name, duration=.24, sampleRate=RATE, channels=1, peakDb=-6,
            onsetSeconds=round(onset / RATE, 4), sha256=hashlib.sha256(out.read_bytes()).hexdigest()))
    (ROOT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    # Audition: brisk steps, a stop, then slower steps while carrying the phone.
    preview = [0.] * (RATE * 7)
    times = [.15 + i * .28 for i in range(9)] + [3.6 + i * .37 for i in range(8)]
    for i, at in enumerate(times):
        start = round(at * RATE)
        for j, v in enumerate(clips[i % 2]): preview[start+j] += v * .65
    write_wave(ROOT / 'walking-preview.wav', preview)
    print('Prepared 2 footsteps and walking-preview.wav', flush=True)

if __name__ == '__main__': main()
