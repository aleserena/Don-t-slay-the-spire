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
