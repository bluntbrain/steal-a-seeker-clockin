# Phantom / MWA investigation — 2026-09-13

## What was checked

Compared `src/hooks/useWallet.ts` and `src/polyfills.ts` on [SolScan's feat/jupiter-swap branch](https://github.com/bluntbrain/solscan-react-native/tree/feat/jupiter-swap) with our installed Wallet UI 4.3.0 and MWA Kit implementation.

Both use native MWA `transact` followed by wallet authorization. SolScan uses web3.js, explicit legacy `cluster`, and signs transactions then broadcasts through its RPC. This app uses Solana Kit, current `chain: solana:devnet`, cached authorization, and wallet sign-and-send. The API shapes differ; that alone is not a broken integration. Our addresses are decoded from base64 by Wallet UI; the cache contains JSON-compatible string addresses. Native crypto loads before the app. We did not copy SolScan's `skipPreflight: true` or add blind payment retries.

Our purchase flow has three different actions:
1. Connect: authorize the wallet and show its address. Cached authorization can return immediately without a new prompt.
2. Continue: obtain and sign the server challenge, verify it with the backend, then quote the purchase. Sign-in does not spend tokens.
3. Pay: review and approve the TEST SKR transfer. Backend verification grants the purchase.

Confirmed gaps addressed: generic connection errors masked the actual failed phase; no detailed transport/auth/cache/API trace; payment did not explicitly reject an account change during reauthorization. Wallet UI also throws when an authorized wallet omits optional `sign_in_result`. We now fall back to `sign_messages` for the exact challenge only in that case, within the same MWA session. Declines and transport failures never trigger fallback. The server still verifies the signature, domain, nonce, expiry and wallet. No authentication bypass.

## Device finding — September 14

The device trace shows `/auth/challenge` returning HTTP 200, `mwa.sign-in.transport-ready`, then a cached authorization request failing immediately. Inside the session the error had native code `JSON_RPC_ERROR`; after the session ended it became protocol code `-1`. No fresh authorization request appeared.

Installed MWA protocol 2.3.0's native request handler returns `invoke()` without awaiting it inside its try/catch. Asynchronous native rejections therefore reach the callback before conversion to `SolanaMobileWalletAdapterProtocolError`. Wallet UI's `instanceof` check cannot recognize them and skips its fresh-token retry. The app now normalizes only this native JSON-RPC error at the authorization boundary, using the SDK's own protocol-error class. Wallet UI can then perform its existing one-time retry without the cached token. No app data or purchases are erased. Other error codes, including declined signatures, retain their meaning.

This establishes the missed retry, not the reason Phantom originally rejected that cached token. A fresh device approval is still needed to verify recovery. Automated backend tests do not prove physical Phantom integration.

Further inspection also found protocol 2.3.0 already supplies a SIWS fallback for fresh `authorize` requests. The app fallback covers a missing result that reaches Wallet UI, including legacy cached reauthorization. Neither bypasses backend signature checks.

## Capture

Install the newly built `releases/steal-a-seeker-devnet.apk` without clearing app data. Open the app, then:

```sh
python3 scripts/wallet-logcat.py EYHUYXMZ55SCMNW4 > /tmp/seeker-wallet.jsonl
```

Tap Connect and approve in Phantom. Return, tap Continue, approve sign-in if requested, then review the quote before Pay. Reproduce the failing step once. Stop capture with Ctrl+C. Never repeatedly pay to resolve an unclear result; use Restore purchases.

Without a computer: after a connection error, use **Share diagnostic log**. Otherwise long-press the wallet sheet handle or **Restore purchases** to open the OS share sheet with the report. No log is sent automatically. The in-memory report retains the latest 200 events until the app process exits; capture logcat for process-death investigation.

## Reading the trace

| Last event | What it establishes / investigate next |
|---|---|
| `mwa.connect.start` without `transport-ready` | Failure before the local MWA connection: wallet launch, native crypto/transport, or wallet availability. |
| `mwa.authorize.request` without `response` | MWA transport opened; authorization did not return. Check error code and user approval. |
| `mwa.authorize.response` | Wallet returned an account count and whether a SIWS result exists. |
| `cache.write` failure | Wallet returned, but local secure persistence failed. |
| `account.selected` connected=true | Wallet connected. Returning here is normal; Continue starts backend login. |
| `/auth/challenge` failure | API/network issue before wallet sign-in. |
| `mwa.sign-in.message-fallback` | Wallet omitted optional SIWS result; explicit message-signing fallback started. |
| `/auth/verify` failure | Signed login returned, but backend verification failed. HTTP status is recorded. |
| `mwa.sign-and-send.ok` | Wallet returned a transaction signature, not proof of purchase fulfillment. |
| `/transaction` or `/reconcile` failure | Restore purchases; transaction may already be on-chain. |
| `app.background` / `app.active` | Lifecycle observation only; does not prove cancellation or approval. |

Every step has a start ID, elapsed duration and matching success/failure; a waiting event fires after 12 seconds without cancelling a still-running wallet approval. Errors log a safe category and numeric code/status only. No keys, full addresses, tokens, signatures, signed messages, request bodies, raw SDK errors, deep links or association URLs are recorded by these diagnostics.

## Validation

TypeScript and eleven focused tests cover log privacy, bounded history, error propagation, SIWS fallback, cancellation, changed accounts and malformed signed messages. The device has reached the MWA transport; successful fresh authorization, sign-in, purchase and restore remain to be checked after this fix.

References: [MWA TypeScript API](https://docs.solanamobile.com/get-started/react-native/mobile-wallet-adapter), [MWA 2.0 optional sign-in and sign_messages fallback](https://solana-mobile.github.io/mobile-wallet-adapter/spec/spec.html).

## Signature decoding finding — September 14

The device confirmed fresh authorization succeeds and returns `sign_in_result`. The next failure was HTTP 401 at `/auth/verify`, with diagnostics showing an 88-byte signature. MWA returns base64 strings; Wallet UI 4.3.0's `convertSignInResult` uses `stringToUint8Array`, which UTF-8 encodes those strings. An encoded 64-byte Ed25519 signature becomes 88 ASCII bytes.

The app now captures the original authorization response and explicitly base64-decodes the signature and signed message. It checks the returned address and 64-byte signature length. Backend verification is unchanged. New tests use real Ed25519 signatures and the same SIWS verifier as the server; the old conversion fails and the corrected conversion succeeds. Tampered signatures and changed nonces still fail.

## Branded identity domain

Requested identity: `https://stealaseeker.bluntbrain.com`. Railway custom domain ID `5fa8140a-168e-4838-9bb5-4e5673fd9c63`, target port 8790 on the existing API. DNS CNAME `stealaseeker` → `hexu02ke.up.railway.app`. Set native `EXPO_PUBLIC_APP_IDENTITY_URI` and server `APP_IDENTITY_URI` together after DNS/HTTPS verification. Clear only the old MWA authorization on identity change; keep purchase/progress data. API traffic can retain the working Railway endpoint independently of the branded identity.

Domain activation verified: CNAME and TXT ownership records resolve; HTTPS `/health` and `/app-icon.png` return 200. The deployed challenge now returns `stealaseeker.bluntbrain.com` and `https://stealaseeker.bluntbrain.com`. A fresh ephemeral test wallet signed that live challenge; decoding the base64 response through the app helper produced a 64-byte signature, `/auth/verify` returned 200, and the test session was logged out. This is an API/encoding check, not a claim of a successful physical Phantom approval.

The matching APK (SHA256 `f6daba200b7017fcfcd3baa4a04aa38369433dfbc12070245d2f92c7118445ce`) was installed with `adb install -r` on Realme RMX5033 and launched. Client checks: 97 tests pass. Server checks: 53 tests pass. Identity-scoped authorization cache requests a new connection without deleting progress, purchases, or the wallet's keys.

## 2026-09-14: dropped SOL payment / restoration loop

Phone logs recorded a successful MWA sign-and-send return and HTTP 200 when attaching its signature. Those events did not prove chain execution. Devnet signature history returned null; order reference history was empty; account had no campaign entitlement. The wallet's pre-top-up SOL balance was 0.07, below the 0.0987 SOL quote. Insufficient balance is a likely contributor, but the original wallet broadcast failure was not returned to the app, so its exact cause is unproven.

Two application defects compounded this:

- `restore()` always said purchases were restored, even with an empty entitlement list.
- Expired approval cleanup cleared the order authorization but left its callback attempt pending. The next reconciliation checked the dropped signature, received null and changed the order back to verifying, now without an authorization to expire.

Fix: expire pending attempts atomically when finalized expiry checks release an unpaid quote; ignore stale pending responses for expired attempts; still retain late real payments for review. Reconciliation itself can expire an abandoned approval, without preparing a replacement. Restoration reports real entitlement state, ignores expired empty quotes and finds active payments even if the saved local pointer is missing. Partial RPC failures do not discard successfully restored purchases.

Historical affected order `e91745b1-2d47-45dc-ab4f-6dd88053911f` was repaired without granting access or deleting history. Checks: devnet genesis, no signature in transaction history, empty finalized reference history, no entitlement, null authorization, finalized block after quote expiry and more than 150 block heights beyond that block. Evidence: finalized slot 497902365, current height 485471136, proof block height 485470866 / timestamp 1789333450. Its attempt is expired and order remains an expired quote. Follow-up read confirmed no resurrection.

Sent 0.2 devnet SOL to the user's supplied wallet, transaction `4eqUCtqgt4qKHHy38s2FFzZQYGbt14Uxp4QZ3aZGd3FQDYA93UE89XippPgLJrZezFLAtxhv2rUb6oPLxbWMEkjA`; resulting balance 0.27 SOL. Public faucet request failed; funds came from the devnet test treasury.

## Comparison with the user's working SolScan app

Cloned [feat/jupiter-swap](https://github.com/bluntbrain/solscan-react-native/tree/feat/jupiter-swap) at `6af9c2f9c0d0c06d0feaf7b7da35d51950e0af5b` into `/tmp/seeker-solscan-reference`. Its `src/hooks/useWallet.ts` authorizes and calls `signTransactions`, exits MWA, waits 1 second, submits serialized bytes with up to three attempts, then confirms the SOL transaction.

Steal a Seeker now follows that sequence using its existing Kit adapter, for both native SOL and TEST SKR. It preserves the server's amount, memo, reference and blockhash. Unlike the reference's `skipPreflight: true`, preflight stays enabled. Changed message bytes / missing signatures fail before broadcasting. Network retries reuse identical signed bytes. RPC acceptance is followed by confirmation checks; an uncertain send retains its locally derived signature for backend reconciliation. Finalized verification alone grants campaign access. After payment, the sheet briefly polls for fulfillment to open the campaign automatically.

Stages: `mwa.sign-transactions`, `mwa.payment.signed`, `payment.rpc.send.N`, `payment.rpc.confirmed`, `payment.rpc.preflight-failed`, `payment.rpc.expired`, `payment.rpc.submission-uncertain`, `commerce.restore.result`. No keys, auth tokens, signed payloads or arbitrary wallet errors are logged.

Validation: 109 client tests and 56 server tests pass. Real app-submission helper succeeded for both currencies and fulfilled cosmetic purchases on deployed devnet API; see `verification/wallet-app-submit.json`. This uses automated test-wallet signing; physical Phantom signing with the new build remains to be tested.
