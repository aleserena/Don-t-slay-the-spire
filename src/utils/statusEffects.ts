import { StatusType, Player, Enemy } from '../types/game';
import { debugConsole } from './debugUtils';

export const applyStatusEffect = (
  target: Player | Enemy,
  effectType: StatusType,
  stacks: number
): Player | Enemy => {
  const existingEffect = target.statusEffects.find(effect => effect.type === effectType);
  
  if (existingEffect) {
    // Stack the effect
    existingEffect.stacks += stacks;
  } else {
    // Add new effect
    target.statusEffects.push({
      type: effectType,
      stacks,
      duration: getStatusEffectDuration(effectType)
    });
  }
  
  return { ...target };
};

export const removeStatusEffect = (
  target: Player | Enemy,
  effectType: StatusType
): Player | Enemy => {
  return {
    ...target,
    statusEffects: target.statusEffects.filter(effect => effect.type !== effectType)
  };
};

export const getStatusEffectDuration = (effectType: StatusType): number | undefined => {
  switch (effectType) {
    case StatusType.WEAK:
    case StatusType.VULNERABLE:
      return undefined; // These effects use stacks, not duration
    case StatusType.POISON:
      return undefined; // Poison lasts until combat ends
    case StatusType.STRENGTH:
    case StatusType.DEXTERITY:
      return undefined; // These are permanent for the combat
    default:
      return undefined;
  }
};

export const processStatusEffects = (entity: Player | Enemy): Player | Enemy => {
  let newEntity = { ...entity };
  
  // Process each status effect
  newEntity.statusEffects = newEntity.statusEffects.map(effect => {
    let newEffect = { ...effect };
    
    switch (effect.type) {
      case StatusType.POISON:
        // Poison deals damage then reduces stacks
        if ('health' in newEntity) {
          newEntity.health = Math.max(0, newEntity.health - effect.stacks);
        }
        newEffect.stacks = Math.max(0, effect.stacks - 1);
        break;
        
      case StatusType.WEAK:
      case StatusType.VULNERABLE:
        // Reduce stacks by 1 at end of turn
        newEffect.stacks = Math.max(0, effect.stacks - 1);
        break;
        
      case StatusType.STRENGTH:
      case StatusType.DEXTERITY:
        // These persist for the entire combat
        break;
        
      default:
        // For other effects with duration, reduce duration
        if (effect.duration !== undefined) {
          newEffect.duration = Math.max(0, effect.duration - 1);
        }
        break;
    }
    
    return newEffect;
  }).filter(effect => {
    // Remove effects with 0 stacks or 0 duration
    if (effect.stacks !== undefined && effect.stacks <= 0) {
      return false;
    }
    if (effect.duration !== undefined && effect.duration <= 0) {
      return false;
    }
    return true;
  });

  return newEntity;
};

export const calculateDamage = (
  baseDamage: number,
  attacker: Player | Enemy,
  target: Player | Enemy,
  isFirstAttack?: boolean
): number => {
  // Input validation
  if (typeof baseDamage !== 'number' || isNaN(baseDamage)) {
    debugConsole.error('🚨 DAMAGE CALCULATION ERROR: Invalid baseDamage:', baseDamage);
    return 0;
  }
  
  if (!attacker || !target) {
    debugConsole.error('🚨 DAMAGE CALCULATION ERROR: Missing attacker or target:', { attacker, target });
    return 0;
  }
  
  if (!attacker.statusEffects || !target.statusEffects) {
    debugConsole.error('🚨 DAMAGE CALCULATION ERROR: Missing statusEffects:', { 
      attackerEffects: attacker.statusEffects, 
      targetEffects: target.statusEffects 
    });
    return 0;
  }

  let damage = baseDamage;
  const originalDamage = damage;
  
  // Apply strength bonus
  const strength = attacker.statusEffects.find(e => e.type === StatusType.STRENGTH);
  if (strength) {
    if (typeof strength.stacks !== 'number' || isNaN(strength.stacks)) {
      debugConsole.error('🚨 DAMAGE CALCULATION ERROR: Invalid strength stacks:', strength.stacks);
    } else {
      damage += strength.stacks;
    }
  }
  
  // Apply weak debuff (reduces damage by 25%)
  const weak = attacker.statusEffects.find(e => e.type === StatusType.WEAK);
  if (weak) {
    if (typeof weak.stacks !== 'number' || isNaN(weak.stacks)) {
      debugConsole.error('🚨 DAMAGE CALCULATION ERROR: Invalid weak stacks:', weak.stacks);
    } else {
      damage = Math.floor(damage * 0.75);
    }
  }
  
  // Apply vulnerable on target (increases damage by 50%)
  const vulnerable = target.statusEffects.find(e => e.type === StatusType.VULNERABLE);
  if (vulnerable) {
    if (typeof vulnerable.stacks !== 'number' || isNaN(vulnerable.stacks)) {
      debugConsole.error('🚨 DAMAGE CALCULATION ERROR: Invalid vulnerable stacks:', vulnerable.stacks);
    } else {
      damage = Math.floor(damage * 1.5);
    }
  }
  
  // Apply relic effects if attacker is a player
  if ('relics' in attacker) {
    const player = attacker as Player;
    
    if (!player.relics) {
      debugConsole.error('🚨 DAMAGE CALCULATION ERROR: Player missing relics array');
    } else {
      // Apply Akabeko effect (first attack each combat deals 8 additional damage)
      if (isFirstAttack) {
        const hasAkabeko = player.relics.some(r => r && r.id === 'akabeko');
        if (hasAkabeko) {
          damage += 8;
        }
      }
    }
  }
  
  const finalDamage = Math.max(0, damage);
  
  // Log calculation details for debugging
  if (originalDamage !== finalDamage) {
    debugConsole.log('🔢 Damage Calculation Details:', {
      baseDamage: originalDamage,
      finalDamage,
      modifiers: {
        strength: strength?.stacks || 0,
        weak: weak ? 'applied (-25%)' : 'none',
        vulnerable: vulnerable ? 'applied (+50%)' : 'none',
        akabeko: isFirstAttack && 'relics' in attacker && (attacker as Player).relics?.some(r => r?.id === 'akabeko') ? 'applied (+8)' : 'none'
      },
      calculation: `${originalDamage} → ${finalDamage}`
    });
  }
  
  return finalDamage;
};

export const calculateBlock = (
  baseBlock: number,
  defender: Player | Enemy
): number => {
  let block = baseBlock;
  
  // Apply dexterity bonus
  const dexterity = defender.statusEffects.find(e => e.type === StatusType.DEXTERITY);
  if (dexterity) {
    block += dexterity.stacks;
  }
  
  return Math.max(0, block);
};

export const getStatusEffectIcon = (effectType: StatusType): string => {
  switch (effectType) {
    case StatusType.POISON:
      return '☠️';
    case StatusType.WEAK:
      return '💔';
    case StatusType.VULNERABLE:
      return '🎯';
    case StatusType.STRENGTH:
      return '💪';
    case StatusType.DEXTERITY:
      return '🏃';
    default:
      return '❓';
  }
};

export const getStatusEffectColor = (effectType: StatusType): string => {
  switch (effectType) {
    case StatusType.POISON:
      return '#8B5A2B';
    case StatusType.WEAK:
      return '#FF6B6B';
    case StatusType.VULNERABLE:
      return '#4ECDC4';
    case StatusType.STRENGTH:
      return '#95E1D3';
    case StatusType.DEXTERITY:
      return '#A8E6CF';
    default:
      return '#95A5A6';
  }
};

export const getStatusEffectDescription = (statusType: StatusType): string => {
  switch (statusType) {
    case StatusType.VULNERABLE:
      return 'Takes 50% more damage from attacks.';
    case StatusType.WEAK:
      return 'Deals 25% less damage with attacks.';
    case StatusType.STRENGTH:
      return 'Increases damage dealt by attacks.';
    case StatusType.POISON:
      return 'Takes damage at the start of each turn, then reduces by 1.';
    case StatusType.DEXTERITY:
      return 'Increases block gained from cards.';
    default:
      return 'Unknown status effect.';
  }
};

export const getStatusEffectName = (statusType: StatusType): string => {
  switch (statusType) {
    case StatusType.VULNERABLE:
      return 'Vulnerable';
    case StatusType.WEAK:
      return 'Weak';
    case StatusType.STRENGTH:
      return 'Strength';
    case StatusType.POISON:
      return 'Poison';
    case StatusType.DEXTERITY:
      return 'Dexterity';
    default:
      return statusType;
  }
}; 