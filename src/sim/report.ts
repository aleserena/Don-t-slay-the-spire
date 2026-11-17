/**
 * Turns the results of simulated runs into numbers and text.
 */

import { NodeType } from "../types/map";
import { RunResult } from "./types";

/** A share of runs with the range it is likely to really lie in. */
export interface Rate {
  count: number;
  of: number;
  rate: number;
  /** 95% Wilson interval. */
  low: number;
  high: number;
}

export interface CardStats {
  offered: number;
  /** Times the card was taken as a reward. */
  picked: number;
  /** Times the card was bought in a shop. */
  bought: number;
  /** Times the card was played, over all runs. */
  played: number;
  /** Runs with at least one copy picked or bought. */
  runs: number;
  /** Of those runs, the ones that were won. */
  wins: number;
  /** Win rate of those runs minus the overall win rate. */
  winRateDelta: number;
}

export interface RelicStats {
  /** Runs that ended holding the relic. */
  runs: number;
  wins: number;
  winRateDelta: number;
}

export interface EncounterStats {
  fights: number;
  wins: number;
  averageHealthLost: number;
  averageTurns: number;
}

export interface SimulationReport {
  policy: string;
  runs: number;
  winRate: Rate;
  averageFloor: number;
  averageTurns: number;
  /** Average health left, as a share of max health, in the runs won. */
  averageHealthLeftOnWin: number;
  averageDeckSize: number;
  averageRelics: number;
  /** Seeds of runs that could neither end nor continue. */
  stuckSeeds: number[];
  /** Runs lost on each 1-based floor. */
  deathsByFloor: Record<number, number>;
  /** Runs lost in each type of node. */
  deathsByNodeType: Partial<Record<NodeType, number>>;
  /** Average number of nodes of each type entered per run. */
  nodesPerRun: Partial<Record<NodeType, number>>;
  /** Share of the runs that reached each 1-based floor. */
  reachedFloor: Record<number, number>;
  encounters: Record<string, EncounterStats>;
  /** The same numbers per kind of combat node. */
  fightsByNodeType: Partial<Record<NodeType, EncounterStats>>;
  cards: Record<string, CardStats>;
  relics: Record<string, RelicStats>;
  /** Broken invariants, with the seed that reproduces each. */
  violations: { seed: number; message: string }[];
}

/** A rate with its 95% Wilson score interval. */
export const toRate = (count: number, of: number): Rate => {
  if (of === 0) return { count, of, rate: 0, low: 0, high: 0 };

  const z = 1.96;
  const p = count / of;
  const denominator = 1 + (z * z) / of;
  const centre = (p + (z * z) / (2 * of)) / denominator;
  const margin =
    (z * Math.sqrt((p * (1 - p)) / of + (z * z) / (4 * of * of))) / denominator;

  return {
    count,
    of,
    rate: p,
    low: Math.max(0, centre - margin),
    high: Math.min(1, centre + margin),
  };
};

const average = (values: number[]): number =>
  values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;

const addFight = (
  stats: EncounterStats | undefined,
  fight: { won: boolean; healthLost: number; turns: number },
): EncounterStats => {
  const fights = (stats?.fights ?? 0) + 1;
  return {
    fights,
    wins: (stats?.wins ?? 0) + (fight.won ? 1 : 0),
    // Running averages
    averageHealthLost:
      ((stats?.averageHealthLost ?? 0) * (fights - 1) + fight.healthLost) /
      fights,
    averageTurns:
      ((stats?.averageTurns ?? 0) * (fights - 1) + fight.turns) / fights,
  };
};

/** Summarises the results of many runs played with one policy. */
export const summarize = (results: RunResult[]): SimulationReport => {
  const won = results.filter((run) => run.outcome === "victory");
  const winRate = toRate(won.length, results.length);

  const deathsByFloor: Record<number, number> = {};
  const deathsByNodeType: Partial<Record<NodeType, number>> = {};
  const nodeTotals: Partial<Record<NodeType, number>> = {};
  const reachedCount: Record<number, number> = {};
  const encounters: Record<string, EncounterStats> = {};
  const fightsByNodeType: Partial<Record<NodeType, EncounterStats>> = {};
  const cards: Record<string, CardStats> = {};
  const relics: Record<string, RelicStats> = {};
  const violations: { seed: number; message: string }[] = [];

  const cardStats = (baseId: string) =>
    (cards[baseId] ??= {
      offered: 0,
      picked: 0,
      bought: 0,
      played: 0,
      runs: 0,
      wins: 0,
      winRateDelta: 0,
    });

  for (const run of results) {
    const isWin = run.outcome === "victory";

    if (run.outcome === "defeat") {
      deathsByFloor[run.floor] = (deathsByFloor[run.floor] ?? 0) + 1;
      if (run.lastNodeType) {
        deathsByNodeType[run.lastNodeType] =
          (deathsByNodeType[run.lastNodeType] ?? 0) + 1;
      }
    }

    for (let floor = 1; floor <= run.floor; floor++) {
      reachedCount[floor] = (reachedCount[floor] ?? 0) + 1;
    }

    for (const [type, count] of Object.entries(run.nodesVisited)) {
      const nodeType = type as NodeType;
      nodeTotals[nodeType] = (nodeTotals[nodeType] ?? 0) + count;
    }

    for (const fight of run.fights) {
      encounters[fight.encounter] = addFight(
        encounters[fight.encounter],
        fight,
      );
      fightsByNodeType[fight.nodeType] = addFight(
        fightsByNodeType[fight.nodeType],
        fight,
      );
    }

    for (const baseId of run.cardsOffered) cardStats(baseId).offered++;
    for (const baseId of run.cardsPicked) cardStats(baseId).picked++;
    for (const baseId of run.cardsBought) cardStats(baseId).bought++;
    for (const [baseId, count] of Object.entries(run.cardsPlayed)) {
      cardStats(baseId).played += count;
    }
    for (const baseId of new Set([...run.cardsPicked, ...run.cardsBought])) {
      const stats = cardStats(baseId);
      stats.runs++;
      if (isWin) stats.wins++;
    }

    for (const id of run.relics) {
      const stats = (relics[id] ??= { runs: 0, wins: 0, winRateDelta: 0 });
      stats.runs++;
      if (isWin) stats.wins++;
    }

    for (const message of run.violations) {
      violations.push({ seed: run.seed, message });
    }
  }

  for (const stats of [...Object.values(cards), ...Object.values(relics)]) {
    stats.winRateDelta = stats.runs
      ? stats.wins / stats.runs - winRate.rate
      : 0;
  }

  const perRun = <K extends string | number>(
    totals: Partial<Record<K, number>>,
  ): Record<K, number> => {
    const out = {} as Record<K, number>;
    for (const key of Object.keys(totals) as K[]) {
      out[key] = (totals[key] ?? 0) / Math.max(1, results.length);
    }
    return out;
  };

  return {
    policy: results[0]?.policy ?? "",
    runs: results.length,
    winRate,
    averageFloor: average(results.map((run) => run.floor)),
    averageTurns: average(results.map((run) => run.turns)),
    averageHealthLeftOnWin: average(
      won.map((run) => run.health / run.maxHealth),
    ),
    averageDeckSize: average(results.map((run) => run.deckSize)),
    averageRelics: average(results.map((run) => run.relics.length)),
    stuckSeeds: results
      .filter((run) => run.outcome === "stuck")
      .map((run) => run.seed),
    deathsByFloor,
    deathsByNodeType,
    nodesPerRun: perRun(nodeTotals),
    reachedFloor: perRun(reachedCount),
    encounters,
    fightsByNodeType,
    cards,
    relics,
    violations,
  };
};

const percent = (value: number): string => `${(value * 100).toFixed(1)}%`;

const signedPercent = (value: number): string =>
  `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}`;

const formatRate = (rate: Rate): string =>
  `${rate.count}/${rate.of} (${percent(rate.rate)}, 95% ${percent(
    rate.low,
  )}-${percent(rate.high)})`;

const table = (header: string[], rows: (string | number)[][]): string[] => {
  const cells = [header, ...rows.map((row) => row.map(String))];
  const widths = header.map((_, column) =>
    Math.max(...cells.map((row) => row[column].length)),
  );
  return cells.map(
    (row) =>
      "  " +
      row
        .map((cell, column) =>
          column === 0
            ? cell.padEnd(widths[column])
            : cell.padStart(widths[column]),
        )
        .join("  "),
  );
};

const encounterRows = (stats: Record<string, EncounterStats>) =>
  Object.entries(stats)
    .sort(([, a], [, b]) => b.averageHealthLost - a.averageHealthLost)
    .map(([name, s]) => [
      name,
      s.fights,
      percent(s.wins / s.fights),
      s.averageHealthLost.toFixed(1),
      s.averageTurns.toFixed(1),
    ]);

/** Entries with too few runs say nothing; they are left out of rankings. */
const MIN_RUNS_FOR_RANKING = 5;

/** A plain-text version of a report, for the terminal. */
export const formatReport = (report: SimulationReport): string => {
  const lines = [
    `Policy: ${report.policy}`,
    `Win rate: ${formatRate(report.winRate)}`,
    `Average floor reached: ${report.averageFloor.toFixed(1)}   ` +
      `turns: ${report.averageTurns.toFixed(1)}   ` +
      `deck: ${report.averageDeckSize.toFixed(1)}   ` +
      `relics: ${report.averageRelics.toFixed(1)}`,
    `Health left in won runs: ${percent(report.averageHealthLeftOnWin)}`,
    `Stuck runs: ${report.stuckSeeds.length}${
      report.stuckSeeds.length ? ` (seeds ${report.stuckSeeds.join(", ")})` : ""
    }`,
    `Invariant violations: ${report.violations.length}`,
    ...report.violations
      .slice(0, 10)
      .map(({ seed, message }) => `  seed ${seed}: ${message}`),
    "",
    "Runs still alive at each floor, and deaths on it:",
    ...table(
      ["floor", "reached", "died"],
      Object.keys(report.reachedFloor)
        .map(Number)
        .sort((a, b) => a - b)
        .map((floor) => [
          floor,
          percent(report.reachedFloor[floor]),
          report.deathsByFloor[floor] ?? 0,
        ]),
    ),
    "",
    "Nodes entered per run / runs lost there:",
    ...table(
      ["node", "per run", "deaths"],
      Object.entries(report.nodesPerRun).map(([type, perRun]) => [
        type,
        perRun.toFixed(1),
        report.deathsByNodeType[type as NodeType] ?? 0,
      ]),
    ),
    "",
    "Fights by node type:",
    ...table(
      ["node", "fights", "won", "health lost", "turns"],
      encounterRows(report.fightsByNodeType as Record<string, EncounterStats>),
    ),
    "",
    "Encounters, most costly first:",
    ...table(
      ["encounter", "fights", "won", "health lost", "turns"],
      encounterRows(report.encounters),
    ),
    "",
    "Cards (win-rate difference of the runs that had the card, in points):",
    ...table(
      [
        "card",
        "offered",
        "picked",
        "pick rate",
        "bought",
        "played",
        "runs",
        "win ±",
      ],
      Object.entries(report.cards)
        .sort(([, a], [, b]) => b.winRateDelta - a.winRateDelta)
        .map(([baseId, s]) => [
          baseId,
          s.offered,
          s.picked,
          s.offered ? percent(s.picked / s.offered) : "-",
          s.bought,
          s.played,
          s.runs,
          s.runs >= MIN_RUNS_FOR_RANKING ? signedPercent(s.winRateDelta) : "-",
        ]),
    ),
    "",
    "Relics (win-rate difference of the runs that held the relic, in points).",
    "Runs that get further hold more relics, so this flatters every relic;",
    "npm run simulate:impact measures each one on its own:",
    ...table(
      ["relic", "runs", "win ±"],
      Object.entries(report.relics)
        .sort(([, a], [, b]) => b.winRateDelta - a.winRateDelta)
        .map(([id, s]) => [
          id,
          s.runs,
          s.runs >= MIN_RUNS_FOR_RANKING ? signedPercent(s.winRateDelta) : "-",
        ]),
    ),
  ];
  return lines.join("\n");
};

/** One line per policy, to compare bots on the same seeds. */
export const formatComparison = (reports: SimulationReport[]): string =>
  [
    "Policies on the same seeds:",
    ...table(
      ["policy", "win rate", "95% range", "avg floor", "stuck", "violations"],
      reports.map((report) => [
        report.policy,
        percent(report.winRate.rate),
        `${percent(report.winRate.low)}-${percent(report.winRate.high)}`,
        report.averageFloor.toFixed(1),
        report.stuckSeeds.length,
        report.violations.length,
      ]),
    ),
  ].join("\n");
