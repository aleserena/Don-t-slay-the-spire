/**
 * Controlled experiments: the same seeds are played with and without one
 * change (an extra relic, an extra card), and the difference in results is
 * the effect of that change.
 *
 * This answers what the tables of a normal report cannot: there, a relic
 * held by many winning runs may simply be one that long runs collect.
 */

import { getAllCards } from "../data/cards";
import { getAllRelics } from "../data/relics";
import { createCardInstance } from "../engine/deck";
import { createOutOfCombatPiles } from "../store/initialState";
import { useGameStore } from "../store/gameStore";
import { CardRarity, RelicRarity } from "../types/game";
import { Rate, toRate } from "./report";
import { simulateRuns } from "./simulator";
import { Policy, RunResult } from "./types";

/** A change applied to a fresh run before it is played. */
export interface Variant {
  name: string;
  setup: () => void;
}

export interface VariantResult {
  name: string;
  winRate: Rate;
  /** Win rate minus the baseline's, on the same seeds. */
  winRateDelta: number;
  /** Average floor reached minus the baseline's. */
  floorDelta: number;
  /** Seeds the baseline lost and this variant won. */
  gained: number;
  /** Seeds the baseline won and this variant lost. */
  lost: number;
}

export interface ExperimentReport {
  policy: string;
  runs: number;
  baseline: Rate;
  baselineFloor: number;
  variants: VariantResult[];
}

/** Starts every run with one more relic. */
export const withStartingRelic = (relicId: string): Variant => ({
  name: relicId,
  setup: () => {
    const relic = getAllRelics().find((r) => r.id === relicId);
    if (!relic) throw new Error(`Unknown relic: ${relicId}`);
    const { player } = useGameStore.getState();
    useGameStore.setState({
      player: { ...player, relics: [...player.relics, relic] },
    });
  },
});

/** Starts every run with one more card in the deck. */
export const withStartingCard = (baseId: string): Variant => ({
  name: baseId,
  setup: () => {
    const card = getAllCards().find((c) => c.baseId === baseId);
    if (!card) throw new Error(`Unknown card: ${baseId}`);
    const { persistentDeck } = useGameStore.getState();
    useGameStore.setState(
      createOutOfCombatPiles([...persistentDeck, createCardInstance(card)]),
    );
  },
});

/** One variant per relic the player does not start with. */
export const allRelicVariants = (): Variant[] =>
  getAllRelics()
    .filter((relic) => relic.rarity !== RelicRarity.STARTER)
    .map((relic) => withStartingRelic(relic.id));

/** One variant per card that can be found during a run. */
export const allCardVariants = (): Variant[] =>
  getAllCards()
    .filter((card) => card.rarity !== CardRarity.BASE)
    .map((card) => withStartingCard(card.baseId));

const averageFloor = (results: RunResult[]): number =>
  results.reduce((total, run) => total + run.floor, 0) /
  Math.max(1, results.length);

const isWin = (run: RunResult): boolean => run.outcome === "victory";

/**
 * Plays the seeds once unchanged and once per variant, and compares each
 * variant with the unchanged runs seed by seed.
 */
export const runExperiment = async (
  seeds: number[],
  policy: Policy,
  variants: Variant[],
): Promise<ExperimentReport> => {
  const baseline = await simulateRuns(seeds, policy);
  const baselineWins = baseline.filter(isWin).length;
  const baselineFloor = averageFloor(baseline);

  const results: VariantResult[] = [];
  for (const variant of variants) {
    const runs = await simulateRuns(seeds, policy, { setup: variant.setup });
    const wins = runs.filter(isWin).length;

    results.push({
      name: variant.name,
      winRate: toRate(wins, runs.length),
      winRateDelta: (wins - baselineWins) / Math.max(1, seeds.length),
      floorDelta: averageFloor(runs) - baselineFloor,
      gained: runs.filter((run, i) => isWin(run) && !isWin(baseline[i])).length,
      lost: runs.filter((run, i) => !isWin(run) && isWin(baseline[i])).length,
    });
  }

  return {
    policy: policy.name,
    runs: seeds.length,
    baseline: toRate(baselineWins, seeds.length),
    baselineFloor,
    variants: results.sort((a, b) => b.winRateDelta - a.winRateDelta),
  };
};

const percent = (value: number): string => `${(value * 100).toFixed(1)}%`;

const signed = (value: number, digits = 1): string =>
  `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;

/** A plain-text table of an experiment, best variant first. */
export const formatExperiment = (
  title: string,
  report: ExperimentReport,
): string => {
  const rows = [
    ["variant", "win rate", "win ±", "floor ±", "gained", "lost"],
    ...report.variants.map((v) => [
      v.name,
      percent(v.winRate.rate),
      signed(v.winRateDelta * 100),
      signed(v.floorDelta),
      String(v.gained),
      String(v.lost),
    ]),
  ];
  const widths = rows[0].map((_, column) =>
    Math.max(...rows.map((row) => row[column].length)),
  );

  return [
    `${title} (${report.policy} policy, ${report.runs} seeds)`,
    `Baseline: ${percent(report.baseline.rate)} win rate ` +
      `(95% ${percent(report.baseline.low)}-${percent(report.baseline.high)}), ` +
      `average floor ${report.baselineFloor.toFixed(1)}`,
    ...rows.map(
      (row) =>
        "  " +
        row
          .map((cell, column) =>
            column === 0
              ? cell.padEnd(widths[column])
              : cell.padStart(widths[column]),
          )
          .join("  "),
    ),
  ].join("\n");
};
