import { Card, Player, Enemy, TargetType, EffectType } from '../types/game';
import { calculateDamage } from './statusEffects';
import { getAllCards } from '../data/cards';

export interface CardDamageInfo {
  totalDamage: number;
  actualDamage: number;
  isVulnerable: boolean;
  wouldKill: boolean;
  hitsCount?: number;
}

export interface CardPreview {
  type: 'single-target' | 'multi-target' | 'whirlwind';
  previews: Array<{
    enemyName: string;
    totalDamage: number;
    actualDamage: number;
    isVulnerable: boolean;
    wouldKill: boolean;
    hitsCount?: number;
  }>;
  hitsCount?: number;
}

/**
 * Get a card by its baseId (consistent identifier)
 */
export const getCardByBaseId = (baseId: string): Card | undefined => {
  return getAllCards().find((card: Card) => card.baseId === baseId);
};

/**
 * Check if a card has a specific baseId
 */
export const hasBaseId = (card: Card, baseId: string): boolean => {
  return card.baseId === baseId;
};

/**
 * Modular damage calculation system - calculates damage based on card effects
 */
export const calculateCardEffectDamage = (
  card: Card,
  player: Player,
  enemy: Enemy,
  isFirstAttack: boolean = false
): number => {
  let totalDamage = 0;
  
  // Check for effect-based damage first
  if (card.effects) {
    for (const effect of card.effects) {
      switch (effect.type) {
        case EffectType.DAMAGE:
          totalDamage += calculateDamage(effect.value, player, enemy, isFirstAttack && totalDamage === 0);
          break;
          
        case EffectType.DAMAGE_MULTIPLIER_BLOCK:
          const blockDamage = player.block * (effect.multiplier || 1);
          totalDamage += calculateDamage(blockDamage, player, enemy, isFirstAttack);
          break;
          
        case EffectType.DAMAGE_MULTIPLIER_ENERGY:
          const energyHits = player.energy;
          const damagePerHit = calculateDamage(effect.value, player, enemy, isFirstAttack);
          totalDamage += damagePerHit * energyHits;
          break;
      }
    }
  }
  
  // Fallback to direct damage property for legacy cards
  if (totalDamage === 0 && card.damage !== undefined && card.damage > 0) {
    totalDamage = calculateDamage(card.damage, player, enemy, isFirstAttack);
  }
  
  return totalDamage;
};

/**
 * Check if card needs target selection
 */
export const cardNeedsTarget = (card: Card): boolean => {
  // Multi-target cards don't need targeting
  if (isMultiTargetCard(card)) {
    return false;
  }
  
  // Cards that target enemies need targeting
  if (card.effects) {
    return card.effects.some(effect => 
      effect.target === TargetType.ENEMY
    );
  }
  
  // Legacy damage cards need targeting
  if (card.damage && card.damage > 0) {
    return true;
  }
  
  return false;
};

/**
 * Check if card targets all enemies (multi-target)
 */
export const isMultiTargetCard = (card: Card): boolean => {
  return hasBaseId(card, 'cleave') || hasBaseId(card, 'whirlwind');
};

/**
 * Calculates the total damage a card would deal to a specific enemy
 */
export const calculateCardDamage = (card: Card, player: Player, target: Enemy): number => {
  let totalDamage = 0;
  
  // Handle effect-based damage
  if (card.effects) {
    for (const effect of card.effects) {
      if (effect.type === EffectType.DAMAGE) {
        totalDamage += calculateDamage(effect.value, player, target);
      } else if (effect.type === EffectType.DAMAGE_MULTIPLIER_BLOCK) {
        const blockDamage = player.block * (effect.multiplier || 1);
        totalDamage += calculateDamage(blockDamage, player, target);
      } else if (effect.type === EffectType.DAMAGE_MULTIPLIER_ENERGY) {
        const energyDamage = player.energy * effect.value;
        totalDamage += calculateDamage(energyDamage, player, target);
      }
    }
  }
  
  // Handle legacy damage property (only if no damage effects)
  if (card.damage && card.damage > 0 && (!card.effects || !card.effects.some(effect => 
    effect.type === EffectType.DAMAGE || 
    effect.type === EffectType.DAMAGE_MULTIPLIER_BLOCK || 
    effect.type === EffectType.DAMAGE_MULTIPLIER_ENERGY
  ))) {
    totalDamage += calculateDamage(card.damage, player, target);
  }
  
  return totalDamage;
};

/**
 * Gets damage preview information for a card against all enemies
 */
export const getCardDamagePreview = (
  card: Card,
  player: Player,
  enemies: Enemy[]
): CardPreview | null => {
  // Check if card deals damage through effects or direct damage
  const dealsDamage = card.effects?.some(effect => 
    effect.type === EffectType.DAMAGE || 
    effect.type === EffectType.DAMAGE_MULTIPLIER_BLOCK ||
    effect.type === EffectType.DAMAGE_MULTIPLIER_ENERGY
  ) || (card.damage !== undefined && card.damage > 0);
  
  if (!dealsDamage) return null;
  
  const previews = enemies.map(enemy => {
    const totalDamage = calculateCardDamage(card, player, enemy);
    const damageAfterBlock = Math.max(0, totalDamage - enemy.block);
    const isVulnerable = enemy.statusEffects.some((effect: any) => effect.type === 'vulnerable');
    const wouldKill = damageAfterBlock >= enemy.health;
    
    const preview = {
      enemyName: enemy.name,
      totalDamage,
      actualDamage: damageAfterBlock,
      isVulnerable,
      wouldKill
    };
    
    // Check for energy-based effects (like Whirlwind)
    const energyEffect = card.effects?.find(effect => effect.type === EffectType.DAMAGE_MULTIPLIER_ENERGY);
    if (energyEffect) {
      return { ...preview, hitsCount: player.energy };
    }
    
    return preview;
  });
  
  // Determine preview type
  const energyEffect = card.effects?.find(effect => effect.type === EffectType.DAMAGE_MULTIPLIER_ENERGY);
  if (energyEffect) {
    return { type: 'whirlwind', previews, hitsCount: player.energy };
  } else if (isMultiTargetCard(card)) {
    return { type: 'multi-target', previews };
  } else {
    return { type: 'single-target', previews };
  }
};

/**
 * Gets the display damage for a card (shown on the card itself)
 */
export const getCardDisplayDamage = (card: Card, player: Player, enemies: Enemy[]): number => {
  let totalDamage = 0;
  
  // Check for effect-based damage calculation
  if (card.effects) {
    for (const effect of card.effects) {
      switch (effect.type) {
        case EffectType.DAMAGE:
          if (effect.target === 'all_enemies') {
            // For multi-target effects, show base damage
            if (enemies.length === 0) {
              totalDamage += effect.value;
            } else {
              // Always show conservative damage (no vulnerable bonus)
              const mockEnemy = { ...enemies[0], statusEffects: enemies[0].statusEffects.filter(e => e.type !== 'vulnerable') };
              totalDamage += calculateDamage(effect.value, player, mockEnemy, false);
            }
          } else {
            // For single-target effects (like Twin Strike), add each damage instance
            if (enemies.length === 0) {
              totalDamage += effect.value;
            } else {
              // Always show conservative damage (no vulnerable bonus)
              const mockEnemy = { ...enemies[0], statusEffects: enemies[0].statusEffects.filter(e => e.type !== 'vulnerable') };
              totalDamage += calculateDamage(effect.value, player, mockEnemy, false);
            }
          }
          break;
          
        case EffectType.DAMAGE_MULTIPLIER_BLOCK:
          totalDamage += player.block * (effect.multiplier || 1);
          break;
          
        case EffectType.DAMAGE_MULTIPLIER_ENERGY:
          if (enemies.length === 0) {
            totalDamage += 0;
          } else {
            const damagePerHit = calculateDamage(effect.value, player, enemies[0], false);
            totalDamage += damagePerHit * player.energy;
          }
          break;
      }
    }
  }
  
  // Fallback to legacy damage calculation
  if (totalDamage === 0 && card.damage) {
    if (enemies.length === 0) {
      totalDamage = card.damage;
    } else {
      // Always show conservative damage (no vulnerable bonus)
      const mockEnemy = { ...enemies[0], statusEffects: enemies[0].statusEffects.filter(e => e.type !== 'vulnerable') };
      totalDamage = calculateDamage(card.damage, player, mockEnemy, false);
    }
  }
  
  return totalDamage;
}; 