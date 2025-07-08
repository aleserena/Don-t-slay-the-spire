import { Player, Enemy, PowerTrigger, EffectType, TargetType, PowerCardEffect } from '../types/game';
import { applyStatusEffect } from './statusEffects';

export const processPowerCardEffects = (
  trigger: PowerTrigger,
  player: Player,
  enemies: Enemy[]
): { player: Player; enemies: Enemy[] } => {
  let newPlayer = { ...player };
  let newEnemies = [...enemies];

  // Process each active power card
  for (const powerCard of player.powerCards) {
    for (const effect of powerCard.effects) {
      if (effect.trigger === trigger) {
        const result = applyPowerCardEffect(effect, newPlayer, newEnemies);
        newPlayer = result.player;
        newEnemies = result.enemies;
      }
    }
  }

  return { player: newPlayer, enemies: newEnemies };
};

const applyPowerCardEffect = (
  effect: PowerCardEffect,
  player: Player,
  enemies: Enemy[]
): { player: Player; enemies: Enemy[] } => {
  let newPlayer = { ...player };
  let newEnemies = [...enemies];

  switch (effect.type) {
    case EffectType.BLOCK:
      if (effect.target === TargetType.SELF) {
        newPlayer.block += effect.value;
      }
      break;

    case EffectType.HEAL:
      if (effect.target === TargetType.SELF) {
        newPlayer.health = Math.min(newPlayer.maxHealth, newPlayer.health + effect.value);
      }
      break;

    case EffectType.GAIN_ENERGY:
      if (effect.target === TargetType.SELF) {
        newPlayer.energy = Math.min(newPlayer.maxEnergy + 3, newPlayer.energy + effect.value);
      }
      break;

    case EffectType.APPLY_STATUS:
      if (effect.statusType) {
        if (effect.target === TargetType.SELF) {
          newPlayer = applyStatusEffect(newPlayer, effect.statusType, effect.value) as Player;
        } else if (effect.target === TargetType.ALL_ENEMIES) {
          newEnemies = newEnemies.map(enemy => 
            applyStatusEffect(enemy, effect.statusType!, effect.value) as Enemy
          );
        }
      }
      break;

    case EffectType.DAMAGE:
      if (effect.target === TargetType.ALL_ENEMIES) {
        newEnemies = newEnemies.map(enemy => ({
          ...enemy,
          health: Math.max(0, enemy.health - effect.value)
        }));
      }
      break;
  }

  return { player: newPlayer, enemies: newEnemies };
}; 