import { describe, expect, it } from "vitest";
import { useGameStore } from "../../store/gameStore";
import { GamePhase } from "../../types/game";
import { NodeType } from "../../types/map";
import {
  defaultPolicy,
  formatReport,
  RunResult,
  simulateRun,
  simulateRuns,
  summarize,
} from "../simulator";

const run = (overrides: Partial<RunResult>): RunResult => ({
  seed: 1,
  outcome: "defeat",
  floor: 3,
  combatsWon: 2,
  turns: 10,
  health: 0,
  deckSize: 12,
  cardsPicked: [],
  cardsOffered: [],
  ...overrides,
});

describe("simulator", () => {
  it("plays every run to an end without getting stuck", async () => {
    const seeds = Array.from({ length: 25 }, (_, index) => index + 1);

    const { results, report } = await simulateRuns(seeds);

    expect(report.stuckSeeds).toEqual([]);
    for (const result of results) {
      expect(["victory", "defeat"]).toContain(result.outcome);
      expect(result.floor).toBeGreaterThanOrEqual(1);
      expect(result.floor).toBeLessThanOrEqual(15);
      expect(result.turns).toBeGreaterThan(0);
      if (result.outcome === "defeat") expect(result.health).toBe(0);
      if (result.outcome === "victory") {
        expect(result.floor).toBe(15);
        expect(result.lastNodeType).toBe(NodeType.BOSS);
      }
    }
  });

  it("leaves the store at the end of the run", async () => {
    const result = await simulateRun(3);

    expect(useGameStore.getState().seed).toBe(3);
    expect(useGameStore.getState().gamePhase).toBe(
      result.outcome === "victory" ? GamePhase.VICTORY : GamePhase.GAME_OVER,
    );
  });

  it("gives the same result for the same seed", async () => {
    const first = await simulateRun(77);
    const second = await simulateRun(77);

    expect(second).toEqual(first);
  });

  it("reports a run with no way forward as stuck", async () => {
    const result = await simulateRun(5, {
      ...defaultPolicy,
      // Never plays a card, and the map has no nodes to go to
      chooseNode: (state, nodes) => {
        useGameStore.setState({
          map: { ...state.map!, nodes: [] },
        });
        return nodes[0];
      },
    });

    expect(result.outcome).toBe("stuck");
  });

  it("can lose: a policy that never plays cards dies", async () => {
    const result = await simulateRun(9, {
      ...defaultPolicy,
      chooseCard: () => null,
    });

    expect(result.outcome).toBe("defeat");
    expect(result.combatsWon).toBe(0);
  });

  it("can skip rewards", async () => {
    const result = await simulateRun(9, {
      ...defaultPolicy,
      chooseReward: () => null,
    });

    expect(result.cardsPicked).toEqual([]);
  });
});

describe("summarize", () => {
  it("counts wins, deaths and card statistics", () => {
    const report = summarize([
      run({
        seed: 1,
        outcome: "victory",
        floor: 15,
        turns: 60,
        cardsOffered: ["a", "b", "c"],
        cardsPicked: ["a", "a"],
      }),
      run({
        seed: 2,
        floor: 3,
        turns: 10,
        lastNodeType: NodeType.COMBAT,
        cardsOffered: ["a", "b"],
        cardsPicked: ["a"],
      }),
      run({ seed: 3, floor: 3, turns: 20, lastNodeType: NodeType.ELITE }),
      run({ seed: 4, outcome: "stuck", floor: 5, turns: 30 }),
    ]);

    expect(report).toMatchObject({
      runs: 4,
      wins: 1,
      winRate: 0.25,
      averageFloor: 6.5,
      averageTurns: 30,
      stuckSeeds: [4],
      deathsByFloor: { 3: 2 },
      deathsByNodeType: { combat: 1, elite: 1 },
    });
    expect(report.cards.a).toEqual({ offered: 2, picked: 3, wins: 1, runs: 2 });
    expect(report.cards.b).toEqual({ offered: 2, picked: 0, wins: 0, runs: 0 });
  });

  it("handles no runs", () => {
    expect(summarize([])).toMatchObject({
      runs: 0,
      winRate: 0,
      averageFloor: 0,
    });
  });

  it("formats a report as text", () => {
    const text = formatReport(
      summarize([
        run({ outcome: "victory", floor: 15, cardsPicked: ["a"] }),
        run({ seed: 2, outcome: "stuck" }),
        run({ seed: 3, lastNodeType: NodeType.COMBAT }),
      ]),
    );

    expect(text).toContain("Runs: 3   Wins: 1 (33.3%)");
    expect(text).toContain("Stuck runs: 1 (seeds 2)");
    expect(text).toContain("floor  3: 1");
    expect(text).toContain("combat: 1");
    expect(text).toMatch(/a\s+0\s+1\s+100\.0%/);
  });
});
