# Credits balance locations

All current balance chips use `src/components/CreditChip.tsx`: the Hideout pill, mint coin icon, 40px minimum height, 17px balance, rounded mint border and dark green background.

`CreditBalance.tsx` reads the economy balance and retains the existing purchase action and selection haptic. `CreditChip.tsx` is presentation only, so the claim screen can supply its animated balance without changing rewards.

| Surface | Owner | Behavior |
| --- | --- | --- |
| Missions / district map | `src/components/Hideout.tsx` | Opens Add Credits |
| Leaderboard / weekly league | `src/components/Hideout.tsx` | Opens Add Credits |
| Hideout / all collection tabs | `src/components/Hideout.tsx` | Opens Add Credits |
| Mission briefing | `src/components/Hideout.tsx` | Opens Add Credits |
| Campaign completion hub | `src/components/Hideout.tsx` | Opens Add Credits |
| Gameplay / paused run | `src/GameScreen.tsx` | Pauses first, then opens Add Credits |
| Phone inspector | `src/components/PhoneInspector.tsx` | Opens Add Credits |
| Add Credits | `src/commerce/CreditStore.tsx` | Display only; already inside the store |
| Skin checkout, Game Pass checkout and wallet panel | `src/wallet/WalletPanel.tsx` and `.web.tsx` | Display only; avoids interrupting checkout |
| Credit claim | `src/components/CreditClaim.tsx` | Animated displayed balance; flight destination follows its layout |

Display-only chips omit the plus sign; their visual style is otherwise identical. The unused legacy `HideoutBalance.web.tsx` also uses the shared presentation while retaining its own demo balance. Product prices, credit-pack quantities and legacy entry receipts are not account-balance chips.

Validation: TypeScript and complete web export passed. Sixteen existing store and haptic tests passed. Browser checks covered a 320px header, Add Credits, skin checkout and the claim demo completing from 250 to 310 credits. No wallet transaction was made.
