# Steal a Seeker — current review guide

A solo Android stealth-action game. Tap to move, use cover, tap robots to approach and slash, collect a virtual Seeker and escape the alarm. Twelve free campaign missions span Warehouse, Rooftops and Powerworks. Gameplay uses React Native and 2D Skia, not a WebView.

## Build and source

- Current signed build: 0.3.4 / versionCode 7, package com.bluntbrain.stealaseeker.
- APK: ../releases/steal-a-seeker-mainnet.apk. The local APK is ignored; provide it separately through the submission portal. Its adjacent JSON records hashes/configuration.
- [Build and signing instructions](../docs/RELEASE.md). Reviewers need the APK and source, never the private release key.
- Source: https://github.com/bluntbrain/steal-a-seeker-clockin (private). Grant the organizer's confirmed reviewer identities access before submission.
- [Current tutorial audit](../docs/TUTORIAL-AUDIT-2026-09-17.md).

## First run

Open Missions and Continue. No wallet or payment is required. The first room teaches movement, cover, knife takedowns, dodging an aim line, phone collection and extraction through guided taps. Settings or the pause screen can replay the tutorial. Mission completion unlocks the next room and awards non-transferable credits. Three stars on a first clear earns 60 credits; repeat clears do not farm the same reward. Use credits in Hideout for outfits or the cosmetic escape trail. Phone collection/inspection is separate from gameplay.

## Weekly league and commerce

Three shared missions are available per week. Practice is unlimited. A Game Pass unlocks five ranked attempts per mission; no extra attempts can be bought. The best complete run per mission contributes to rank. Server verification replays inputs and applies the issued manifest; it does not prove a human played them. Bought cosmetics do not improve ranked performance.

The native app uses Solana Mobile Wallet Adapter for authentication/signing, plus a backend that verifies finalized payments, grants entitlements/credit packs and stores ledger entries idempotently. Purchases are Mainnet and require the user's wallet approval. The existing service currently has TEST_PRICING enabled; inspect the actual quote and network fee before approving. Browser purchases and results are local demo state and transfer no tokens.

Weekly token prizes are not active. The old campaign 25 SKR rebate is not included in new purchases. Do not advertise a payout, investment return or live store approval. The App NFT mint identifies the publisher listing; it is not a player collectible.

## Publishing status and final submission

The Mainnet App NFT is minted for com.bluntbrain.stealaseeker. An App NFT mint is not APK release approval. Upload the current APK and complete the release review in the publishing portal.

Refresh the existing pitch and demo script before submission: their earlier economy/control descriptions are historical. Record the current physical-device tutorial and MWA flow, then provide the functional APK, accessible repository, three-minute demo and presentation before the official deadline. The builder must check eligibility declarations and the final submission agreement.

Physical install and cold launch pass for 0.3.4. The phone was locked during the latest audit, so a full physical touch/audio/Phantom walkthrough remains unverified. See the tutorial report for the exact automated and browser checks completed.
