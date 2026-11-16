import {
  MonsterCard,
  Player,
  Enemy,
  EffectType,
  TargetType,
} from "../types/game";
import { getCardEffects, takeDamage } from "../engine/effects";
import {
  applyStatusEffect,
  calculateDamage,
  calculateBlock,
} from "./statusEffects";

export interface MonsterCardResult {
  player: Player;
  enemy: Enemy;
}

/**
 * Resolves a card an enemy plays. Targets are from the enemy's point of view:
 * `ENEMY` is the player and `SELF` is the enemy playing the card.
 */
export const processMonsterCardEffects = (
  card: MonsterCard,
  player: Player,
  enemy: Enemy,
): MonsterCardResult => {
  let newPlayer = player;
  let newEnemy = enemy;

  for (const effect of getCardEffects(card)) {
    switch (effect.type) {
      case EffectType.DAMAGE:
        if (effect.target === TargetType.ENEMY) {
          newPlayer = takeDamage(
            newPlayer,
            calculateDamage(effect.value, newEnemy, newPlayer),
          );
        }
        break;

      case EffectType.BLOCK:
        if (effect.target === TargetType.SELF) {
          newEnemy = {
            ...newEnemy,
            block: newEnemy.block + calculateBlock(effect.value, newEnemy),
          };
        }
        break;

      case EffectType.APPLY_STATUS:
        if (!effect.statusType) break;
        if (effect.target === TargetType.SELF) {
          newEnemy = applyStatusEffect(
            newEnemy,
            effect.statusType,
            effect.value,
          ) as Enemy;
        } else if (effect.target === TargetType.ENEMY) {
          newPlayer = applyStatusEffect(
            newPlayer,
            effect.statusType,
            effect.value,
          ) as Player;
        }
        break;

      case EffectType.HEAL:
        if (effect.target === TargetType.SELF) {
          newEnemy = {
            ...newEnemy,
            health: Math.min(
              newEnemy.maxHealth,
              newEnemy.health + effect.value,
            ),
          };
        }
        break;

      default:
        break;
    }
  }

  return { player: newPlayer, enemy: newEnemy };
};
