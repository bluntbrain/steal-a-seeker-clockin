# Android release 0.3.3

Package: **com.bluntbrain.stealaseeker**, versionCode **6**. This is the current APK for testing and the first store submission, replacing 0.3.2. The package, existing Android signing key and already-minted App NFT are unchanged.

APK: `releases/steal-a-seeker-mainnet.apk`.
SHA256: `6380e0029c68be7872c37bdde6e22c53a22f5eb2f7b813f9df550906e24a10a2`.

The store now reads credit-pack targets and outfit/trail credit costs from the backend. Game Pass settings were already server-controlled. A changed redemption price requires a new review before debiting credits. Existing token-payment orders preserve their original price. See [PRICING.md](PRICING.md) for all Railway variables and exact examples.

24 targeted pricing/store/checkout tests and all 73 backend tests passed. TypeScript, rules manifest, signed Android build and signature verification passed. Deployment/device receipts are in `publishing/0.3.3/status.json`. No Mainnet payment was approved by this test run.

For signing-key location, website URLs, publisher mint and release process, see [the preceding release record](PUBLISHING-0.3.2.md). Use this 0.3.3 APK in Releases → New Version after phone testing. No release has been submitted for review.
