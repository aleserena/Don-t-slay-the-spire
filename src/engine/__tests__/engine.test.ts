import { describe, it, expect } from "vitest";
import {
  CardType,
  EffectType,
  GamePhase,
  Relic,
  RelicRarity,
  RelicTrigger,
  StatusType,
  TargetType,
} from "../../types/game";
import { ConsequenceType, EventConsequence } from "../../types/map";
import { getAllRelics } from "../../data/relics";
import {
  createTestCard,
  createTestCards,
  createTestEnemy,
  createTestMonsterAttack,
  createTestPlayer,
} from "../../test/setup";
import { createSeededRng } from "../../utils/random";
import { getEnergyCost, resolveCardPlay } from "../cardPlay";
import {
  createCombatState,
  createVictoryState,
  resolveEnemyCard,
  startPlayerTurn,
  tickEnemies,
} from "../combat";
import {
  createCardInstance,
  createTemporaryCopy,
  drawCards,
  isTemporaryCard,
  withoutTemporaryCards,
} from "../deck";
import { applyEventChoice, applyEventConsequence } from "../events";
import { createShop, pickRelicReward } from "../rewards";

const createTestRelic = (overrides: Partial<Relic> = {}): Relic => ({
  id: "test_relic",
  name: "Test Relic",
  description: "A relic for tests.",
  rarity: RelicRarity.COMMON,
  effects: [],
  ...overrides,
});

describe("engine/deck", () => {
  it("should give every card instance a unique id", () => {
    const card = createTestCard();
    const ids = new Set(
      Array.from({ length: 50 }, () => createCardInstance(card).id),
    );

    expect(ids.size).toBe(50);
  });

  it("should tell temporary copies apart from owned cards", () => {
    const card = createTestCard();
    const copy = createTemporaryCopy(card);

    expect(isTemporaryCard(copy)).toBe(true);
    expect(isTemporaryCard(createCardInstance(card))).toBe(false);
    expect(withoutTemporaryCards([card, copy])).toEqual([card]);
  });

  it("should draw from the top of the draw pile", () => {
    const [bottom, middle, top] = createTestCards(3);

    const result = drawCards(
      { drawPile: [bottom, middle, top], discardPile: [], hand: [] },
      2,
    );

    expect(result.hand).toEqual([top, middle]);
    expect(result.drawPile).toEqual([bottom]);
  });

  it("should shuffle the discard pile in when the draw pile runs out", () => {
    const [inDraw, ...discarded] = createTestCards(4);

    const result = drawCards(
      { drawPile: [inDraw], discardPile: discarded, hand: [] },
      3,
      createSeededRng(1),
    );

    expect(result.hand).toHaveLength(3);
    expect(result.hand[0]).toBe(inDraw);
    expect(result.discardPile).toEqual([]);
    expect(result.drawPile).toHaveLength(1);
  });

  it("should draw only what is available and not modify its input", () => {
    const piles = { drawPile: createTestCards(2), discardPile: [], hand: [] };

    const result = drawCards(piles, 5);

    expect(result.hand).toHaveLength(2);
    expect(piles.drawPile).toHaveLength(2);
    expect(piles.hand).toHaveLength(0);
  });
});

describe("engine/cardPlay", () => {
  const playInput = {
    energyCost: 1,
    player: createTestPlayer(),
    hand: [],
    isFirstAttack: false,
  };

  it("should spend all energy on X-cost cards", () => {
    const player = createTestPlayer({ energy: 2 });

    expect(getEnergyCost(createTestCard({ cost: "X" }), player)).toBe(2);
    expect(getEnergyCost(createTestCard({ cost: 1 }), player)).toBe(1);
  });

  it("should remove block before health and only hit the target", () => {
    const target = createTestEnemy({ id: "target", health: 20, block: 4 });
    const bystander = createTestEnemy({ id: "bystander", health: 20 });

    const result = resolveCardPlay({
      ...playInput,
      card: createTestCard(),
      targetId: "target",
      enemies: [target, bystander],
    });

    expect(result.enemies[0]).toMatchObject({ health: 18, block: 0 });
    expect(result.enemies[1]).toMatchObject({ health: 20 });
  });

  it("should hit every enemy with an all-enemies effect", () => {
    const result = resolveCardPlay({
      ...playInput,
      card: createTestCard({
        effects: [
          {
            type: EffectType.DAMAGE,
            value: 5,
            target: TargetType.ALL_ENEMIES,
          },
        ],
      }),
      enemies: [
        createTestEnemy({ id: "a", health: 10 }),
        createTestEnemy({ id: "b", health: 10 }),
      ],
    });

    expect(result.enemies.map((enemy) => enemy.health)).toEqual([5, 5]);
  });

  it("should report cards to draw and created cards instead of applying them", () => {
    const card = createTestCard({
      type: CardType.SKILL,
      effects: [
        { type: EffectType.DRAW_CARDS, value: 2, target: TargetType.SELF },
        {
          type: EffectType.ADD_CARD_TO_DISCARD,
          value: 1,
          target: TargetType.SELF,
        },
      ],
    });

    const result = resolveCardPlay({ ...playInput, card, enemies: [] });

    expect(result.cardsToDraw).toBe(2);
    expect(result.createdCards).toHaveLength(1);
    expect(isTemporaryCard(result.createdCards[0])).toBe(true);
  });

  it("should give copies created in the same instant different ids", () => {
    const card = createTestCard({
      effects: [
        {
          type: EffectType.ADD_CARD_TO_DISCARD,
          value: 1,
          target: TargetType.SELF,
        },
        {
          type: EffectType.ADD_CARD_TO_DISCARD,
          value: 1,
          target: TargetType.SELF,
        },
      ],
    });

    const { createdCards } = resolveCardPlay({
      ...playInput,
      card,
      enemies: [],
    });

    expect(createdCards[0].id).not.toBe(createdCards[1].id);
  });
});

describe("engine/combat", () => {
  it("should start combat with the whole deck shuffled into the draw pile", () => {
    const deck = createTestCards(10);
    const copy = createTemporaryCopy(deck[0]);
    const player = createTestPlayer({ block: 7, energy: 0 });

    const state = createCombatState([...deck, copy], player, []);

    expect(state.gamePhase).toBe(GamePhase.COMBAT);
    expect(state.drawPile).toHaveLength(10);
    expect(state.drawPile).toEqual(expect.arrayContaining(deck));
    expect(state.player).toMatchObject({ block: 0, energy: 3 });
    expect(state.firstAttackThisCombat).toBe(true);
  });

  it("should clear combat-only player state on victory", () => {
    const deck = createTestCards(5);
    const player = createTestPlayer({
      block: 9,
      gold: 10,
      statusEffects: [
        { type: StatusType.POISON, stacks: 3 },
        { type: StatusType.STRENGTH, stacks: 2 },
      ],
    });

    const state = createVictoryState(deck, player, [createTestEnemy()]);

    expect(state.gamePhase).toBe(GamePhase.CARD_REWARD);
    expect(state.player.statusEffects).toEqual([]);
    expect(state.player.block).toBe(0);
    expect(state.player.gold).toBe(10 + state.combatReward.gold);
    expect(state.drawPile).toEqual(deck);
    expect(state.combatReward.relicReward).toBeUndefined();
  });

  it("should award a relic for defeating an elite", () => {
    const state = createVictoryState([], createTestPlayer(), [
      createTestEnemy({ isElite: true }),
    ]);

    expect(state.combatReward.relicReward).toBeDefined();
  });

  it("should only fire turn-limited relic effects on their turn", () => {
    const player = createTestPlayer({
      relics: [
        createTestRelic({
          effects: [
            {
              trigger: RelicTrigger.TURN_START,
              effect: EffectType.BLOCK,
              value: 14,
              onTurn: 2,
            },
          ],
        }),
      ],
    });

    expect(startPlayerTurn(player, [], 1).player.block).toBe(0);
    expect(startPlayerTurn(player, [], 2).player.block).toBe(14);
    expect(startPlayerTurn(player, [], 3).player.block).toBe(0);
  });

  it("should refill energy and reset block at the start of a turn", () => {
    const player = createTestPlayer({ energy: 0, block: 12 });

    const result = startPlayerTurn(player, [], 2);

    expect(result.player).toMatchObject({ energy: 3, block: 0 });
    expect(result.cardsToDraw).toBe(0);
  });

  it("should keep combat-start block on the first turn", () => {
    const player = createTestPlayer({ energy: 0, block: 12 });

    expect(startPlayerTurn(player, [], 1).player.block).toBe(12);
  });

  it("should remove enemies killed by status effects and reset block", () => {
    const poisoned = createTestEnemy({
      id: "poisoned",
      health: 2,
      statusEffects: [{ type: StatusType.POISON, stacks: 5 }],
    });
    const healthy = createTestEnemy({ id: "healthy", block: 8 });

    const result = tickEnemies([poisoned, healthy]);

    expect(result.map((enemy) => enemy.id)).toEqual(["healthy"]);
    expect(result[0].block).toBe(0);
  });

  it("should let relics react when an enemy card costs the player health", () => {
    const player = createTestPlayer({
      health: 30,
      relics: [
        createTestRelic({
          effects: [
            {
              trigger: RelicTrigger.DAMAGE_TAKEN,
              effect: EffectType.DAMAGE,
              value: 3,
            },
            {
              trigger: RelicTrigger.DAMAGE_TAKEN,
              effect: EffectType.DRAW_CARDS,
              value: 2,
            },
          ],
        }),
      ],
    });
    const enemy = createTestEnemy({ health: 2 });

    const result = resolveEnemyCard(createTestMonsterAttack(5), player, enemy);

    expect(result.player.health).toBe(25);
    expect(result.enemy.health).toBe(0);
    expect(result.cardsToDraw).toBe(2);
  });

  it("should not trigger damage relics when block absorbs the whole hit", () => {
    const player = createTestPlayer({
      health: 30,
      block: 10,
      relics: [
        createTestRelic({
          effects: [
            {
              trigger: RelicTrigger.DAMAGE_TAKEN,
              effect: EffectType.DAMAGE,
              value: 3,
            },
          ],
        }),
      ],
    });
    const enemy = createTestEnemy({ health: 20 });

    const result = resolveEnemyCard(createTestMonsterAttack(5), player, enemy);

    expect(result.player).toMatchObject({ health: 30, block: 5 });
    expect(result.enemy.health).toBe(20);
  });
});

describe("engine/rewards", () => {
  it("should never offer a relic the player already owns", () => {
    const commons = getAllRelics().filter(
      (relic) => relic.rarity === RelicRarity.COMMON,
    );
    const [missing, ...owned] = commons;
    const player = createTestPlayer({ relics: owned });

    for (let i = 0; i < 20; i++) {
      expect(pickRelicReward(player, [RelicRarity.COMMON])).toEqual(missing);
    }
  });

  it("should return no relic once the player owns them all", () => {
    const player = createTestPlayer({ relics: getAllRelics() });

    expect(
      pickRelicReward(player, [RelicRarity.COMMON, RelicRarity.UNCOMMON]),
    ).toBeUndefined();
  });

  it("should stock the shop with distinct relics the player does not own", () => {
    const player = createTestPlayer();

    for (let i = 0; i < 20; i++) {
      const shop = createShop(player);
      const relicIds = shop.relics.map((item) => item.relic.id);

      expect(relicIds).toHaveLength(2);
      expect(new Set(relicIds).size).toBe(2);
      expect(
        shop.relics.every((item) => item.relic.rarity !== RelicRarity.STARTER),
      ).toBe(true);
      expect(shop.cards).toHaveLength(5);
    }
  });
});

describe("engine/events", () => {
  const consequence = (
    type: ConsequenceType,
    extra: Partial<EventConsequence> = {},
  ): EventConsequence => ({ type, description: "", ...extra });

  it("should upgrade a card in the deck", () => {
    const deck = createTestCards(3).map((card, index) => ({
      ...card,
      upgraded: index !== 1,
    }));

    const result = applyEventConsequence(
      consequence(ConsequenceType.UPGRADE_CARD),
      { player: createTestPlayer(), persistentDeck: deck },
    );

    // Only the one card that was not upgraded yet can be picked
    expect(result.persistentDeck.every((card) => card.upgraded)).toBe(true);
    expect(result.persistentDeck).toHaveLength(3);
  });

  it("should leave the deck alone when nothing can be upgraded", () => {
    const deck = createTestCards(2).map((card) => ({
      ...card,
      upgraded: true,
    }));

    const result = applyEventConsequence(
      consequence(ConsequenceType.UPGRADE_CARD),
      { player: createTestPlayer(), persistentDeck: deck },
    );

    expect(result.persistentDeck).toEqual(deck);
  });

  it("should remove the named card from the deck", () => {
    const deck = createTestCards(3);

    const result = applyEventConsequence(
      consequence(ConsequenceType.REMOVE_CARD, { cardId: deck[1].id }),
      { player: createTestPlayer(), persistentDeck: deck },
    );

    expect(result.persistentDeck).toEqual([deck[0], deck[2]]);
  });

  it("should add a gained card to the deck with a new id", () => {
    const result = applyEventConsequence(
      consequence(ConsequenceType.GAIN_CARD, { cardId: "random_attack" }),
      { player: createTestPlayer(), persistentDeck: [] },
    );

    expect(result.persistentDeck).toHaveLength(1);
    expect(result.persistentDeck[0].type).toBe(CardType.ATTACK);
    expect(result.persistentDeck[0].id).toMatch(
      new RegExp(`^${result.persistentDeck[0].baseId}_`),
    );
  });

  it("should apply every consequence of a choice in order", () => {
    const result = applyEventChoice(
      {
        id: "choice",
        text: "Choice",
        consequences: [
          consequence(ConsequenceType.GAIN_GOLD, { value: 50 }),
          consequence(ConsequenceType.LOSE_HEALTH, { value: 20 }),
          consequence(ConsequenceType.GAIN_MAX_HEALTH, { value: 5 }),
        ],
      },
      {
        player: createTestPlayer({ health: 50, maxHealth: 80, gold: 100 }),
        persistentDeck: [],
      },
    );

    expect(result.player).toMatchObject({
      gold: 150,
      health: 35,
      maxHealth: 85,
    });
  });

  it("should not let health or gold go below zero", () => {
    const outcome = {
      player: createTestPlayer({ health: 5, gold: 10 }),
      persistentDeck: [],
    };

    expect(
      applyEventConsequence(
        consequence(ConsequenceType.LOSE_HEALTH, { value: 99 }),
        outcome,
      ).player.health,
    ).toBe(0);
    expect(
      applyEventConsequence(
        consequence(ConsequenceType.LOSE_GOLD, { value: 99 }),
        outcome,
      ).player.gold,
    ).toBe(0);
  });
});
