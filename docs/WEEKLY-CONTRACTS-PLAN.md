# Weekly contracts: implementation plan

## Product and screen references

- Duolingo league screen: a clear weekly deadline, personal position and nearby competition. Reference: https://blog.duolingo.com/duolingo-leagues-leaderboards/ . Use the visible personal-rank pattern, not unlimited XP accumulation.
- Strava Trophy Case: completed challenges remain as earned achievements and can be opened for detail/sharing. Reference: https://support.strava.com/en-us/articles/15402068-the-strava-trophy-case . Use a permanent collection and a shareable achievement detail.
- Chess.com league standings: explain rank and show the competition clearly. Reference: https://www.chess.com/leagues . Our scores measure three best performances, not participation volume.

These are product pattern references, not evidence of conversion or retention for this game.

## Minimal screen flow

Keep Missions / Leaderboard / Hideout. Leaderboard has Contracts, Standings and History segments inside the same destination. Contracts: three visual cards with location, distinct modifier, clear count of ranked attempts remaining and best score. Contract detail: exact map preview, phone/exit objective, practice CTA and ranked CTA. Ranked confirmation states that starting consumes one of five attempts; loss, exit or timeout consumes it too. Existing retries of the same network request must not consume another attempt.

Result returns to the weekly screen with progress and nearby rival. A successful result can be shared as a Courier Card. The same card is reachable from standings and history. It includes the game, verified .skr name plus short address (or address alone), week, rank, complete-contract count, points, time and earned title. In-progress ranks say LIVE; historical finalized ranks say FINAL. Browser cards say LOCAL PRACTICE and never claim verification. Share image uses the Android system chooser; browser uses file sharing when available or downloads PNG. No social login in our game and no automatic posting. Users choose X, Telegram or another installed app. Do not assume everyone has Telegram.

## Competition rules

Three contracts open Monday 00:00 UTC, close next Monday. All three available all week. Identical published definition and pinned rules version for everyone. Unlimited unranked practice with the exact definition. Five ranked starts per wallet per contract; no purchases, cosmetics or retries can add attempts. Server serializes starts per wallet and persists request keys; cancellation/abandonment consumes a started attempt, while a rejected start does not. Infrastructure verification errors preserve the ticket/replay for retry rather than count as an extra start.

One best successful result per contract contributes: normalized contract points, then total simulation ticks. Exact ties share rank. No points from practice, losing, or merely starting. Completion is displayed separately; nearby rival gap comes from real standings. Attempts reset with the week; campaign ownership, cosmetics and achievements persist. One wallet is not proof of one human; no claim of bot immunity. No token pool or investment-return promises.

## Contracts and deterministic gameplay

Generate purpose-built weekly layouts rather than select one of the twelve campaign missions. Each immutable definition contains cover layout, spawn, phone positions, exit location, guard routes/conditions and a named modifier. Three identities: Warehouse / Blackout (no decoy), Rooftops / Double haul (two extractions), Powerworks / Exit window (extraction only while the timed exit is open). Weekly seed changes geometry, routes, targets and exits. Validate collision reachability, object placement and reproducibility over many weeks. Preview, practice, ranked client simulation and pinned server replay must all receive exactly that same definition.

## Data and security

Versioned weekly manifests in PostgreSQL; ranked tickets reuse the audited replay queue with explicit contract metadata and server-stored definitions. Attempt limits enforced in a transaction under a wallet lock. Verification loads the rule bundle pinned when the week was issued. Old daily/campaign records remain separate and recoverable. Achievements and frozen weekly history persist server-side; finalization waits for pending submissions and a grace period. Cosmetics are earned entitlements distinct from shop items.

.skr identity uses mainnet read-only AllDomains ownership even in a devnet game. Prefer owner-selected name verified against connected wallet; never let an arbitrary text field impersonate a name. Cache successful lookups briefly, report RPC failure separately, and fall back to the address. Payment network remains devnet.

## Delivery and validation

1. Contract definitions, simulation overrides, pinned replay support and rule-version migration.
2. Atomic attempt budgets, scoring, nearby ranks, weekly archive and earned cosmetics.
3. Web practice/local test flow plus Android verified run flow, recovery and live result updates.
4. Contract cards, detail/confirmation, standings, history and shareable identity card.
5. Tests for concurrency, retries, attempt exhaustion, practice isolation, tampering, end-of-week windows, ranking ties, earned entitlement persistence and contract generation validity.
6. Browser visual/E2E checks; signed Android build; deploy API; physical test if a phone is connected. Record actual limitations instead of claiming unperformed tests.

## Implementation notes

The first implementation uses three fresh deterministic contract definitions per week, not a campaign mission rotation. Screen artwork reuses the established districts; the actual map preview renders the contract collision geometry. The Ghost Courier palette is lavender/ivory, distinct from both purchasable outfits. It appears on the collection courier and campaign gameplay; ranked contracts always use the standard loadout.

Scores: successful run = 5,000 completion points + up to 4,000 for time remaining relative to that contract's hard limit + up to 1,000 for remaining charge. The ceiling is 10,000 per contract / 30,000 per week. Best means highest points, then lowest ticks. This prioritizes the performance of the best three attempts, not attempt count.

Name verification uses the official Solana Mobile AllDomains account-layout reference: https://github.com/solana-mobile/solana-mobile-skills/blob/main/skills/seeker-domains/references/kit-resolver.md . It verifies the mainnet genesis, name-program owner, registration expiry and wallet owner. The owner explicitly supplies their preferred .skr. Non-name-account/tokenized names safely fail rather than assigning an unverified identity. Successful display ownership is valid for one hour; reverify afterward. The full wallet remains the authenticated identity. X/Telegram sign-in is not needed to create or save a card.

Visual reference: Duolingo's own published league screen at https://blog.duolingo.com/frontend-prediction/ shows the deadline above rankings and highlights the current learner. Our rank rows and persistent personal summary borrow that hierarchy; they display confirmed scores only.

## Validation and remaining device checks

- 114 client tests + 60 server tests passed. Contract validation covers 52 weeks of reproducibility, collision-free patrol segments and connected target/extraction routes. The three current-week contracts have successful complete-input replays, verified using the same simulation on the server. An automated route search did not solve every future variant; connectivity is guaranteed by these checks, but future difficulty still needs human playtesting.
- Weekly modifiers rotate between districts as well as changing phone positions, routes, cover and exits. This changes the extraction objective instead of only swapping a background.
- Atomic five-start budget, simultaneous requests, duplicate request recovery, infrastructure retry of the same replay, normalized points, earned outfit, final archive and persistence across reset are tested.
- Browser at 360×640 and 360×797: entered practice, checked it used zero attempts, entered/left a ranked test, checked exactly one attempt used, and verified tab bounds. Used computed successful replay fixtures in a separate browser session to inspect earned outfit, standings and PNG export. No fictional competitors were added to the live service.
- Live devnet API: existing dedicated QA wallet signed in, fetched all three contracts, repeated one start request, verified the same ticket was returned, abandoned it and confirmed exactly one attempt and zero leaderboard score. No token transfer. See `verification/contracts/live-api.json`.
- Mainnet read-only .skr lookup succeeded for a registered public name; authenticated ownership rejection and expiry parsing have tests. A successful claim for the user's own .skr still requires their wallet/name.
- Signed Android APK built successfully with image sharing and view capture. No phone was connected by USB. Native share chooser, saving to a folder, and full wallet playthrough on a physical phone remain device checks, not claimed completed.
- Design/QA screenshots and local-test share image: `verification/contracts/screens/`.

Final deployment: `0a69c57d-30d2-4695-b639-2fbda53e1eb3` (Railway devnet API, SUCCESS). Public league read returned the expected three modifiers and no fabricated participants. Final APK SHA256: `c4b188b392470b8161a66ae6f289d9d2c3b90c70b786244e6428a27b8b0e57a6`.

Browser name entry deliberately says **Preview .skr name**, and exported local cards say **LOCAL TEST** and **example name**. The Android action says **Verify my .skr** and checks the connected wallet. This allows review of the name/card layout without claiming that a browser-entered name is owned.
