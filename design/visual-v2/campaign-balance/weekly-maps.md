# Weekly maps: current behavior and next design

Updated 17 September 2026.

## The simple explanation

The phone contains the game engine and artwork. The backend sends a map recipe: where the walls, guards, phones and exit go, plus the mission rules. The Android app builds the playable map from that recipe. The backend also uses that exact recipe to check the recorded run.

Every Monday at 00:00 UTC (05:30 in India), a new competition week starts. The first request for that week creates three missions and saves them in PostgreSQL. Everybody receives the same saved missions for the entire week. There is no need to keep a timer running on the phone, and this does not require another Railway service.

The browser demo is different: it generates a local test league. It does not download the live competition or submit real rankings.

## What exists now

| Part | Where it lives | What it does |
|---|---|---|
| Twelve campaign maps | App bundle | Permanent campaign, available with the installed build |
| Weekly map generator | Backend code in `shared/contracts.ts` | Date-seeded placement, mirroring, patrol variation and three rotating modifiers |
| Published weekly maps | PostgreSQL `league_weeks.manifest` | Frozen definitions shared by all players |
| Download and rendering | `src/league/api.ts`, `useLeague.ts`, `src/GameScreen.tsx` | Fetches `/league`; starts the actual downloaded level |
| Ranked tickets and input replays | `ranked_runs` | Binds every attempt to its week, map and archived rules |
| Weekly standings | Verified best results per mission | Adds each player's best complete score from each of the three missions |
| Historical standings and earned outfit | `league_history`, `league_achievements` | Survive the weekly reset |

Three missions are available all week. Players have unlimited practice and five scored attempts per mission. That is up to 15 scored attempts each week, not only three plays. The next week has fresh budgets; buying extra attempts is not supported.

The current generator is limited. It remixes one sparse layout family through mirroring, cover shifts, phone placement and patrol changes. It is not producing three newly designed dense maps every Monday. Rotation alone will start to feel repetitive.

## Compatibility change in this build

Previously the Android client required the week's complete rules hash to equal the installed build's hash. Editing a campaign patrol changed that hash and could block weekly missions even when their engine behavior had not changed.

New weeks now store a separate engine fingerprint. The client checks this fingerprint for weekly play; the server still verifies the run with the exact archived rules and map in its ticket. Campaign layout edits no longer invalidate otherwise compatible weekly missions.

The already-published week of 14 September is left intact. Its older engine was inspected and replay-tested against this build using all three frozen missions and six start delays each. Only that specific historical rules hash is explicitly allowed. Unknown engines and unsupported mechanics remain blocked. Existing installed apps need this update once to use the new compatibility check.

An engine fingerprint is compatibility metadata, not an anti-cheat replacement. Every scored run still needs server replay validation. Never rewrite an active week's layout to make it fit a new app build.

## Can we keep adding maps on the backend?

Yes, when they use supported geometry, guard types, assets and mechanics. A new arrangement of existing walls and guards does not need an APK update after this compatibility change.

Right now those additions require changing the backend map generator and deploying the same API service. There is no map upload endpoint or admin map editor yet. The 12 campaign levels do not automatically become remotely managed.

A new enemy ability, movement rule, weapon behavior, renderer feature or artwork that is absent from the app still needs an app update. Sending a new asset name in JSON cannot create that asset on the phone.

## Recommended automation

Use a library of tested maps, then select from it automatically. Do not generate arbitrary walls directly into a paid competition. Connectivity alone cannot tell us whether a map is fun or has an unfair crossfire.

1. Build 12–18 distinct templates across Warehouse, Rooftops and Powerworks. Each needs alternate cover routes, safe starting space and a different central obstacle or objective arrangement.
2. Give each template a small set of designed phone positions, exit positions and patrol patterns. Use bounded combinations rather than random coordinates.
3. Prepare three missions for each of the next eight weeks. Use a deterministic seed based on week and slot; prevent recent repeats. Give the trio a deliberate difficulty order.
4. Validate the complete pack before publication: all objectives reachable, return path reachable, switches and timed exits functional, every patrol segment walkable, no damage during the initial safe period, and at least one full winning replay per mission.
5. Run the difficulty audit against each candidate. Flag large damage spikes, unavoidable-looking crossfire and outcomes highly sensitive to tiny tap delays. These are review signals, not measured human win rates.
6. Approve only packs that pass QA and a phone playtest. Save the exact three definitions, engine fingerprint, rules hash, content checksum and test evidence in the database ahead of time.
7. On Monday, atomically publish that week's approved pack on the first `/league` request. Copy it into the existing immutable `league_weeks` record. Never regenerate a pack once players can start it.
8. Keep at least two prevalidated fallback packs. If the scheduled pack is missing or invalid, select a compatible approved fallback once and freeze that choice. If none is available, show the competition as unavailable instead of charging for an untested mission.

This gives automatic weekly release with deliberate level design. The game does not need an AI service to be available at reset time.

## Proposed data additions — not implemented yet

- `weekly_map_templates`: template ID, content version, district, supported engine, level recipe and retirement flag.
- `weekly_packs`: week, version, status (`draft`, `validated`, `approved`), three complete definitions, content checksum, engine fingerprint, archived rules hash and approval time.
- `weekly_pack_checks`: pack checksum, check type, tool version, results, winning replay references and human review notes. Approval applies to an exact checksum; editing the pack invalidates it.
- Keep `league_weeks` as the publication record. Existing attempt, best-score and history tables remain the scoring source of truth.

No new hosting service is necessary. A local build tool or CI can prepare and test packs; the current API and PostgreSQL can publish them. CI credentials should only be added when implementing this pipeline.

## Release checks

- The September 14 competition's rule hash and all three map definitions must remain byte-equivalent after deployment.
- New Monday records include the weekly engine fingerprint.
- Same-week concurrent requests return the same stored manifest.
- Old week records, ranked attempts, results and earned cosmetics survive deployment and rollover.
- Unsupported engine or map mechanics fail before consuming an attempt.

The compatibility fix is implemented in this balance update. The larger template bank, pack approval tools and fallback publication pipeline above are the next implementation step, not completed features.
