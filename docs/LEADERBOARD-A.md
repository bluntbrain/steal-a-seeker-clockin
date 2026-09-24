# Leaderboard A implementation

The selected concept is `design/visual-v2/leaderboard-options/a.png`.

## Visual implementation

- New transparent waving courier generated using the built-in OpenAI image tool. The canonical default courier and selected UI concept were supplied as references. Asset and exact prompt: `assets/leaderboard-v3/`.
- Soft mint lighting across the screen; mint gradient personal-position card with a luminous border; dark gradient ranking rows; restrained gold first-place row; silver and bronze medals; mint gradient primary action.
- One full-page scroll surface above a pinned Play weekly missions button and existing bottom navigation. No nested rankings scroll box. Existing shared wordmark and right-aligned credit balance are retained.
- Leaderboard navigation uses the three-bar mark in the selected reference.

## Data and behavior

The production UI still reads the existing `useLeague` state. It has no baked names, scores, balances, prizes or rankings. Local browser test scores remain labelled local and never get a fake global rank. Empty, loading and unavailable boards do not fabricate entries.

The list includes the top three, unlike the former podium layout. It retains server ordering and tied ranks. An off-page personal entry is added once so the player can find their own result. Nearby standings, share card, refresh, weekly missions, history, help and the existing pass flow remain connected.

## Verification

- TypeScript check, web export and Android Hermes bundle export.
- Eight targeted league-presentation, history and weekly-reset tests, including tied ranks, missing personal rows and no duplicate personal entry.
- Browser checks: 390×844 populated fixture; 360×640 long name and scrolling; 320×740 empty fixture; loading/unavailable button states; nearby toggle and pinned action callback.
- Actual game: leaderboard, weekly missions, history with saved attempts and How to play navigation.
- The comparison page is `/design/leaderboard-a/index.html`. Its sample-data fixture is separate from game storage.

This task does not build or install an APK. Android bundle export verifies compilation and packaged assets, not physical-device rendering or haptics.
