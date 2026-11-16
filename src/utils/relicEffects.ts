import {
  Player,
  Enemy,
  Relic,
  RelicTrigger,
  StatusType,
  RelicEffect,
} from "../types/game";
import { applyStatusEffect } from "./statusEffects";
import { createBattle, runRelicTrigger } from "../engine/triggers";

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

/**
 * Applies every relic effect the player owns that matches `trigger`.
 *
 * Kept for callers that only have a player and enemies; combat itself raises
 * events through `dispatch` in `src/engine/triggers.ts`, which runs the same
 * code and also tracks per-combat conditions.
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
  const battle = runRelicTrigger(createBattle(player, enemies), trigger, {
    turn: context?.playerTurnThisCombat,
  });

  if (context && battle.cardsToDraw > 0) {
    context.shouldDrawCards =
      (context.shouldDrawCards || 0) + battle.cardsToDraw;
  }
  return { player: battle.player, enemies: battle.enemies };
};

/** Whether an effect's own conditions (beyond its trigger) are met. */
const isEffectActive = (effect: RelicEffect, context?: RelicContext): boolean =>
  effect.onTurn === undefined ||
  effect.onTurn === context?.playerTurnThisCombat;

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
