import {
  Player,
  Enemy,
  Relic,
  RelicTrigger,
  EffectType,
  StatusType,
  RelicEffect,
} from "../types/game";
import { applyStatusEffect } from "./statusEffects";
import { debugConsole } from "./debugUtils";

/**
 * Extra information about the moment a relic trigger fires.
 *
 * `shouldDrawCards` is an output: relic effects cannot draw cards themselves
 * (that needs the draw and discard piles), so they add to it and the caller
 * performs the draw.
 */
export interface RelicContext {
  shouldDrawCards?: number;
  playerTurnThisCombat?: number;
}

interface RelicResult {
  player: Player;
  enemies: Enemy[];
}

const targetsAllEnemies = (target?: string): boolean =>
  !target || target.toLowerCase() === "all_enemies";

/** Whether an effect's own conditions (beyond its trigger) are met. */
const isEffectActive = (effect: RelicEffect, context?: RelicContext): boolean =>
  effect.onTurn === undefined ||
  effect.onTurn === context?.playerTurnThisCombat;

/**
 * Applies every relic effect the player owns that matches `trigger`.
 *
 * `enemies` is the set of enemies the trigger concerns: every enemy in combat
 * for combat/turn triggers, or just the attacker for `DAMAGE_TAKEN`.
 */
export const processRelicEffects = (
  trigger: RelicTrigger,
  player: Player,
  enemies: Enemy[],
  context?: RelicContext,
): RelicResult => {
  let result: RelicResult = { player: { ...player }, enemies: [...enemies] };

  for (const relic of player.relics) {
    for (const effect of relic.effects) {
      if (effect.trigger !== trigger || !isEffectActive(effect, context)) {
        continue;
      }
      debugConsole.log(
        `[DEBUG] Relic triggered: ${relic.name} - ${effect.effect} (${effect.value})`,
      );
      result = applyRelicEffect(effect, result.player, result.enemies, context);
    }
  }

  return result;
};

const applyRelicEffect = (
  effect: RelicEffect,
  player: Player,
  enemies: Enemy[],
  context?: RelicContext,
): RelicResult => {
  let newPlayer = { ...player };
  let newEnemies = [...enemies];

  const amount = effect.value || 0;

  switch (effect.effect) {
    case EffectType.HEAL:
      newPlayer.health = Math.min(
        newPlayer.maxHealth,
        newPlayer.health + amount,
      );
      break;

    case EffectType.BLOCK:
      newPlayer.block = Math.max(0, newPlayer.block + amount);
      break;

    case EffectType.GAIN_ENERGY:
      newPlayer.energy = Math.min(
        newPlayer.maxEnergy + 3,
        newPlayer.energy + amount,
      );
      break;

    case EffectType.DRAW_CARDS:
      if (context) {
        context.shouldDrawCards = (context.shouldDrawCards || 0) + amount;
      }
      break;

    case EffectType.APPLY_STATUS: {
      const statusType = effect.statusType;
      if (!statusType) break;

      if (effect.target === "self") {
        newPlayer = applyStatusEffect(
          newPlayer,
          statusType,
          effect.value || 1,
        ) as Player;
      } else if (targetsAllEnemies(effect.target)) {
        newEnemies = newEnemies.map(
          (enemy) =>
            applyStatusEffect(enemy, statusType, effect.value || 1) as Enemy,
        );
      }
      break;
    }

    case EffectType.DAMAGE:
      if (targetsAllEnemies(effect.target)) {
        newEnemies = newEnemies.map((enemy) => ({
          ...enemy,
          health: Math.max(0, enemy.health - amount),
        }));
      }
      break;
  }

  return { player: newPlayer, enemies: newEnemies };
};

export const getRelicDescription = (relic: Relic): string => {
  return relic.description;
};

export const shouldTriggerRelic = (
  relic: Relic,
  trigger: RelicTrigger,
  context?: RelicContext,
): boolean => {
  return relic.effects.some(
    (effect) => effect.trigger === trigger && isEffectActive(effect, context),
  );
};

// Specific relic implementations
export const processAkabekoEffect = (
  player: Player,
  cardType: string,
): number => {
  // Akabeko: First attack each combat deals 8 additional damage
  const hasAkabeko = player.relics.some((r) => r.id === "akabeko");
  if (hasAkabeko && cardType === "attack") {
    return 8;
  }
  return 0;
};

export const processBagOfMarblesEffect = (enemies: Enemy[]): Enemy[] => {
  // Bag of Marbles: Apply 1 Vulnerable to ALL enemies at combat start
  return enemies.map(
    (enemy) => applyStatusEffect(enemy, StatusType.VULNERABLE, 1) as Enemy,
  );
};

export const processBloodVialEffect = (player: Player): Player => {
  // Blood Vial: Heal 2 HP at combat start
  return {
    ...player,
    health: Math.min(player.maxHealth, player.health + 2),
  };
};
