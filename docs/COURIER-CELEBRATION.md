# Courier celebration — selected option A

The campaign-complete sheet now uses a large illustration with a single headline and three live personal-best totals. The narrow nested poster and repeated copy are removed. Replay stays left, Share card right, and Back to missions below. Controls and stats are real UI, not text baked into a bitmap.

## Phone accuracy and artwork

The user supplied three photographs of the Seeker. We first generated and checked `design/visual-v2/completion-options/seeker-phone-sheet.png`: rear view, rear three-quarter views and camera detail. It is an artistic rear reference, not measured CAD. We then regenerated the courier illustration from it.

The final phone is slate blue-grey with a separate upper circular lens, narrow lower pill containing two circular elements, flash to the right, Seed Vault sticker, and small three-bar mark near the bottom. The earlier mint generic phone and gold chips are not used. Original generated PNG and prompts are retained; the app uses a 294 KB transparent WebP. Built-in image generation was used.

The default outfit gets the new celebration pose. Other equipped outfits retain their existing correct costume portraits; they are not silently replaced by the default outfit. Those portraits have not been regenerated into the raised-fist pose.

## Confetti

48 real animated paper pieces, including thin ribbons, small rectangles and round pieces. Each has its own timing, launch arc, horizontal drift, rotation and flutter. A single burst takes about five seconds. It uses the existing React Native Animated library with the native driver; no new runtime package. It intercepts no taps, cancels on unmount, and is absent with reduced effects. Confetti is not baked into the shared image.

## Data and sharing

Stars, best score totals and best time totals come from saved campaign progress. Screen and PNG use the same layout and portrait selection. Campaign PNG is 1080×1450; weekly cards retain 1080×1620 and their existing design. The default hero is embedded for portable export. Browser downloads a PNG and offers an X compose link; Android uses the system share sheet. No automatic social posting.

Campaign sync still runs even though its routine success text is hidden on this sheet. Save failures remain visible with a retry action. Neither weekly prizes nor payment settings changed.

## Verification

- TypeScript and web export passed; all 198 tests passed.
- Campaign/weekly card tests cover true stats, image dimensions, text bounds and all six equipped outfit identities.
- Browser end-to-end test seeds eleven saved wins, then completes the tutorial with actual pointer input. This is a layout fixture, not a claim of twelve human-played wins. It checks completion, left/right actions, 48 confetti pieces, PNG download and keeping the result when focus changes.
- Sheet checked at 390×844 and 360×640, including after download, without scrolling or clipped buttons.
- Separate actual-component sample preview verifies reduced effects and the Night Courier outfit.
- Evidence: `verification/celebration/`.

No new APK or physical Android verification is included in this patch. Native capture still needs a device check. The local preview is `/design/completion-options/preview.html`; its stats are explicitly labelled samples.
