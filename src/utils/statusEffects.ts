import { StatusType, Player, Enemy } from '../types/game';

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
      return 3; // These effects last 3 turns
    case StatusType.POISON:
      return undefined; // Poison lasts until combat ends
    case StatusType.STRENGTH:
    case StatusType.DEXTERITY:
      return undefined; // These are permanent for the combat
    default:
      return undefined;
  }
};

export const processStatusEffects = (target: Player | Enemy): Player | Enemy => {
  const newTarget = { ...target };
  
  // Process each status effect
  newTarget.statusEffects = newTarget.statusEffects.map(effect => {
    switch (effect.type) {
      case StatusType.POISON:
        // Poison deals damage at start of turn
        newTarget.health = Math.max(0, newTarget.health - effect.stacks);
        return effect;
      
      case StatusType.WEAK:
      case StatusType.VULNERABLE:
        // Reduce duration
        if (effect.duration !== undefined) {
          return { ...effect, duration: effect.duration - 1 };
        }
        return effect;
      
      default:
        return effect;
    }
  }).filter(effect => effect.duration === undefined || effect.duration > 0);
  
  return newTarget;
};

export const calculateDamage = (
  baseDamage: number,
  attacker: Player | Enemy,
  target: Player | Enemy
): number => {
  let damage = baseDamage;
  
  // Apply strength bonus
  const strength = attacker.statusEffects.find(e => e.type === StatusType.STRENGTH);
  if (strength) {
    damage += strength.stacks;
  }
  
  // Apply weak debuff (reduces damage by 25%)
  const weak = attacker.statusEffects.find(e => e.type === StatusType.WEAK);
  if (weak) {
    damage = Math.floor(damage * 0.75);
  }
  
  // Apply vulnerable on target (increases damage by 50%)
  const vulnerable = target.statusEffects.find(e => e.type === StatusType.VULNERABLE);
  if (vulnerable) {
    damage = Math.floor(damage * 1.5);
  }
  
  return Math.max(0, damage);
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