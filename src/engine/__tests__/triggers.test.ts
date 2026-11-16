import { describe, expect, it } from "vitest";
import {
  CardType,
  EffectType,
  PowerCard,
  PowerCardEffect,
  PowerTrigger,
  Relic,
  RelicEffect,
  RelicRarity,
  RelicTrigger,
  TargetType,
} from "../../types/game";
import {
  createTestCard,
  createTestEnemy,
  createTestPlayer,
} from "../../test/setup";
import { createSeededRng } from "../../utils/random";
import { getCardEffects, takeDamage } from "../effects";
import { createBattle, dispatch, gainBlock, loseHp } from "../triggers";

const relic = (id: string, ...effects: RelicEffect[]): Relic => ({
  id,
  name: id,
  description: "",
  rarity: RelicRarity.COMMON,
  effects,
});

const power = (id: string, ...effects: PowerCardEffect[]): PowerCard => ({
  id,
  name: id,
  description: "",
  effects,
});

const attack = createTestCard({ type: CardType.ATTACK });
const skill = createTestCard({ type: CardType.SKILL });

describe("engine/effects", () => {
  it("takeDamage removes block before health", () => {
    const enemy = createTestEnemy({ health: 20, block: 5 });

    expect(takeDamage(enemy, 8)).toMatchObject({ health: 17, block: 0 });
    expect(takeDamage(enemy, 3)).toMatchObject({ health: 20, block: 2 });
    expect(takeDamage(enemy, -4)).toMatchObject({ health: 20, block: 5 });
  });

  it("getCardEffects turns legacy fields into effects", () => {
    expect(getCardEffects({ damage: 6, block: 5 })).toEqual([
      { type: EffectType.DAMAGE, value: 6, target: TargetType.ENEMY },
      { type: EffectType.BLOCK, value: 5, target: TargetType.SELF },
    ]);
  });

  it("getCardEffects prefers the card's own effects over legacy fields", () => {
    const effects = [
      { type: EffectType.DAMAGE, value: 9, target: TargetType.ALL_ENEMIES },
    ];

    expect(getCardEffects({ damage: 6, effects })).toEqual(effects);
  });
});

describe("engine/triggers", () => {
  it("fires relic effects for the matching event only", () => {
    const player = createTestPlayer({
      health: 40,
      relics: [
        relic("on_start", {
          trigger: RelicTrigger.COMBAT_START,
          effect: EffectType.HEAL,
          value: 5,
        }),
        relic("on_end", {
          trigger: RelicTrigger.TURN_END,
          effect: EffectType.HEAL,
          value: 9,
        }),
      ],
    });

    const result = dispatch(createBattle(player, []), {
      type: "combat_start",
    });

    expect(result.player.health).toBe(45);
  });

  it("fires power effects before relic effects", () => {
    // Healing is capped at max health, so the order is visible: heal then
    // lose 3 ends at 77, lose 3 then heal would end at 80
    const player = createTestPlayer({
      health: 79,
      maxHealth: 80,
      powerCards: [
        power("p", {
          trigger: PowerTrigger.TURN_START,
          type: EffectType.HEAL,
          value: 5,
          target: TargetType.SELF,
        }),
      ],
      relics: [
        relic("r", {
          trigger: RelicTrigger.TURN_START,
          effect: EffectType.LOSE_HP,
          value: 3,
        }),
      ],
    });

    const result = dispatch(createBattle(player, []), {
      type: "turn_start",
      turn: 1,
    });

    expect(result.player.health).toBe(77);
  });

  it("a power played twice fires twice", () => {
    const blockAtTurnEnd = power("p", {
      trigger: PowerTrigger.TURN_END,
      type: EffectType.BLOCK,
      value: 3,
      target: TargetType.SELF,
    });
    const player = createTestPlayer({
      powerCards: [blockAtTurnEnd, blockAtTurnEnd],
    });

    const result = dispatch(createBattle(player, []), { type: "turn_end" });

    expect(result.player.block).toBe(6);
  });

  it("limits a relic effect to a card type", () => {
    const player = createTestPlayer({
      health: 40,
      relics: [
        relic("r", {
          trigger: RelicTrigger.CARD_PLAYED,
          effect: EffectType.HEAL,
          value: 2,
          cardType: CardType.SKILL,
        }),
      ],
    });
    const battle = createBattle(player, []);

    expect(
      dispatch(battle, { type: "card_played", card: attack }).player.health,
    ).toBe(40);
    expect(
      dispatch(battle, { type: "card_played", card: skill }).player.health,
    ).toBe(42);
  });

  it("limits a relic effect to a turn", () => {
    const player = createTestPlayer({
      relics: [
        relic("r", {
          trigger: RelicTrigger.TURN_START,
          effect: EffectType.BLOCK,
          value: 14,
          onTurn: 2,
        }),
      ],
    });
    const battle = createBattle(player, []);

    expect(dispatch(battle, { type: "turn_start", turn: 1 }).player.block).toBe(
      0,
    );
    expect(dispatch(battle, { type: "turn_start", turn: 2 }).player.block).toBe(
      14,
    );
  });

  it("fires a once-per-combat effect once, and again with fresh counters", () => {
    const player = createTestPlayer({
      relics: [
        relic("r", {
          trigger: RelicTrigger.DAMAGE_TAKEN,
          effect: EffectType.DRAW_CARDS,
          value: 3,
          oncePerCombat: true,
        }),
      ],
    });
    const event = { type: "hp_lost", amount: 4 } as const;

    const first = dispatch(createBattle(player, []), event);
    const second = dispatch(first, event);
    expect(second.cardsToDraw).toBe(3);

    const nextCombat = dispatch(createBattle(second.player, []), event);
    expect(nextCombat.cardsToDraw).toBe(3);
  });

  it("stores next-turn energy instead of granting it now", () => {
    const player = createTestPlayer({
      energy: 1,
      relics: [
        relic("r", {
          trigger: RelicTrigger.DAMAGE_TAKEN,
          effect: EffectType.GAIN_ENERGY,
          value: 1,
          nextTurn: true,
        }),
      ],
    });

    const result = dispatch(createBattle(player, []), {
      type: "hp_lost",
      amount: 2,
    });

    expect(result.player.energy).toBe(1);
    expect(result.counters.energyNextTurn).toBe(1);
  });

  it("counts attacks per turn for effects that need a turn without attacks", () => {
    const player = createTestPlayer({
      relics: [
        relic("r", {
          trigger: RelicTrigger.TURN_END,
          effect: EffectType.GAIN_ENERGY,
          value: 1,
          nextTurn: true,
          ifNoAttacksThisTurn: true,
        }),
      ],
    });
    const start = dispatch(createBattle(player, []), {
      type: "turn_start",
      turn: 1,
    });

    const quietTurn = dispatch(
      dispatch(start, { type: "card_played", card: skill }),
      { type: "turn_end" },
    );
    expect(quietTurn.counters.energyNextTurn).toBe(1);

    const attackTurn = dispatch(
      dispatch(start, { type: "card_played", card: attack }),
      { type: "turn_end" },
    );
    expect(attackTurn.counters.energyNextTurn).toBe(0);

    // The count starts again on the next turn
    const nextTurn = dispatch(attackTurn, { type: "turn_start", turn: 2 });
    expect(nextTurn.counters.attacksPlayedThisTurn).toBe(0);
  });

  it("deals untargeted damage back to the attacker only, through block", () => {
    const player = createTestPlayer({
      relics: [
        relic("r", {
          trigger: RelicTrigger.DAMAGE_TAKEN,
          effect: EffectType.DAMAGE,
          value: 3,
        }),
      ],
    });
    const attacker = createTestEnemy({ id: "attacker", health: 10, block: 1 });
    const bystander = createTestEnemy({ id: "bystander", health: 10 });

    const result = dispatch(createBattle(player, [attacker, bystander]), {
      type: "hp_lost",
      amount: 5,
      attackerId: "attacker",
    });

    expect(result.enemies[0]).toMatchObject({ health: 8, block: 0 });
    expect(result.enemies[1].health).toBe(10);
  });

  it("hits every enemy with untargeted damage when nobody caused the event", () => {
    const player = createTestPlayer({
      relics: [
        relic("r", {
          trigger: RelicTrigger.TURN_END,
          effect: EffectType.DAMAGE,
          value: 3,
        }),
      ],
    });
    const enemies = [
      createTestEnemy({ id: "a", health: 10 }),
      createTestEnemy({ id: "b", health: 2 }),
    ];

    const result = dispatch(createBattle(player, enemies), {
      type: "turn_end",
    });

    expect(result.enemies.map((e) => e.health)).toEqual([7, 0]);
  });

  it("picks a living enemy for a random target, and nothing when none is left", () => {
    const player = createTestPlayer({
      powerCards: [
        power("p", {
          trigger: PowerTrigger.TURN_END,
          type: EffectType.DAMAGE,
          value: 4,
          target: TargetType.RANDOM_ENEMY,
        }),
      ],
    });
    const dead = createTestEnemy({ id: "dead", health: 0 });
    const alive = createTestEnemy({ id: "alive", health: 10 });

    for (let seed = 0; seed < 10; seed++) {
      const result = dispatch(
        createBattle(player, [dead, alive]),
        { type: "turn_end" },
        createSeededRng(seed),
      );
      expect(result.enemies.map((e) => e.health)).toEqual([0, 6]);
    }

    const nobody = dispatch(createBattle(player, [dead]), {
      type: "turn_end",
    });
    expect(nobody.enemies[0].health).toBe(0);
  });

  it("gainBlock raises block_gained for powers that react to it", () => {
    const player = createTestPlayer({
      powerCards: [
        power("p", {
          trigger: PowerTrigger.BLOCK_GAINED,
          type: EffectType.DAMAGE,
          value: 5,
          target: TargetType.RANDOM_ENEMY,
        }),
      ],
    });
    const enemy = createTestEnemy({ health: 20 });

    const result = gainBlock(createBattle(player, [enemy]), 4);
    expect(result.player.block).toBe(4);
    expect(result.enemies[0].health).toBe(15);

    // Gaining nothing is not an event
    const nothing = gainBlock(createBattle(player, [enemy]), 0);
    expect(nothing.enemies[0].health).toBe(20);
  });

  it("stops a chain of effects that feeds itself", () => {
    const player = createTestPlayer({
      powerCards: [
        power("loop", {
          trigger: PowerTrigger.BLOCK_GAINED,
          type: EffectType.BLOCK,
          value: 1,
          target: TargetType.SELF,
        }),
      ],
    });

    const result = gainBlock(createBattle(player, []), 1);

    expect(result.player.block).toBeGreaterThan(1);
    expect(result.player.block).toBeLessThan(20);
  });

  it("loseHp ignores block and raises hp_lost", () => {
    const player = createTestPlayer({
      health: 30,
      block: 10,
      relics: [
        relic("r", {
          trigger: RelicTrigger.DAMAGE_TAKEN,
          effect: EffectType.DRAW_CARDS,
          value: 1,
        }),
      ],
    });

    const result = loseHp(createBattle(player, []), 4);

    expect(result.player).toMatchObject({ health: 26, block: 10 });
    expect(result.cardsToDraw).toBe(1);
    expect(loseHp(createBattle(player, []), 0).cardsToDraw).toBe(0);
  });

  it("ignores passive effects when their trigger fires", () => {
    const player = createTestPlayer({
      relics: [
        relic("r", {
          trigger: RelicTrigger.TURN_START,
          effect: EffectType.LIMIT_BLOCK_LOSS,
          value: 15,
        }),
      ],
    });
    const battle = createBattle(player, [createTestEnemy()]);

    expect(dispatch(battle, { type: "turn_start", turn: 2 })).toMatchObject({
      player,
      enemies: battle.enemies,
    });
  });
});
