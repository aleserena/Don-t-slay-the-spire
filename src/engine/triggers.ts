/**
 * The trigger pipeline: things that happen in a combat are raised as events,
 * and every power card and relic effect that listens for an event is applied
 * here. Pure: a `Battle` goes in and a new `Battle` comes out.
 */

import {
  Card,
  CardType,
  CombatCounters,
  EffectType,
  Enemy,
  Player,
  PowerTrigger,
  RelicEffect,
  RelicTrigger,
  StatusType,
  TargetType,
} from "../types/game";
import { debugConsole } from "../utils/debugUtils";
import { pickRandom, Rng } from "../utils/random";
import { applyStatusEffect } from "../utils/statusEffects";
import { MAX_BONUS_ENERGY } from "./constants";
import { takeDamage } from "./effects";

export const createCombatCounters = (): CombatCounters => ({
  attacksPlayedThisTurn: 0,
  usedEffects: [],
  energyNextTurn: 0,
  expiringStatuses: [],
});

/** The part of a combat that effects can change. */
export interface Battle {
  player: Player;
  enemies: Enemy[];
  counters: CombatCounters;
  /**
   * Cards the effects asked to draw. Effects cannot draw themselves (that
   * needs the piles), so the caller performs the draw.
   */
  cardsToDraw: number;
}

export const createBattle = (
  player: Player,
  enemies: Enemy[],
  counters: CombatCounters = createCombatCounters(),
): Battle => ({ player, enemies, counters, cardsToDraw: 0 });

export type CombatEvent =
  | { type: "combat_start" }
  | { type: "turn_start"; turn: number }
  | { type: "turn_end" }
  | { type: "card_played"; card: Card }
  | { type: "card_exhausted"; card: Card }
  | { type: "hp_lost"; amount: number; attackerId?: string }
  | { type: "block_gained"; amount: number }
  | { type: "enemy_died"; enemyId: string };

/** What a triggered effect may need to know about the moment it fires. */
export interface TriggerContext {
  /** 1-based player turn, for turn-start effects. */
  turn?: number;
  /** The card that was played or exhausted. */
  card?: Card;
  /** The enemy that caused the event, e.g. the one that hit the player. */
  attackerId?: string;
}

/** Effects can raise events that trigger more effects; chains stop here. */
const MAX_CHAIN_DEPTH = 10;

const POWER_TRIGGERS: Partial<Record<CombatEvent["type"], PowerTrigger>> = {
  combat_start: PowerTrigger.COMBAT_START,
  turn_start: PowerTrigger.TURN_START,
  turn_end: PowerTrigger.TURN_END,
  card_played: PowerTrigger.CARD_PLAYED,
  card_exhausted: PowerTrigger.CARD_EXHAUSTED,
  hp_lost: PowerTrigger.DAMAGE_TAKEN,
  block_gained: PowerTrigger.BLOCK_GAINED,
};

const RELIC_TRIGGERS: Partial<Record<CombatEvent["type"], RelicTrigger>> = {
  combat_start: RelicTrigger.COMBAT_START,
  turn_start: RelicTrigger.TURN_START,
  turn_end: RelicTrigger.TURN_END,
  card_played: RelicTrigger.CARD_PLAYED,
  card_exhausted: RelicTrigger.CARD_EXHAUSTED,
  hp_lost: RelicTrigger.DAMAGE_TAKEN,
  enemy_died: RelicTrigger.ENEMY_DEATH,
};

/** Power triggers that `dispatch` can raise. */
export const SUPPORTED_POWER_TRIGGERS: PowerTrigger[] =
  Object.values(POWER_TRIGGERS);

/** Relic triggers that `dispatch` can raise. */
export const SUPPORTED_RELIC_TRIGGERS: RelicTrigger[] =
  Object.values(RELIC_TRIGGERS);

/** A power or relic effect in one common shape. */
interface TriggeredEffect {
  type: EffectType;
  value: number;
  target?: TargetType;
  statusType?: StatusType;
  /** Energy is granted at the start of the next player turn instead of now. */
  nextTurn?: boolean;
}

const isAlive = (enemy: Enemy): boolean => enemy.health > 0;

/** Relic data names targets with loose strings ("ALL_ENEMIES", "self"). */
const toTargetType = (target?: string): TargetType | undefined => {
  switch (target?.toLowerCase()) {
    case TargetType.SELF:
      return TargetType.SELF;
    case TargetType.ENEMY:
      return TargetType.ENEMY;
    case TargetType.ALL_ENEMIES:
      return TargetType.ALL_ENEMIES;
    case TargetType.RANDOM_ENEMY:
      return TargetType.RANDOM_ENEMY;
    default:
      return undefined;
  }
};

/**
 * Ids of the enemies a triggered effect applies to.
 *
 * An effect aimed at a single enemy, or at nothing in particular, hits the
 * enemy that caused the event when there is one (e.g. damage dealt back to
 * an attacker). Without one, an untargeted effect hits every enemy and a
 * single-target effect picks one at random.
 */
const pickEnemyIds = (
  enemies: Enemy[],
  target: TargetType | undefined,
  context: TriggerContext,
  rng: Rng,
): string[] => {
  const living = enemies.filter(isAlive);
  const randomId = () => {
    const enemy = pickRandom(living, rng);
    return enemy ? [enemy.id] : [];
  };

  if (target === TargetType.ALL_ENEMIES) return living.map((e) => e.id);
  if (target === TargetType.RANDOM_ENEMY) return randomId();

  if (context.attackerId) {
    return living.some((e) => e.id === context.attackerId)
      ? [context.attackerId]
      : [];
  }
  return target === TargetType.ENEMY ? randomId() : living.map((e) => e.id);
};

const mapEnemies = (
  battle: Battle,
  ids: string[],
  update: (enemy: Enemy) => Enemy,
): Battle => ({
  ...battle,
  enemies: battle.enemies.map((enemy) =>
    ids.includes(enemy.id) ? update(enemy) : enemy,
  ),
});

const applyTriggeredEffect = (
  battle: Battle,
  effect: TriggeredEffect,
  context: TriggerContext,
  rng: Rng,
  depth: number,
): Battle => {
  const { player } = battle;

  switch (effect.type) {
    case EffectType.HEAL:
      return {
        ...battle,
        player: {
          ...player,
          health: Math.min(player.maxHealth, player.health + effect.value),
        },
      };

    case EffectType.BLOCK:
      return gainBlock(battle, effect.value, rng, depth + 1);

    case EffectType.LOSE_HP:
      return loseHp(battle, effect.value, undefined, rng, depth + 1);

    case EffectType.GAIN_ENERGY:
      if (effect.nextTurn) {
        return {
          ...battle,
          counters: {
            ...battle.counters,
            energyNextTurn: battle.counters.energyNextTurn + effect.value,
          },
        };
      }
      return {
        ...battle,
        player: {
          ...player,
          energy: Math.min(
            player.maxEnergy + MAX_BONUS_ENERGY,
            player.energy + effect.value,
          ),
        },
      };

    case EffectType.DRAW_CARDS:
      return { ...battle, cardsToDraw: battle.cardsToDraw + effect.value };

    case EffectType.APPLY_STATUS: {
      const statusType = effect.statusType;
      if (!statusType) return battle;

      if (effect.target === TargetType.SELF) {
        return {
          ...battle,
          player: applyStatusEffect(player, statusType, effect.value) as Player,
        };
      }
      return mapEnemies(
        battle,
        pickEnemyIds(battle.enemies, effect.target, context, rng),
        (enemy) => applyStatusEffect(enemy, statusType, effect.value) as Enemy,
      );
    }

    case EffectType.DAMAGE:
      return mapEnemies(
        battle,
        pickEnemyIds(battle.enemies, effect.target, context, rng),
        (enemy) => {
          const hit = takeDamage(enemy, effect.value);
          return { ...hit, health: Math.max(0, hit.health) };
        },
      );

    default:
      // Passive effects (block retention, first-attack bonus) are read where
      // they apply and do nothing when their trigger fires
      return battle;
  }
};

/** Applies the effects of the player's power cards that listen to `trigger`. */
export const runPowerTrigger = (
  battle: Battle,
  trigger: PowerTrigger,
  context: TriggerContext = {},
  rng: Rng = Math.random,
  depth: number = 0,
): Battle => {
  let result = battle;
  // The powers in play when the event happened; one attached by an effect
  // does not react to the event that attached it
  for (const power of battle.player.powerCards) {
    for (const effect of power.effects) {
      if (effect.trigger !== trigger) continue;
      result = applyTriggeredEffect(result, effect, context, rng, depth);
    }
  }
  return result;
};

/** Whether a relic effect's own conditions, beyond its trigger, are met. */
const isRelicEffectActive = (
  effect: RelicEffect,
  key: string,
  battle: Battle,
  context: TriggerContext,
): boolean => {
  if (effect.onTurn !== undefined && effect.onTurn !== context.turn) {
    return false;
  }
  if (effect.cardType !== undefined && effect.cardType !== context.card?.type) {
    return false;
  }
  if (effect.ifNoAttacksThisTurn && battle.counters.attacksPlayedThisTurn > 0) {
    return false;
  }
  if (effect.oncePerCombat && battle.counters.usedEffects.includes(key)) {
    return false;
  }
  return true;
};

/** Applies the effects of the player's relics that listen to `trigger`. */
export const runRelicTrigger = (
  battle: Battle,
  trigger: RelicTrigger,
  context: TriggerContext = {},
  rng: Rng = Math.random,
  depth: number = 0,
): Battle => {
  let result = battle;

  for (const relic of battle.player.relics) {
    relic.effects.forEach((effect, index) => {
      const key = `${relic.id}:${index}`;
      if (
        effect.trigger !== trigger ||
        !isRelicEffectActive(effect, key, result, context)
      ) {
        return;
      }
      debugConsole.log(
        `[DEBUG] Relic triggered: ${relic.name} - ${effect.effect} (${effect.value})`,
      );

      if (effect.oncePerCombat) {
        result = {
          ...result,
          counters: {
            ...result.counters,
            usedEffects: [...result.counters.usedEffects, key],
          },
        };
      }

      result = applyTriggeredEffect(
        result,
        {
          type: effect.effect,
          // A status effect without a value applies one stack
          value:
            effect.value ?? (effect.effect === EffectType.APPLY_STATUS ? 1 : 0),
          target: toTargetType(effect.target),
          statusType: effect.statusType,
          nextTurn: effect.nextTurn,
        },
        context,
        rng,
        depth,
      );
    });
  }

  return result;
};

/** Per-combat bookkeeping that follows from an event itself. */
const updateCounters = (
  counters: CombatCounters,
  event: CombatEvent,
): CombatCounters => {
  if (event.type === "turn_start") {
    return { ...counters, attacksPlayedThisTurn: 0 };
  }
  if (event.type === "card_played" && event.card.type === CardType.ATTACK) {
    return {
      ...counters,
      attacksPlayedThisTurn: counters.attacksPlayedThisTurn + 1,
    };
  }
  return counters;
};

const toContext = (event: CombatEvent): TriggerContext => {
  switch (event.type) {
    case "turn_start":
      return { turn: event.turn };
    case "card_played":
    case "card_exhausted":
      return { card: event.card };
    case "hp_lost":
      return { attackerId: event.attackerId };
    default:
      return {};
  }
};

/**
 * Raises an event: power card effects react first, then relic effects.
 * Effects may raise further events; a chain stops after a fixed depth so
 * effects that feed each other cannot loop forever.
 */
export const dispatch = (
  battle: Battle,
  event: CombatEvent,
  rng: Rng = Math.random,
  depth: number = 0,
): Battle => {
  if (depth > MAX_CHAIN_DEPTH) return battle;

  const context = toContext(event);
  let result: Battle = {
    ...battle,
    counters: updateCounters(battle.counters, event),
  };

  const powerTrigger = POWER_TRIGGERS[event.type];
  if (powerTrigger) {
    result = runPowerTrigger(result, powerTrigger, context, rng, depth);
  }

  const relicTrigger = RELIC_TRIGGERS[event.type];
  if (relicTrigger) {
    result = runRelicTrigger(result, relicTrigger, context, rng, depth);
  }

  return result;
};

/** The player gains block, and effects that react to gaining block fire. */
export const gainBlock = (
  battle: Battle,
  amount: number,
  rng: Rng = Math.random,
  depth: number = 0,
): Battle => {
  const block = Math.max(0, battle.player.block + amount);
  const gained = block - battle.player.block;
  const result = { ...battle, player: { ...battle.player, block } };

  return gained > 0
    ? dispatch(result, { type: "block_gained", amount: gained }, rng, depth)
    : result;
};

/**
 * The player loses health directly (block does not help), and effects that
 * react to losing health fire.
 */
export const loseHp = (
  battle: Battle,
  amount: number,
  attackerId?: string,
  rng: Rng = Math.random,
  depth: number = 0,
): Battle => {
  if (amount <= 0) return battle;

  const result = {
    ...battle,
    player: {
      ...battle.player,
      health: Math.max(0, battle.player.health - amount),
    },
  };
  return dispatch(result, { type: "hp_lost", amount, attackerId }, rng, depth);
};
