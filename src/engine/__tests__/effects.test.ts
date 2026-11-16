import { describe, it, expect } from "vitest";
import {
  CardType,
  EffectType,
  IntentType,
  MonsterCardType,
  RelicRarity,
  StatusType,
  TargetType,
} from "../../types/game";
import { ConsequenceType, EventConsequence, NodeType } from "../../types/map";
import { getAllCards } from "../../data/cards";
import { getAllRelics } from "../../data/relics";
import {
  createTestCard,
  createTestCards,
  createTestEnemy,
  createTestPlayer,
} from "../../test/setup";
import { resolveCardPlay } from "../cardPlay";
import {
  cardTypeToIntentType,
  chooseNextCard,
  createEncounter,
  isCombatNode,
} from "../combat";
import { applyEventConsequence } from "../events";

const play = (
  effects: NonNullable<ReturnType<typeof createTestCard>["effects"]>,
  overrides: Partial<Parameters<typeof resolveCardPlay>[0]> = {},
) =>
  resolveCardPlay({
    card: createTestCard({ type: CardType.SKILL, effects }),
    energyCost: 1,
    player: createTestPlayer(),
    enemies: [createTestEnemy({ id: "a" }), createTestEnemy({ id: "b" })],
    hand: [],
    isFirstAttack: false,
    ...overrides,
  });

const self = (type: EffectType, value: number) => ({
  type,
  value,
  target: TargetType.SELF,
});

const stacksOf = (
  entity: { statusEffects: { type: StatusType; stacks: number }[] },
  type: StatusType,
) => entity.statusEffects.find((effect) => effect.type === type)?.stacks ?? 0;

describe("engine/cardPlay effects", () => {
  it("should add block to the player", () => {
    const result = play([self(EffectType.BLOCK, 5)]);

    expect(result.player.block).toBe(5);
  });

  it("should heal without exceeding max health", () => {
    const result = play([self(EffectType.HEAL, 50)], {
      player: createTestPlayer({ health: 70, maxHealth: 80 }),
    });

    expect(result.player.health).toBe(80);
  });

  it("should gain energy up to the bonus cap and lose it down to zero", () => {
    const gained = play([self(EffectType.GAIN_ENERGY, 10)], {
      player: createTestPlayer({ energy: 2, maxEnergy: 3 }),
    });
    const lost = play([self(EffectType.LOSE_ENERGY, 10)], {
      player: createTestPlayer({ energy: 2 }),
    });

    expect(gained.player.energy).toBe(6);
    expect(lost.player.energy).toBe(0);
  });

  it("should apply a status to the player", () => {
    const result = play([
      { ...self(EffectType.APPLY_STATUS, 2), statusType: StatusType.STRENGTH },
    ]);

    expect(stacksOf(result.player, StatusType.STRENGTH)).toBe(2);
  });

  it("should apply a status to the targeted enemy only", () => {
    const result = play(
      [
        {
          type: EffectType.APPLY_STATUS,
          value: 2,
          target: TargetType.ENEMY,
          statusType: StatusType.VULNERABLE,
        },
      ],
      { targetId: "b" },
    );

    expect(stacksOf(result.enemies[0], StatusType.VULNERABLE)).toBe(0);
    expect(stacksOf(result.enemies[1], StatusType.VULNERABLE)).toBe(2);
  });

  it("should apply a status to every enemy", () => {
    const result = play([
      {
        type: EffectType.APPLY_STATUS,
        value: 1,
        target: TargetType.ALL_ENEMIES,
        statusType: StatusType.WEAK,
      },
    ]);

    expect(
      result.enemies.map((enemy) => stacksOf(enemy, StatusType.WEAK)),
    ).toEqual([1, 1]);
  });

  it("should ignore a status effect without a status type", () => {
    const result = play([self(EffectType.APPLY_STATUS, 2)]);

    expect(result.player.statusEffects).toEqual([]);
  });

  it("should not hit anything with a single-target effect and no target", () => {
    const result = play([
      { type: EffectType.DAMAGE, value: 6, target: TargetType.ENEMY },
    ]);

    expect(result.enemies.every((enemy) => enemy.health === 50)).toBe(true);
  });

  it("should hit once per energy spent", () => {
    const result = play(
      [
        {
          type: EffectType.DAMAGE_MULTIPLIER_ENERGY,
          value: 5,
          target: TargetType.ALL_ENEMIES,
        },
      ],
      { energyCost: 3 },
    );

    expect(result.enemies.map((enemy) => enemy.health)).toEqual([35, 35]);
  });

  it("should deal damage based on the player's block", () => {
    const result = play(
      [
        {
          type: EffectType.DAMAGE_MULTIPLIER_BLOCK,
          value: 0,
          multiplier: 2,
          target: TargetType.ENEMY,
        },
      ],
      { targetId: "a", player: createTestPlayer({ block: 7 }) },
    );

    expect(result.enemies[0].health).toBe(36);
  });

  it("should upgrade one card that is not upgraded yet", () => {
    const [upgraded, plain] = createTestCards(2);
    const result = play([self(EffectType.UPGRADE_CARD, 1)], {
      hand: [{ ...upgraded, upgraded: true }, plain],
    });

    expect(result.hand.every((card) => card.upgraded)).toBe(true);
  });

  it("should leave the hand alone when every card is upgraded", () => {
    const hand = createTestCards(2).map((card) => ({
      ...card,
      upgraded: true,
    }));

    const result = play([self(EffectType.UPGRADE_CARD, 1)], { hand });

    expect(result.hand).toEqual(hand);
  });

  it("should use direct damage and block numbers when there are no effects", () => {
    const result = resolveCardPlay({
      card: createTestCard({ damage: 4, block: 3, effects: [] }),
      targetId: "a",
      energyCost: 1,
      player: createTestPlayer(),
      enemies: [createTestEnemy({ id: "a" })],
      hand: [],
      isFirstAttack: false,
    });

    expect(result.enemies[0].health).toBe(46);
    expect(result.player.block).toBe(3);
  });

  it("should attach a power card to the player", () => {
    const powerCard = getAllCards().find(
      (card) => card.type === CardType.POWER,
    )!;

    const result = resolveCardPlay({
      card: powerCard,
      energyCost: 1,
      player: createTestPlayer(),
      enemies: [],
      hand: [],
      isFirstAttack: false,
    });

    expect(result.player.powerCards).toHaveLength(1);
  });
});

describe("engine/combat encounters and intents", () => {
  it("should map every monster card type to an intent", () => {
    expect(cardTypeToIntentType(MonsterCardType.ATTACK)).toBe(
      IntentType.ATTACK,
    );
    expect(cardTypeToIntentType(MonsterCardType.DEFEND)).toBe(
      IntentType.DEFEND,
    );
    expect(cardTypeToIntentType(MonsterCardType.BUFF)).toBe(IntentType.BUFF);
    expect(cardTypeToIntentType(MonsterCardType.DEBUFF)).toBe(
      IntentType.DEBUFF,
    );
    expect(cardTypeToIntentType("other" as MonsterCardType)).toBe(
      IntentType.UNKNOWN,
    );
  });

  it("should show the chosen card as the enemy's intent", () => {
    const enemy = chooseNextCard(createTestEnemy());

    expect(enemy.currentCard).toBeDefined();
    expect(enemy.intent.card).toBe(enemy.currentCard);
    expect(enemy.intent.type).toBe(
      cardTypeToIntentType(enemy.currentCard!.type),
    );
  });

  it("should know which map nodes start a combat", () => {
    expect(isCombatNode(NodeType.COMBAT)).toBe(true);
    expect(isCombatNode(NodeType.ELITE)).toBe(true);
    expect(isCombatNode(NodeType.BOSS)).toBe(true);
    expect(isCombatNode(NodeType.SHOP)).toBe(false);
    expect(isCombatNode(NodeType.REST)).toBe(false);
  });

  it("should create a single boss and give enemies unique ids", () => {
    expect(createEncounter(NodeType.BOSS, 0)).toHaveLength(1);

    for (let i = 0; i < 20; i++) {
      const ids = createEncounter(NodeType.COMBAT, 0).map((enemy) => enemy.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("engine/events outcomes", () => {
  const consequence = (
    type: ConsequenceType,
    extra: Partial<EventConsequence> = {},
  ): EventConsequence => ({ type, description: "", ...extra });

  const apply = (
    c: EventConsequence,
    player = createTestPlayer({ health: 50, maxHealth: 80, gold: 100 }),
  ) => applyEventConsequence(c, { player, persistentDeck: [] });

  it("should change gold and health", () => {
    expect(
      apply(consequence(ConsequenceType.GAIN_GOLD, { value: 25 })).player.gold,
    ).toBe(125);
    expect(
      apply(consequence(ConsequenceType.LOSE_GOLD, { value: 25 })).player.gold,
    ).toBe(75);
    expect(
      apply(consequence(ConsequenceType.GAIN_HEALTH, { value: 99 })).player
        .health,
    ).toBe(80);
    expect(apply(consequence(ConsequenceType.GAIN_GOLD)).player.gold).toBe(100);
  });

  it("should grant a random relic of the requested rarity", () => {
    const result = apply(
      consequence(ConsequenceType.GAIN_RELIC, { relicId: "random_uncommon" }),
    );

    expect(result.player.relics).toHaveLength(1);
    expect(result.player.relics[0].rarity).toBe(RelicRarity.UNCOMMON);
  });

  it("should grant a specific relic by id", () => {
    const relic = getAllRelics()[1];

    const result = apply(
      consequence(ConsequenceType.GAIN_RELIC, { relicId: relic.id }),
    );

    expect(result.player.relics).toEqual([relic]);
  });

  it("should do nothing for an unknown or missing relic or card", () => {
    const player = createTestPlayer();

    for (const c of [
      consequence(ConsequenceType.GAIN_RELIC),
      consequence(ConsequenceType.GAIN_RELIC, { relicId: "no_such_relic" }),
      consequence(ConsequenceType.GAIN_CARD),
      consequence(ConsequenceType.GAIN_CARD, { cardId: "no_such_card" }),
      consequence("unknown" as ConsequenceType),
    ]) {
      const result = apply(c, player);
      expect(result.player).toEqual(player);
      expect(result.persistentDeck).toEqual([]);
    }
  });

  it("should grant a specific card by base id and a random skill", () => {
    const card = getAllCards()[0];

    const specific = apply(
      consequence(ConsequenceType.GAIN_CARD, { cardId: card.baseId }),
    );
    const skill = apply(
      consequence(ConsequenceType.GAIN_CARD, { cardId: "random_skill" }),
    );

    expect(specific.persistentDeck[0].baseId).toBe(card.baseId);
    expect(skill.persistentDeck[0].type).toBe(CardType.SKILL);
  });

  it("should do nothing when removing from an empty deck", () => {
    expect(
      apply(consequence(ConsequenceType.REMOVE_CARD)).persistentDeck,
    ).toEqual([]);
  });
});
