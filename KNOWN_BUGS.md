# Known Bugs

This file tracks known bugs in the game that need to be fixed.

## Known Bugs

### Card Mechanics
- Metallicize grants 3 Block immediately when played (its card effect) in addition to the intended 3 Block at the end of each turn
- Bronze Scales only damages the attacking enemy, but its description says "ALL enemies"

### Game Flow
- Event choices are not being processed correctly (not re-verified)

### Tests
- `cards.test.ts > should respect rarity weighting` is random and fails occasionally (it requires at least one rare card in 100 draws)

## Fixed

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
