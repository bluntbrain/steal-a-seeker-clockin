> Current renderer: fixed overhead **2D**, in all active modes. Open `/design/index.html` on the local preview for assets and all twelve maps. Live 3D is superseded.

# Test the game in your browser

Open http://127.0.0.1:8787 in a desktop browser. Android testing is paused for this iteration.

## Start to finish

1. Buy the campaign with 50 of the 250 **local playtest credits** provided. No wallet opens and no money moves.
2. In the Hideout, choose **Continue · Quiet Pickup**. One guard watches the phone lane.
3. Move with WASD, arrow keys or the joystick. Stop next to the phone and hold **E / TAKE**. Carry it to the mint exit and stay there for one second. **Space / DASH** spends 20 battery while carrying.
4. Check your stars and choose the next mission. There are twelve maps across the warehouse, rooftops and vault. Briefings explain the new mechanic. **Q / DECOY** is available on every mission. Aim toward the landing ring; nearby mobile guards investigate the six-second noise. **E / ACT** operates nearby switches.
5. Open Hideout → Shop. Buy and equip an outfit or trail. Return to gameplay and check the change. Frame and rack purchases appear in your Hideout. Outfits never change gameplay stats.
6. Reload. Purchases, equipment, collection and mission bests should still be there in this browser.
7. Open Daily. Complete the route to add your result to this browser's daily records. These are not global/server-verified rankings.
8. Open Entry challenge. Review terms, buy an entry for 10 credits, then Start. A successful extraction returns 10 credits; capture, timeout or abandoning a started entry returns zero. Unstarted cancellation returns the entry cost.
9. During an entry, pause and **Save / leave**, reload, then choose **Resume saved entry**. It keeps the same entry and original deadline. No second debit should occur.
10. Pick up a phone: the red alarm and siren start, guards move 40% faster and rise to 80% over 30 seconds. On two-phone missions the alarm stays on after the first delivery.
11. Try sound, volume and reduced effects in Settings. Escape pauses a run. Menus pause gameplay; close the menu and explicitly resume.

## Tell me what feels wrong

Mission number, what you expected, what happened, and whether you used keys or touch. Most useful feedback: camera visibility, character size, patrol readability, input response, difficulty and confusing buttons.

## What this build proves

Browser gameplay and a local model of the complete product flow. The sandbox uses its own storage key, never a devnet wallet session, server entitlement or real token receipt. Clearing browser storage removes the local playtest profile. Physical Android, Phantom approval, hosted backend and live devnet settlement remain separate tests.

See [security and decoy details](SECURITY-DIFFICULTY.md) for the updated mission pressure and how to lure guards.

The game message sheets now fit at the screen bottom without scrolling. Pause, caught, timeout and success have distinct courier art. Preview all six message states at `/design/sheets/index.html` (sample data, no purchases).
