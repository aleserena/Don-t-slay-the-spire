# Run Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** A run has a shape: a map with real route choices and guaranteed stops, fights that get harder as the player climbs, a proper ending, and event choices that respect what the player can pay.

**Architecture:** Map generation becomes path-based on a 7-column grid, with node types assigned by per-floor rules. Encounters move to `src/engine/encounters.ts`, which picks from a pool by floor tier. The victory screen is a component fed by the store. All randomness uses the run's random source from the previous plan.

**Tech Stack:** TypeScript, React, Zustand, Vitest.

**Spec:** "Plan 4" of the 2026-11-16 review.

## Global Constraints

- `npm run validate` passes after every task; coverage floors stay met.
- The map keeps its shape for consumers: `MapNode { id, type, x, y, connections, completed, available }`, 15 floors (`y` 0–14), `x` in 0–6, connections only to the next floor, one boss node on floor 14.
- Uses existing enemies only; no new enemy, card or relic content.
- Every random pick takes the run's `rng`.

## Map rules

- Six paths walk from floor 0 to floor 13, each step to the same or an adjacent column. A step may not cross an existing edge. The first two paths start in different columns.
- Every floor-13 node connects to the single boss node (floor 14, column 3).
- Fixed floors: 0 is combat, 7 is treasure, 13 is rest, 14 is boss.
- Other floors are rolled: combat 45, event 22, elite 12, shop 11, rest 10.
  - Elite and rest only from floor 4; shop only from floor 2; no rest on floor 12.
  - Elite, rest and shop never directly follow a node of the same type.
- Every map has at least one shop and one elite (a combat node on floors 4–11 is converted if needed).

## Encounter rules

- Floors 0–2 ("easy"): one enemy, or two small ones.
- Floors 3–8 ("normal"): pairs and the three-enemy group.
- Floors 9+ ("hard"): the normal pool with health ×1.25.
- Elite nodes use dedicated elite encounters (a single strong enemy, or three guards), flagged `isElite`, with health ×1.25 on hard floors.

## Outcome

Checked in a browser as well as by tests: new game, the generated map, a
fight with an end of turn, reload and Continue, with no console errors.

## Review Focus

- Every node must be reachable from floor 0 and must lead to the boss.
- No two edges between the same pair of floors may cross.
- A map generated from the same seed must be identical.
- An event choice whose gold cost is exactly the player's gold must be allowed.
- Winning the run must show the summary and remove the save.

---

### Task 1: Path-based map generation

**Files:** `src/utils/mapGeneration.ts`, `src/utils/__tests__/mapGeneration.test.ts`

- [x] Tests over 50 seeds: floor rules, reachability both ways, no crossing edges, at least one shop and elite, no forbidden type on a floor, no repeated special type along an edge, same seed same map. Implement `generateMap(rng)`. Commit.

### Task 2: Encounters by floor

**Files:** create `src/engine/encounters.ts`, `src/engine/__tests__/encounters.test.ts`; modify `src/engine/combat.ts`, `src/engine/constants.ts`

**Produces:** `getEncounterTier(floor: number): "easy" | "normal" | "hard"`, `createCombatEncounter(floor: number, rng?: Rng): Enemy[]`, `createEliteEncounter(floor: number, rng?: Rng): Enemy[]`; `createEncounter` delegates to them.

- [x] Tests: easy floors total at most 70 health and at most two enemies; hard floors are the normal pool ×1.25; elites are flagged and never appear in combat pools; ids are unique. Implement. Commit.

### Task 3: Victory summary and run stats

**Files:** create `src/components/VictoryScreen.tsx`; modify `src/App.tsx`, `src/store/types.ts`, `src/store/initialState.ts`, `src/store/slices/combatSlice.ts`, `src/store/saveGame.ts`

- Store gains `combatsWon: number`, incremented on every combat win and kept in the save.
- The victory screen shows floors climbed, combats won, health, gold, deck size, relics and seed, with "New Run" and "Title" buttons.

- [x] Tests: counter increments, survives save/load; component renders the numbers. Implement. Commit.

### Task 4: Event choices and costs

**Files:** `src/engine/events.ts`, `src/store/slices/mapSlice.ts`, `src/components/EventScreen.tsx`

**Produces:** `getChoiceGoldCost(choice: EventChoice): number`, `canChooseEventOption(choice: EventChoice, player: Player): boolean`.

- [x] Tests: unaffordable choice is rejected by the store and leaves the event open; exact gold is allowed. The screen disables the button and says why. Commit.

### Task 5: Docs

- [x] `KNOWN_BUGS.md`, `CHANGELOG.md`; `npm run validate`; commit.
