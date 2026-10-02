# Steal a Seeker — CLOCK IN presentation

Updated 27 September 2026. Ten slides. Original source presentation was preserved.

- `steal-a-seeker-clock-in.pptx`: editable slide text and individual artwork; slide 2 embeds a 10-second, 120-frame gameplay GIF. View in slideshow mode for motion. File and layout validators passed. Native PowerPoint playback was not tested on this machine.
- `index.html`: browser presentation with slide navigation, downloads and an inline, controllable MP4 on slide 2. All assets are local and relative, so the directory can be hosted as a static site.
- `steal-a-seeker-clock-in.pdf`: static viewing fallback. It does not animate.
- `assets/gameplay.mp4` and `assets/gameplay.gif`: actual current browser gameplay captured on 27 September 2026. Two excerpts at original speed. Silent canvas capture, without the outer HUD. Separate from the published Android release.
- `assets/store-published.png`: the user's unmodified publisher screenshot. v0.3.30 was live since 25 September. Snapshot: 25 installs and 46 updates in the last seven days, rating 4/5 from one review. These are not retention or active-user measurements.
- `assets/cover-art.png`: newly generated original cover using OpenAI image generation and the existing courier reference. No Higgsfield generation was used for this presentation update.

Sources and claim boundaries are in the PowerPoint speaker notes. The deck describes existing mainnet payment implementation and configuration; it does not claim a new physical-device payment test. Weekly token rewards are not presented as active. Character cosmetics do not imply partnerships or endorsements.

To view locally, serve this directory with `python3 -m http.server 8807` and open `http://127.0.0.1:8807/`.

This package has not been uploaded publicly. The hackathon Deck URL field needs a publicly accessible hosted/viewable link, not a localhost URL.
