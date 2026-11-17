/**
 * Prints a simulation report. Not part of the normal test run:
 *
 *   npm run simulate
 *
 * Environment variables:
 *   VITE_SIM_RUNS    runs per policy (default 300)
 *   VITE_SIM_SEED    first seed (default 1)
 *   VITE_SIM_POLICY  policy of the detailed report: lookahead (default),
 *                    greedy or random
 *
 * Fails if any run gets stuck or breaks an invariant, so it also works as a
 * long fuzz test.
 */
import { expect, it } from "vitest";
import { createRandomPolicy, greedyPolicy, lookaheadPolicy } from "./policies";
import { formatComparison, formatReport, summarize } from "./report";
import { simulateRuns } from "./simulator";
import { Policy } from "./types";

const runs = Number(import.meta.env.VITE_SIM_RUNS ?? 300);
const firstSeed = Number(import.meta.env.VITE_SIM_SEED ?? 1);
const detailed = String(import.meta.env.VITE_SIM_POLICY ?? "lookahead");

it(`simulates ${runs} runs per policy`, { timeout: 1_800_000 }, async () => {
  const seeds = Array.from({ length: runs }, (_, index) => firstSeed + index);
  const policies: Policy[] = [
    createRandomPolicy(firstSeed),
    greedyPolicy,
    lookaheadPolicy,
  ];

  const reports = [];
  for (const policy of policies) {
    reports.push(summarize(await simulateRuns(seeds, policy)));
  }

  const report = reports.find((r) => r.policy === detailed) ?? reports[2];
  console.log(`\n${formatComparison(reports)}\n\n${formatReport(report)}\n`);

  for (const each of reports) {
    expect(each.stuckSeeds, `${each.policy}: stuck runs`).toEqual([]);
    expect(each.violations, `${each.policy}: invariants`).toEqual([]);
  }
});
