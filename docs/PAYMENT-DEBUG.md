# Payment integration: current flow

## Source checked

Cloned the official repository at `/tmp/seeker-official-mwa-reference`, commit `2be726c075e8114e2e38f2395ead8b42537c309c`:

- [Official MWA repository](https://github.com/solana-mobile/mobile-wallet-adapter)
- [React Native sample](https://github.com/solana-mobile/mobile-wallet-adapter/blob/2be726c075e8114e2e38f2395ead8b42537c309c/examples/example-react-native-app/components/RecordMessageButton.tsx)
- [SDK Web3 wrapper](https://github.com/solana-mobile/mobile-wallet-adapter/blob/2be726c075e8114e2e38f2395ead8b42537c309c/js/packages/mobile-wallet-adapter-protocol-web3js/src/transact.ts)

The earlier SolScan reference remains cloned at `/tmp/seeker-solscan-animations-reference` (branch `feat/animations`, commit `41fda56c54f807980d4beab2d7aebb982e9de32c`). The active send flow now follows the official MWA sample's wallet-managed submission.

## Confirmed failure in the prior build

USB Android logcat captured successful authorization and signing, followed by `payment.web3.changed.instruction-count`. The original instruction prefix passed comparison, but the wallet returned extra instruction(s). Our custom validator refused to broadcast it. No `send` stage was reached. A read-only Mainnet database check found zero receipts for the test wallet. We have not identified the extra instruction's program, so do not attribute it definitively to priority fees or claim the SDK malfunctioned.

## Current sequence

1. Fetch a server-priced order and prepare its Mainnet transaction.
2. Open an official MWA session; authorize the configured chain and app identity.
3. Verify the authorized wallet and request `wallet.signAndSendTransactions` once.
4. Phantom presents the payment, signs and submits using its network implementation.
5. Decode the Web3 wrapper's base58 signature. Wait for Android foreground and network resume.
6. Attach the signature to the order. The backend verifies finalized transfer amount, payer, token, recipient, reference and memo; only its receipt grants access.

No local second broadcast or sign-only fallback remains. SDK submission success alone is not an entitlement. The superseded local broadcast and returned-message validator files were removed.

## Recovery

A prepared order may have been sent even if the callback was lost. The app shows **Check payment**, never an automatic second approval. Reconciliation scans finalized reference history. While the original blockhash is live or RPC history is unavailable, it preserves the lock. After finalized blockheight exceeds the transaction lifetime and no payment is found, it clears the abandoned approval without creating another one. This no longer waits for the longer price quote expiry. A later explicit Pay prepares a fresh request. Existing completed transfers restore access instead.

## Verification

- 129 app/shared tests passed.
- 64 backend tests passed, including dropped callbacks, finalized expiry and entitlement recovery.
- TypeScript passed; Android compiled and installed on Realme.
- API deployment `6f02fb9f-b567-4e98-bbf1-9ac587f1e1c2` succeeded; Mainnet `/health` returned `ok: true`.
- APK SHA-256: `93feb9cc270e7a3b4acea783a6540b0772810951d14748c343ad02d845cc45c2`.
- Physical-device Mainnet purchase result: awaiting the next user-approved attempt.

The release metadata step initially encountered deleted tracked source files after the APK compiled. The script now skips missing files; metadata was regenerated from the completed APK and current source without rebuilding unchanged app code.
