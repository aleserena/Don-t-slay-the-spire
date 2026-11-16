import { describe, expect, it } from "vitest";
import { useGameStore } from "../../store/gameStore";
import { getAllCards } from "../../data/cards";
import { createCombatCounters } from "../../engine/triggers";
import {
  CardType,
  EffectType,
  GamePhase,
  MonsterCardType,
  StatusType,
  TargetType,
} from "../../types/game";
import { ConsequenceType, EventChoice, NodeType } from "../../types/map";
import {
  createTestCard,
  createTestEnemy,
  createTestPlayer,
} from "../../test/setup";
import { checkInvariants } from "../invariants";
import {
  createRandomPolicy,
  estimateCardValue,
  greedyPolicy,
  lookaheadPolicy,
} from "../policies";
import { formatComparison, formatReport, summarize, toRate } from "../report";
import { evaluateTurnEnd, findBestPlay, getIncomingDamage } from "../search";
import { simulateRun, simulateRuns } from "../simulator";
import { RunResult } from "../types";

const store = () => useGameStore.getState();

const seeds = (count: number, first = 1) =>
  Array.from({ length: count }, (_, index) => first + index);

const run = (overrides: Partial<RunResult>): RunResult => ({
  seed: 1,
  policy: "test",
  outcome: "defeat",
  floor: 3,
  combatsWon: 2,
  turns: 10,
  health: 0,
  maxHealth: 80,
  gold: 0,
  deckSize: 12,
  cardsPicked: [],
  cardsBought: [],
  cardsOffered: [],
  cardsPlayed: {},
  relics: [],
  fights: [],
  nodesVisited: {},
  violations: [],
  ...overrides,
});

const dataCard = (baseId: string, id = baseId) => ({
  ...getAllCards().find((card) => card.baseId === baseId)!,
  id,
});

const attacker = (damage: number, overrides = {}) =>
  createTestEnemy({
    currentCard: {
      id: "hit",
      baseId: "hit",
      name: "Hit",
      type: MonsterCardType.ATTACK,
      description: "",
      damage,
      priority: 1,
    },
    ...overrides,
  });

describe("simulator", () => {
  it.each([
    ["lookahead", lookaheadPolicy],
    ["greedy", greedyPolicy],
    ["random", createRandomPolicy(1)],
  ])("plays every run to an end with the %s policy", async (_name, policy) => {
    const results = await simulateRuns(seeds(20), policy);

    for (const result of results) {
      expect(["victory", "defeat"]).toContain(result.outcome);
      expect(result.violations).toEqual([]);
      expect(result.floor).toBeGreaterThanOrEqual(1);
      expect(result.floor).toBeLessThanOrEqual(15);
      expect(result.fights.length).toBeGreaterThan(0);
      // A run can also end in an event, so a defeat has at most one lost fight
      const diedInFight =
        result.outcome === "defeat" && result.lastNodeType !== NodeType.EVENT;
      expect(result.fights.filter((f) => !f.won).length).toBe(
        diedInFight ? 1 : 0,
      );
      if (result.outcome === "victory") {
        expect(result.lastNodeType).toBe(NodeType.BOSS);
      }
    }
  });

  it("gives the same result for the same seed", async () => {
    expect(await simulateRun(77)).toEqual(await simulateRun(77));
  });

  it("records fights, played cards and visited nodes", async () => {
    const result = await simulateRun(3);

    const fight = result.fights[0];
    expect(fight).toMatchObject({ floor: 1, nodeType: NodeType.COMBAT });
    expect(fight.encounter.length).toBeGreaterThan(0);
    expect(fight.turns).toBeGreaterThan(0);
    expect(result.fights.reduce((sum, f) => sum + f.turns, 0)).toBe(
      result.turns,
    );
    expect(
      Object.values(result.cardsPlayed).reduce((a, b) => a + b, 0),
    ).toBeGreaterThan(0);
    expect(Object.values(result.nodesVisited).reduce((a, b) => a + b, 0)).toBe(
      result.floor,
    );
    expect(result.relics.length).toBeGreaterThan(0);
  });

  it("leaves the store at the end of the run", async () => {
    const result = await simulateRun(3);

    expect(store().seed).toBe(3);
    expect(store().gamePhase).toBe(
      result.outcome === "victory" ? GamePhase.VICTORY : GamePhase.GAME_OVER,
    );
  });

  it("reports a run with no way forward as stuck", async () => {
    const result = await simulateRun(5, {
      ...greedyPolicy,
      chooseNode: (state, nodes) => {
        useGameStore.setState({ map: { ...state.map!, nodes: [] } });
        return nodes[0];
      },
    });

    expect(result.outcome).toBe("stuck");
  });

  it("stops at the step limit", async () => {
    const result = await simulateRun(5, greedyPolicy, { maxSteps: 3 });

    expect(result.outcome).toBe("stuck");
  });

  it("loses with a policy that never plays a card", async () => {
    const result = await simulateRun(9, {
      ...greedyPolicy,
      chooseCard: () => null,
    });

    expect(result.outcome).toBe("defeat");
    expect(result.combatsWon).toBe(0);
    expect(result.fights).toHaveLength(1);
    expect(result.fights[0].won).toBe(false);
  });

  it("does not loop on a card the engine refuses", async () => {
    const result = await simulateRun(9, {
      ...greedyPolicy,
      // Always aims at an enemy that does not exist
      chooseCard: (state) =>
        state.hand[0] ? { card: state.hand[0], targetId: "nobody" } : null,
    });

    expect(["victory", "defeat"]).toContain(result.outcome);
  });

  it("reports broken invariants with the step they appeared at", async () => {
    const result = await simulateRun(4, {
      ...greedyPolicy,
      chooseNode: (state, nodes) => {
        useGameStore.setState({ player: { ...state.player, gold: -5 } });
        return nodes[0];
      },
    });

    expect(result.violations[0]).toMatch(/^step \d+ \(\w+\): gold is negative/);
    expect(result.violations.length).toBeLessThanOrEqual(5);

    const unchecked = await simulateRun(4, greedyPolicy, {
      checkInvariants: false,
    });
    expect(unchecked.violations).toEqual([]);
  });

  it("lets a policy shop: the lookahead policy buys and removes", async () => {
    const results = await simulateRuns(seeds(30), lookaheadPolicy);
    const shopped = results.filter((r) => (r.nodesVisited.shop ?? 0) > 0);

    expect(shopped.length).toBeGreaterThan(0);
    // Buying a relic or removing a card shows as more relics or a deck that
    // is smaller than starter deck plus rewards
    const changed = shopped.some(
      (r) =>
        r.relics.length > 1 ||
        r.cardsBought.length > 0 ||
        r.deckSize < 10 + r.cardsPicked.length,
    );
    expect(changed).toBe(true);
  });
});

describe("invariants", () => {
  it("accepts a fresh run and a fresh combat", () => {
    store().startNewGame(1);
    expect(checkInvariants(store())).toEqual([]);

    store().startCombat([attacker(5, { id: "a" })]);
    expect(checkInvariants(store())).toEqual([]);
  });

  it("reports each kind of broken state", () => {
    store().startNewGame(1);
    store().startCombat([attacker(5, { id: "a" })]);
    const state = store();
    const card = state.hand[0];

    const problems = (changes: Partial<typeof state>) =>
      checkInvariants({ ...state, ...changes }).join(" | ");

    expect(problems({ player: { ...state.player, block: -1 } })).toContain(
      "block is negative",
    );
    expect(problems({ player: { ...state.player, health: 999 } })).toContain(
      "exceeds max health",
    );
    expect(problems({ player: { ...state.player, energy: 99 } })).toContain(
      "energy is 99",
    );
    expect(problems({ discardPile: [card] })).toContain("in two piles");
    expect(
      problems({ hand: [...state.hand, createTestCard({ id: "stray" })] }),
    ).toContain("not in the deck");
    expect(
      problems({ enemies: [{ ...state.enemies[0], health: 0 }] }),
    ).toContain("dead but still in combat");
    expect(problems({ enemies: [] })).toContain("no enemies");
    expect(problems({ rngState: 1.5 })).toContain("random state");
    expect(
      problems({ gamePhase: GamePhase.MAP, map: { ...state.map!, nodes: [] } }),
    ).toContain("nowhere to go");
    expect(problems({ gamePhase: GamePhase.MAP })).toContain(
      "combat piles outside a combat",
    );
  });
});

describe("turn search", () => {
  const turn = (overrides = {}) => ({
    player: createTestPlayer({ health: 50, energy: 3 }),
    enemies: [attacker(10, { id: "a", health: 40 })],
    hand: [],
    combat: createCombatCounters(),
    firstAttackThisCombat: false,
    ...overrides,
  });

  it("adds up what the enemies have announced", () => {
    const player = createTestPlayer();
    const weak = attacker(10, {
      statusEffects: [{ type: StatusType.WEAK, stacks: 1 }],
    });

    expect(getIncomingDamage(player, [attacker(10), attacker(4)])).toBe(14);
    expect(getIncomingDamage(player, [weak])).toBe(7);
    expect(getIncomingDamage(player, [createTestEnemy()])).toBe(0);
  });

  it("ends the turn when there is nothing useful to play", () => {
    expect(findBestPlay(turn())).toBeNull();
    expect(
      findBestPlay(
        turn({
          player: createTestPlayer({ energy: 0 }),
          hand: [dataCard("strike")],
        }),
      ),
    ).toBeNull();
  });

  it("takes the kill rather than blocking a hit from the enemy it kills", () => {
    const state = turn({
      player: createTestPlayer({ health: 50, energy: 1 }),
      enemies: [attacker(10, { id: "a", health: 6 })],
      hand: [dataCard("defend"), dataCard("strike")],
    });

    expect(findBestPlay(state)?.card.baseId).toBe("strike");
  });

  it("blocks when the hit would kill", () => {
    const state = turn({
      player: createTestPlayer({ health: 8, energy: 1 }),
      enemies: [attacker(10, { id: "a", health: 40 })],
      hand: [dataCard("strike"), dataCard("defend")],
    });

    expect(findBestPlay(state)?.card.baseId).toBe("defend");
  });

  it("aims at the enemy it can kill", () => {
    const state = turn({
      player: createTestPlayer({ health: 50, energy: 1 }),
      enemies: [
        attacker(10, { id: "big", health: 40 }),
        attacker(10, { id: "small", health: 5 }),
      ],
      hand: [dataCard("strike")],
    });

    expect(findBestPlay(state)).toMatchObject({ targetId: "small" });
  });

  it("plays the status before the attacks it makes stronger", () => {
    const vulnerable = createTestCard({
      id: "expose",
      baseId: "expose",
      type: CardType.SKILL,
      cost: 0,
      effects: [
        {
          type: EffectType.APPLY_STATUS,
          value: 1,
          target: TargetType.ENEMY,
          statusType: StatusType.VULNERABLE,
        },
      ],
    });
    const state = turn({
      player: createTestPlayer({ health: 50, energy: 1 }),
      enemies: [attacker(0, { id: "a", health: 9 })],
      hand: [dataCard("strike"), vulnerable],
    });

    // Strike alone leaves the enemy alive; exposed first, it dies
    expect(findBestPlay(state)?.card.id).toBe("expose");
  });

  it("scores a won fight above everything and a lost one below", () => {
    const base = turn();
    const won = evaluateTurnEnd({
      ...base,
      counters: base.combat,
      enemies: [],
    });
    const lost = evaluateTurnEnd({
      ...base,
      counters: base.combat,
      player: createTestPlayer({ health: 5 }),
    });
    const ongoing = evaluateTurnEnd({ ...base, counters: base.combat });

    expect(won).toBeGreaterThan(ongoing);
    expect(ongoing).toBeGreaterThan(lost);
  });
});

describe("policies", () => {
  it("rates cards by their numbers", () => {
    const value = (baseId: string) => estimateCardValue(dataCard(baseId));

    expect(value("bludgeon")).toBeGreaterThan(value("strike"));
    expect(value("strike")).toBeGreaterThan(0);
    expect(
      estimateCardValue(createTestCard({ effects: [], damage: undefined })),
    ).toBeLessThan(value("strike"));
  });

  it("the lookahead policy avoids an event choice that would kill", () => {
    const choice = (id: string, type: ConsequenceType, value: number) =>
      ({
        id,
        text: id,
        consequences: [{ type, value, description: "" }],
      }) as EventChoice;
    store().startNewGame(1);
    useGameStore.setState({ player: { ...store().player, health: 10 } });

    const picked = lookaheadPolicy.chooseEventChoice(store(), [
      choice("fatal", ConsequenceType.LOSE_HEALTH, 25),
      choice("small", ConsequenceType.GAIN_GOLD, 5),
    ]);

    expect(picked.id).toBe("small");
  });

  it("the lookahead policy heads for a rest site when hurt", () => {
    store().startNewGame(1);
    const map = store().map!;
    const [first, second] = map.nodes.filter((n) => n.y === 0);
    const typed = {
      ...map,
      nodes: map.nodes.map((node) =>
        node.y === 0 ? { ...node, connections: [] } : node,
      ),
    };
    const rest = { ...first, type: NodeType.REST };
    const elite = { ...second, type: NodeType.ELITE };
    useGameStore.setState({
      map: typed,
      player: { ...store().player, health: 10 },
    });

    expect(lookaheadPolicy.chooseNode(store(), [elite, rest]).id).toBe(rest.id);
  });

  it("the random policy is reproducible from its seed", async () => {
    const first = await simulateRun(8, createRandomPolicy(42));
    const second = await simulateRun(8, createRandomPolicy(42));

    expect(second).toEqual(first);
  });
});

describe("report", () => {
  it("gives a rate with its likely range", () => {
    const rate = toRate(30, 200);

    expect(rate.rate).toBe(0.15);
    expect(rate.low).toBeCloseTo(0.107, 2);
    expect(rate.high).toBeCloseTo(0.206, 2);
    expect(toRate(0, 0)).toMatchObject({ rate: 0, low: 0, high: 0 });
    expect(toRate(10, 10).high).toBe(1);
  });

  const results = [
    run({
      seed: 1,
      outcome: "victory",
      floor: 15,
      turns: 60,
      health: 40,
      relics: ["r1", "r2"],
      cardsOffered: ["a", "b", "c"],
      cardsPicked: ["a", "a"],
      cardsPlayed: { a: 7, strike: 20 },
      nodesVisited: { combat: 8, rest: 2 },
      fights: [
        {
          floor: 1,
          nodeType: NodeType.COMBAT,
          encounter: "Rat",
          turns: 3,
          healthLost: 4,
          won: true,
        },
      ],
    }),
    run({
      seed: 2,
      floor: 3,
      turns: 10,
      lastNodeType: NodeType.COMBAT,
      relics: ["r1"],
      cardsOffered: ["a", "b"],
      cardsPicked: ["a"],
      nodesVisited: { combat: 3 },
      fights: [
        {
          floor: 3,
          nodeType: NodeType.COMBAT,
          encounter: "Rat",
          turns: 5,
          healthLost: 10,
          won: false,
        },
      ],
    }),
    run({ seed: 3, floor: 3, turns: 20, lastNodeType: NodeType.ELITE }),
    run({
      seed: 4,
      outcome: "stuck",
      floor: 5,
      turns: 30,
      violations: ["step 3 (map): gold is negative (-5)"],
    }),
  ];

  it("counts wins, deaths, fights, cards and relics", () => {
    const report = summarize(results);

    expect(report).toMatchObject({
      policy: "test",
      runs: 4,
      averageFloor: 6.5,
      averageTurns: 30,
      averageHealthLeftOnWin: 0.5,
      stuckSeeds: [4],
      deathsByFloor: { 3: 2 },
      deathsByNodeType: { combat: 1, elite: 1 },
      nodesPerRun: { combat: 2.75, rest: 0.5 },
      violations: [{ seed: 4, message: "step 3 (map): gold is negative (-5)" }],
    });
    expect(report.winRate).toMatchObject({ count: 1, of: 4, rate: 0.25 });
    expect(report.reachedFloor[1]).toBe(1);
    expect(report.reachedFloor[4]).toBe(0.5);
    expect(report.reachedFloor[15]).toBe(0.25);
    expect(report.encounters.Rat).toEqual({
      fights: 2,
      wins: 1,
      averageHealthLost: 7,
      averageTurns: 4,
    });
    expect(report.cards.a).toEqual({
      offered: 2,
      picked: 3,
      bought: 0,
      played: 7,
      runs: 2,
      wins: 1,
      winRateDelta: 0.25,
    });
    expect(report.cards.b).toMatchObject({ offered: 2, picked: 0, runs: 0 });
    expect(report.relics.r1).toEqual({ runs: 2, wins: 1, winRateDelta: 0.25 });
    expect(report.relics.r2).toEqual({ runs: 1, wins: 1, winRateDelta: 0.75 });
  });

  it("handles no runs", () => {
    expect(summarize([])).toMatchObject({
      runs: 0,
      averageFloor: 0,
      policy: "",
    });
  });

  it("formats a report and a comparison as text", () => {
    const report = summarize(results);
    const text = formatReport(report);

    expect(text).toContain("Policy: test");
    expect(text).toContain("Win rate: 1/4 (25.0%");
    expect(text).toContain("Stuck runs: 1 (seeds 4)");
    expect(text).toContain("Invariant violations: 1");
    expect(text).toContain("seed 4: step 3 (map): gold is negative (-5)");
    expect(text).toMatch(/Rat\s+2\s+50\.0%\s+7\.0\s+4\.0/);
    expect(text).toMatch(/combat\s+2\.8\s+1/);

    const comparison = formatComparison([report, summarize([])]);
    expect(comparison).toMatch(/test\s+25\.0%/);
  });
});

describe("experiments", () => {
  it("applies a variant to every run and compares it with the baseline", async () => {
    const { runExperiment, withStartingCard, withStartingRelic } = await import(
      "../experiments"
    );
    const experimentSeeds = seeds(12);

    const report = await runExperiment(experimentSeeds, greedyPolicy, [
      withStartingRelic("anchor"),
      withStartingCard("bludgeon"),
      // Losing all health but one point can only hurt
      {
        name: "wounded",
        setup: () =>
          useGameStore.setState({
            player: { ...store().player, health: 1 },
          }),
      },
    ]);

    expect(report).toMatchObject({ policy: "greedy", runs: 12 });
    expect(report.variants.map((v) => v.name).sort()).toEqual([
      "anchor",
      "bludgeon",
      "wounded",
    ]);
    const wounded = report.variants.find((v) => v.name === "wounded")!;
    expect(wounded.floorDelta).toBeLessThan(0);
    expect(wounded.gained).toBe(0);
    // Sorted best first
    expect(report.variants[report.variants.length - 1].name).toBe("wounded");
  });

  it("starts runs with the extra relic or card", async () => {
    const { withStartingCard, withStartingRelic } = await import(
      "../experiments"
    );

    const withRelic = await simulateRun(2, greedyPolicy, {
      setup: withStartingRelic("anchor").setup,
    });
    expect(withRelic.relics).toContain("anchor");
    expect(withRelic.violations).toEqual([]);

    store().startNewGame(2);
    withStartingCard("bludgeon").setup();
    expect(store().persistentDeck.map((c) => c.baseId)).toContain("bludgeon");
    expect(store().drawPile).toHaveLength(store().persistentDeck.length);

    expect(() => withStartingRelic("nope").setup()).toThrow("Unknown relic");
    expect(() => withStartingCard("nope").setup()).toThrow("Unknown card");
  });

  it("formats an experiment as a table", async () => {
    const { formatExperiment } = await import("../experiments");

    const text = formatExperiment("Title", {
      policy: "p",
      runs: 10,
      baseline: toRate(5, 10),
      baselineFloor: 9,
      variants: [
        {
          name: "thing",
          winRate: toRate(7, 10),
          winRateDelta: 0.2,
          floorDelta: 1.5,
          gained: 3,
          lost: 1,
        },
      ],
    });

    expect(text).toContain("Title (p policy, 10 seeds)");
    expect(text).toContain("Baseline: 50.0% win rate");
    expect(text).toMatch(/thing\s+70\.0%\s+\+20\.0\s+\+1\.5\s+3\s+1/);
  });
});
