# Seeded Runs and Save/Load Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** A run is reproducible from its seed, and a run in progress survives closing the browser.

**Architecture:** The store keeps `seed` and `rngState` (one 32-bit number, so it serializes). Each store action builds a random source from `rngState`, hands it to the pure engine functions, and writes the advanced state back. Saving is a plain module (`src/store/saveGame.ts`) that writes a versioned snapshot to `localStorage` whenever the run is on the map, and a store action that restores it.

**Tech Stack:** TypeScript, Zustand, Vitest (jsdom `localStorage`).

**Spec:** "Plan 3" of the 2026-11-16 review.

## Global Constraints

- `npm run validate` passes after every task; coverage floors stay met.
- Every engine and data function that uses randomness takes an optional `rng` last parameter defaulting to `Math.random`, so existing callers and tests keep working.
- No gameplay randomness in the store or engine may call `Math.random` directly (the debug panel may).
- Ids stay UUIDs: they do not affect rules. Reproducibility tests compare rules-relevant state, not ids.
- Storage failures (unavailable, full, corrupt, other version) never throw into the game; a bad save is treated as no save.

## Decisions

- **Saves happen on the map only.** A save taken there plus the seed replays the next node identically, so nothing mid-combat has to be serialized. Closing the tab mid-combat returns the player to the map before that node.
- **The enemy turn stays in the store.** Moving it to a pure step list was in the review's sketch, but saving at node boundaries removes the need; left for when replays are wanted.
- **No seed input in the UI yet.** `startNewGame(seed?)` accepts one and the end screens show it.

## Outcome

- Autosave is installed by the app (`installAutosave` in `src/store/autosave.ts`, called from `main.tsx`) instead of by the store module, so tests and tools that only use the store do not touch storage.
- The save tests found that entering a node marked it completed while the run was still on the map, which would have saved the node as done. `selectNode` now changes the map and the phase together.
- Enemy opening cards are picked in `createEncounter` with the run's random source (the enemy constructors still pick one with `Math.random`, which is then replaced).

## Review Focus

- Two runs with the same seed and the same choices must match after several nodes, not just at the start.
- Loading a save with a newer or older version must act as "no save".
- Corrupt JSON in storage must not break the title screen.
- Finishing a run (death or victory) must remove the save.
- A seed of 0 must work.

---

### Task 1: Serializable random source

**Files:** `src/utils/random.ts`, `src/utils/__tests__/random.test.ts`

**Produces:**
- `interface SeededRng { (): number; readonly state: number }`
- `createSeededRng(seed: number): SeededRng` — same sequence as today; `state` is the value to pass back in to continue the sequence.
- `createRandomSeed(): number` — a 32-bit unsigned integer.

- [x] Test: `createSeededRng(rng.state)` continues the sequence of `rng`; implement; commit.

### Task 2: Thread `rng` through engine and data

**Files:** `src/utils/mapGeneration.ts`, `src/data/{enemies,bosses,events,monsterCards,relics}.ts`, `src/engine/{combat,rewards,events}.ts`, `src/store/slices/*.ts`, `src/store/{types,initialState}.ts`

**Signatures (new trailing `rng?: Rng`):** `generateMap`, `getRandomEnemy`, `getRandomEnemyEncounter`, `selectEnemyCard`, `getRandomBoss`, `getBossForFloor`, `getRandomEvent`, `getRandomRelic`, `createEncounter`, `createCombatState`, `createVictoryState`, `chooseNextCard`, `startPlayerTurn`, `endPlayerTurn`, `resolveEnemyCard`, `pickRelicReward`, `createCombatReward`, `createTreasureReward`, `createShop`, `applyEventConsequence`, `applyEventChoice`.

**Store:** `seed: number`, `rngState: number`; `startNewRun(seed?)`, `startNewGame(seed?)`. Helper `withRng(get, set)` in `src/store/rng.ts` gives an action a random source and a function that returns `{ rngState }` to include in its `set`.

- [x] Test (`src/__tests__/seeded-runs.test.ts`): two stores' worth of play with the same seed (map shape and node types, first three fights' enemies, drawn hands by `baseId`, gold and card rewards) are equal; a different seed differs; seed 0 works. Implement; commit.

### Task 3: Save and load

**Files:** create `src/store/saveGame.ts`; modify `src/store/gameStore.ts`, `src/store/slices/runSlice.ts`, `src/store/initialState.ts`

**Produces:**
- `SAVE_KEY = "dsts.save"`, `SAVE_VERSION = 1`
- `interface SavedRun { version: number; seed: number; rngState: number; player: Player; persistentDeck: Card[]; map: GameMap; currentFloor: number }`
- `toSavedRun(state): SavedRun`, `writeSave(run)`, `readSave(): SavedRun | null`, `clearSave()`, `hasSave(): boolean`
- Store: subscription writes a save when `gamePhase` is `MAP`, clears it on `GAME_OVER` and `VICTORY`; `hasSavedGame` mirrors storage; `loadSavedGame()` restores the snapshot onto a fresh run state and goes to the map.

- [x] Tests (`src/store/__tests__/saveGame.test.ts`): round trip; wrong version, corrupt JSON and missing fields read as `null`; reaching the map saves; death clears; load restores player, deck, map and rng state. Implement; commit.

### Task 4: Docs

- [x] `KNOWN_BUGS.md`, `CHANGELOG.md`; show the seed on the Game Over screen; `npm run validate`; commit.
