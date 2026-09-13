# Steal a Seeker — review guide

An Android stealth game for short runs. Recover virtual Seeker phones, avoid robot patrols, and escape after the theft alarm raises the guards' speed. The campaign has 12 missions across Warehouse, Rooftops and Powerworks/Vault.

## Review artifacts

- Protected-signature arm64 Android APK: `../releases/steal-a-seeker-judge.apk` (offline gameplay review).
- Devnet integration build: `../releases/steal-a-seeker-devnet.apk` (service configuration still required).
- Build provenance/checksums sit beside each APK. Build steps: `../docs/RELEASE.md`.
- Source: https://github.com/bluntbrain/steal-a-seeker-clockin (private). The owner must grant the organizer's confirmed GitHub reviewer identities access before submission. Do not make the repository public without instruction.
- Pitch: `steal-a-seeker-pitch.pptx`.
- Demo recording plan: `DEMO-SCRIPT.md`. A final physical-device + devnet-wallet demo remains a release gate.

## First run

Install the judge APK alongside any existing MVP. It opens Missions. Tap Continue for Quiet Pickup. Drag the RIGHT joystick. Stop beside the glowing phone and hold TAKE on the LEFT. The alarm makes mobile guards faster and updates them with your position. Break sight behind cover. A decoy lures nearby mobile guards to its landing ring after they lose sight of you. DASH spends 20 phone charge. Stay in the mint EXIT for one second.

The first mission gives dismissible tips; Settings can replay them. Completing missions unlocks the next. Inspect recovered phones in Hideout. After mission 12, view the completed collection, improve stars, or try the daily challenge.

Level 11 requires relays: lower-left relay → left door → middle room → right relay → upper-right door → phone. Reopen those relays on the return route and leave at the lower-left exit. Stop moving before ACT. Each opening lasts nine seconds. Full help is in Settings during that mission.

## What to distinguish

Browser commerce uses local playtest credits. The native game uses Mobile Wallet Adapter and a backend for signed sessions, devnet payment verification, entitlements and payout reconciliation. TEST SKR is a test asset with no monetary value. No mainnet purchase, investment return, NFT, or outside-player traction is claimed.

Daily runs use a standard loadout, UTC daily rotation and server replay verification. The best complete run per wallet ranks by score, then exact simulation ticks; exact ties share rank. Replay verification checks the submitted simulation, not whether a human played it. Browser daily results stay local.

The judge build bypasses only the local campaign gate through a compile-time flag. It cannot authorize purchases, settlement or ranked runs at the server. For online review, use the normal devnet build and a funded test wallet after the service is ready.

## Submission gates

Confirm portal deadline and judge GitHub identities with the organizer. Submit APK, accessible repository, a demo of no more than three minutes and pitch before the deadline. Final agreement locks edits; the builder must review it. Physical installation and the full devnet wallet round trip need recorded evidence. Winners must publish within the stated 30-day window. Eligibility, funding and KYC declarations belong to the builder.

The editable deck source is `build-pitch.mjs`. It uses the supplied local presentation runtime and original project assets. The deck includes a development-status slide; update that slide only after new evidence exists. The submitted app/build is reproducible independently of this optional presentation tooling.
