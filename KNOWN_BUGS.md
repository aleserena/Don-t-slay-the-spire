# Known Bugs

This file tracks known bugs in the game that need to be fixed.

## Known Bugs

### Card Mechanics
These cards need a mechanic of their own. They are listed in `src/data/__tests__/dataConsistency.test.ts`, which fails if an entry is fixed but still listed.
- True Grit does not exhaust a random card from the hand
- Battle Trance does not stop further draws this turn
- Perfected Strike does not count Strikes in the deck
- Entrench does not double Block
- Immolate does not add a Burn
- Reaper does not heal for the damage dealt

### Engine gaps
- Dead Branch has no effect (adding a random card to the hand is not implemented)
- The relic trigger `REST` is defined but never fired (no relic uses it)
- An enemy's retaliation and random-target effects during the enemy turn only see the enemy that is acting
- The event reward `random_curse` resolves to nothing
- Bosses share one deck and are not scaled by anything but their health
- One enemy (`createLagavulin`) has no deck of its own and is not used in any encounter
- There is no way to type a seed in the UI; `startNewGame(seed)` accepts one and the Game Over screen shows it
- A run is saved on the map only: closing the browser during a combat, event or shop returns to the map before that node
- The hand view (`HandArea.tsx`) still has per-card markup for a few cards; the other card views read everything from card data

## Fixed

### Run structure (unreleased)
- The map is built from routes that never cross, with a combat to start, a treasure halfway, a rest site before the boss, and at least one shop and one elite
- Fights scale with the floor: single enemies at the start, groups in the middle, tougher groups near the top; elite nodes have their own encounters
- Defeating the boss shows a summary of the run
- Event choices that cost more gold than the player has cannot be picked

### Seeded runs and saving (unreleased)
- A run in progress is saved while it is on the map and can be continued from the title screen; the save is removed when the run ends
- A run is reproducible from its seed: the same seed and choices give the same map, fights, draws and rewards
- Entering a map node and leaving the map are one state change, so a node is never marked as entered without being played

### Effect and trigger pipeline (unreleased)
- Relic triggers for cards played, turn end, cards exhausted and enemy deaths fire; relic effects can be limited to a card type, to once per combat, or to turns without attacks
- Energy granted "next turn" arrives after the turn's refill instead of being lost
- "First time each combat" effects fire once per combat
- Cards whose text says "Exhaust." go to the exhaust pile for the rest of the combat
- Power cards apply their ongoing effect only through its trigger (Metallicize no longer also gives Block when played), and an upgraded power is upgraded in play
- Powers that had no ongoing effect now have one: turn-end damage and health loss, Block when a card is exhausted, damage when Block is gained, keeping Block between turns
- Temporary Strength is removed at the end of the turn; the random-target attack no longer asks for a target
- Damage from relics and powers is absorbed by enemy Block
- The hand holds at most 10 cards

### Engine correctness pass (unreleased)
- Weak and Vulnerable lose a stack after the affected side has acted, so 1 stack lasts one turn (it used to expire before the enemy attacked)
- Block gained at the start of combat (Anchor) is kept for the first turn
- Calipers keeps all but 15 Block instead of setting Block to -15
- Power cards leave play when played instead of going to the discard pile
- A card that needs a target cannot be played without a living one; with a single enemy it is targeted automatically
- The first-attack bonus (Akabeko) applies to one hit and is added before Weak and Vulnerable
- Upgrades change the card's effects: Strike+, Defend+, Iron Wave+ and Pommel Strike+ now do what they show
- The generic upgrade no longer raises every number and lowers the cost at the same time
- Bosses have their own deck, pick a card before their first turn, and the first act's boss is no longer scaled up
- Defeating the boss shows the victory screen instead of an empty map
- The Game Over screen shows the floor that was reached

### Engine (unreleased)
- Combats entered from the map shuffle the deck, apply turn-start effects on the first turn and deal the first hand immediately (previously the deck was dealt in deck order after a 100 ms timer)
- Event choices that upgrade or remove a card now do so, and an event that takes the last health ends the run
- Cards, enemies and enemy cards created in the same millisecond no longer share an id
- Shuffling is unbiased (Fisher-Yates instead of a random sort)
- All status effects are cleared when a combat is won (poison and dexterity used to carry over)
- Relic rewards, treasure and shops no longer offer relics the player already owns; shops always stock two relics
- An enemy turn that is still animating no longer writes into a new run
- `cards.test.ts > should respect rarity weighting` is deterministic (seeded random source)

### Combat Mechanics
- Block is now reduced by enemy attacks and resets at the start of the next player turn
- Horn Cleat grants block on the 2nd player turn of every combat
- Power cards are attached to the player when played and cleared after combat
- Bronze Scales kills an attacking enemy with 3 or less health
- Enemies play their non-attack cards (block, buffs, debuffs) again

### Card Mechanics
- Uppercut (and any card with a single-enemy effect) requires targeting
- Self-targeted status, heal, energy and draw effects are processed when a card is played
- Cards cannot be played outside the player's turn

### Game Flow
- Rest site upgrades, shop purchases and event card changes are kept in the persistent deck and survive combats
