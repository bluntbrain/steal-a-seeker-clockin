# Illustrated phone posts — repeatable production guide

Created: 5 October 2026. Reference batch: **three boss gameplay videos and one leaderboard image** for Steal a Seeker.

## The result to repeat

A square post with a large, upright phone in the middle. Real gameplay or a real screenshot fills its screen. Original flat 2D artwork frames it: the Courier on the left and the matching boss on the right. The leaderboard version replaces the boss with a trophy and coins.

**The image generator makes the illustrated background only. HTML/CSS makes the phone. HyperFrames places and renders the actual recording inside it.** This separation keeps the screen straight, readable, and easy to replace. Do not ask an image model to redraw the gameplay or leaderboard.

The four approved visuals were Toly surveillance, Mert calling backup, Chase pursuing the Courier, and a leaderboard celebration. The user liked the content but rejected the original instructional captions; use the caption guidance below.

## 1. Where everything lives

These are local macOS paths, not files guaranteed to exist in a fresh Git clone. Replace the base paths on another machine. This guide is committed; the media package remains outside the game repository.

**Production folder:**

```text
/Users/bluntbrain/Documents/creative/solana/steal-a-seeker-production/social/2026-10-05-four-posts/
```

| File or folder inside production | Purpose |
| --- | --- |
| `BRIEF.md`, `design.md` | Scope and visual decisions |
| `assets/art-toly.png` | Toly background, generated at 1254 × 1254 |
| `assets/art-mert.png` | Mert background |
| `assets/art-chase.png` | Chase background |
| `assets/art-leaderboard.png` | Trophy/Courier background |
| `assets/gameplay-{toly,mert,chase}.mp4` | Copies of the original recordings |
| `assets/leaderboard.jpeg` | Original leaderboard screenshot |
| `prompts/*.txt` | Exact generation prompts, also preserved below |
| `art-provenance.json` | Generator and original generated-file locations |
| `build_compositions.py` | Rebuilds the five phone compositions; source included below |
| `post-specs.json` | Reference output durations and source start times |
| `01-toly/`, `02-mert/`, `03-chase/` | Standalone video compositions and check results |
| `04-leaderboard/`, `empty-phone/` | Still-image compositions |
| `exports/` | Three MP4s, one leaderboard PNG, covers, and blank-phone PNG |
| `verification.json` | Measured dimensions, durations, audio levels and SHA-256 hashes |
| `preview.html` | Responsive review page with players, captions and downloads |
| `steal-a-seeker-four-posts.zip` | Upload kit; not a complete editable project backup |
| `CAPTIONS.md` | Original captions — superseded by the user's request for funnier hooks |

### Character and style references

Inspect these before generation. They establish the character identity, clothing and correct Seeker phone. Do not substitute a generic phone or invent a different Courier.

```text
# Courier and correct Seeker phone, combined reference
/Users/bluntbrain/Documents/creative/solana/steal-a-seeker-production/loading-screen-2026-10-04/courier-phone-reference.png

# Boss identity sheets
/Users/bluntbrain/Documents/creative/solana/steal-a-seeker-production/private-guard-sheets/toly.png
/Users/bluntbrain/Documents/creative/solana/steal-a-seeker-production/private-guard-sheets/mert.png
/Users/bluntbrain/Documents/creative/solana/steal-a-seeker-production/private-guard-sheets/chase.png

# Existing 2D poster used as the first style/Toly reference
/Users/bluntbrain/Documents/code/clockin/seeker-game/assets/boss-loading-v1/toly.webp
```

The Toly background was generated first using the poster and Courier/phone reference. The other backgrounds then used **that generated Toly background as their style/composition reference**, plus the relevant character sheet and Courier reference. That is what kept the set consistent.

### Original user media and exact edits

All input files were under `/Users/bluntbrain/Downloads/`.

| Post | Input filename | Source range used | Export |
| --- | --- | --- | --- |
| Toly | `telegram-cloud-document-5-6203836627052143789.mp4` | 7.0–42.4 s | `exports/01-toly.mp4`, 35.4 s |
| Mert | `telegram-cloud-document-5-6203836627052143791.mp4` | 4.5–51.5 s | `exports/02-mert.mp4`, 47 s |
| Chase | `telegram-cloud-document-5-6203836627052143793.mp4` | 6.5–51.5 s | `exports/03-chase.mp4`, 45 s |
| Leaderboard | `photo_2026-10-05 12.38.49.jpeg` | Still image | `exports/04-leaderboard.png` |

Loading screens and opening boss introductions were trimmed. Gameplay after the trim stayed continuous, with its original sound. These timings are specific to this batch: inspect new recordings and choose new cuts rather than reusing them blindly.

## 2. Inspect new recordings first

Use `ffprobe` to check dimensions, duration and audio. Extract a contact sheet so the artwork and caption match the actual boss/action. Also inspect the first few seconds and the ending separately before choosing trims.

```bash
ffprobe -v error -show_entries stream=codec_name,width,height,duration:format=duration -of json input.mp4
ffmpeg -hide_banner -loglevel error -i input.mp4 -vf 'fps=1/8,scale=180:-1,tile=6x1' -frames:v 1 contact-sheet.jpg
```

Record the boss, usable start/end, what happens, and whether the clip actually shows a win or a death. Do not write “Chase killed me” over a clip that never shows that outcome. A general joke about being chased still works.

## 3. Generate the side artwork

This batch used the **built-in image generation tool**, not Higgsfield. Give it real local reference images after inspecting them. Keep the generated originals, copy selected outputs into `assets/`, and save each exact prompt in `prompts/`. The tool's returned output path is authoritative; a requested filename in a prompt does not automatically save it there.

### Visual contract

| Property | Requirement |
| --- | --- |
| Canvas | Square, at least the final 1080 × 1080 output size |
| Style | Flat 2D graphic-novel/screen-print illustration; bold contours, restrained texture |
| Palette | Forest `#08291f`, jade `#2b6552`, mint `#b6efc7`, ivory `#efe4ca`, sparse gold `#dbb858` |
| Center | Blank deep-green vertical strip, approximately x = 28%–72%, full height |
| Left wing | Courier in a funny action pose; cream hood, mint face/backpack, correct small Seeker prop |
| Right wing | Matching fictional game boss, or trophy/coins for leaderboard |
| Background detail | A few maze walls, stairs and searchlights; keep the phone dominant |
| Exclusions | No baked text, UI, central phone, perspective screen, photorealism, or 3D toy render |

Keep faces, hands and important props outside the central phone footprint. Review with the phone overlaid: the bezel occupies roughly x = 26.3%–73.7%, slightly wider than the requested blank column. For future generations, asking for **26%–74% clear** provides more protection against covered fingers or props. Do not crop a face just to fit the layout.

Use the character references as fictional game artwork. Do not imply the depicted people endorsed or played the game.

## 4. Build the phone and insert the real screen

The frame is HTML/CSS, not part of the generated illustration. The background is a full-canvas `<img>`. A flex-centered phone sits above it. A rounded, clipped viewport contains the actual `<video>` or `<img>`.

| Geometry | Reference value |
| --- | --- |
| Output canvas | 1080 × 1080 |
| Phone outer size | 512 × 1008; centered with 36 px above/below |
| Phone corner radius | 51 px |
| Screen viewport | 480 × 960 |
| Screen corner radius | 31 px |
| Source recording | 576 × 1280 |
| Displayed source | 480 × 1066.667; same aspect ratio as recording |
| Source vertical offset | −53.333 px |
| Result | Clips about 64 source pixels at each end to hide Android system bars |

**Do not stretch a new recording to these dimensions if its aspect ratio differs.** Recalculate its displayed height as `sourceHeight × screenWidth / sourceWidth`. Inspect the real status/nav bars and choose the offset accordingly. If trimming would remove game controls, change the viewport or retain more of the source.

For HyperFrames, the video owns its timing and sound:

```html
<video
  id="game-screen"
  class="clip recording"
  src="assets/gameplay-toly.mp4"
  playsinline
  preload="auto"
  data-start="0"
  data-duration="35.4"
  data-media-start="7"
  data-track-index="1"
  data-has-audio="true"
  data-volume="1"
  data-layout-allow-overflow
></video>
```

- `data-start` is placement in the output; `data-media-start` is the trim point in the source.
- Keep the root duration equal to the desired export duration.
- Do not add timing to the ordinary phone/screen wrappers around a timed video.
- Do not set `muted` or add another copy of its audio. HyperFrames owns video playback and seeking.
- Register one paused GSAP timeline whose key matches `data-composition-id`. No decorative motion was needed: the gameplay supplies movement and the fixed artwork keeps it readable.
- Use the screenshot directly for the still. The supplied leaderboard already had a partially clipped summary card; this workflow preserved it rather than inventing missing UI or scores. Prefer a cleaner source screenshot next time.

## 5. Reuse or recreate the project

The tested toolchain was **HyperFrames 0.8.127**, Node 22+, FFmpeg/ffprobe, and local hardware-GPU rendering. Read the currently installed HyperFrames and image-generation skills when executing this workflow; their commands can change.

### Fast path: copy the existing editable setup

Copy the existing `hyperframes.json` and `build_compositions.py` into a new batch folder. Create `assets/`, `prompts/` and `exports/`. Copy or generate the required backgrounds and source media using the builder's filenames. Edit the `posts` array for new bosses, source starts and durations. Run:

```bash
python3 build_compositions.py
```

The script creates standalone folders, each linking to shared `../assets`, and recreates the root Toly preview. It **overwrites** generated composition HTML and `post-specs.json`; make changes in the builder or preserve manual edits before rerunning it. Editing `post-specs.json` alone does not change the builder.

### Fresh path: if only this guide remains

Initialize a fresh directory before adding files:

```bash
npx hyperframes@0.8.127 init ./new-social-posts --non-interactive --example=blank --skill=general-video
cd ./new-social-posts
mkdir -p assets prompts exports
```

Save the complete builder from Appendix B as `build_compositions.py`. Supply the eight media files named in section 1, then run the builder. Read the generated project's `AGENTS.md` before editing it. Save a new brief and provenance record for the new batch.

## 6. Check, preview and export

Run from the batch root. Check each composition and inspect the saved screenshots; an automated pass cannot judge illustration quality or guarantee readable source UI.

```bash
npx hyperframes@0.8.127 check 01-toly --samples 3 --snapshots --json > 01-toly/check.json
npx hyperframes@0.8.127 check 02-mert --samples 3 --snapshots --json > 02-mert/check.json
npx hyperframes@0.8.127 check 03-chase --samples 3 --snapshots --json > 03-chase/check.json
npx hyperframes@0.8.127 check 04-leaderboard --samples 1 --json > 04-leaderboard/check.json
npx hyperframes@0.8.127 preview --background --port 8842
```

Use the actual preview URL printed by the CLI. For this batch it was `http://localhost:8842/#project/2026-10-05-four-posts`. Ports and running sessions are not permanent.

Render the three videos locally:

```bash
npx hyperframes@0.8.127 render 01-toly --quality delivery --fps 30 --workers 1 --video-frame-format png --output exports/01-toly.mp4
npx hyperframes@0.8.127 render 02-mert --quality delivery --fps 30 --workers 1 --video-frame-format png --output exports/02-mert.mp4
npx hyperframes@0.8.127 render 03-chase --quality delivery --fps 30 --workers 1 --video-frame-format png --output exports/03-chase.mp4
```

PNG source-frame extraction preserves UI detail. One worker per export kept resource use bounded. The successful render summaries reported `drawelement capture · hardware gpu`. If a future render fails from memory pressure, retry serially with `--low-memory-mode`; inspect the actual result rather than assuming the fast path worked.

Export the still and blank template through HyperFrames snapshots:

```bash
npx hyperframes@0.8.127 snapshot 04-leaderboard --at 0 --no-end --output snapshots/leaderboard --describe false
cp snapshots/leaderboard/frame-00-at-0s.png exports/04-leaderboard.png
npx hyperframes@0.8.127 snapshot empty-phone --at 0 --no-end --output snapshots/empty-phone --describe false
cp snapshots/empty-phone/frame-00-at-0s.png exports/empty-phone-template.png
```

The blank template has an opaque dark screen, not a transparent cutout. For new videos, replacing the media in the HTML composition is preferable to layering onto the flattened PNG.

## 7. Verify the exported files

Check the **rendered output**, not only the HTML preview:

```bash
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration:format=duration,size -of json exports/01-toly.mp4
ffmpeg -hide_banner -i exports/01-toly.mp4 -vn -af volumedetect -f null -
ffmpeg -hide_banner -loglevel error -ss 8 -i exports/01-toly.mp4 -frames:v 1 -q:v 2 exports/01-toly-cover.jpg
```

Repeat for each video. Inspect early, middle and late frames, then play the file in the review page with sound enabled.

- Expect 1080 × 1080, H.264 video, AAC audio, 30 fps, and the planned duration.
- Confirm the game moves inside the phone throughout; no black panel, frozen frames or missing ending.
- Confirm the screen is proportional, the system bars are hidden, and game controls remain visible.
- Check faces/props are not hidden behind the bezel. Match each illustration to its actual boss.
- Listen for sound; audio-stream presence and volume measurements alone are not a listening test.
- Check the still against the original screenshot. Never fabricate rank, score, player count or rewards.
- Save measured metadata and hashes in `verification.json`. Test ZIP integrity before delivery.

The reference batch passed all four composition checks and exported H.264/AAC videos with matching durations. Audio peaks were −1.5 dB (Toly), −6.6 dB (Mert), and −1.6 dB (Chase); Mert's source was quieter. These are a past snapshot, not required target loudness values.

## 8. Write captions people would actually say

The user's correction: **plain language, funny player reactions, one distinct hook for each post, and several options to choose from.** The first captions were too instructional.

Lead with a specific joke about the clip. Do not lead with feature lists, “Introducing”, or a generic game description. Avoid promising that a hook will stop everyone scrolling. Keep game-death jokes tied to what the footage shows.

Useful options from the follow-up discussion (not a final user selection):

| Post | Hook |
| --- | --- |
| Toly | “I stole one phone. Toly called the whole department.” |
| Toly | “Toly has backup. I have a knife and poor judgment.” |
| Mert | “Mert saw one tiny guy in a hoodie and made it everyone's problem.” |
| Mert | “I came for the phone. Mert started a group call.” |
| Chase | “Chase, bro. It's one phone.” |
| Chase | “I named him Chase. Really should've named him Stay.” |
| Leaderboard | “I'm first in my own game. Someone please fix this.” |
| Leaderboard | “If you beat my score, please be annoying about it.” |

Use the first-place joke only when the accompanying screenshot still supports it. An optional short ending is: “Think you'd do better? Steal a Seeker is on the Seeker dApp Store.” Do not add unverified prizes, free passes or download claims.

## 9. Package and hand off

Deliver three MP4s and one PNG, a caption file, a preview page, and the optional blank-phone template. Include selected backgrounds, exact prompts and a provenance/verification record for later reuse. Keep private character reference sheets and large working caches out of the upload ZIP.

Keep a separate backup of the **editable project**: the original upload ZIP does not contain the builder, source recordings or all composition folders. For a portable backup, include shared `assets/`, the builder, project configuration and compositions together so the relative asset links remain valid.

To review locally:

```bash
python3 -m http.server 8843 --bind 127.0.0.1
```

Open `http://127.0.0.1:8843/preview.html` while the server is running, or open the saved HTML file directly. State clearly whether the work is merely ready to upload or actually published. This batch was prepared locally; nothing was posted to a social account.

## Appendix A — exact generation prompts

The following prompts are preserved verbatim from the original batch. Local destination text inside a prompt is historical; copy the tool's real output file into the intended asset path yourself.


### Toly

References, in order: existing `boss-loading-v1/toly.webp`; `courier-phone-reference.png`.

```text
Create a square 1:1 premium flat 2D editorial comic illustration as a background for the mobile game Steal a Seeker. Use the first reference for the forest green, mint, cream screen-printed graphic-novel illustration style and Toly character identity; use second for the Courier and correct graphite Seeker phone prop. Composition MUST reserve an entirely empty plain deep forest green vertical strip from x=28% to x=72%, full height, where a large phone mockup will be composited later. Do NOT draw a central phone, rectangle, border, text, letters or UI. All illustration must live in side wings: LEFT x=3%-26% a playful cream-hooded mint-face Courier with mint backpack sprinting down angular stealth-maze stairs, clutching the small reference Seeker. RIGHT x=75%-97% the fictional game boss Toly, large head and upper body, black tactical jacket mint piping, hand to earpiece looking left with stern comedic suspicion, pistol lowered safely, not aiming at viewer. Characters fully contained in side wings and entirely visible, no heads cut. Simple mint searchlight beams and very few angular maze-wall shapes connect the edges. Rich flat forest green #0a241c, jade #225c49, mint #a3e6bc, warm ivory #efe4ca, tiny ochre highlights. Bold contour lines, limited cel shading, very light print texture. NOT photorealistic, NOT 3D rendered. Beautiful high contrast readable shapes, restrained details. Entire central 44% width blank. This is clearly fictional game character artwork, not an endorsement. No text anywhere. Output save to /Users/bluntbrain/Documents/creative/solana/steal-a-seeker-production/social/2026-10-05-four-posts/assets/art-toly.png
```

### Mert

References, in order: generated `art-toly.png`; private `mert.png` identity sheet; `courier-phone-reference.png`.

```text
Create a new SQUARE 1:1 illustration in exactly the forest green mint cream flat 2D screen-print graphic novel style of first image. Preserve its essential composition: entirely blank dark green CENTRAL VERTICAL STRIP x28%-72% across FULL HEIGHT reserved for a phone to be added later. No phone frame in center, no words, no text, no UI. NEW CHARACTER SCENE instead: in RIGHT x75%-98%, the fictional game boss MERT matching bald head, big dark beard and black mint-piped tactical jacket in second identity reference. He is a playful angry security boss holding a walkie-talkie to his mouth and low-held pistol, eyeing the left. LEFT x2%-26% cream-hooded mint-faced courier of third image tiptoes behind a tall jade crate holding small graphite Seeker phone, finger to lips, funny stealth pose. Larger head for readability, body contained in wing. Surround with just a few bold maze walls and three mint sound-wave arcs by walkie talkie, forest green, no explosions. Do not place anything into blank middle. No photorealism or 3D. No character or head cut off. Fictional game illustration, not endorsement.
```

### Chase

References, in order: generated `art-toly.png`; private `chase.png` identity sheet; `courier-phone-reference.png`.

```text
Create a new SQUARE 1:1 illustration in exactly the forest green mint cream flat 2D screen-print graphic novel style of first image. Keep an entirely blank dark green CENTRAL VERTICAL STRIP x28%-72% across FULL HEIGHT reserved for a phone composited later. No phone frame in center, no words, no text, no UI. NEW SCENE: in RIGHT x75%-98%, fictional game boss CHASE matching wavy shoulder-length sandy blond hair, face and black mint-piped tactical jacket in second identity reference, lean forward running down jade industrial steps in pursuit, comically determined, one hand holding pistol pointed down. LEFT x2%-26% the cream-hooded mint-face Courier of third reference vaults over a low jade crate clutching the correct small graphite Seeker phone with three vertical rear cameras. Loose cream shoelace, dynamic jumping pose, exaggerated playful action, bold outlines and flat cel shading. Mint sweep lines and sparse angular corridors at corners. Forest green, jade, pale mint, warm ivory, tiny ochre sparks. Absolutely keep middle empty. Heads fully visible. Not photorealistic, not 3D. Fictional game fan artwork, not endorsement.
```

### Leaderboard

References, in order: generated `art-toly.png`; `courier-phone-reference.png`.

```text
Create a new SQUARE 1:1 illustration in exactly the forest green mint cream flat 2D screen-print graphic novel style of first image. Keep an entirely blank plain forest green CENTRAL VERTICAL STRIP x28%-72% across FULL HEIGHT reserved for a phone later. No phone frame in center, no text, no letters, no UI. A playful high-score celebration in the SIDE WINGS only: LEFT x2%-26% the cream-hooded mint-face Courier matching second reference proudly standing on a jade podium, one arm raising small graphite Seeker phone vertically with its three real rear cameras, a tiny warm-gold crown hovering over its head. RIGHT x75%-98% a large illustrated angular golden trophy surrounded by a joyful curved stream of mint collectible coins with simple three stacked slanted bars, small four-point ivory sparkles and jade maze podiums. Bold flat 2D hand-inked contour, restrained print texture, no 3D toy render, no photorealism. Avoid generic clutter. All main figures fully visible in narrow side wings, central area untouched dark green. Match palette of first image #08291f forest, jade #2b6552, mint #b6efc7, ivory #efe4ca, sparse gold #dbb858. The phone screen will show real leaderboard later.
```

## Appendix B — complete composition builder

Save this as `build_compositions.py` in an initialized batch root. It recreates the original layouts; change `posts` and the staged media names for the next batch. It writes HTML and links local assets; it does not generate artwork or run the renderer.

```python
from pathlib import Path
import json
root=Path(__file__).parent
posts=[('01-toly','toly',7,35.4),('02-mert','mert',4.5,47),('03-chase','chase',6.5,45),('04-leaderboard','leaderboard',0,1),('empty-phone','toly',0,1)]
css='''*{box-sizing:border-box;margin:0}html,body{width:1080px;height:1080px;overflow:hidden;background:#08291f}#root{width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center}.art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.phone{position:relative;width:512px;height:1008px;flex:none;border-radius:51px;background:linear-gradient(110deg,#71857c 0%,#263b32 4%,#080f0b 8%,#101a14 90%,#52655b 96%,#17261e 100%);padding:23px 15px;border:1px solid #95b4a3;box-shadow:0 15px 25px #00140ed0,inset 0 0 0 5px #16271f}.screen{position:relative;width:480px;height:960px;overflow:hidden;border-radius:31px;background:#071c13}.recording{position:absolute;left:0;top:-53.333333px;width:480px;height:1066.666667px;max-width:none;object-fit:fill}.camera{position:absolute;top:8px;left:250px;width:10px;height:10px;border-radius:100%;background:#020b07;border:2px solid #384d41}.speaker{position:absolute;bottom:9px;left:224px;width:62px;height:4px;border-radius:4px;background:#374e3f}.sidekey{position:absolute;right:-4px;top:209px;width:3px;height:66px;border-radius:2px;background:#5c7968}.sidekey.volume{top:122px;height:64px}'''
for folder,theme,start,duration in posts:
 p=root/folder;p.mkdir(exist_ok=True)
 a=p/'assets'
 if not a.exists(): a.symlink_to('../assets',target_is_directory=True)
 (p/'hyperframes.json').write_text((root/'hyperframes.json').read_text())
 (p/'meta.json').write_text(json.dumps({'id':folder,'name':folder}))
 if folder=='empty-phone': media=''
 elif theme=='leaderboard': media='<img id="game-screen" class="recording" src="assets/leaderboard.jpeg" alt="Actual Steal a Seeker leaderboard" data-layout-allow-overflow />'
 else: media=f'<video id="game-screen" class="clip recording" src="assets/gameplay-{theme}.mp4" playsinline preload="auto" data-start="0" data-duration="{duration}" data-media-start="{start}" data-track-index="1" data-has-audio="true" data-volume="1" data-layout-allow-overflow></video>'
 html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1080,height=1080"><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>{css}</style></head><body><div id="root" data-composition-id="{folder}" data-width="1080" data-height="1080" data-duration="{duration}" data-fps="30"><img class="art" src="assets/art-{theme}.png" alt="2D Steal a Seeker {theme} illustration"><div class="phone"><div class="screen">{media}</div><div class="camera"></div><div class="speaker"></div><div class="sidekey"></div><div class="sidekey volume"></div></div></div><script>const tl=gsap.timeline({{paused:true}});window.__timelines["{folder}"]=tl;</script></body></html>'''
 (p/'index.html').write_text(html)
(root/'index.html').write_text((root/'01-toly/index.html').read_text())
(root/'post-specs.json').write_text(json.dumps([{'folder':f,'theme':t,'sourceStart':s,'duration':d} for f,t,s,d in posts],indent=2))
```
