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
