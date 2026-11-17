/**
 * Prints a simulation report. Not part of the normal test run:
 *
 *   npm run simulate
 *
 * Set VITE_SIM_RUNS to change the number of runs (default 200) and
 * VITE_SIM_SEED to change the first seed (default 1).
 */
import { expect, it } from "vitest";
import { formatReport, simulateRuns } from "./simulator";

const runs = Number(import.meta.env.VITE_SIM_RUNS ?? 200);
const firstSeed = Number(import.meta.env.VITE_SIM_SEED ?? 1);

it(`simulates ${runs} runs`, { timeout: 600_000 }, async () => {
  const seeds = Array.from({ length: runs }, (_, index) => firstSeed + index);

  const { report } = await simulateRuns(seeds);

  console.log(`\n${formatReport(report)}\n`);
  expect(report.stuckSeeds).toEqual([]);
});
