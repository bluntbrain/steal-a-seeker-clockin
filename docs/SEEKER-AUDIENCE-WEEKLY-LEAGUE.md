# Seeker audience and weekly league proposal

Research checked: 14 September 2026. Proposal only; no prices, purchase terms, payouts or gameplay changed by this document.

## Project constraints to retain

Primary audience: crypto-native Seeker owners. The user specifically likes a weekly leaderboard. Solo mobile play with bots; no live multiplayer lobby. One purchase around USD 10 paid in SKR or SOL, optional cosmetics, no new game NFT collection, no custom smart contract. Current physical testing is on Realme/Phantom; production audience also requires Seed Vault Wallet testing. Honor existing purchase terms when changing rewards for new orders.

## Evidence, not assumptions about every owner

- Solana Mobile's Activity Tracking measures onchain activity, dApp exploration and daily use, with weekly views for the latter two. This establishes a familiar habit/season format, not a guarantee that playing our app earns official SKR allocations. https://solanamobile.com/blog/introducing-seeker-activity-tracking
- Its SKR launch announcement reports over 100,000 users and 188 developers eligible for the community allocation. Eligibility is not active gamer count or willingness to pay. https://solanamobile.com/blog/skr-is-live
- Its ecosystem roundup describes GORECATS' Arena Battlepass and prize leaderboard, TokenRun quests with SKR payouts, and Gold Rush's free cart for Seeker users. The roundup reports Gold Rush's team claimed 1,300 players. These are product/distribution examples, not independently audited retention or revenue. https://solanamobile.com/blog/1-000-dapps-smarter-discovery-and-a-bigger-seeker-season
- The official Seeker docs describe .skr identity, SGT and MWA/Seed Vault Wallet connectivity. https://docs.solanamobile.com/solana-mobile-stack/seeker
- Device model checks can be spoofed. Official guidance recommends SIWS followed by SGT ownership verification for valuable Seeker benefits. Existing SGT verification does not require us to issue new NFTs; it proves device-linked ownership, not a unique human. https://docs.solanamobile.com/recipes/general/detecting-seeker-users

Some migrated blog pages display the same July 14 date despite describing different historical events. Do not infer campaign chronology or currently active offers from that displayed date. No reliable cohort-level D7 retention, paying-user percentage or $10 willingness-to-pay study was found in this research.

Working audience hypotheses: reward-focused explorers may try a game because of a visible funded prize; competitive players may return for mastery and rank; community collectors may value earned recognition and useful exclusives. These groups overlap. A generic outfit will not necessarily motivate someone interested only in financial rewards. Validate hypotheses with actual owners.

## Recommended product

A Seeker heist league: a short campaign teaches the mechanics; weekly contracts supply the ongoing competition. The $10 buys game access and included content, with no additional payment per normal attempt. The small completion cashback should not be the new offer's headline. Existing 25-SKR contractual rewards remain honored; a new offer needs separate versioned terms.

- Campaign: 12 missions and unlimited retries, with a chosen earned courier cosmetic upon completion.
- Weekly league: unlock the basic board early (after mission 3), rather than withholding the main return loop until the whole campaign is finished.
- Completion: unlock optional Master Contracts with harder mechanical combinations, the earned Ghost Courier outfit, Master Thief title and a trophy phone. These awards cannot be purchased from the shop.
- Sold cosmetics: visually different from earned rank awards, same competitive stats. Do not sell ranked attempts, leaderboard multipliers, extra speed or a shortcut to an earned rank.

The $10 price is still a hypothesis requiring a convincing trial. Do not imply a profitable return on the pass.

## Completion and seasonal rewards

| Unlock | Specific example | Source of value | Dependency |
|---|---|---|---|
| Earned identity | Master Thief next to a verified .skr name and proof page | Visible proof of an achievement | Buildable in-house |
| Earned appearance | Ghost Courier cloak, extraction animation and trophy phone | Recognizable skill award; cannot buy the same variant | Buildable in-house; cosmetic only |
| New play | Master Contracts with blackouts, moving exits and coordinated guards | Additional game depth | Buildable in-house, needs fair level design |
| Historical recognition | Season 1 champion plaque; top-run replay in Hall of Fame | Lasting competitive reputation | Earned placement, not automatic for every finisher |
| Wallet value | Weekly SKR prizes for published winning ranks | Spendable reward with a defined budget | Funded pool, verification and applicable eligibility rules |
| Partner utility | Confirmed partner subscription credit, merchandise or event benefit | Value outside our game | Requires an actual agreement and fulfillment budget |

Do not promise official Solana Mobile points, an airdrop, token yield, a .skr domain we cannot issue, endorsements or partner benefits that are not secured. The title and trophy are app records, not investments or transferable NFTs. Make visible what is earned versus purchased.

## Weekly competition specification

Start small: one global board plus nearby ranks and a friends filter. No live lobbies or crews in the first version.

- Three new contracts available for the entire week. Every competitor gets identical rules, map seed and loadout per contract. Vary patrol timing, phone/exit placement and one distinct modifier; validate that every seeded route is solvable.
- Unlimited unranked practice. Five scored attempts per contract per week, chosen explicitly before starting. Same allowance for everyone; attempts cannot be bought. Permit finishing on any day instead of requiring seven consecutive check-ins.
- Use the best complete run from each contract. Normalize contract scores to a fixed maximum before adding them so one easy contract cannot dominate. Score completion, then objective performance with defined stealth/time tradeoffs; use total ticks and detections for published tie-breaks. Exact ties share rank and the relevant combined prize allocation.
- Show "Rank 34; 180 points to rank 30", personal-best ghost, remaining scored attempts, reset time and the next attainable cosmetic milestone.
- Reset weekly competition, retain campaign progress, cosmetics and historical records. Optional opt-in notification when a rival overtakes the player or a new week begins. Never require posting or tagging friends to claim a reward.
- At settlement, freeze standings, mark provisional winners, verify server replays and inspect anomalies, then publish final ranks and payout receipts. One prize entry per verified SGT identity; do not claim this eliminates multi-device farming or automation. Replay validation proves valid simulation, not human play, so top-run review remains necessary.

Current implementation gap: dailyMission rotates the same 12 levels and the manifest uses seed 0. There is no implemented weekly three-contract league, weekly attempt allowance, seasonal cosmetic entitlement or funded weekly payout schedule yet.

## Payment and reward accounting

Sign in once through MWA with the supported wallet; show verified .skr identity if available. Show the USD reference and exact SKR/SOL quote. One purchase, then no wallet prompts for movement, retries, scores or collecting in-game phones. Scores, inventory, replay verification and rank remain server-side. Purchases and actual SKR payouts are onchain. No custody of a player's entire wallet balance.

Weekly monetary prize proposal, illustration only (not funded): 5,000 SKR total; first 1,500; second 1,000; third 750; places 4–10 receive 250 each. Exactly 5,000 total. Announce the token amounts and eligibility before the week; USD is only a changing reference. Most players will not win a monetary prize. Lower attainable non-cash milestones are needed alongside top-rank prizes.

Reserve each pool from an approved marketing budget or confirmed sponsor funds before opening its rewarded week. Four such weeks require 20,000 SKR reserved; do not imply indefinite weekly cash rewards are funded by one-time purchases. Gross pass receipts are not net profit: subtract rewards, operating costs, refunds, fees and taxes where applicable. Cosmetic and future content revenue may support later events but is not guaranteed funding.

The existing backend wallet can pay prizes, with idempotent allocations, a maximum total liability and public payment receipts. Separate prize budget accounting from spendable operating funds even if one wallet holds both; a displayed wallet balance alone does not prove an unencumbered reserve. No custom contract means users still trust the operator to honor adjudication and payouts.

Real-token paid competition requires a country-specific eligibility/legal review before mainnet. A store listing of another prize game is not proof our model is permitted everywhere. The publisher policy requires compliance with applicable law and prohibits misleading claims. A free-entry sponsored league is an alternative if paid access plus monetary prizes creates an unsuitable launch requirement. https://docs.solanamobile.com/dapp-store/publisher-policy

## Minimal flow

Mission home (Campaign / This Week) -> brief -> play -> result and rank movement. Keep Wardrobe/Hideout secondary. League screen contains personal position, nearby rivals, three contracts, rewards and transparent settlement state. Checkout only when access is needed; receipt/claim lives under wallet. No wallet popup on every session.

Completion scene: 12th phone arrives on rack, Ghost Courier unlocked, verified Master Thief title added, Master Contracts revealed, clear CTA to this week's league. The default share card includes the player's chosen name, actual accomplishment and replay link; sharing is voluntary.

## Validation before expanding

Recruit 15–20 real Seeker owners with permission, covering reward-focused, competitive and casual players. This is directional testing, not a statistically representative survey. Observe an actual free trial and explicit test-price choice; do not equate devnet payment with real willingness to pay. Ask them to rank SKR prizes, an earned visible title, exclusive appearance and genuinely useful partner credit. Measure first-session completion, seven-day return, visits outside claim windows, attempts after a loss, rank engagement and paid intent. Predefine success thresholds with a meaningful sample before claiming PMF. Compare rewarded and unrewarded weeks transparently; never silently remove an advertised reward.

Build order: truthful stable checkout -> identity/SGT eligibility -> three replay-verified weekly contracts -> normalized scoring/attempt budget -> visible earned completion awards -> one funded devnet prize season and receipt flow -> physical Seeker testing and real playtest evidence.
