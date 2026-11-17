# Engine Correctness Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the combat and run rules do what the game says they do, for the bugs found in the 2026-11-16 review.

**Architecture:** Rules stay as pure functions in `src/engine` and `src/utils`; the Zustand slices only sequence them. No new subsystems: every task is a rule change in an existing function plus a regression test. The larger effect/trigger rewrite is a separate plan.

**Tech Stack:** TypeScript, Zustand, Vitest.

**Spec:** the review findings in this conversation (bugs 1–9, 11, 14).

## Global Constraints

- `npm run validate` (lint, format check, type-check, tests) passes after every task.
- Coverage floors in `vite.config.ts` for `src/engine/**` and `src/store/**` stay met.
- New regression tests go in `src/__tests__/correctness-pass.test.ts`, one `describe` per task.
- Existing tests that assert the old (wrong) behaviour are updated, not deleted.
- No new card, relic or enemy content beyond what a fix needs.

## Out of scope (next plan: effect/trigger pipeline)

- Relics that need triggers or "first time" counters (Centennial Puzzle, Blue Candle, Art of War, Bird-Faced Urn, Dead Branch).
- Cards whose text needs new primitives (exhaust, random target, temporary status, end-of-turn damage).
- Map generation, encounter scaling, save/load.

## Review Focus

- Debuff with 1 stack applied by an enemy must still affect the enemy's next attack.
- An enemy killed by poison at the start of its turn must not act or tick.
- A targeted card played with the id of a dead or unknown enemy must cost nothing.
- Upgrading an already upgraded card must return it unchanged.
- Killing a boss with a multi-hit card must go to victory exactly once.

---

### Task 1: Status timing

**Files:** `src/utils/statusEffects.ts`, `src/engine/combat.ts`, `src/store/slices/combatSlice.ts`

**Interfaces — produces:**
- `tickPoison<T extends Player | Enemy>(entity: T): T` — poison deals its stacks as damage, then loses 1 stack.
- `tickDebuffs<T extends Player | Enemy>(entity: T, shouldTick?: (type: StatusType) => boolean): T` — Weak and Vulnerable lose 1 stack.
- `processStatusEffects` stays exported as `tickDebuffs(tickPoison(entity))`.

**Rule:**
- Start of enemy turn: poison ticks on the player and on enemies (as today). Nothing else.
- Each enemy's Weak/Vulnerable tick right after that enemy acts.
- The player's Weak/Vulnerable tick at the end of the enemy turn, but only the types the player already had when the enemy turn started.

- [x] Tests: Weak 1 on an enemy reduces its next attack by 25%; Vulnerable 1 applied by an enemy increases that enemy's next attack by 50% and is gone afterwards; Vulnerable 2 on an enemy lasts through the following player turn; an enemy killed by poison does not attack.
- [x] Run, see them fail. Implement. Run `npm test`.

### Task 2: Block at turn start

**Files:** `src/types/game.ts`, `src/engine/combat.ts`, `src/data/relics.ts`, `src/utils/relicEffects.ts`

**Rule:**
- `startPlayerTurn` does not reset block on turn 1, so combat-start block survives.
- New `EffectType.LIMIT_BLOCK_LOSS = "limit_block_loss"`. A relic with this effect on `TURN_START` makes the player lose at most `value` block instead of all of it. Calipers uses it with value 15.
- Relic `BLOCK` effects never leave block below 0.

- [x] Tests: Anchor gives 10 block on turn 1 and it is gone on turn 2; with Calipers block is 0 on turn 1, and 20 block kept through the enemy turn becomes 5.
- [x] Fail, implement, pass, commit.

### Task 3: Playing cards

**Files:** `src/store/slices/combatSlice.ts`, `src/engine/cardPlay.ts`, `src/utils/statusEffects.ts`

**Rule:**
- A power card leaves play when played (not added to the discard pile).
- A card for which `cardNeedsTarget` is true: with no `targetId` and exactly one enemy, that enemy is the target; otherwise an unknown or missing target rejects the play (no energy spent, card stays in hand).
- The first-attack bonus applies to the first damage effect of the card only, and is added before Weak/Vulnerable multipliers.

- [x] Tests: Inflame is not in the discard pile and cannot be redrawn; Bash with two enemies and no target changes nothing; Bash with one enemy and no target hits it; Twin Strike with Akabeko deals 5+8+5 = 18.
- [x] Fail, implement, pass, commit.

### Task 4: Upgrades edit effects

**Files:** `src/utils/cardUpgrades.ts`, `src/utils/__tests__/cardUpgrades.test.ts`

**Rule:**
- Every upgrade changes `effects`; legacy `damage`/`block` fields are kept in sync with the matching effect.
- Strike 9, Defend 8, Iron Wave 7/7, Pommel Strike 10 (existing numbers, now applied to the effects).
- Generic upgrade: damage and block effects with a value above 0 get +3. If the card has none, status, draw, energy and heal effects get +1. If nothing was improved, cost drops by 1 (numeric cost above 0). Cost never drops otherwise. `UPGRADE_CARD`, `ADD_CARD_TO_DISCARD` and multiplier effects are never changed.
- Generic description: each improved number is replaced in the text; there is no "(Upgraded)" suffix (the name already ends in "+").

- [x] Tests: Strike+ played deals 9; Defend+ gives 8 block; Shockwave+ costs 2 and applies 4/4; Seeing Red+ costs 1 and gives 3 energy; Entrench+ costs 1; Bludgeon+ costs 3 and deals 35.
- [x] Fail, implement, update old assertions, pass, commit.

### Task 5: Enemies and bosses

**Files:** `src/engine/combat.ts`, `src/data/monsterCards.ts`, `src/data/bosses.ts`

**Rule:**
- `createCombatState` gives every enemy without a `currentCard` an opening card via `chooseNextCard`.
- New `bossCards` deck (original, generic: a heavy attack, an attack with Weak, a guard, a Strength buff). `getEnemyDeck("boss")` returns it and all bosses use it.
- `getBossForFloor(floor)`: an act is 15 floors. Floors 0–14 use the first boss group, 15–29 the second, 30+ the scaled group.

- [x] Tests: a boss from `getBossForFloor(14)` has health of 250 or less and a deck with no Cultist cards; after `startCombat` every enemy has a `currentCard` and a matching intent.
- [x] Fail, implement, pass, commit.

### Task 6: Run flow

**Files:** `src/engine/combat.ts`, `src/store/slices/mapSlice.ts`

**Rule:**
- `createVictoryState` sets `gamePhase` to `VICTORY` when a defeated enemy has `isBoss`, otherwise `CARD_REWARD`.
- `selectNode` sets `currentFloor` to `node.y + 1`.

- [x] Tests: killing a boss ends in `GamePhase.VICTORY`; entering a node on `y = 3` sets `currentFloor` to 4.
- [x] Fail, implement, pass, commit.

### Task 7: Wrap-up

- [x] Move the fixed items in `KNOWN_BUGS.md` to "Fixed" and list the out-of-scope ones under "Known Bugs".
- [x] Add a `CHANGELOG.md` entry.
- [x] `npm run validate` passes.
- [ ] Commit (waiting for the go-ahead).
