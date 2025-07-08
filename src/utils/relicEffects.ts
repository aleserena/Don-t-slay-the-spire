import { Player, Enemy, Relic, RelicTrigger, EffectType, StatusType, RelicEffect } from '../types/game';
import { applyStatusEffect } from './statusEffects';

interface RelicContext {
  shouldDrawCards?: number;
}

export const processRelicEffects = (
  trigger: RelicTrigger,
  player: Player,
  enemies: Enemy[],
  _context?: RelicContext
): { player: Player; enemies: Enemy[] } => {
  let newPlayer = { ...player };
  let newEnemies = [...enemies];

  // Process each relic's effects
  for (const relic of player.relics) {
    for (const effect of relic.effects) {
      if (effect.trigger === trigger) {
        // Special handling for specific relics
        if (relic.id === 'bronze_scales' && trigger === RelicTrigger.DAMAGE_TAKEN) {
          // Bronze Scales: Deal 3 damage back to all enemies
          newEnemies = newEnemies.map(enemy => ({
            ...enemy,
            health: Math.max(0, enemy.health - 3)
          }));
        } else if (relic.id === 'centennial_puzzle' && trigger === RelicTrigger.DAMAGE_TAKEN) {
          // Centennial Puzzle: Draw 3 cards on first damage taken
          // This would need to be handled in the game store to actually draw cards
          // For now, we'll mark that cards should be drawn
          if (_context) {
            _context.shouldDrawCards = 3;
          }
        } else {
          // Apply standard relic effect
          const result = applyRelicEffect(effect, newPlayer, newEnemies, _context);
          newPlayer = result.player;
          newEnemies = result.enemies;
        }
      }
    }
  }

  return { player: newPlayer, enemies: newEnemies };
};

const applyRelicEffect = (
  effect: RelicEffect,
  player: Player,
  enemies: Enemy[],
  _context?: RelicContext
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
        // Check if the effect has a target specified
        if (effect.target === 'self') {
          newPlayer = applyStatusEffect(newPlayer, effect.statusType, effect.value || 1) as Player;
        } else if (effect.target === 'all_enemies' || effect.target === 'ALL_ENEMIES' || !effect.target) {
          // Default to all enemies if no target specified for status effects
          newEnemies = newEnemies.map(enemy => 
            applyStatusEffect(enemy, effect.statusType!, effect.value || 1) as Enemy
          );
        }
      }
      break;

    case EffectType.DAMAGE:
      if (effect.target === 'all_enemies' || effect.target === 'ALL_ENEMIES') {
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
  _context?: RelicContext
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