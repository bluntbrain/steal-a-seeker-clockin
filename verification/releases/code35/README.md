# APK code 35

Requested: latest signed Android APK for testing. Version 0.3.32, code 35, arm64, mainnet configuration.

Includes the current workspace, including the redesigned campaign maps through level 9, knife attacks, coin effects and fair guard pursuit. The build receipt records source hashes and pre-existing uncommitted changes; this is not a clean-checkout build.

Client validation immediately before packaging: 395 tests passed, TypeScript passed, browser smoke test for level 9 passed. These checks are not Android runtime tests.

No Android device was attached during this build. No device installation, physical performance test, payment, store upload or backend deployment was performed.

The public backend health endpoint reported mainnet healthy. Its daily endpoint advertised older rules 6def64a8028a9aacdd926441f15e07135318a88609042d9a17a635b94367d354, while this client's campaign rules are dccdef3f350858895875bb13f786e3e40cbcaa55ce3c91c9acb1f11e8b3da71b. The daily hash alone does not list every installed historical bundle; production acceptance of new campaign replays remains unverified. Validate or deploy the matching backend rules before public release.
