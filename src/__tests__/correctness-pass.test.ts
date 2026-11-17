/**
 * Regression tests for the engine correctness pass
 * (docs/plans/2026-11-16-engine-correctness-pass.md).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "../store/gameStore";
import { getAllCards } from "../data/cards";
import { getAllRelics } from "../data/relics";
import { createTestEnemy } from "../data/enemies";
import { getBossForFloor } from "../data/bosses";
import { cultistCards } from "../data/monsterCards";
import {
  Card,
  EffectType,
  Enemy,
  GamePhase,
  MonsterCard,
  MonsterCardType,
  StatusType,
  TargetType,
} from "../types/game";
import { upgradeCard } from "../utils/cardUpgrades";

const store = () => useGameStore.getState();

const relic = (id: string) => getAllRelics().find((r) => r.id === id)!;

const card = (baseId: string, id = `${baseId}_test`): Card => ({
  ...getAllCards().find((c) => c.baseId === baseId)!,
  id,
});

const attackCard: MonsterCard = {
  id: "test_attack",
  baseId: "test_attack",
  name: "Test Attack",
  type: MonsterCardType.ATTACK,
  description: "Deal 10 damage.",
  damage: 10,
  priority: 1,
};

const idleCard: MonsterCard = {
  id: "test_idle",
  baseId: "test_idle",
  name: "Test Idle",
  type: MonsterCardType.DEFEND,
  description: "Gain 1 Block.",
  block: 1,
  priority: 1,
};

const vulnerableCard: MonsterCard = {
  id: "test_vulnerable",
  baseId: "test_vulnerable",
  name: "Test Vulnerable",
  type: MonsterCardType.DEBUFF,
  description: "Apply 1 Vulnerable.",
  priority: 1,
  effects: [
    {
      type: EffectType.APPLY_STATUS,
      value: 1,
      target: TargetType.ENEMY,
      statusType: StatusType.VULNERABLE,
    },
  ],
};

/** An enemy that plays `first` on its first turn and `next` afterwards. */
const enemy = (
  first: MonsterCard,
  next: MonsterCard = first,
  overrides: Partial<Enemy> = {},
): Enemy => ({
  ...createTestEnemy(),
  id: `enemy_${Math.random()}`,
  health: 500,
  maxHealth: 500,
  deck: [next],
  currentCard: first,
  ...overrides,
});

const stacks = (
  entity: { statusEffects: { type: StatusType; stacks: number }[] },
  type: StatusType,
) => entity.statusEffects.find((e) => e.type === type)?.stacks ?? 0;

/** Starts a fresh run with the given relics and enters a combat. */
const startCombat = (enemies: Enemy[], relicIds: string[] = []) => {
  store().startNewGame();
  useGameStore.setState({
    player: { ...store().player, relics: relicIds.map(relic) },
  });
  store().startCombat(enemies);
};

const setHand = (...cards: Card[]) => useGameStore.setState({ hand: cards });

beforeEach(() => {
  store().startNewGame();
});

describe("status timing", () => {
  it("Weak 1 on an enemy weakens its next attack", async () => {
    startCombat([
      enemy(attackCard, attackCard, {
        statusEffects: [{ type: StatusType.WEAK, stacks: 1 }],
      }),
    ]);
    const before = store().player.health;

    await store().endTurn();

    expect(before - store().player.health).toBe(7);
    expect(stacks(store().enemies[0], StatusType.WEAK)).toBe(0);
  });

  it("Vulnerable 1 from an enemy boosts that enemy's next attack, then ends", async () => {
    startCombat([enemy(vulnerableCard, attackCard)]);

    await store().endTurn();
    expect(stacks(store().player, StatusType.VULNERABLE)).toBe(1);
    const before = store().player.health;

    await store().endTurn();

    expect(before - store().player.health).toBe(15);
    expect(stacks(store().player, StatusType.VULNERABLE)).toBe(0);
  });

  it("Vulnerable 2 on an enemy lasts through the next player turn", async () => {
    startCombat([
      enemy(idleCard, idleCard, {
        statusEffects: [{ type: StatusType.VULNERABLE, stacks: 2 }],
      }),
    ]);

    await store().endTurn();
    expect(stacks(store().enemies[0], StatusType.VULNERABLE)).toBe(1);

    await store().endTurn();
    expect(stacks(store().enemies[0], StatusType.VULNERABLE)).toBe(0);
  });

  it("an enemy killed by poison does not attack", async () => {
    startCombat([
      enemy(attackCard, attackCard, {
        health: 3,
        statusEffects: [{ type: StatusType.POISON, stacks: 5 }],
      }),
    ]);
    const before = store().player.health;

    await store().endTurn();

    expect(store().player.health).toBe(before);
    expect(store().gamePhase).toBe(GamePhase.CARD_REWARD);
  });
});

describe("block at turn start", () => {
  it("combat-start block lasts through the first turn only", async () => {
    startCombat([enemy(idleCard)], ["anchor"]);
    expect(store().player.block).toBe(10);

    await store().endTurn();
    expect(store().player.block).toBe(0);
  });

  it("a block-loss limit keeps the rest of the block", async () => {
    startCombat([enemy(idleCard)], ["calipers"]);
    expect(store().player.block).toBe(0);

    useGameStore.setState({ player: { ...store().player, block: 20 } });
    await store().endTurn();

    expect(store().player.block).toBe(5);
  });

  it("block never goes below zero with a block-loss limit", async () => {
    startCombat([enemy(idleCard)], ["calipers"]);
    useGameStore.setState({ player: { ...store().player, block: 4 } });

    await store().endTurn();

    expect(store().player.block).toBe(0);
  });
});

describe("playing cards", () => {
  it("a power card leaves play", () => {
    startCombat([enemy(idleCard)]);
    setHand(card("inflame"));

    store().playCard("inflame_test");

    const { hand, drawPile, discardPile } = store();
    const inPiles = [...hand, ...drawPile, ...discardPile].some(
      (c) => c.id === "inflame_test",
    );
    expect(inPiles).toBe(false);
    expect(stacks(store().player, StatusType.STRENGTH)).toBe(2);
  });

  it("a targeted card without a target is rejected when there are several enemies", () => {
    startCombat([enemy(idleCard), enemy(idleCard)]);
    setHand(card("bash"));

    store().playCard("bash_test");

    expect(store().player.energy).toBe(3);
    expect(store().hand).toHaveLength(1);
  });

  it("a targeted card aimed at an unknown enemy is rejected", () => {
    startCombat([enemy(idleCard)]);
    setHand(card("bash"));

    store().playCard("bash_test", "nobody");

    expect(store().player.energy).toBe(3);
    expect(store().hand).toHaveLength(1);
    expect(store().enemies[0].health).toBe(500);
  });

  it("a targeted card without a target hits the only enemy", () => {
    startCombat([enemy(idleCard)]);
    setHand(card("bash"));

    store().playCard("bash_test");

    expect(store().enemies[0].health).toBe(492);
    expect(store().player.energy).toBe(1);
  });

  it("the first-attack bonus applies to one hit only", () => {
    startCombat([enemy(idleCard)], ["akabeko"]);
    setHand(card("twin_strike"));

    store().playCard("twin_strike_test", store().enemies[0].id);

    expect(store().enemies[0].health).toBe(500 - 18);
  });

  it("the first-attack bonus is added before Vulnerable", () => {
    startCombat(
      [
        enemy(idleCard, idleCard, {
          statusEffects: [{ type: StatusType.VULNERABLE, stacks: 1 }],
        }),
      ],
      ["akabeko"],
    );
    setHand(card("strike"));

    store().playCard("strike_test", store().enemies[0].id);

    // (6 + 8) * 1.5
    expect(store().enemies[0].health).toBe(500 - 21);
  });
});

describe("upgrades", () => {
  const effectValue = (c: Card, type: EffectType) =>
    c.effects?.find((e) => e.type === type)?.value;

  it("Strike+ deals its upgraded damage", () => {
    startCombat([enemy(idleCard)]);
    setHand(upgradeCard(card("strike")));

    store().playCard("strike_test", store().enemies[0].id);

    expect(store().enemies[0].health).toBe(491);
  });

  it("Defend+ gives its upgraded block", () => {
    startCombat([enemy(idleCard)]);
    setHand(upgradeCard(card("defend")));

    store().playCard("defend_test");

    expect(store().player.block).toBe(8);
  });

  it("keeps legacy fields in sync with effects", () => {
    const ironWave = upgradeCard(card("iron_wave"));
    expect(effectValue(ironWave, EffectType.DAMAGE)).toBe(7);
    expect(effectValue(ironWave, EffectType.BLOCK)).toBe(7);

    const pommel = upgradeCard(card("pommel_strike"));
    expect(effectValue(pommel, EffectType.DAMAGE)).toBe(10);
    expect(effectValue(pommel, EffectType.DRAW_CARDS)).toBe(1);
  });

  it("generic upgrade raises damage by 3 and keeps the cost", () => {
    const bludgeon = upgradeCard(card("bludgeon"));
    expect(bludgeon.cost).toBe(3);
    expect(bludgeon.damage).toBe(35);
    expect(effectValue(bludgeon, EffectType.DAMAGE)).toBe(35);
    expect(bludgeon.description).toBe("Deal 35 damage.");
  });

  it("generic upgrade raises other effects by 1 when there is no damage or block", () => {
    const shockwave = upgradeCard(card("shockwave"));
    expect(shockwave.cost).toBe(2);
    expect(shockwave.effects?.map((e) => e.value)).toEqual([4, 4]);
    expect(shockwave.description).toBe(
      "Apply 4 Weak and 4 Vulnerable to ALL enemies.",
    );

    const seeingRed = upgradeCard(card("seeing_red"));
    expect(seeingRed.cost).toBe(1);
    expect(effectValue(seeingRed, EffectType.GAIN_ENERGY)).toBe(3);
  });

  it("generic upgrade lowers the cost only when nothing else improves", () => {
    const entrench = upgradeCard(card("entrench"));
    expect(entrench.cost).toBe(1);
    expect(effectValue(entrench, EffectType.BLOCK)).toBe(0);
  });

  it("does not touch secondary effects of a damage card", () => {
    const shrug = upgradeCard(card("shrug_it_off"));
    expect(effectValue(shrug, EffectType.BLOCK)).toBe(11);
    expect(effectValue(shrug, EffectType.DRAW_CARDS)).toBe(1);
    expect(shrug.cost).toBe(1);
  });

  it("returns an upgraded card unchanged", () => {
    const once = upgradeCard(card("bludgeon"));
    expect(upgradeCard(once)).toBe(once);
  });
});

describe("enemies and bosses", () => {
  it("the boss of the first act is not scaled and has its own deck", () => {
    const cultistIds = new Set(cultistCards.map((c) => c.baseId));

    for (let i = 0; i < 30; i++) {
      const boss = getBossForFloor(14);
      expect(boss.maxHealth).toBeLessThanOrEqual(250);
      expect(boss.deck.length).toBeGreaterThan(0);
      expect(boss.deck.some((c) => cultistIds.has(c.baseId))).toBe(false);
    }
  });

  it("every enemy enters combat with a card and a matching intent", () => {
    startCombat([
      getBossForFloor(14),
      { ...createTestEnemy(), currentCard: undefined },
    ]);

    for (const e of store().enemies) {
      expect(e.currentCard).toBeDefined();
      expect(e.intent.card).toBe(e.currentCard);
    }
  });
});

describe("run flow", () => {
  it("killing the boss wins the run", () => {
    startCombat([{ ...getBossForFloor(14), health: 8 }]);
    setHand(card("twin_strike"));

    store().playCard("twin_strike_test", store().enemies[0].id);

    expect(store().gamePhase).toBe(GamePhase.VICTORY);
    expect(store().enemies).toHaveLength(0);
  });

  it("a normal victory goes to the card reward", () => {
    startCombat([enemy(idleCard, idleCard, { health: 1 })]);
    setHand(card("strike"));

    store().playCard("strike_test", store().enemies[0].id);

    expect(store().gamePhase).toBe(GamePhase.CARD_REWARD);
  });

  it("entering a node updates the current floor", () => {
    store().startNewGame();
    const map = store().map!;
    const node = map.nodes.find((n) => n.y === 3)!;
    useGameStore.setState({
      map: {
        ...map,
        nodes: map.nodes.map((n) =>
          n.id === node.id ? { ...n, available: true } : n,
        ),
      },
    });

    store().selectNode(node.id);

    expect(store().currentFloor).toBe(4);
  });
});
