/**
 * The interface must work for any content: nothing in it may name a
 * specific card, relic or enemy, and what it shows is read from data or
 * worked out by the engine. Also covers keyboard play and the shared
 * screens.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useGameStore } from "../store/gameStore";
import { BRANDING } from "../config/branding";
import { GameBoard } from "../components/GameBoard";
import { GameOverScreen } from "../components/GameOverScreen";
import { MapView } from "../components/MapView";
import { TitleScreen } from "../components/TitleScreen";
import { getAllCards } from "../data/cards";
import { getAllBosses } from "../data/bosses";
import { getAllEnemies } from "../data/enemies";
import { getAllRelics } from "../data/relics";
import { previewCardPlay } from "../engine/preview";
import {
  createTestCard,
  createTestEnemy,
  createTestPlayer,
} from "../test/setup";
import {
  CardType,
  EffectType,
  GamePhase,
  IntentType,
  MonsterCardType,
  StatusType,
  TargetType,
  TurnPhase,
} from "../types/game";
import { getCardStatBadges } from "../utils/cardDisplay";
import { isMultiTargetCard } from "../utils/cardUtils";

const store = () => useGameStore.getState();

const dataCard = (baseId: string, id = `${baseId}_test`) => ({
  ...getAllCards().find((card) => card.baseId === baseId)!,
  id,
});

const idleEnemy = (id: string, health = 40) =>
  createTestEnemy({
    id,
    name: `Enemy ${id}`,
    health,
    maxHealth: health,
    deck: [
      {
        id: "idle",
        baseId: "idle",
        name: "Idle",
        type: MonsterCardType.DEFEND,
        description: "",
        block: 1,
        priority: 1,
      },
    ],
  });

const press = (key: string) => fireEvent.keyDown(window, { key });

beforeEach(() => {
  store().startNewGame(1);
});

afterEach(() => {
  cleanup();
});

describe("no content in the interface", () => {
  // The source of every component and of the config, as text
  const sources = import.meta.glob(
    ["../components/**/*.tsx", "../components/**/*.ts", "../config/*.ts"],
    { query: "?raw", import: "default", eager: true },
  ) as Record<string, string>;

  /**
   * Whether the source refers to a content id. Ids of several words are
   * looked for as any string literal. One-word ids can also be ordinary
   * words (a CSS value, say), so those only count where code compares
   * against them.
   */
  const mentionsId = (source: string, id: string) =>
    id.includes("_")
      ? new RegExp(`["'\`]${id}["'\`]`).test(source)
      : new RegExp(
          `(===|!==|case|includes\\(|[iI]d:)\\s*["'\`]${id}["'\`]`,
        ).test(source);

  it("finds the component sources", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(15);
  });

  it("recognises a mention of a content id", () => {
    expect(mentionsId('card.baseId === "bash"', "bash")).toBe(true);
    expect(mentionsId('case "bash":', "bash")).toBe(true);
    expect(mentionsId('ids.includes("bash")', "bash")).toBe(true);
    expect(mentionsId('display: "flex"', "flex")).toBe(false);
    expect(
      mentionsId('find((r) => r.id === "energy_core")', "energy_core"),
    ).toBe(true);
    expect(mentionsId('const x = "twin_strike";', "twin_strike")).toBe(true);
  });

  it("names no card, relic or enemy", () => {
    // An id that is also a word of the engine (an intent or effect type)
    // cannot be told apart from it, so it is not checked
    const engineWords = new Set<string>(
      [IntentType, MonsterCardType, CardType, EffectType, StatusType].flatMap(
        (values) => Object.values(values),
      ),
    );
    const ids = [
      ...getAllCards().map((card) => card.baseId),
      ...getAllRelics().map((relic) => relic.id),
    ].filter((id) => !engineWords.has(id));
    const names = [
      ...getAllCards().map((card) => card.name),
      ...getAllRelics().map((relic) => relic.name),
      ...getAllEnemies().map((enemy) => enemy.name),
      ...getAllBosses().map((boss) => boss.name),
    ].filter((name) => !engineWords.has(name.toLowerCase()));

    for (const [file, source] of Object.entries(sources)) {
      for (const id of ids) {
        expect(mentionsId(source, id), `${file} mentions "${id}"`).toBe(false);
      }
      for (const name of names) {
        expect(source.includes(name), `${file} mentions ${name}`).toBe(false);
      }
    }
  });

  it("keeps the game's name in the branding config", () => {
    for (const [file, source] of Object.entries(sources)) {
      if (file.includes("/config/")) continue;
      expect(source.includes(BRANDING.title), file).toBe(false);
      expect(/spire/i.test(source), `${file} mentions a spire`).toBe(false);
    }
  });
});

describe("look comes from the theme", () => {
  const sources = import.meta.glob("../components/**/*.tsx", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  // Developer tools, not part of the game's interface
  const isDebugTool = (file: string) => /Debug/.test(file);

  it("keeps colors out of components", () => {
    const color = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|linear-gradient/;

    for (const [file, source] of Object.entries(sources)) {
      if (isDebugTool(file)) continue;
      expect(color.test(source), `${file} sets a color`).toBe(false);
    }
  });

  it("uses inline styles only for geometry that depends on data", () => {
    // The health bar's width and a map node's position
    const allowed = ["ui/Combat.tsx", "MapView.tsx"];

    for (const [file, source] of Object.entries(sources)) {
      if (isDebugTool(file)) continue;
      if (allowed.some((name) => file.endsWith(name))) continue;
      expect(/\bstyle=/.test(source), `${file} has an inline style`).toBe(
        false,
      );
    }
  });
});

describe("card badges from data", () => {
  const strong = createTestPlayer({
    energy: 2,
    block: 6,
    statusEffects: [
      { type: StatusType.STRENGTH, stacks: 3 },
      { type: StatusType.DEXTERITY, stacks: 2 },
    ],
  });

  it("shows the card's own numbers without a player", () => {
    expect(getCardStatBadges(dataCard("strike"))).toEqual([
      { kind: "damage", label: "6" },
    ]);
    expect(getCardStatBadges(dataCard("defend"))).toEqual([
      { kind: "block", label: "5" },
    ]);
  });

  it("applies the player's modifiers", () => {
    expect(getCardStatBadges(dataCard("strike"), { player: strong })).toEqual([
      { kind: "damage", label: "9" },
    ]);
    expect(getCardStatBadges(dataCard("defend"), { player: strong })).toEqual([
      { kind: "block", label: "7" },
    ]);
  });

  it("describes any shape of card", () => {
    const card = createTestCard({
      effects: [
        { type: EffectType.DAMAGE, value: 4, target: TargetType.ALL_ENEMIES },
        { type: EffectType.DAMAGE, value: 4, target: TargetType.ALL_ENEMIES },
        {
          type: EffectType.DAMAGE_MULTIPLIER_ENERGY,
          value: 5,
          target: TargetType.ENEMY,
        },
        {
          type: EffectType.DAMAGE_MULTIPLIER_BLOCK,
          value: 0,
          multiplier: 2,
          target: TargetType.ENEMY,
        },
        { type: EffectType.BLOCK, value: 3, target: TargetType.SELF },
      ],
    });

    expect(getCardStatBadges(card)).toEqual([
      { kind: "damage", label: "4 × 2 to ALL" },
      { kind: "damage", label: "5×X" },
      { kind: "damage", label: "2x Block" },
      { kind: "block", label: "3" },
    ]);
    expect(getCardStatBadges(card, { player: strong })).toEqual([
      { kind: "damage", label: "7 × 2 to ALL" },
      { kind: "damage", label: "8×2" },
      // (6 block × 2) + 3 Strength
      { kind: "damage", label: "15" },
      { kind: "block", label: "5" },
    ]);
  });

  it("adds a first-attack bonus to the first hit only", () => {
    const player = createTestPlayer({
      relics: [
        {
          id: "bonus",
          name: "Bonus",
          description: "",
          rarity: getAllRelics()[0].rarity,
          effects: [
            {
              trigger: getAllRelics()[0].effects[0].trigger,
              effect: EffectType.FIRST_ATTACK_DAMAGE,
              value: 4,
            },
          ],
        },
      ],
    });
    const twoHits = createTestCard({
      type: CardType.ATTACK,
      effects: [
        { type: EffectType.DAMAGE, value: 5, target: TargetType.ENEMY },
        { type: EffectType.DAMAGE, value: 5, target: TargetType.ENEMY },
      ],
    });

    expect(getCardStatBadges(twoHits, { player, isFirstAttack: true })).toEqual(
      [
        { kind: "damage", label: "9" },
        { kind: "damage", label: "5" },
      ],
    );
  });

  it("leaves out the ongoing effects of power cards", () => {
    const power = createTestCard({
      type: CardType.POWER,
      effects: [
        {
          type: EffectType.BLOCK,
          value: 3,
          target: TargetType.SELF,
          trigger:
            store().player.powerCards[0]?.effects[0]?.trigger ??
            getAllCards()
              .find((c) => c.effects?.some((e) => e.trigger))!
              .effects!.find((e) => e.trigger)!.trigger,
        },
      ],
    });

    expect(getCardStatBadges(power)).toEqual([]);
  });

  it("knows a card hits every enemy from its effects", () => {
    const sweep = createTestCard({
      effects: [
        { type: EffectType.DAMAGE, value: 4, target: TargetType.ALL_ENEMIES },
      ],
    });

    expect(isMultiTargetCard(sweep)).toBe(true);
    expect(isMultiTargetCard(createTestCard())).toBe(false);
  });
});

describe("damage preview from the engine", () => {
  const player = createTestPlayer({ energy: 3 });

  it("shows what a card would do to its target", () => {
    const target = createTestEnemy({ id: "a", health: 20, block: 4 });
    const other = createTestEnemy({ id: "b", health: 20 });

    const preview = previewCardPlay({
      card: createTestCard(),
      player,
      enemies: [target, other],
      targetId: "a",
    });

    expect(preview).toEqual({
      a: { totalDamage: 6, healthLost: 2, wouldKill: false },
    });
  });

  it("includes statuses, every enemy hit, and kills", () => {
    const sweep = createTestCard({
      effects: [
        { type: EffectType.DAMAGE, value: 8, target: TargetType.ALL_ENEMIES },
      ],
    });
    const exposed = createTestEnemy({
      id: "a",
      health: 10,
      statusEffects: [{ type: StatusType.VULNERABLE, stacks: 1 }],
    });
    const healthy = createTestEnemy({ id: "b", health: 30 });

    expect(
      previewCardPlay({ card: sweep, player, enemies: [exposed, healthy] }),
    ).toEqual({
      a: { totalDamage: 12, healthLost: 10, wouldKill: true },
      b: { totalDamage: 8, healthLost: 8, wouldKill: false },
    });
  });

  it("uses the player's energy for cards that spend all of it", () => {
    const perEnergy = createTestCard({
      cost: "X",
      effects: [
        {
          type: EffectType.DAMAGE_MULTIPLIER_ENERGY,
          value: 5,
          target: TargetType.ALL_ENEMIES,
        },
      ],
    });
    const enemy = createTestEnemy({ id: "a", health: 40 });

    expect(
      previewCardPlay({ card: perEnergy, player, enemies: [enemy] }).a
        .totalDamage,
    ).toBe(15);
  });

  it("shows nothing for a card that deals no damage", () => {
    const guard = createTestCard({
      type: CardType.SKILL,
      effects: [{ type: EffectType.BLOCK, value: 5, target: TargetType.SELF }],
    });

    expect(
      previewCardPlay({
        card: guard,
        player,
        enemies: [createTestEnemy({ id: "a" })],
      }),
    ).toEqual({});
  });
});

describe("screens", () => {
  it("shows the game's name from the branding config", () => {
    store().startNewRun(1);
    render(<TitleScreen />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      BRANDING.title,
    );
    expect(screen.getByText(BRANDING.tagline)).toBeTruthy();
  });

  it("offers Continue only when there is a saved run", () => {
    store().startNewRun(1);
    render(<TitleScreen />);
    const button = () =>
      screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;

    expect(button().disabled).toBe(true);

    cleanup();
    useGameStore.setState({ hasSavedGame: true });
    render(<TitleScreen />);
    expect(button().disabled).toBe(false);
  });

  it("starts a run from the title screen", () => {
    store().startNewRun(1);
    render(<TitleScreen />);

    fireEvent.click(screen.getByRole("button", { name: "New Game" }));

    expect(store().gamePhase).toBe(GamePhase.MAP);
  });

  it("summarises a lost run", () => {
    useGameStore.setState({
      gamePhase: GamePhase.GAME_OVER,
      currentFloor: 7,
      combatsWon: 4,
    });
    render(<GameOverScreen />);

    const stat = (label: string) =>
      screen.getByText(label).parentElement!.textContent;
    expect(stat("Floor Reached")).toContain("7");
    expect(stat("Combats Won")).toContain("4");
    expect(screen.getByText(`Seed ${store().seed}`)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(store().gamePhase).toBe(GamePhase.MAP);
    expect(store().combatsWon).toBe(0);
  });
});

describe("map with the keyboard", () => {
  it("exposes nodes as buttons and enters one with Enter", () => {
    render(<MapView />);

    const available = screen.getAllByRole("button", { name: /available$/ });
    const locked = screen.getAllByRole("button", {
      name: /not reachable yet$/,
    });
    expect(available.length).toBeGreaterThanOrEqual(2);
    expect(available[0].tabIndex).toBe(0);
    expect(locked[0].tabIndex).toBe(-1);
    expect(locked[0].getAttribute("aria-disabled")).toBe("true");

    fireEvent.keyDown(locked[0], { key: "Enter" });
    expect(store().gamePhase).toBe(GamePhase.MAP);

    fireEvent.keyDown(available[0], { key: "Enter" });
    expect(store().gamePhase).toBe(GamePhase.COMBAT);
  });
});

describe("combat with the keyboard", () => {
  const startFight = (enemies = [idleEnemy("a"), idleEnemy("b")]) => {
    store().startCombat(enemies);
    useGameStore.setState({
      hand: [
        dataCard("strike", "attack_card"),
        dataCard("defend", "block_card"),
      ],
    });
    render(<GameBoard />);
  };

  it("labels cards and enemies for screen readers", () => {
    startFight();

    const card = screen.getByRole("button", { name: /^1: Strike, cost 1/ });
    expect(card.tabIndex).toBe(0);
    expect(screen.getByRole("group", { name: "Hand" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /^1: Enemy a, 40 of 40 health/ }),
    ).toBeTruthy();
  });

  it("plays an untargeted card with its number pressed twice", () => {
    startFight();

    press("2");
    expect(store().player.block).toBe(0);
    expect(store().hand).toHaveLength(2);

    press("2");
    expect(store().player.block).toBe(5);
    expect(store().hand.map((c) => c.id)).toEqual(["attack_card"]);
  });

  it("aims a targeted card with a second number", () => {
    startFight();

    press("1");
    expect(store().selectedCard?.id).toBe("attack_card");
    expect(store().enemies.map((e) => e.health)).toEqual([40, 40]);

    press("2");
    expect(store().enemies.map((e) => e.health)).toEqual([40, 34]);
    expect(store().selectedCard).toBeNull();
    expect(store().hand.map((c) => c.id)).toEqual(["block_card"]);
  });

  it("cancels with Escape", () => {
    startFight();

    press("1");
    press("Escape");
    expect(store().selectedCard).toBeNull();

    // The number now selects a card again instead of aiming
    press("2");
    press("Escape");
    press("2");
    expect(store().player.block).toBe(0);
    expect(store().hand).toHaveLength(2);
  });

  it("ignores numbers without a card and shortcuts with modifier keys", () => {
    startFight();

    press("7");
    fireEvent.keyDown(window, { key: "e", ctrlKey: true });

    expect(store().hand).toHaveLength(2);
    expect(store().currentTurn).toBe(TurnPhase.PLAYER_TURN);
    expect(store().playerTurnThisCombat).toBe(1);
  });

  it("ends the turn with E", async () => {
    startFight();

    press("e");
    await Promise.resolve();

    expect(store().playerTurnThisCombat).toBe(2);
  });

  it("activates a focused card with Enter and a focused enemy with Space", () => {
    startFight();

    fireEvent.keyDown(screen.getByRole("button", { name: /^1: Strike/ }), {
      key: "Enter",
    });
    expect(store().selectedCard?.id).toBe("attack_card");

    fireEvent.keyDown(screen.getByRole("button", { name: /^1: Enemy a/ }), {
      key: " ",
    });
    expect(store().enemies.map((e) => e.health)).toEqual([34, 40]);
  });

  it("marks a card the player cannot afford as disabled", () => {
    store().startCombat([idleEnemy("a")]);
    useGameStore.setState({
      hand: [dataCard("strike", "attack_card")],
      player: { ...store().player, energy: 0 },
    });
    render(<GameBoard />);

    const card = screen.getByRole("button", { name: /Not enough energy/ });
    expect(card.getAttribute("aria-disabled")).toBe("true");

    press("1");
    expect(store().selectedCard).toBeNull();
  });
});
