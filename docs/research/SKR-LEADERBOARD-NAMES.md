# Wallet names on the leaderboard

Verified 4 October 2026 against AllDomains documentation and the published `@onsol/tldparser@1.2.1` package. Research only: the live leaderboard has not been changed to resolve names yet.

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

## Smallest reliable integration

1. Add a server-only resolver alongside `server/campaign-service.ts`. Keep RPC credentials server-side. Pin the tested SDK version.
2. Resolve uncached leaderboard wallet addresses with the batch primary-name method. Accept only `.skr` candidates whose current forward owner matches the wallet.
3. For wallets without a verified primary `.skr`, query owned `skr` names. Verify candidates; if multiple exist, use a stable alphabetical choice. Later we can offer a user-selected identity.
4. Cache positive results for roughly 24 hours, missing names for 15 minutes; deduplicate concurrent lookups. Keep RPC errors distinct from a verified absence. Refresh in the background and put a timeout/concurrency cap on lookups.
5. Return an optional `displayName` with each leaderboard row. Keep the wallet as the stable identifier for ranking, rewards and personal-row matching. Render plain text in `src/campaign/CampaignBoard.tsx`, with truncation and shortened-wallet fallback. Apply the same resolver to weekly ranking responses.
6. Show the leaderboard immediately even when the RPC is unavailable. Never hold scores behind a slow name lookup. A stale cache is a display label, not proof of current ownership for financial actions.

Tests before shipping: primary .skr; primary other TLD; owned .skr without primary; multiple names; wrapped name; invalid/expired/transferred name; no name; malformed wallet; RPC timeout/rate limit; cache hit and concurrent requests; long/unicode names; campaign and weekly ranking stay unchanged.

## Current limits

This research verifies the official API and package implementation, not a successful live resolution of one of our leaderboard wallets. Production RPC access, latency and rate limits still need an integration test. There is currently no server-side `.skr` resolver in the campaign leaderboard response.
