/**
 * Encounters by floor, the run summary and event costs
 * (docs/plans/2026-11-16-run-structure.md).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useGameStore } from "../store/gameStore";
import { VictoryScreen } from "../components/VictoryScreen";
import { EventScreen } from "../components/EventScreen";
import { createEncounter } from "../engine/combat";
import {
  createCombatEncounter,
  createEliteEncounter,
  getEncounterTier,
} from "../engine/encounters";
import { HARD_HEALTH_MULTIPLIER } from "../engine/constants";
import { canChooseEventOption, getChoiceGoldCost } from "../engine/events";
import { toSavedRun, writeSave } from "../store/saveGame";
import { getAllCards } from "../data/cards";
import { getBossForFloor } from "../data/bosses";
import { GamePhase } from "../types/game";
import { ConsequenceType, Event, EventChoice, NodeType } from "../types/map";
import { createSeededRng } from "../utils/random";

const store = () => useGameStore.getState();

const SEEDS = Array.from({ length: 60 }, (_, index) => index + 1);

const totalHealth = (enemies: { maxHealth: number }[]) =>
  enemies.reduce((total, enemy) => total + enemy.maxHealth, 0);

beforeEach(() => {
  localStorage.clear();
  store().startNewGame(1);
});

describe("encounters by floor", () => {
  it("splits the map into tiers", () => {
    expect([0, 2, 3, 8, 9, 13].map(getEncounterTier)).toEqual([
      "easy",
      "easy",
      "normal",
      "normal",
      "hard",
      "hard",
    ]);
  });

  it("starts with small fights", () => {
    for (const seed of SEEDS) {
      const enemies = createCombatEncounter(0, createSeededRng(seed));
      expect(enemies.length).toBeLessThanOrEqual(2);
      expect(totalHealth(enemies)).toBeLessThanOrEqual(70);
    }
  });

  it("uses groups from the middle of the map on", () => {
    for (const seed of SEEDS) {
      const enemies = createCombatEncounter(5, createSeededRng(seed));
      expect(enemies.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("makes the same fight tougher on the last floors", () => {
    for (const seed of SEEDS) {
      const normal = createCombatEncounter(5, createSeededRng(seed));
      const hard = createCombatEncounter(10, createSeededRng(seed));

      expect(hard.map((e) => e.name)).toEqual(normal.map((e) => e.name));
      expect(hard.map((e) => e.maxHealth)).toEqual(
        normal.map((e) => Math.floor(e.maxHealth * HARD_HEALTH_MULTIPLIER)),
      );
      expect(hard.every((e) => e.health === e.maxHealth)).toBe(true);
    }
  });

  it("keeps elite enemies for elite nodes", () => {
    const eliteNames = new Set<string>();
    for (const seed of SEEDS) {
      const elites = createEliteEncounter(6, createSeededRng(seed));
      expect(elites.every((e) => e.isElite)).toBe(true);
      elites.forEach((e) => eliteNames.add(e.name));
    }

    for (const seed of SEEDS) {
      for (const floor of [0, 5, 10]) {
        const enemies = createCombatEncounter(floor, createSeededRng(seed));
        expect(enemies.some((e) => e.isElite)).toBe(false);
        expect(enemies.some((e) => eliteNames.has(e.name))).toBe(false);
      }
    }
  });

  it("gives every enemy in a fight its own id and an opening card", () => {
    for (const seed of SEEDS) {
      for (const type of [NodeType.COMBAT, NodeType.ELITE, NodeType.BOSS]) {
        const enemies = createEncounter(type, 10, createSeededRng(seed));
        expect(new Set(enemies.map((e) => e.id)).size).toBe(enemies.length);
        expect(enemies.every((e) => e.currentCard)).toBe(true);
      }
    }
  });

  it("is the same for the same seed", () => {
    const describe = (seed: number) =>
      createEncounter(NodeType.COMBAT, 5, createSeededRng(seed)).map(
        (e) => `${e.name}/${e.health}/${e.currentCard?.baseId}`,
      );

    expect(describe(11)).toEqual(describe(11));
  });
});

describe("run summary", () => {
  const winFight = (boss = false) => {
    const enemy = boss
      ? { ...getBossForFloor(14), health: 1 }
      : { ...createCombatEncounter(0)[0], health: 1 };
    store().startCombat([enemy]);
    const strike = {
      ...getAllCards().find((c) => c.baseId === "strike")!,
      id: "strike_test",
    };
    useGameStore.setState({ hand: [strike] });
    store().playCard("strike_test", store().enemies[0].id);
  };

  it("counts combats won", () => {
    expect(store().combatsWon).toBe(0);

    winFight();
    store().skipCardReward();
    winFight();

    expect(store().combatsWon).toBe(2);
  });

  it("starts the count again on a new run", () => {
    winFight();
    store().startNewGame(2);

    expect(store().combatsWon).toBe(0);
  });

  it("keeps the count in the save", () => {
    winFight();
    store().skipCardReward();
    writeSave(toSavedRun(store())!);

    store().startNewRun(3);
    store().loadSavedGame();

    expect(store().combatsWon).toBe(1);
  });

  it("shows the run summary after the boss", () => {
    useGameStore.setState({ currentFloor: 15 });
    winFight(true);
    expect(store().gamePhase).toBe(GamePhase.VICTORY);

    render(<VictoryScreen />);

    const stat = (label: string) =>
      screen.getByText(label).parentElement!.textContent;
    expect(stat("Floors Climbed")).toContain("15");
    expect(stat("Combats Won")).toContain("1");
    expect(stat("Deck Size")).toContain(String(store().persistentDeck.length));
    expect(stat("Gold")).toContain(String(store().player.gold));
    expect(screen.getByText(`Seed ${store().seed}`)).toBeTruthy();
  });

  it("starts a new run from the summary", () => {
    winFight(true);
    render(<VictoryScreen />);

    screen.getByText("New Run").click();

    expect(store().gamePhase).toBe(GamePhase.MAP);
    expect(store().combatsWon).toBe(0);
  });
});

describe("event choices and gold", () => {
  const pay = (gold: number): EventChoice => ({
    id: "pay",
    text: "Pay",
    consequences: [
      { type: ConsequenceType.LOSE_GOLD, value: gold, description: "" },
      { type: ConsequenceType.GAIN_MAX_HEALTH, value: 5, description: "" },
    ],
  });
  const free: EventChoice = {
    id: "free",
    text: "Walk away",
    consequences: [
      { type: ConsequenceType.GAIN_GOLD, value: 10, description: "" },
    ],
  };
  const event = (choice: EventChoice): Event => ({
    id: "test_event",
    name: "Test Event",
    description: "",
    choices: [choice, free],
  });

  const openEvent = (choice: EventChoice, gold: number) =>
    useGameStore.setState({
      gamePhase: GamePhase.EVENT,
      currentEvent: event(choice),
      player: { ...store().player, gold },
    });

  it("adds up what a choice costs", () => {
    expect(getChoiceGoldCost(pay(75))).toBe(75);
    expect(getChoiceGoldCost(free)).toBe(0);
    expect(canChooseEventOption(pay(75), { ...store().player, gold: 74 })).toBe(
      false,
    );
    expect(canChooseEventOption(pay(75), { ...store().player, gold: 75 })).toBe(
      true,
    );
  });

  it("rejects a choice the player cannot pay for", () => {
    openEvent(pay(75), 74);
    const maxHealth = store().player.maxHealth;

    store().selectEventChoice("pay");

    expect(store().gamePhase).toBe(GamePhase.EVENT);
    expect(store().currentEvent).toBeDefined();
    expect(store().player).toMatchObject({ gold: 74, maxHealth });
  });

  it("allows a choice that costs exactly the player's gold", () => {
    openEvent(pay(75), 75);
    const maxHealth = store().player.maxHealth;

    store().selectEventChoice("pay");

    expect(store().gamePhase).toBe(GamePhase.MAP);
    expect(store().player).toMatchObject({
      gold: 0,
      maxHealth: maxHealth + 5,
    });
  });

  it("always allows a free choice", () => {
    openEvent(pay(75), 0);

    store().selectEventChoice("free");

    expect(store().gamePhase).toBe(GamePhase.MAP);
    expect(store().player.gold).toBe(10);
  });

  it("disables the button of a choice the player cannot pay for", () => {
    openEvent(pay(75), 20);

    render(<EventScreen />);

    const payButton = screen.getByText(/Pay/).closest("button")!;
    const freeButton = screen.getByText(/Walk away/).closest("button")!;
    expect(payButton.disabled).toBe(true);
    expect(payButton.textContent).toContain("not enough gold");
    expect(freeButton.disabled).toBe(false);
  });
});
