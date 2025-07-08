import {
  MonsterCard,
  Player,
  Enemy,
  EffectType,
  TargetType,
} from "../types/game";
import {
  applyStatusEffect,
  calculateDamage,
  calculateBlock,
} from "./statusEffects";

export interface MonsterCardResult {
  player: Player;
  enemy: Enemy;
}

export const processMonsterCardEffects = (
  card: MonsterCard,
  player: Player,
  enemy: Enemy,
): MonsterCardResult => {
  let newPlayer = { ...player };
  let newEnemy = { ...enemy };

  if (card.effects) {
    for (const effect of card.effects) {
      switch (effect.type) {
        case EffectType.DAMAGE:
          if (effect.target === TargetType.ENEMY) {
            // From monster perspective, ENEMY target is the player
            const finalDamage = calculateDamage(
              effect.value,
              newEnemy,
              newPlayer,
            );
            const damageAfterBlock = Math.max(0, finalDamage - newPlayer.block);

            newPlayer = {
              ...newPlayer,
              health: newPlayer.health - damageAfterBlock,
              block: Math.max(0, newPlayer.block - finalDamage),
            };
          }
          break;

        case EffectType.BLOCK:
          if (effect.target === TargetType.SELF) {
            // Monster gains block
            const finalBlock = calculateBlock(effect.value, newEnemy);
            newEnemy.block += finalBlock;
          }
          break;

        case EffectType.APPLY_STATUS:
          if (effect.statusType) {
            if (effect.target === TargetType.SELF) {
              // Apply status to the monster
              newEnemy = applyStatusEffect(
                newEnemy,
                effect.statusType,
                effect.value,
              ) as Enemy;
            } else if (effect.target === TargetType.ENEMY) {
              // From monster perspective, ENEMY target is the player
              newPlayer = applyStatusEffect(
                newPlayer,
                effect.statusType,
                effect.value,
              ) as Player;
            }
          }
          break;

        case EffectType.HEAL:
          if (effect.target === TargetType.SELF) {
            newEnemy.health = Math.min(
              newEnemy.maxHealth,
              newEnemy.health + effect.value,
            );
          }
          break;

        // Add more effect types as needed
        default:
          break;
      }
    }
  }

  // Legacy support: Handle cards with direct damage property
  if (
    card.damage &&
    card.damage > 0 &&
    (!card.effects ||
      !card.effects.some((effect) => effect.type === EffectType.DAMAGE))
  ) {
    const finalDamage = calculateDamage(card.damage, newEnemy, newPlayer);
    const damageAfterBlock = Math.max(0, finalDamage - newPlayer.block);

    newPlayer = {
      ...newPlayer,
      health: newPlayer.health - damageAfterBlock,
      block: Math.max(0, newPlayer.block - finalDamage),
    };
  }

  // Legacy support: Handle cards with direct block property
  if (
    card.block &&
    card.block > 0 &&
    (!card.effects ||
      !card.effects.some((effect) => effect.type === EffectType.BLOCK))
  ) {
    const finalBlock = calculateBlock(card.block, newEnemy);
    newEnemy.block += finalBlock;
  }

  return {
    player: newPlayer,
    enemy: newEnemy,
  };
};
