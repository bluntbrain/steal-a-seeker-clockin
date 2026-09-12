# Campaign paywall redesign — 12 September 2026

## References and evidence

- [RevenueCat: four redesign case studies, party game example](https://www.revenuecat.com/blog/growth/paywall-redesigns-case-studies#case-study-3-optimizing-an-onboarding-paywall-for-a-party-game-app). The author reports 31% more install-to-trial conversions and 64% higher revenue after multiple changes, including a shorter layout, fewer choices and playful art. This is a bundled redesign; it does not isolate the effect of illustration or copy.
- [Superwall: Stompers](https://superwall.com/case-studies/stompers). The vendor reports over 16% improvement in overall conversion for a single-page approach versus a multi-page flow. The page also discusses different plan prices; it does not publish enough experiment detail to generalize the result to this game.

These are vendor-reported subscription case studies, not independent proof or forecasts for a one-time token purchase. We borrow clarity and hierarchy, not their subscriptions, trial toggles, discounts or performance claims.

## Implemented design

The shared React Native Paywall now has original courier escape key art, one short headline, a three-column mission/retry/daily summary, a contrasting cream pass card and a single mint primary action. The amount, currency and one-time payment wording stay together. The completion rebate remains legible before approval. Offer, review, cancelled and trial-used states share the same visual system.

Full price remains 100 TEST SKR, with a fixed 25 TEST SKR completion rebate. In the browser these are local credits. Outfits are separate. No new discount, earnings claim or timer. Payment execution, campaign ownership and rebate verification are unchanged.

Ordinary phone layouts do not scroll. Artwork yields space first; compact error states remove the illustration to keep payment terms and controls visible. Short landscape and large system text have a scrolling accessibility fallback. No text is truncated to fit a purchase screen.

## Artwork

`assets/paywall-v3/courier-heist.png`: original generated key art, using our existing courier portrait as the identity reference. Built-in image generation, 1536×1024. The image is illustrative; it is not an in-game screenshot. UI copy and buttons are real React Native components, not flattened into the image. No third-party paywall imagery is bundled in the app.

## Review and verification

- `/design/economy/index.html`: before/after screenshots, research links, offer/review/trial previews.
- `/design/economy/paywall/index.html`: renders the actual shared component with inert callbacks, explicitly labelled as a design preview. It cannot charge, grant access or modify any game save.
- Add `?mode=devnet`, `?stage=review`, `?stage=cancelled`, `?stage=cancelled&used=1`, `?error=1` or `?busy=1` to inspect states.
- `scripts/playtest-paywall-layout.cjs`: responsive fit and enabled/disabled controls across local/devnet, five viewport sizes and six states.
- `scripts/playtest-economy-v2.cjs`: actual local purchase, cancellation, one-attempt trial, cosmetic purchases and restore regression.

Android hardware and live devnet approvals still need separate validation. This change does not establish a conversion lift.

## First conversion experiment

Before mainnet, instrument distinct offer views, purchase taps, wallet approvals/rejections, confirmed server entitlements, trial starts and first-mission completion. Measure confirmed purchases per unique eligible offer viewer, with payment errors and early abandonment as guardrails. Keep price, audience and traffic source stable when comparing artwork/copy. Do not count local credits or repeat renders as real conversions. Decide a sample target from observed baseline volume; no invented significance threshold or projected revenue.
