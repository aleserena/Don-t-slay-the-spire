# Known Bugs

This file tracks known bugs in the game that need to be fixed.

## Known Bugs

### Card Mechanics
- Metallicize grants 3 Block immediately when played (its card effect) in addition to the intended 3 Block at the end of each turn
- Nothing is ever exhausted: cards whose text says "Exhaust" go to the discard pile, and the exhaust pile is never used
- Flex never removes its Strength; Entrench does not double Block; Battle Trance does not stop further draws
- Sword Boomerang needs a target instead of hitting random enemies; Perfected Strike, Reaper and Immolate only deal their base damage
- Combust, Barricade, Juggernaut and Feel No Pain have no ongoing effect; their card effect fires once when played
- Upgrading Demon Form or Metallicize changes the card's numbers but not the attached power

### Engine gaps
- Relic triggers `CARD_PLAYED`, `ENEMY_DEATH`, `TURN_END` and `REST` are defined but never fired, so Art of War, Bird-Faced Urn and Dead Branch do nothing
- Relic effects that react to damage fire on every hit; there is no "first time each combat" condition yet (Centennial Puzzle draws 3 cards on every hit)
- Effects that react to damage during the enemy turn are applied immediately: cards are drawn into the next hand, and energy gained (Blue Candle) is lost to the turn refill
- The event reward `random_curse` resolves to nothing
- Map node types are rolled independently (a floor can be all shops, and there is no guaranteed rest before the boss); encounters do not scale with the floor
- Saving and loading a run is not implemented (`loadSavedGame` only resumes the in-memory run)
- Event choices that cost gold can be picked without having the gold
- The hand view (`HandArea.tsx`) still has per-card markup for a few cards; the other card views read everything from card data

## Fixed

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
