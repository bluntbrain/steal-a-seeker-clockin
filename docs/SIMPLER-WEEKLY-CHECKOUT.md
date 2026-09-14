# Simpler weekly play and checkout

Implemented 14 September 2026. This is a wording and checkout navigation change; prices, five-chance limits, verification and rewards are unchanged.

## What a new player needs to understand

“Three new missions each week. Practice as much as you want. You have five chances per mission to set a score. We add your best score from each mission to rank you.”

The UI now uses **Missions / Rankings / Past weeks** inside Leaderboard. Contract cards say **No score yet** or show the best score. Mission details offer **Practice — unlimited** and **Play for score**. The scoring confirmation explains that losing or leaving uses a chance. Finishing all three for score earns Ghost Courier permanently. The footer explicitly says there are no cash or token prizes.

## Tap audit

Count from the pass screen, with SKR selected. These are code-path counts, not a recorded payment on a fresh Phantom installation. Wallet account selection, unlock/biometrics, extra wallet warnings, network errors and price changes may add steps.

| Player | Previous | Updated |
| --- | --- | --- |
| First purchase, no connected wallet/session | About 7 | About 5 |
| Connected wallet, valid saved sign-in | About 4 | About 3 |
| Choosing SOL instead of default SKR | +1 | +1 |

First purchase now:
1. Continue on the game pass opens the checkout and Phantom connection.
2. Approve connection in Phantom.
3. Tap Pay with the exact token amount displayed (change to SOL first if desired).
4. Approve sign-in if there is no valid saved session.
5. Approve the payment in Phantom. Verified access opens the game automatically.

Removed: the separate Connect button after choosing the pass, and the separate Review button before Pay. Opening the normal wallet panel does not automatically open Phantom. Browser local credits now use one explicit Unlock game button displaying the price; they do not simulate native wallet approval counts.

## Payment protections retained

- A fresh quote can continue directly only if SKU, token, atomic amount, decimals and USD amount exactly match the price the player tapped.
- A changed price is displayed and requires another tap. Never silently increase a charge.
- Restored ownership skips a new purchase.
- Existing pending payments continue through reconciliation/resume, not a new automatic charge.
- Duplicate taps remain locked while a checkout operation is running.
- The wallet still approves every transaction. Access still requires server verification.

## Validation

TypeScript passed. 117 app/shared tests passed, including exact-price continuation, changed-price/method/SKU rejection and protection against automatically paying prepared/submitted/fulfilled orders. Browser mobile layout and practice/scoring navigation checked separately. Actual new-user Phantom payment approval remains a hands-on device check; no payment was sent from the user's wallet for this change.
