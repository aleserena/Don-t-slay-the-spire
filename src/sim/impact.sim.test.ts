/**
 * Measures what each relic and each card is worth: every run starts with
 * one extra copy of it, on the same seeds as an unchanged baseline.
 *
 *   npm run simulate:impact
 *
 * Environment variables:
 *   VITE_SIM_RUNS  seeds per variant (default 150)
 *   VITE_SIM_SEED  first seed (default 1)
 */
import { expect, it } from "vitest";
import {
  allCardVariants,
  allRelicVariants,
  formatExperiment,
  runExperiment,
} from "./experiments";
import { lookaheadPolicy } from "./policies";

const runs = Number(import.meta.env.VITE_SIM_RUNS ?? 150);
const firstSeed = Number(import.meta.env.VITE_SIM_SEED ?? 1);
const seeds = Array.from({ length: runs }, (_, index) => firstSeed + index);

it(
  `measures relic impact over ${runs} seeds`,
  { timeout: 1_800_000 },
  async () => {
    const report = await runExperiment(
      seeds,
      lookaheadPolicy,
      allRelicVariants(),
    );

    console.log(
      `\n${formatExperiment("Starting with one extra relic", report)}\n`,
    );
    expect(report.variants.length).toBeGreaterThan(0);
  },
);

it(
  `measures card impact over ${runs} seeds`,
  { timeout: 1_800_000 },
  async () => {
    const report = await runExperiment(
      seeds,
      lookaheadPolicy,
      allCardVariants(),
    );

    console.log(
      `\n${formatExperiment("Starting with one extra card", report)}\n`,
    );
    expect(report.variants.length).toBeGreaterThan(0);
  },
);
