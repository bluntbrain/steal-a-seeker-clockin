# Steal a Seeker

A solo Android stealth-action game for Clock In. Tap to move, use cover, defeat robot guards, recover a virtual Seeker and escape after the alarm.

The game uses **2D Skia in React Native** on Android and React Native Web in the browser. It is not a WebView. Phone inspection is separate from gameplay.

## Current product — 17 September 2026

- All 12 campaign missions are free. No wallet is needed to start. The first mission teaches movement, cover, knife takedowns and extraction.
- First clears earn 50 credits; each extra star earns another 5. Up to 720 campaign credits. Identical repeats do not grant credits again.
- Hideout is the store and collection: Outfits, Gear and Collection. Cosmetics use credits; packs can be bought with SKR or SOL. Bought items never improve weekly performance.
- Leaderboard rankings and practice are free. A one-time Game Pass unlocks ranked attempts: three missions per week, five attempts each. No buying extra attempts. Best complete runs count; faster runs break score ties.
- Live pass targets: **500 SKR or $10 worth of SOL**. These are different payment options, not an exchange-rate claim. The existing Mainnet service has **TEST_PRICING=true**: 1 SKR or a $0.10 SOL target, with rounding and network fees shown at checkout.
- Weekly token prizes are **not active**. New passes do not include the old 25 SKR campaign rebate. Earlier reserved purchase terms remain recoverable.

See [the current design, research, pricing and QA plan](docs/FREE-CAMPAIGN-STORE-V3.md). It supersedes older campaign-paywall and token-wardrobe proposals. [Weekly map architecture](docs/WEEKLY-MAP-AUTOMATION.md) explains backend manifests and engine compatibility.

## Try it

- [Browser preview](http://127.0.0.1:8787/?build=free-campaign-store): local demo credits, purchases and weekly results. No real token transfers.
- [Design and QA review](http://127.0.0.1:8787/design/free-store/index.html): generated reference and actual implemented screens.
- [Mainnet APK](releases/steal-a-seeker-mainnet.apk): signed arm64 Android build. Phantom approval is required for real purchases; campaign play is free.

APK files are ignored local artifacts. Adjacent JSON receipts record source hashes, build configuration and APK SHA-256. Older judge/devnet APKs and reports are historical. Signing credentials stay outside the repository; see [release instructions](docs/RELEASE.md).

## Run and build

Node 22+, Java 17 and Android SDK 36. Configure ANDROID_HOME or ignored android/local.properties.

```sh
npm ci
npm run typecheck
npm test
npm run server:test
npm run export:web
npm run preview
npm run build:apk
```

Server tests require the dedicated local `seeker_clockin_test` PostgreSQL database and truncate only that database. Never point them at production. `npm start` runs Metro; `npm run android` runs a development Android build. Static preview uses port 8787. Release builds ignore `.env`, force diagnostics off and verify frozen rules.

## Connected service

[Mainnet API](https://seeker-api-production-41b3.up.railway.app/health): one existing Railway API service with embedded workers and private PostgreSQL, app sleep disabled. No replacement service was created. [Server documentation](server/README.md) covers credits, payments and recovery.

Authenticated credits use a PostgreSQL ledger. Verified campaign replays and finalized payment receipts grant credits idempotently. Redemptions atomically debit and grant ownership. Raw progress saves cannot authorize money, credits or rank. Guest campaign progress survives wallet connection; only valid queued replays can produce wallet credits.

## Verification and remaining work

17 September: TypeScript passes, **189 game/client tests** pass in the latest tutorial audit; **73 backend tests** passed in the preceding pricing verification. The 1,296-trial balance audit found a winning reference through all 12 missions and completed the campaign unlock/save chain. The first five rooms are more forgiving; basic controllers still struggle with 11–12. Bot results do not establish human difficulty or retention.

The latest browser tutorial check reached the win screen with 60 credits and continued to mission two. Earlier store QA covered free practice, pass gating, credit-pack cancellation/purchase, cosmetic debit/equip/unequip and persistence, with Hideout and packs at 360×640 and 390×844. That historical evidence is in the [store QA report](verification/free-store-ui/README.md); current tutorial evidence is in the [tutorial audit](docs/TUTORIAL-AUDIT-2026-09-17.md).

The updated APK builds. This revision still needs physical Android frame-pacing, sound/haptics, touch and real Phantom purchase verification. Weekly funded prize settlement and campaign-only health upgrades are not included. Do not advertise token winnings before settlement is implemented and funded.

## Source layout

`src/game`: deterministic maps/rules. `src/components`: Skia rendering and screens. `src/commerce`: accounts, credit store and checkout. `src/wallet`: MWA. `src/league` and `src/ranked`: weekly manifests and ranks. `src/progress`: local/cloud bests. `server`: authentication, finalized payments, credit ledger and replay workers. `shared/store.ts`: pack quantities and defaults. Backend price overrides are documented in [PRICING.md](docs/PRICING.md).

Current [tutorial audit](docs/TUTORIAL-AUDIT-2026-09-17.md), [repository/deployment audit](docs/REPO-CLEANUP-AUDIT.md), and [reviewer guide](submission/JUDGE-GUIDE.md).

Submission drafts: [judge guide](submission/JUDGE-GUIDE.md), [pitch](submission/steal-a-seeker-pitch.pptx), [demo script](submission/DEMO-SCRIPT.md). Refresh their older economy copy before submitting. [Playtest protocol](docs/PLAYTEST-PROTOCOL.md) and [privacy/support draft](submission/PRIVACY-AND-SUPPORT.md) remain useful preparation.
