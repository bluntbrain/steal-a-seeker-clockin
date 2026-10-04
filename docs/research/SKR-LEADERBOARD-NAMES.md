# Wallet names on the leaderboard

Verified 4 October 2026 against AllDomains documentation and the published `@onsol/tldparser@1.2.1` package. Implemented in the API and campaign leaderboard. No scraping or wallet signature is required.

## Finding

Yes. `.skr` uses AllDomains naming infrastructure on Solana. A wallet can be reverse-resolved using the official SDK over a Solana mainnet RPC. No signature, transaction, or wallet permission is required for these public reads.

Official sources:
- https://docs.alldomains.id/protocol/developer-guide/ad-sdks/svm-sdks/solana-mainnet-sdk
- https://docs.alldomains.id/protocol/roadmap
- https://github.com/onsol-labs/tld-parser

## Verified API details

```ts
import {Connection} from '@solana/web3.js';
import {TldParser} from '@onsol/tldparser';
const parser = new TldParser(new Connection(process.env.SOLANA_RPC_URL!));

// Batch primary names. Result order matches addresses; missing names are null.
const primaryNames = await parser.getMainDomains(walletAddresses);

// Fallback when the primary name is missing or isn't a .skr name.
const owned = await parser.getParsedAllUserDomainsFromTld(walletAddress, 'skr');
// 1.2.1 returns [{nameAccount: PublicKey, domain: 'example.skr'}].
// IMPORTANT: pass 'skr', not '.skr'; domain already contains the suffix.

// Forward-check each chosen candidate, including NFT-wrapped ownership.
const owner = await parser.getOwnerFromDomainTld(owned[0].domain);
const valid = owner?.toString() === walletAddress;
```

The published package differs from some older documentation examples: `getMainDomains` returns `(string | null)[]`, and owned-domain rows already contain the full domain. Do not append `.skr` a second time. `getOwnerFromDomainTld` checks the name record's `isValid` and follows NFT ownership; comparing the raw record owner would reject wrapped domains incorrectly.

Owning a Seeker does not prove that a particular connected wallet has a .skr name. A primary name may belong to another TLD, and users may hold their name in a different wallet.

## Implemented integration

1. Add a server-only resolver alongside `server/campaign-service.ts`. Keep RPC credentials server-side. Pin the tested SDK version.
2. Resolve uncached leaderboard wallet addresses with the batch primary-name method. Accept only `.skr` candidates whose current forward owner matches the wallet.
3. For wallets without a verified primary `.skr`, query owned `skr` names. Verify candidates; if multiple exist, use a stable alphabetical choice. Later we can offer a user-selected identity.
4. Cache positive results for roughly 24 hours, missing names for 15 minutes; deduplicate concurrent lookups. Keep RPC errors distinct from a verified absence. Refresh in the background and put a timeout/concurrency cap on lookups.
5. Return an optional `displayName` with each leaderboard row. Keep the wallet as the stable identifier for ranking, rewards and personal-row matching. Render plain text in `src/campaign/CampaignBoard.tsx`, with truncation and shortened-wallet fallback. The current API exposes only the campaign leaderboard; no separate weekly ranking response exists to decorate.
6. Show the leaderboard immediately even when the RPC is unavailable. Never hold scores behind a slow name lookup. A stale cache is a display label, not proof of current ownership for financial actions.

Tests before shipping: primary .skr; primary other TLD; owned .skr without primary; multiple names; wrapped name; invalid/expired/transferred name; no name; malformed wallet; RPC timeout/rate limit; cache hit and concurrent requests; long/unicode names; campaign ranking stays unchanged; binary SDK account decoding uses the actual installed dependency.

## Operations and verification

- `server/wallet-names.ts` owns resolution and the bounded, process-local cache. Restarting the API clears that cache; no database migration is needed.
- `SKR_NAMES_ENABLED=false` disables resolution. Default: enabled.
- Optional server-only `SKR_RPC_URL` chooses a mainnet RPC. Otherwise mainnet deployments use their existing RPC, devnet deployments use `MAINNET_RPC_URL`, and the final fallback is the public mainnet RPC. Never put private RPC URLs in `EXPO_PUBLIC_*` variables.
- Positive names cache for 24 hours, confirmed absence for 15 minutes, failed reads retry after 30 seconds. Name labels can lag an ownership transfer by the positive cache duration. Wallet addresses still determine identity, rank, and rewards.
- At most 20 addresses per batch, three concurrent wallet lookups, eight candidate verifications per wallet, eight seconds per batch, 500 queued addresses, and 2,048 cached results. Successfully resolved names survive a partial batch timeout.
- Scores return immediately. `namesPending` makes the campaign screen refresh every three seconds, up to ten times. Manual refresh starts a new polling window. Outages keep address labels and do not block gameplay or scores.
- `@onsol/tldparser@1.2.1` requires `borsh@2.0.0`. Pin both in root development and server production manifests. The production manifest also pins the SDK peer `buffer@6.0.1`; its lockfile is generated with peer dependency resolution enabled for clean Docker installs. Without the explicit Borsh pin, this repository resolved the SDK against Web3's legacy Borsh 0.7 and threw `schema.get is not a function` for real owned domains. A binary account decoding regression test covers this.
- Read-only live smoke command: `node --env-file=.env.server --import tsx scripts/check-skr-names.ts` (optional wallet arguments). It prints public addresses and names, never the RPC URL or credentials.
- Mainnet smoke on 4 October 2026 resolved three current leaderboard wallets in 1.35 seconds: `irvita.skr`, `bokolono.skr`, and one confirmed absence. Owners were forward-checked. This is a point-in-time observation, not a permanent identity assertion.

Official SDK calls are server-only. The mobile bundle imports only the pure display helper. No gameplay, scoring, transactions, or purchase behavior changes.

Production verification: Railway deployment `6a4b1049-fb51-4879-b79c-a07e4b4c9701` passed its health check on 4 October 2026. The public board resolved five of six wallets and returned `namesPending: false`. Browser interaction confirmed the names and address fallback. The local preview explicitly proxies the public leaderboard without forwarding authentication.
