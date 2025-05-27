import { Player, Enemy, Relic, RelicTrigger, EffectType, StatusType } from '../types/game';
import { applyStatusEffect } from './statusEffects';

export const processRelicEffects = (
  trigger: RelicTrigger,
  player: Player,
  enemies: Enemy[],
  context?: any
): { player: Player; enemies: Enemy[] } => {
  let newPlayer = { ...player };
  let newEnemies = [...enemies];

  // Process each relic's effects
  for (const relic of player.relics) {
    for (const effect of relic.effects) {
      if (effect.trigger === trigger) {
        const result = applyRelicEffect(effect, newPlayer, newEnemies, context);
        newPlayer = result.player;
        newEnemies = result.enemies;
      }
    }
  }

  return { player: newPlayer, enemies: newEnemies };
};

const applyRelicEffect = (
  effect: any,
  player: Player,
  enemies: Enemy[],
  context?: any
): { player: Player; enemies: Enemy[] } => {
  let newPlayer = { ...player };
  let newEnemies = [...enemies];

  switch (effect.effect) {
    case EffectType.HEAL:
      newPlayer.health = Math.min(newPlayer.maxHealth, newPlayer.health + (effect.value || 0));
      break;

    case EffectType.BLOCK:
      newPlayer.block += (effect.value || 0);
      break;

    case EffectType.GAIN_ENERGY:
      newPlayer.energy = Math.min(newPlayer.maxEnergy + 3, newPlayer.energy + (effect.value || 0));
      break;

    case EffectType.DRAW_CARDS:
      // This would trigger the draw cards function in the game store
      // For now, we'll just note that cards should be drawn
      break;

    case EffectType.APPLY_STATUS:
      if (effect.statusType) {
        if (effect.target === 'self') {
          newPlayer = applyStatusEffect(newPlayer, effect.statusType, effect.value || 1) as Player;
        } else if (effect.target === 'all_enemies') {
          newEnemies = newEnemies.map(enemy => 
            applyStatusEffect(enemy, effect.statusType!, effect.value || 1) as Enemy
          );
        }
      }
      break;

    case EffectType.DAMAGE:
      if (effect.target === 'all_enemies') {
        newEnemies = newEnemies.map(enemy => ({
          ...enemy,
          health: enemy.health - (effect.value || 0)
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
  context?: any
): boolean => {
  // Check if any of the relic's effects should trigger
  return relic.effects.some(effect => effect.trigger === trigger);
};

// Specific relic implementations
export const processAkabekoEffect = (player: Player, cardType: string): number => {
  // Akabeko: First attack each combat deals 8 additional damage
  const hasAkabeko = player.relics.some(r => r.id === 'akabeko');
  if (hasAkabeko && cardType === 'attack') {
    // In a real implementation, we'd track if this is the first attack
    return 8;
  }
  return 0;
};

export const processBagOfMarblesEffect = (enemies: Enemy[]): Enemy[] => {
  // Bag of Marbles: Apply 1 Vulnerable to ALL enemies at combat start
  return enemies.map(enemy => 
    applyStatusEffect(enemy, StatusType.VULNERABLE, 1) as Enemy
  );
};

export const processBloodVialEffect = (player: Player): Player => {
  // Blood Vial: Heal 2 HP at combat start
  return {
    ...player,
    health: Math.min(player.maxHealth, player.health + 2)
  };
}; 