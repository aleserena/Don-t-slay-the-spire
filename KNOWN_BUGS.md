# Known Bugs

This file tracks known bugs in the game that need to be fixed.

## Known Bugs

### Card Mechanics
- Metallicize grants 3 Block immediately when played (its card effect) in addition to the intended 3 Block at the end of each turn

### Engine gaps
- Relic triggers `CARD_PLAYED`, `ENEMY_DEATH`, `TURN_END` and `REST` are defined but never fired
- Relic effects that react to damage fire on every hit; there is no "first time each combat" condition yet
- Saving and loading a run is not implemented (`loadSavedGame` only resumes the in-memory run)
- Event choices that cost gold can be picked without having the gold
- The hand view (`HandArea.tsx`) still has per-card markup for a few cards; the other card views read everything from card data

## Fixed

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
