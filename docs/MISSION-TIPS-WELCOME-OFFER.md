# Mission education and welcome offer — v0.3.17 (20)

## Player flow

Campaign Play/Continue and Next Mission now show one animated, skippable tip before the run. Back returns to the mission menu; Skip and Let's Go start the selected mission. Retries restart immediately. The old run is paused while the tip is visible; keyboard shortcuts cannot resume it behind the tip. Existing scene-ready loading still gates the new map.

Each of the twelve missions has a short lesson tied to its authored mechanics. Mission 2 introduces the twelve Seeker designs and Hideout → Phones. Later lessons cover scout drones, alarm reinforcements, cover, Heavy guards, patrol routes, two phones, switches, timed exits, crossfire and the Warden. Existing phone and courier assets are reused. Reduced-effects mode disables the animation.

Weekly missions use their current contract name, modifier and objective. The run ticket is created only after Let's Go or Skip, not while the user reads or backs out. Failed starts keep the tip and error visible; the existing action lock prevents duplicate starts.

## Welcome offer

The opening Game Pass screen reads the public backend catalog. The approved comparison is twice each current backend price, explicitly labelled **Planned regular price**, crossed out above the actual welcome price. It is not labelled as a historical price. Both SKR and USD targets follow catalog changes. The actual SOL quote and network fee are still obtained in checkout. This change does not raise prices or schedule an offer expiry.

If the catalog is unavailable, the comparison is omitted and the screen says Live price at checkout. Browser preview uses a read-only public catalog proxy; it cannot proxy payments or authenticated requests.

## Verification

- TypeScript, 243 game tests and rules compatibility check passed.
- Web export passed.
- Browser checks at 390×844 and 360×640: mission 1 tip fits, collection art and mission 2 lesson render, Skip opens the correct map, replay restarts without a tip.
- Weekly Ghost Freight tip used this week's Double Haul objective; Back left the displayed 4/5 chances unchanged. No live ranked attempt or payment was submitted.
- Public catalog test pricing displayed 1 SKR / approximately $0.10 in SOL, with planned comparison 2 SKR / $0.20.
- Signed Mainnet APK build and certificate verification recorded alongside the release artifact. Physical Android testing and store upload remain unperformed.
