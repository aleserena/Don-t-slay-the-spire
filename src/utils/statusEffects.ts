import { StatusType, StatusEffect, Player, Enemy } from "../types/game";
import { debugConsole } from "./debugUtils";

export const applyStatusEffect = (
  target: Player | Enemy,
  effectType: StatusType,
  stacks: number,
): Player | Enemy => {
  const existingEffect = target.statusEffects.find(
    (effect) => effect.type === effectType,
  );

  let newStatusEffects;
  if (existingEffect) {
    // Stack the effect (immutably)
    newStatusEffects = target.statusEffects.map((effect) =>
      effect.type === effectType
        ? { ...effect, stacks: effect.stacks + stacks }
        : effect,
    );
  } else {
    // Add new effect (immutably)
    newStatusEffects = [
      ...target.statusEffects,
      {
        type: effectType,
        stacks,
        duration: getStatusEffectDuration(effectType),
      },
    ];
  }

  return { ...target, statusEffects: newStatusEffects };
};

export const removeStatusEffect = (
  target: Player | Enemy,
  effectType: StatusType,
): Player | Enemy => {
  return {
    ...target,
    statusEffects: target.statusEffects.filter(
      (effect) => effect.type !== effectType,
    ),
  };
};

export const getStatusEffectDuration = (
  effectType: StatusType,
): number | undefined => {
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

type Combatant = Player | Enemy;

const withoutExpired = (effects: StatusEffect[]): StatusEffect[] =>
  effects.filter(
    (effect) =>
      effect.stacks > 0 &&
      (effect.duration === undefined || effect.duration > 0),
  );

/** Poison deals its stacks as damage (ignoring block), then loses a stack. */
export const tickPoison = <T extends Combatant>(entity: T): T => {
  const poison = entity.statusEffects.find(
    (effect) => effect.type === StatusType.POISON,
  );
  if (!poison) return entity;

  return {
    ...entity,
    health: Math.max(0, entity.health - poison.stacks),
    statusEffects: withoutExpired(
      entity.statusEffects.map((effect) =>
        effect.type === StatusType.POISON
          ? { ...effect, stacks: effect.stacks - 1 }
          : effect,
      ),
    ),
  };
};

const isTimedDebuff = (type: StatusType): boolean =>
  type === StatusType.WEAK || type === StatusType.VULNERABLE;

/**
 * Weak and Vulnerable lose a stack, and effects with a duration lose a turn.
 * `shouldTick` narrows this to some status types, e.g. the ones an entity
 * already had before the turn began.
 */
export const tickDebuffs = <T extends Combatant>(
  entity: T,
  shouldTick: (type: StatusType) => boolean = () => true,
): T => ({
  ...entity,
  statusEffects: withoutExpired(
    entity.statusEffects.map((effect) => {
      if (effect.type === StatusType.POISON || !shouldTick(effect.type)) {
        return effect;
      }
      if (isTimedDebuff(effect.type)) {
        return { ...effect, stacks: effect.stacks - 1 };
      }
      return effect.duration !== undefined
        ? { ...effect, duration: effect.duration - 1 }
        : effect;
    }),
  ),
});

/** A full status tick: poison, then timed debuffs. */
export const processStatusEffects = (entity: Combatant): Combatant =>
  tickDebuffs(tickPoison(entity));

export const calculateDamage = (
  baseDamage: number,
  attacker: Player | Enemy,
  target: Player | Enemy,
  isFirstAttack?: boolean,
  strengthMultiplier: number = 1,
): number => {
  // Input validation
  if (typeof baseDamage !== "number" || isNaN(baseDamage)) {
    debugConsole.error(
      "🚨 DAMAGE CALCULATION ERROR: Invalid baseDamage:",
      baseDamage,
    );
    return 0;
  }

  if (!attacker || !target) {
    debugConsole.error(
      "🚨 DAMAGE CALCULATION ERROR: Missing attacker or target:",
      { attacker, target },
    );
    return 0;
  }

  if (!attacker.statusEffects || !target.statusEffects) {
    debugConsole.error("🚨 DAMAGE CALCULATION ERROR: Missing statusEffects:", {
      attackerEffects: attacker.statusEffects,
      targetEffects: target.statusEffects,
    });
    return 0;
  }

  let damage = baseDamage;
  const originalDamage = damage;

  // Apply strength bonus
  const strength = attacker.statusEffects.find(
    (e) => e.type === StatusType.STRENGTH,
  );
  if (strength) {
    if (typeof strength.stacks !== "number" || isNaN(strength.stacks)) {
      debugConsole.error(
        "🚨 DAMAGE CALCULATION ERROR: Invalid strength stacks:",
        strength.stacks,
      );
    } else {
      damage += strength.stacks * strengthMultiplier;
    }
  }

  // Flat bonus for the first attack of a combat (Akabeko), added before
  // the percentage modifiers
  if (isFirstAttack && "relics" in attacker) {
    if (attacker.relics?.some((r) => r && r.id === "akabeko")) {
      damage += 8;
    }
  }

  // Apply weak debuff (reduces damage by 25%)
  const weak = attacker.statusEffects.find((e) => e.type === StatusType.WEAK);
  if (weak) {
    if (typeof weak.stacks !== "number" || isNaN(weak.stacks)) {
      debugConsole.error(
        "🚨 DAMAGE CALCULATION ERROR: Invalid weak stacks:",
        weak.stacks,
      );
    } else {
      damage = Math.floor(damage * 0.75);
    }
  }

  // Apply vulnerable on target (increases damage by 50%)
  const vulnerable = target.statusEffects.find(
    (e) => e.type === StatusType.VULNERABLE,
  );
  if (vulnerable) {
    if (typeof vulnerable.stacks !== "number" || isNaN(vulnerable.stacks)) {
      debugConsole.error(
        "🚨 DAMAGE CALCULATION ERROR: Invalid vulnerable stacks:",
        vulnerable.stacks,
      );
    } else {
      damage = Math.floor(damage * 1.5);
    }
  }

  const finalDamage = Math.max(0, damage);

  // Log calculation details for debugging
  if (originalDamage !== finalDamage) {
    debugConsole.log("🔢 Damage Calculation Details:", {
      baseDamage: originalDamage,
      finalDamage,
      modifiers: {
        strength: strength?.stacks || 0,
        weak: weak ? "applied (-25%)" : "none",
        vulnerable: vulnerable ? "applied (+50%)" : "none",
        akabeko:
          isFirstAttack &&
          "relics" in attacker &&
          (attacker as Player).relics?.some((r) => r?.id === "akabeko")
            ? "applied (+8)"
            : "none",
      },
      calculation: `${originalDamage} → ${finalDamage}`,
    });
  }

  return finalDamage;
};

export const calculateBlock = (
  baseBlock: number,
  defender: Player | Enemy,
): number => {
  let block = baseBlock;

  // Apply dexterity bonus
  const dexterity = defender.statusEffects.find(
    (e) => e.type === StatusType.DEXTERITY,
  );
  if (dexterity) {
    block += dexterity.stacks;
  }

  return Math.max(0, block);
};

export const getStatusEffectIcon = (effectType: StatusType): string => {
  switch (effectType) {
    case StatusType.POISON:
      return "☠️";
    case StatusType.WEAK:
      return "💔";
    case StatusType.VULNERABLE:
      return "🎯";
    case StatusType.STRENGTH:
      return "💪";
    case StatusType.DEXTERITY:
      return "🏃";
    default:
      return "❓";
  }
};

export const getStatusEffectColor = (effectType: StatusType): string => {
  switch (effectType) {
    case StatusType.POISON:
      return "#8B5A2B";
    case StatusType.WEAK:
      return "#FF6B6B";
    case StatusType.VULNERABLE:
      return "#4ECDC4";
    case StatusType.STRENGTH:
      return "#95E1D3";
    case StatusType.DEXTERITY:
      return "#A8E6CF";
    default:
      return "#95A5A6";
  }
};

export const getStatusEffectDescription = (statusType: StatusType): string => {
  switch (statusType) {
    case StatusType.VULNERABLE:
      return "Takes 50% more damage from attacks.";
    case StatusType.WEAK:
      return "Deals 25% less damage with attacks.";
    case StatusType.STRENGTH:
      return "Increases damage dealt by attacks.";
    case StatusType.POISON:
      return "Takes damage at the start of each turn, then reduces by 1.";
    case StatusType.DEXTERITY:
      return "Increases block gained from cards.";
    default:
      return "Unknown status effect.";
  }
};

export const getStatusEffectName = (statusType: StatusType): string => {
  switch (statusType) {
    case StatusType.VULNERABLE:
      return "Vulnerable";
    case StatusType.WEAK:
      return "Weak";
    case StatusType.STRENGTH:
      return "Strength";
    case StatusType.POISON:
      return "Poison";
    case StatusType.DEXTERITY:
      return "Dexterity";
    default:
      return statusType;
  }
};
