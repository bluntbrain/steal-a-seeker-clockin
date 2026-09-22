# Connect wallet to claim

Native campaign wins now show one “Connect wallet to claim” button when disconnected. It uses the existing Mobile Wallet Adapter connection, preserves the completed mission across guest-to-wallet connection, requests sign-in for replay verification, and automatically animates confirmed credits. Cancellation keeps the run available and the button retryable. Browser playtest remains an explicit local demo.

Guest native wins are queued for verification, not newly awarded as local inventory. The guest importer and foreground claim deduplicate by authenticated session plus replay payload and share the original award receipt. Both queue namespaces are cleaned. Switching away from a connected wallet still resets its game. Tutorial checkpoint runs with no verifiable replay continue with zero credits.

Validation: TypeScript passed; 230 tests passed including concurrent guest import/connected claim; rules manifest check and web export passed. Browser interaction verified the single CTA, disabled connecting state and automatic completion using an explicitly simulated connection. Layout inspected at 390 x 844. No physical Android device was available; actual Phantom connection, sign-in and receipt flow require device testing.

APK: releases/steal-a-seeker-mainnet-v0.3.11-code14.apk
Package: com.bluntbrain.stealaseeker
SHA256: 0e85a54f93aee38d03a3c78f02308762e6070410faf5fc5b6f84cf8fb85aad46
Signing certificate SHA256: 4fa3e9942238f110824fb67dc99438fc1d70ef48a273e4a79331d5f8a1e1e913

Credits are game inventory persisted by the backend. Claiming them does not send a token payment.
