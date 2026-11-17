# Headless Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A bot plays many seeded runs through the real store and reports win rate, where runs die and how cards perform; a run that cannot end is reported, so the simulator doubles as a fuzz test for softlocks.

**Architecture:** `src/sim/simulator.ts` drives the Zustand store with a `Policy` (which node, which card, which reward, rest or upgrade). It has no rules of its own. `summarize` turns run results into a report and `formatReport` into text. The report is run through Vitest with its own config, because the project has no TypeScript runner for scripts.

**Tech Stack:** TypeScript, Zustand, Vitest.

**Spec:** "Plan 6" of the 2026-11-16 review.

## Global Constraints

- The simulator only calls store actions a player could trigger.
- Runs are seeded and reproducible: the same seed and policy give the same result.
- `npm test` does not run the long report; `npm run simulate` does.
- No Node-only APIs in `src` (the project has no Node type definitions).

## Review Focus

- A card the engine refuses to play must not be retried forever.
- A run with no available map node, or an event with no affordable choice, must end as `stuck`, not hang.
- Results must not leak between runs (the store is shared).

---

### Task 1: Simulator and policy

**Files:** create `src/sim/simulator.ts`, `src/sim/__tests__/simulator.test.ts`

**Produces:** `Policy`, `defaultPolicy`, `RunResult`, `simulateRun(seed, policy?)`, `simulateRuns(seeds, policy?)`, `SimulationReport`, `summarize(results)`, `formatReport(report)`.

- [x] Tests: 25 seeds end in victory or defeat and none is stuck; same seed same result; a policy that never plays cards loses; a map with no nodes is reported as stuck; report arithmetic and text. Implement. Commit.

### Task 2: Report command

**Files:** create `src/sim/report.sim.test.ts`, `vitest.sim.config.ts`; modify `vite.config.ts` (exclude `*.sim.test.ts`), `package.json` (`simulate` script), `tsconfig.node.json`

- [x] `npm run simulate` prints the report for 200 runs (`VITE_SIM_RUNS`, `VITE_SIM_SEED` change the count and first seed) and fails if any run is stuck. Commit.

## First report (seeds 1-200, default policy)

- 30 wins of 200 (15.0%), no stuck runs, average floor reached 10.8.
- Deaths: 75 in normal combats, 44 in elites, 39 at the boss, 12 in events.
- The two worst cards by win rate of the runs that picked them are Entrench (7.1%) and Perfected Strike (6.9%), both listed as not implemented.

The default policy is simple (block when the incoming damage exceeds block, otherwise attack the weakest enemy, rest when hurt, avoid elites, take the rarest card), so the absolute win rate says more about the bot than the game. Differences between cards, floors and node types are the useful part.

---

## Second pass: a stronger simulator (same day)

**Goal:** separate what the bot does badly from what the game does badly, measure the effect of single relics and cards, and check the rules while playing.

### What was added

- [x] **Three bots** (`src/sim/policies.ts`): `random` (any legal action, including shopping; for fuzzing), `greedy` (the first bot) and `lookahead`.
- [x] **Turn search** (`src/sim/search.ts`): tries the orders in which the hand can be played with the engine's own pure functions and scores the position after the enemies' announced attacks. It does not know what will be drawn.
- [x] **The lookahead bot also** plans a route over the map, weighs event choices, shops (relics, removing starter cards, clearly good cards) and rates cards from their numbers only, with no knowledge of specific cards.
- [x] **Invariants** (`src/sim/invariants.ts`): after every action the state is checked (health, block, energy and gold ranges, no card in two piles, combat piles match the deck, no dead enemy left in combat, a map with somewhere to go, a valid random state). Violations are reported with the seed and step.
- [x] **Per-fight records**: encounter, floor, node type, turns, health lost, won or lost.
- [x] **Report** (`src/sim/report.ts`): win rate with a 95% interval, survival by floor, nodes per run, fights by node type, encounters by cost, cards (offered, picked, bought, played, win-rate difference), relics, and a comparison of the bots on the same seeds.
- [x] **Experiments** (`src/sim/experiments.ts`, `npm run simulate:impact`): the same seeds are played unchanged and with one extra relic or card at the start; the difference is that item's effect.

### Results (seeds 1-300 for the report, 1-150 for the experiments)

| Bot | Win rate | 95% range | Average floor |
|---|---|---|---|
| random | 0.0% | 0.0-1.3% | 5.7 |
| greedy | 13.7% | 10.2-18.0% | 10.6 |
| lookahead | 64.7% | 59.1-69.9% | 13.6 |

No run got stuck and no invariant broke in 900 runs.

With the lookahead bot:

- 40 of the 106 lost runs died at the boss, 50 in normal fights, 16 in elites.
- Costliest encounters: the two tougher bosses (about 40 health lost, 75-79% won) and the three-guard elite (33 health lost, 80% won). The single-enemy elite is won every time for 15 health.
- Two normal encounters cost no health on average.
- Relics that add energy every turn are worth the most by a wide margin: +27 to +33 win-rate points for one extra copy at the start. The weakest relics are worth about +3.
- Extra cards range from +18 points to -11. The cards listed as not implemented sit at the bottom, together with the powers whose trigger rarely fires.

### Reading the numbers

- An extra card changes every shuffle of the run, so a variant wins about 25 seeds the baseline lost and loses about as many, even when it changes nothing on average. With 150 seeds, differences under roughly 8 points are noise.
- The relic table of the normal report flatters every relic, because runs that go further collect more. Use the experiments for single items.
- The lookahead bot plans one turn only. It undervalues anything that pays off later (scaling powers, statuses that last).
