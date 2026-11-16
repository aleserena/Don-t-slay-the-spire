# Effect and Trigger Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** One place where combat effects are applied and one place where triggers fire, so that relics and powers react to what happens in combat and new content is data only.

**Architecture:** A `Battle` value (player, enemies, per-combat counters, cards to draw) flows through pure functions. `dispatch(battle, event)` in `src/engine/triggers.ts` runs every power and relic effect whose trigger matches the event, checks its conditions, and may raise further events (gaining block raises `block_gained`). Card play, the enemy turn and turn boundaries all go through it. The old entry points (`processRelicEffects`, `processPowerCardEffects`) stay as thin wrappers so their tests keep describing the behaviour.

**Tech Stack:** TypeScript, Zustand, Vitest.

**Spec:** "Plan 2" and the "Not fixed" list from the 2026-11-16 review, plus `KNOWN_BUGS.md`.

## Global Constraints

- `npm run validate` passes after every task; coverage floors in `vite.config.ts` stay met.
- Engine functions stay pure; only the slices touch the store.
- New mechanics are generic primitives proven with fixture cards and relics in tests. Existing data entries are only annotated with those primitives.
- No new cards, relics or enemies. No bespoke per-card mechanics; entries that would need one stay listed as unimplemented.
- Existing exported function signatures only gain optional parameters and extra result fields.

## Decisions

- **Legacy `damage`/`block` fields are not deleted.** About 60 data lines, four views and most tests use them. Instead `getCardEffects(card)` is the single place that turns them into effects, and every interpreter reads cards through it.
- **Power cards carry their ongoing effects as card effects with a `trigger`.** `src/data/powerCards.ts` derives its definitions from the card data, so an upgraded power is upgraded in play too.
- **Triggered damage goes through block** (it used to ignore it).
- **Hand limit is 10**; further draws are skipped.

## Outcome

Implemented in one pass rather than task by task: the code for Tasks 1-4 was
written first and the tests after it. To check the tests are not vacuous,
`dispatch` was disabled once and 25 of the 41 new tests failed.

Still not implemented (bespoke mechanics, listed in the data consistency
test): True Grit, Battle Trance, Perfected Strike, Entrench, Immolate, Reaper,
Dead Branch.

## Review Focus

- A trigger chain that feeds itself (block gained → effect that gains block) must stop, not hang.
- A once-per-combat effect must fire again in the next combat.
- Energy for "next turn" gained during the enemy turn must arrive after the refill, once.
- A random-target effect with no living enemy must do nothing.
- A power played twice must fire its ongoing effect twice.

---

### Task 1: Shared effect primitives

**Files:** create `src/engine/effects.ts`; modify `src/engine/cardPlay.ts`, `src/utils/monsterCardEffects.ts`, `src/utils/cardUtils.ts`

**Produces:**
- `takeDamage<T extends Player | Enemy>(target: T, damage: number): T` — block first, then health, never below 0 block.
- `getCardEffects(card: Card | MonsterCard): CardEffect[]` — the card's effects plus effects made from legacy `damage` (target `ENEMY`) and `block` (target `SELF`) when no effect of that kind exists.
- `isDamageEffect(type: EffectType): boolean`.
- `cardNeedsTarget` becomes: any immediate effect (no `trigger`) aimed at `TargetType.ENEMY`.

- [x] Tests in `src/engine/__tests__/effects-primitives.test.ts`; implement; monster and player interpreters use both helpers; full suite green; commit.

### Task 2: Battle, counters and dispatch

**Files:** create `src/engine/triggers.ts`, `src/engine/__tests__/triggers.test.ts`; modify `src/types/game.ts`, `src/utils/relicEffects.ts`, `src/utils/powerCardEffects.ts`

**Types added in `src/types/game.ts`:**
- `CombatCounters { attacksPlayedThisTurn: number; usedEffects: string[]; energyNextTurn: number; expiringStatuses: { type: StatusType; stacks: number }[] }`
- `EffectType.LOSE_HP`, `EffectType.FIRST_ATTACK_DAMAGE`; `TargetType.RANDOM_ENEMY`
- `PowerTrigger.CARD_EXHAUSTED`, `PowerTrigger.BLOCK_GAINED`; `RelicTrigger.CARD_EXHAUSTED`
- `CardEffect.trigger?: PowerTrigger`, `CardEffect.untilEndOfTurn?: boolean`, `Card.exhaust?: boolean`
- `RelicEffect.cardType?: CardType`, `.oncePerCombat?: boolean`, `.nextTurn?: boolean`, `.ifNoAttacksThisTurn?: boolean`

**Produces in `src/engine/triggers.ts`:**
- `createCombatCounters(): CombatCounters`
- `interface Battle { player: Player; enemies: Enemy[]; counters: CombatCounters; cardsToDraw: number }`
- `type CombatEvent` — `combat_start`, `turn_start { turn }`, `turn_end`, `card_played { card }`, `card_exhausted { card }`, `hp_lost { amount, attackerId? }`, `block_gained { amount }`, `enemy_died { enemyId }`
- `dispatch(battle: Battle, event: CombatEvent, rng?: Rng): Battle`
- `gainBlock(battle, amount, rng?)` and `loseHp(battle, amount, attackerId?, rng?)` — change the player and raise the matching event.

**Rules:**
- Powers fire before relics. Chains stop at depth 10.
- Enemy targets of a triggered effect: `ALL_ENEMIES` all living; `RANDOM_ENEMY` one living at random; `ENEMY` or none → the attacker when the event has one, otherwise all living (none) or one at random (`ENEMY`).
- `nextTurn` energy is added to `counters.energyNextTurn`. `oncePerCombat` uses the key `<relicId>:<effect index>` in `counters.usedEffects`.
- `turn_start` resets `attacksPlayedThisTurn`; `card_played` with an attack increments it before effects run.
- `processRelicEffects` and `processPowerCardEffects` delegate to the same code with fresh counters.

- [x] Fixture tests for each rule and each Review Focus line; implement; full suite green; commit.

### Task 3: Combat flow uses the pipeline

**Files:** `src/engine/cardPlay.ts`, `src/engine/combat.ts`, `src/engine/deck.ts`, `src/engine/constants.ts`, `src/store/slices/combatSlice.ts`, `src/store/types.ts`, `src/store/initialState.ts`, `src/utils/statusEffects.ts`

**Rules:**
- Store keeps `combat: CombatCounters`, reset when a combat starts and ends.
- `resolveCardPlay` takes optional `counters` and `rng`, returns `counters` and `destination: "discard" | "exhaust" | "removed"`. Order: immediate effects, attach power, `card_played`, `card_exhausted` when `card.exhaust`, `enemy_died` per enemy the card killed.
- Immediate effects gain: `RANDOM_ENEMY` targets, `LOSE_HP`, `untilEndOfTurn` statuses (recorded in `counters.expiringStatuses`), and block gained through `gainBlock`.
- A power card with no effects of its own uses the effects of the card definition with the same `baseId`.
- `startPlayerTurn(player, enemies, turn, counters?)` adds `energyNextTurn` after the refill and returns `counters`. Block retention also reads power effects of type `LIMIT_BLOCK_LOSS`.
- New `endPlayerTurn(player, enemies, counters)`: `turn_end`, then expiring statuses are removed.
- `resolveEnemyCard(card, player, enemy, counters?)` raises `hp_lost` with the enemy as attacker.
- The first-attack bonus is the sum of the player's `FIRST_ATTACK_DAMAGE` relic effects, not a relic id check.
- `MAX_HAND_SIZE = 10`.

- [x] Store-level tests in `src/__tests__/effect-pipeline.test.ts` with fixture cards and relics; implement; full suite green; commit.

### Task 4: Annotate existing data

**Files:** `src/data/cards.ts`, `src/data/relics.ts`, `src/data/powerCards.ts`

- Power cards: ongoing effects get their `trigger`; `getPowerCardDefinition` derives from card data.
- Cards whose text says "Exhaust." get `exhaust: true`; the temporary Strength card gets `untilEndOfTurn`; the random-target attack uses `RANDOM_ENEMY`.
- Relics: conditions (`cardType`, `oncePerCombat`, `nextTurn`, `ifNoAttacksThisTurn`) and `FIRST_ATTACK_DAMAGE` where the text calls for them.
- Entries that need a bespoke mechanic keep no misleading effect and are listed in the consistency test.

- [x] Tests assert the annotated entries through the store; full suite green; commit.

### Task 5: Data consistency test and docs

**Files:** create `src/data/__tests__/dataConsistency.test.ts`; modify `KNOWN_BUGS.md`, `CHANGELOG.md`

- Every card effect type is in `SUPPORTED_CARD_EFFECTS` (exported by `cardPlay.ts`); every relic and power trigger is one `dispatch` raises.
- A card whose description contains "Exhaust." has `exhaust: true`; a power card has at least one effect.
- `KNOWN_UNIMPLEMENTED` lists the ids whose text is not fully implemented; the test fails when an id is listed but no longer exists.

- [x] Write test; update docs; `npm run validate`; commit.
