/**
 * Store-level tests for the effect and trigger pipeline
 * (plans/2026-11-16-effect-trigger-pipeline.md). Mechanics are exercised
 * with fixture cards and relics; a few existing entries are checked at the
 * end to pin their annotations.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "../store/gameStore";
import { getAllCards } from "../data/cards";
import { getAllRelics } from "../data/relics";
import { getPowerCardDefinition } from "../data/powerCards";
import { MAX_HAND_SIZE } from "../engine/constants";
import { cardNeedsTarget } from "../utils/cardUtils";
import { upgradeCard } from "../utils/cardUpgrades";
import {
  Card,
  CardEffect,
  CardRarity,
  CardType,
  EffectType,
  Enemy,
  GamePhase,
  MonsterCard,
  MonsterCardType,
  PowerTrigger,
  Relic,
  RelicEffect,
  RelicRarity,
  RelicTrigger,
  StatusType,
  TargetType,
} from "../types/game";
import { createTestCards, createTestEnemy } from "../test/setup";

const store = () => useGameStore.getState();

const fixtureCard = (
  id: string,
  type: CardType,
  effects: CardEffect[],
  overrides: Partial<Card> = {},
): Card => ({
  id,
  baseId: id,
  name: id,
  cost: 0,
  type,
  rarity: CardRarity.COMMON,
  description: "",
  effects,
  ...overrides,
});

const fixtureRelic = (id: string, ...effects: RelicEffect[]): Relic => ({
  id,
  name: id,
  description: "",
  rarity: RelicRarity.COMMON,
  effects,
});

const dataCard = (baseId: string): Card => ({
  ...getAllCards().find((c) => c.baseId === baseId)!,
  id: `${baseId}_test`,
});

const dataRelic = (id: string) => getAllRelics().find((r) => r.id === id)!;

const monsterCard = (overrides: Partial<MonsterCard>): MonsterCard => ({
  id: "fixture_monster_card",
  baseId: "fixture_monster_card",
  name: "Fixture",
  type: MonsterCardType.DEFEND,
  description: "",
  priority: 1,
  ...overrides,
});

const idle = monsterCard({ block: 1 });
const attack10 = monsterCard({ type: MonsterCardType.ATTACK, damage: 10 });

const enemy = (card: MonsterCard = idle, overrides: Partial<Enemy> = {}) =>
  createTestEnemy({
    id: `enemy_${Math.random()}`,
    health: 500,
    maxHealth: 500,
    deck: [card],
    currentCard: card,
    ...overrides,
  });

const startCombat = (enemies: Enemy[], relics: Relic[] = []) => {
  store().startNewGame();
  useGameStore.setState({ player: { ...store().player, relics } });
  store().startCombat(enemies);
};

const play = (card: Card, targetId?: string) => {
  useGameStore.setState({ hand: [...store().hand, card] });
  store().playCard(card.id, targetId);
};

const strength = () =>
  store().player.statusEffects.find((e) => e.type === StatusType.STRENGTH)
    ?.stacks ?? 0;

const selfBlock = (value: number): CardEffect => ({
  type: EffectType.BLOCK,
  value,
  target: TargetType.SELF,
});

beforeEach(() => {
  store().startNewGame();
});

describe("card play", () => {
  it("an exhausting card goes to the exhaust pile and raises card_exhausted", () => {
    startCombat([enemy()]);
    play(
      fixtureCard("on_exhaust", CardType.POWER, [
        { ...selfBlock(3), trigger: PowerTrigger.CARD_EXHAUSTED },
      ]),
    );

    const card = fixtureCard("exhauster", CardType.SKILL, [], {
      exhaust: true,
    });
    play(card);

    expect(store().exhaustPile.map((c) => c.id)).toEqual(["exhauster"]);
    expect(store().discardPile.some((c) => c.id === "exhauster")).toBe(false);
    expect(store().player.block).toBe(3);
  });

  it("an exhausted card does not come back within the combat, but stays in the deck", async () => {
    startCombat([enemy(idle, { health: 1 })]);
    const card = fixtureCard("exhauster", CardType.SKILL, [], {
      exhaust: true,
    });
    useGameStore.setState({
      persistentDeck: [...store().persistentDeck, card],
      drawPile: [],
      discardPile: [],
      hand: [card],
    });

    store().playCard("exhauster");
    await store().endTurn();
    expect(store().hand.some((c) => c.id === "exhauster")).toBe(false);

    play(dataCard("strike"), store().enemies[0].id);
    store().skipCardReward();
    expect(store().drawPile.some((c) => c.id === "exhauster")).toBe(true);
    expect(store().exhaustPile).toHaveLength(0);
  });

  it("an ongoing power effect is not applied when the card is played", () => {
    startCombat([enemy()]);

    play(
      fixtureCard("block_each_turn", CardType.POWER, [
        { ...selfBlock(3), trigger: PowerTrigger.TURN_END },
      ]),
    );

    expect(store().player.block).toBe(0);
    expect(store().player.powerCards).toHaveLength(1);
    expect(store().player.powerCards[0].effects).toHaveLength(1);
  });

  it("a turn-end power effect fires every turn", async () => {
    startCombat([enemy(attack10)]);
    play(
      fixtureCard("block_each_turn", CardType.POWER, [
        { ...selfBlock(4), trigger: PowerTrigger.TURN_END },
      ]),
    );
    const before = store().player.health;

    await store().endTurn();
    expect(before - store().player.health).toBe(6);

    await store().endTurn();
    expect(before - store().player.health).toBe(12);
  });

  it("a turn-end power can lose health and kill enemies", async () => {
    startCombat([enemy(idle, { health: 5 })]);
    play(
      fixtureCard("burn", CardType.POWER, [
        {
          type: EffectType.LOSE_HP,
          value: 1,
          target: TargetType.SELF,
          trigger: PowerTrigger.TURN_END,
        },
        {
          type: EffectType.DAMAGE,
          value: 5,
          target: TargetType.ALL_ENEMIES,
          trigger: PowerTrigger.TURN_END,
        },
      ]),
    );
    const before = store().player.health;

    await store().endTurn();

    expect(store().player.health).toBe(before - 1);
    expect(store().gamePhase).toBe(GamePhase.CARD_REWARD);
  });

  it("a turn-end effect that takes the last health ends the run", async () => {
    startCombat([enemy()]);
    play(
      fixtureCard("burn", CardType.POWER, [
        {
          type: EffectType.LOSE_HP,
          value: 1,
          target: TargetType.SELF,
          trigger: PowerTrigger.TURN_END,
        },
      ]),
    );
    useGameStore.setState({ player: { ...store().player, health: 1 } });

    await store().endTurn();

    expect(store().gamePhase).toBe(GamePhase.GAME_OVER);
    expect(store().player.health).toBe(0);
  });

  it("block from a card raises block_gained", () => {
    startCombat([enemy()]);
    play(
      fixtureCard("thorns", CardType.POWER, [
        {
          type: EffectType.DAMAGE,
          value: 5,
          target: TargetType.RANDOM_ENEMY,
          trigger: PowerTrigger.BLOCK_GAINED,
        },
      ]),
    );

    play(fixtureCard("guard", CardType.SKILL, [selfBlock(5)]));

    expect(store().enemies[0].health).toBe(495);
  });

  it("a block-retention power keeps block between turns", async () => {
    startCombat([enemy()]);
    play(
      fixtureCard("keep", CardType.POWER, [
        {
          type: EffectType.LIMIT_BLOCK_LOSS,
          value: 0,
          target: TargetType.SELF,
          trigger: PowerTrigger.TURN_START,
        },
      ]),
    );
    play(fixtureCard("guard", CardType.SKILL, [selfBlock(9)]));

    await store().endTurn();

    expect(store().player.block).toBe(9);
  });

  it("a status that lasts until end of turn is removed, leaving the rest", async () => {
    startCombat([enemy()]);
    const gain = (id: string, untilEndOfTurn: boolean) =>
      fixtureCard(id, CardType.SKILL, [
        {
          type: EffectType.APPLY_STATUS,
          value: 2,
          target: TargetType.SELF,
          statusType: StatusType.STRENGTH,
          untilEndOfTurn,
        },
      ]);

    play(gain("permanent", false));
    play(gain("temporary", true));
    expect(strength()).toBe(4);

    await store().endTurn();
    expect(strength()).toBe(2);

    await store().endTurn();
    expect(strength()).toBe(2);
  });

  it("a random-target attack needs no target and only hits living enemies", () => {
    startCombat([enemy(idle, { health: 500 }), enemy(idle, { health: 500 })]);
    const card = fixtureCard("scatter", CardType.ATTACK, [
      { type: EffectType.DAMAGE, value: 3, target: TargetType.RANDOM_ENEMY },
      { type: EffectType.DAMAGE, value: 3, target: TargetType.RANDOM_ENEMY },
      { type: EffectType.DAMAGE, value: 3, target: TargetType.RANDOM_ENEMY },
    ]);
    expect(cardNeedsTarget(card)).toBe(false);

    play(card);

    const dealt = store().enemies.reduce((sum, e) => sum + (500 - e.health), 0);
    expect(dealt).toBe(9);
  });

  it("a card still needs a target for a status aimed at one enemy", () => {
    const hex = fixtureCard("hex", CardType.SKILL, [
      {
        type: EffectType.APPLY_STATUS,
        value: 1,
        target: TargetType.ENEMY,
        statusType: StatusType.WEAK,
      },
    ]);
    const legacyAttack = fixtureCard("legacy", CardType.ATTACK, [], {
      effects: undefined,
      damage: 6,
    });
    const triggered = fixtureCard("aura", CardType.POWER, [
      {
        type: EffectType.DAMAGE,
        value: 1,
        target: TargetType.ENEMY,
        trigger: PowerTrigger.TURN_END,
      },
    ]);

    expect(cardNeedsTarget(hex)).toBe(true);
    expect(cardNeedsTarget(legacyAttack)).toBe(true);
    expect(cardNeedsTarget(triggered)).toBe(false);
  });

  it("the hand never exceeds the maximum size", () => {
    startCombat([enemy()]);
    useGameStore.setState({ drawPile: createTestCards(30) });

    store().drawCards(30);

    expect(store().hand).toHaveLength(MAX_HAND_SIZE);
  });
});

describe("relic triggers in combat", () => {
  it("card_played fires for the matching card type", () => {
    const healOnSkill = fixtureRelic("r", {
      trigger: RelicTrigger.CARD_PLAYED,
      effect: EffectType.HEAL,
      value: 2,
      cardType: CardType.SKILL,
    });
    startCombat([enemy()], [healOnSkill]);
    useGameStore.setState({ player: { ...store().player, health: 50 } });

    play(fixtureCard("a", CardType.ATTACK, []));
    expect(store().player.health).toBe(50);

    play(fixtureCard("s", CardType.SKILL, []));
    expect(store().player.health).toBe(52);
  });

  it("next-turn energy from being hit arrives once, after the refill", async () => {
    const energyWhenHit = fixtureRelic("r", {
      trigger: RelicTrigger.DAMAGE_TAKEN,
      effect: EffectType.GAIN_ENERGY,
      value: 1,
      nextTurn: true,
    });
    startCombat([enemy(attack10)], [energyWhenHit]);
    expect(store().player.energy).toBe(3);

    await store().endTurn();
    expect(store().player.energy).toBe(4);

    useGameStore.setState({ player: { ...store().player, block: 50 } });
    await store().endTurn();
    expect(store().player.energy).toBe(3);
  });

  it("a turn without attacks grants energy next turn", async () => {
    const quietTurn = fixtureRelic("r", {
      trigger: RelicTrigger.TURN_END,
      effect: EffectType.GAIN_ENERGY,
      value: 1,
      nextTurn: true,
      ifNoAttacksThisTurn: true,
    });
    startCombat([enemy()], [quietTurn]);

    await store().endTurn();
    expect(store().player.energy).toBe(4);

    play(dataCard("strike"), store().enemies[0].id);
    await store().endTurn();
    expect(store().player.energy).toBe(3);
  });

  it("a once-per-combat effect fires once per combat", async () => {
    const drawWhenHit = fixtureRelic("r", {
      trigger: RelicTrigger.DAMAGE_TAKEN,
      effect: EffectType.DRAW_CARDS,
      value: 2,
      oncePerCombat: true,
    });
    startCombat([enemy(attack10)], [drawWhenHit]);

    await store().endTurn();
    expect(store().hand).toHaveLength(7);

    await store().endTurn();
    expect(store().hand).toHaveLength(5);

    store().startCombat([enemy(attack10)]);
    await store().endTurn();
    expect(store().hand).toHaveLength(7);
  });

  it("the first-attack bonus comes from relic data", () => {
    const sharpener = fixtureRelic("sharpener", {
      trigger: RelicTrigger.CARD_PLAYED,
      effect: EffectType.FIRST_ATTACK_DAMAGE,
      value: 4,
    });
    startCombat([enemy()], [sharpener]);
    const target = store().enemies[0].id;

    play(dataCard("strike"), target);
    expect(store().enemies[0].health).toBe(490);

    play({ ...dataCard("strike"), id: "second" }, target);
    expect(store().enemies[0].health).toBe(484);
  });

  it("enemy_died fires for each enemy a card kills", () => {
    const trophy = fixtureRelic("r", {
      trigger: RelicTrigger.ENEMY_DEATH,
      effect: EffectType.HEAL,
      value: 3,
    });
    startCombat(
      [
        enemy(idle, { health: 1 }),
        enemy(idle, { health: 1 }),
        enemy(idle, { health: 500 }),
      ],
      [trophy],
    );
    useGameStore.setState({ player: { ...store().player, health: 50 } });

    play(
      fixtureCard("sweep", CardType.ATTACK, [
        { type: EffectType.DAMAGE, value: 5, target: TargetType.ALL_ENEMIES },
      ]),
    );

    expect(store().player.health).toBe(56);
    expect(store().enemies).toHaveLength(1);
  });
});

describe("annotated data", () => {
  it("power card definitions come from the card data", () => {
    expect(getPowerCardDefinition("metallicize")?.effects).toEqual([
      {
        trigger: PowerTrigger.TURN_END,
        type: EffectType.BLOCK,
        value: 3,
        target: TargetType.SELF,
        statusType: undefined,
      },
    ]);
    expect(getPowerCardDefinition("strike")).toBeNull();
    expect(getPowerCardDefinition("nope")).toBeNull();
  });

  it("Metallicize gives no block when played, only at turn end", () => {
    startCombat([enemy()]);

    play(dataCard("metallicize"));

    expect(store().player.block).toBe(0);
  });

  it("an upgraded power is upgraded in play", async () => {
    startCombat([enemy()]);

    play(upgradeCard(dataCard("demon_form")));
    await store().endTurn();

    expect(strength()).toBe(3);
  });

  it("cards that say Exhaust are exhausted", () => {
    startCombat([enemy()]);

    play(dataCard("seeing_red"));

    expect(store().exhaustPile.map((c) => c.baseId)).toEqual(["seeing_red"]);
  });

  it("existing relics carry the conditions their text describes", () => {
    expect(dataRelic("centennial_puzzle").effects[0].oncePerCombat).toBe(true);
    expect(dataRelic("blue_candle").effects[0].nextTurn).toBe(true);
    expect(dataRelic("art_of_war").effects[0]).toMatchObject({
      nextTurn: true,
      ifNoAttacksThisTurn: true,
    });
    expect(dataRelic("bird_faced_urn").effects[0].cardType).toBe(
      CardType.POWER,
    );
    expect(dataRelic("akabeko").effects[0].effect).toBe(
      EffectType.FIRST_ATTACK_DAMAGE,
    );
  });
});
