# Daily runs and verification

Implemented 12 September 2026. This mode is separate from the planned paid-entry/success-return mode: there is no entry charge or token payout here.

## Player flow

Open Hideout → Daily challenge / leaderboard. Public daily information and scores are visible in the local browser preview. Starting a run requires the native app, a signed wallet session and campaign access. Every player gets the same published map, standard courier and mission tools. Daily completion does not skip campaign prerequisites.

The game records quantized world-direction inputs at the same 30 Hz ticks used by its simulation. Pickup is a held input; dash and decoy are individual action edges. A ranked pause freezes game state, including velocity, while the server submission deadline continues. Leaving an unfinished daily attempt abandons it when connected. A finished replay is saved under its wallet before submission, so an interrupted upload can be retried from the daily screen.

The results screen distinguishes the local game outcome from the server result. Verification can remain pending during an outage; no pending/invalid/error result appears on the leaderboard. One best verified extraction per wallet is listed, ordered by score then tick count. Exact ties share rank. Personal rank is returned even outside the top 50.

## Server contract

- `GET /daily`: immutable published manifest for the UTC day.
- `GET /daily/:day/leaderboard`: public top 50; a signed session adds personal rank.
- `POST /runs`: requires campaign access and binds a request key to wallet, daily map, rules/level hashes, seed, standard loadout and expiry. One open run per wallet.
- `GET /runs/current` and `GET /runs/:id`: authenticated owner access only.
- `POST /runs/:id/finish`: stores one replay hash atomically. An identical retry is idempotent; different inputs cannot reuse the ticket.
- `POST /runs/:id/abandon`: closes an unsubmitted ticket; queued verification cannot be replaced by abandoning it.

Input shape, size, tick count, rules version, owner and submission window are checked before queueing. Replay duration cannot exceed elapsed ticket time plus a small network allowance. The server computes the outcome; it never accepts client score or campaign-save fields as evidence.

PostgreSQL migration 003 adds manifests and runs. A durable verification queue uses leases and claim tokens. An expired lease can be reclaimed after a worker/process crash; an obsolete worker cannot overwrite the newer claim. Verification runs in a separate worker with a deadline, heap limit and concurrency cap. Invalid replays are rejected; infrastructure errors retry finitely and preserve the replay for support.

Legal-input replay is not proof that a human played. This is not advertised as cheat-proof and must not be treated as enough by itself to enable real-money rewards.

## Pinned rules

`npm run rules:generate` hashes the simulation/verifier source and map definitions, then creates a small immutable verifier bundle under `server/rule-bundles`. The registry records each bundle checksum. Historical bundles are retained. `npm run rules:check` verifies source and bundle integrity; API startup and normal APK/web build commands invoke the check.

A ticket uses its saved bundle, never silently switched current rules. Existing daily manifests remain unchanged after deployment. A newly changed app cannot start an older daily rules version it does not implement; publish compatible game builds at the UTC rollover. Already-issued replays can still be verified by their retained bundle.

Never edit an applied SQL migration or an existing pinned bundle. Rule changes produce a new source hash. The generator preserves a known bundle even if the local bundler version changes.

## Evidence

58 game/client tests and 18 server tests currently pass. Database tests exercise actual signed sessions with synthetic purchase transactions, not real devnet payments. They cover ownership, stale rules, instant/expired attempts, duplicate and changed submissions, worker-lease recovery, rejected replay outcomes and top-50/personal ranking when 60 players tie.

`verification/native-parity-report.json` records 14 passed Android emulator checks on the Reanimated UI runtime: twelve complete mission input sequences plus dash and decoy scenarios. Expected outcomes were generated independently on Node; comparison includes positions, guards, tick count, score, batteries, deliveries and tools. This is simulation parity, not a native touch playthrough or physical-device performance result.

`verification/browser-replay-parity.json` compares an actual browser touch recording with its pinned server verifier. Full-campaign browser replay checking is a separate artifact and should only be reported as passed after `scripts/verify-browser-replay.ts --campaign` succeeds.

## Reproduce

```sh
npm run rules:check
npm test
npm run server:test
npx tsx scripts/native-replay-fixtures.ts
# Dedicated diagnostic APK; do not distribute as the game:
EXPO_PUBLIC_NATIVE_PARITY=1 npm run build:apk
# Force rebundling when switching the compile-time probe flag back off:
cd android
EXPO_PUBLIC_NATIVE_PARITY=0 ./gradlew :app:cleanCreateBundleReleaseJsAndAssets :app:assembleRelease --no-daemon
```

The local preview server proxies only public daily GET routes to port 8790. Native API access still needs `EXPO_PUBLIC_API_URL` set to a reachable HTTPS service. Railway hosting, test-mint funding, physical Phantom and actual native ranked submission remain unverified. The paid-entry reserve/return system remains outstanding.

## Full campaign recording check

All twelve missions passed browser pointer-joystick extraction and reload restoration with the quantized recorder connected. `verification/campaign-browser-replays.json` retains the input traces; `verification/campaign-replay-parity.json` confirms each matches its immutable server bundle for terminal status, tick count, score, battery, deliveries and detection count. Some missions required multiple route start phases. This is browser input evidence, separate from the Android simulation parity diagnostic and still separate from physical-device ranked submission.
