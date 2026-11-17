# Architecture

The game has four layers, each depending only on the ones below it:

```
components/   React screens          read the store, call its actions
store/        Zustand store          holds state, sequences engine calls
engine/       Rules                  pure functions: state in, state out
data/         Content                cards, relics, enemies, events as plain objects
```

`utils/` holds helpers used by several layers (statuses, upgrades, map generation, randomness). `sim/` sits beside `components/`: it drives the same store with bots instead of a person.

## Engine

Everything in `src/engine` is a pure function. It never imports the store, so the rules can be tested, previewed and simulated without React.

| File            | Responsibility                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `cardPlay.ts`   | `resolveCardPlay`: applies a card's effects and says where the card goes (discard, exhaust, or out of play for powers)               |
| `effects.ts`    | `takeDamage` (block first, then health) and `getCardEffects` (a card as a list of effects, including legacy `damage`/`block` fields) |
| `triggers.ts`   | The trigger pipeline: `dispatch` and per-combat counters (see below)                                                                 |
| `combat.ts`     | Starting and winning a combat, turn start and end, enemy cards, block retention                                                      |
| `encounters.ts` | Which enemies appear, by floor tier and node type                                                                                    |
| `rewards.ts`    | Gold, card and relic rewards, treasure, shop stock                                                                                   |
| `events.ts`     | Applying event choices; whether the player can afford one                                                                            |
| `deck.ts`       | Drawing, shuffling, temporary copies                                                                                                 |
| `preview.ts`    | `previewCardPlay`: what a card would do, by resolving it on a copy of the combat                                                     |
| `constants.ts`  | Tunable numbers: hand size, energy cap, rest heal, shop prices, floor tiers                                                          |

### Effects

Every card, enemy card, power and relic is described with effects: `{ type, value, target, statusType? }`. Supported types are listed in `SUPPORTED_CARD_EFFECTS` (`cardPlay.ts`). A few fields change when an effect applies:

- `trigger` on a card effect makes it an **ongoing power effect**: it is not applied when the card is played, but every time that trigger fires.
- `untilEndOfTurn` on a self status removes it again at the end of the turn.
- `TargetType.RANDOM_ENEMY` picks a living enemy each time the effect applies.

### Triggers

Combat raises events: `combat_start`, `turn_start`, `turn_end`, `card_played`, `card_exhausted`, `hp_lost`, `block_gained`, `enemy_died`. `dispatch(battle, event, rng)` applies every power effect and then every relic effect that listens for it. Effects may raise further events (gaining block raises `block_gained`); chains stop at a depth of 10.

Relic effects can carry conditions: `onTurn`, `cardType`, `oncePerCombat`, `nextTurn` (energy arrives after next turn's refill), `ifNoAttacksThisTurn`. The bookkeeping for these lives in `CombatCounters`, kept in the store as `combat` and reset at the start of each combat.

Two relic effects are passive and read where they apply instead of firing: `LIMIT_BLOCK_LOSS` (block kept at turn start) and `FIRST_ATTACK_DAMAGE`.

### Turn order

1. **Player turn start:** energy refills (plus energy owed from last turn), block is lost (or limited), `turn_start` fires, the hand is drawn.
2. **Player plays cards.**
3. **Player turn end:** `turn_end` fires, end-of-turn statuses expire, the hand is discarded.
4. **Enemy turn:** poison ticks on everyone. Each enemy plays its announced card; then its Weak and Vulnerable lose a stack and it picks its next card.
5. The player's Weak and Vulnerable lose a stack (only the ones they had before the enemy turn), and the next player turn starts.

## Store

`src/store/gameStore.ts` combines five slices. Each slice action reads the state, calls engine functions, and writes the result:

| Slice         | Actions                                                                               |
| ------------- | ------------------------------------------------------------------------------------- |
| `runSlice`    | New run, title screen, continue a saved run; UI flags (modals, selection, debug mode) |
| `mapSlice`    | Entering a node, events, rest sites                                                   |
| `combatSlice` | Starting a combat, playing cards, ending the turn, the enemy turn                     |
| `rewardSlice` | Card and relic rewards                                                                |
| `shopSlice`   | Buying cards and relics, removing a card                                              |

The enemy turn is the only asynchronous action: it pauses between steps so the UI can show them. Under test the pause is zero and it resolves at once.

### Randomness and seeds

A run has a `seed`. The store keeps the random source's position as `rngState` (one 32-bit number). Every action that needs randomness builds the source from `rngState`, passes it to the engine, and stores where it ended. The same seed and the same choices always give the same run. `createSeededRng` and the other helpers are in `utils/random.ts`; every random function takes an optional `rng` as its last argument.

### Saving

`store/saveGame.ts` writes a versioned snapshot (`SAVE_VERSION`) to local storage. `store/autosave.ts` subscribes to the store, saves whenever the run is on the map, and clears the save when the run ends. A snapshot plus the random state is enough to continue exactly, so nothing inside a combat is saved; closing the tab mid-fight returns to the map before that node. A save that cannot be read, or has another version, counts as no save.

## Map

`utils/mapGeneration.ts` draws six routes over a 7-column grid of 15 floors, stepping to the same or a neighbouring column without crossing. Floor 0 is a combat, floor 7 a treasure, floor 13 a rest site, floor 14 the boss. Other floors are rolled with weights and limits (no elite or rest before floor 4, no shop before floor 2, no elite, rest or shop twice in a row), and every map has at least one shop and one elite.

## Interface

Screens are in `src/components`, the shared pieces in `src/components/ui`, and the look in `src/styles`. Components read their data from the store with selectors and never name a specific card, relic or enemy: card badges come from card effects, and damage previews from `previewCardPlay`. See [UI.md](UI.md).

## Tests

Tests sit next to the code in `__tests__` folders, plus cross-cutting suites in `src/__tests__`. The engine and store have coverage floors in `vite.config.ts`. See [DEVELOPMENT.md](DEVELOPMENT.md).
