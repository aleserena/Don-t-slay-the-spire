import { Card, CardEffect, EffectType } from "../types/game";

/**
 * Upgrade rules.
 *
 * The engine resolves a card from its `effects`, so an upgrade always changes
 * the effects. The legacy `damage` and `block` fields, which some views still
 * read, are kept in sync with them.
 */

/** Upgrades that set exact numbers instead of using the generic rule. */
interface SpecificUpgrade {
  damage?: number;
  block?: number;
  /** New multiplier for a block-based damage effect. */
  blockDamageMultiplier?: number;
  description: string;
}

const SPECIFIC_UPGRADES: Record<string, SpecificUpgrade> = {
  strike: { damage: 9, description: "Deal 9 damage." },
  defend: { block: 8, description: "Gain 8 Block." },
  bash: { damage: 10, description: "Deal 10 damage. Apply 2 Vulnerable." },
  iron_wave: {
    damage: 7,
    block: 7,
    description: "Gain 7 Block. Deal 7 damage.",
  },
  pommel_strike: { damage: 10, description: "Deal 10 damage. Draw 1 card." },
  cleave: { damage: 11, description: "Deal 11 damage to ALL enemies." },
  twin_strike: { damage: 6, description: "Deal 6 damage twice." },
  anger: {
    damage: 8,
    description:
      "Deal 8 damage. Add a copy of this card into your discard pile.",
  },
  body_slam: {
    blockDamageMultiplier: 2,
    description: "Deal damage equal to 2x your current Block.",
  },
};

const applySpecificUpgrade = (card: Card, upgrade: SpecificUpgrade): Card => ({
  ...card,
  description: upgrade.description,
  ...(card.damage !== undefined && upgrade.damage !== undefined
    ? { damage: upgrade.damage }
    : {}),
  ...(card.block !== undefined && upgrade.block !== undefined
    ? { block: upgrade.block }
    : {}),
  effects: card.effects?.map((effect) => {
    if (effect.type === EffectType.DAMAGE && upgrade.damage !== undefined) {
      return { ...effect, value: upgrade.damage };
    }
    if (effect.type === EffectType.BLOCK && upgrade.block !== undefined) {
      return { ...effect, value: upgrade.block };
    }
    if (
      effect.type === EffectType.DAMAGE_MULTIPLIER_BLOCK &&
      upgrade.blockDamageMultiplier !== undefined
    ) {
      return { ...effect, multiplier: upgrade.blockDamageMultiplier };
    }
    return effect;
  }),
});

/** Generic upgrade: damage and block get this much more. */
const MAIN_BONUS = 3;
/** Generic upgrade: other numbers get this much more. */
const SECONDARY_BONUS = 1;

const isMainEffect = (effect: CardEffect): boolean =>
  (effect.type === EffectType.DAMAGE || effect.type === EffectType.BLOCK) &&
  effect.value > 0;

const SECONDARY_EFFECTS: EffectType[] = [
  EffectType.APPLY_STATUS,
  EffectType.DRAW_CARDS,
  EffectType.GAIN_ENERGY,
  EffectType.HEAL,
  EffectType.DAMAGE_MULTIPLIER_ENERGY,
];

const isSecondaryEffect = (effect: CardEffect): boolean =>
  SECONDARY_EFFECTS.includes(effect.type) && effect.value > 0;

/**
 * Replaces numbers in a card description, each replacement using the first
 * occurrence that an earlier replacement has not already taken.
 */
const replaceNumbers = (
  description: string,
  changes: { from: number; to: number }[],
): string => {
  // Replaced numbers are wrapped in a marker so they are not matched again
  const MARK = "\u0000";
  let text = description;
  for (const { from, to } of changes) {
    text = text.replace(
      new RegExp(`(?<![\\d${MARK}])${from}(?![\\d${MARK}])`),
      `${MARK}${to}${MARK}`,
    );
  }
  return text.split(MARK).join("");
};

/**
 * Generic upgrade: damage and block go up by 3. A card with neither gets +1
 * on its other numbers instead (status stacks, cards drawn, energy, healing).
 * A card with nothing to improve costs 1 less.
 */
const applyGenericUpgrade = (card: Card): Card => {
  const effects = card.effects ?? [];
  const hasLegacyMain = (card.damage ?? 0) > 0 || (card.block ?? 0) > 0;
  const hasMain = hasLegacyMain || effects.some(isMainEffect);

  const shouldImprove = hasMain ? isMainEffect : isSecondaryEffect;
  const bonus = hasMain ? MAIN_BONUS : SECONDARY_BONUS;

  // One description change per distinct number, so a card that repeats an
  // effect ("3 damage ... 3 times") only has its damage number rewritten
  const changes = new Map<string, { from: number; to: number }>();
  const note = (key: string, from: number) => {
    if (!changes.has(key)) changes.set(key, { from, to: from + bonus });
  };

  const upgradedEffects = effects.map((effect) => {
    if (!shouldImprove(effect)) return effect;
    note(
      `${effect.type}:${effect.statusType ?? ""}:${effect.value}`,
      effect.value,
    );
    return { ...effect, value: effect.value + bonus };
  });

  const upgraded: Card = { ...card };
  if (card.effects) upgraded.effects = upgradedEffects;
  if (card.damage !== undefined && card.damage > 0) {
    note(`${EffectType.DAMAGE}::${card.damage}`, card.damage);
    upgraded.damage = card.damage + MAIN_BONUS;
  }
  if (card.block !== undefined && card.block > 0) {
    note(`${EffectType.BLOCK}::${card.block}`, card.block);
    upgraded.block = card.block + MAIN_BONUS;
  }

  if (changes.size > 0) {
    upgraded.description = replaceNumbers(card.description, [
      ...changes.values(),
    ]);
  } else if (typeof card.cost === "number" && card.cost > 0) {
    upgraded.cost = card.cost - 1;
  }

  return upgraded;
};

export const upgradeCard = (card: Card): Card => {
  if (card.upgraded) return card; // Already upgraded

  const base: Card = { ...card, upgraded: true, name: `${card.name}+` };
  const specific = SPECIFIC_UPGRADES[card.baseId];

  return specific
    ? applySpecificUpgrade(base, specific)
    : applyGenericUpgrade(base);
};

export const canUpgradeCard = (card: Card): boolean => {
  return !card.upgraded;
};

export const getUpgradePreview = (card: Card): string => {
  if (card.upgraded) return "Already upgraded";

  const upgraded = upgradeCard(card);
  const changes: string[] = [];

  if (upgraded.damage !== card.damage) {
    changes.push(`Damage: ${card.damage} → ${upgraded.damage}`);
  }

  if (upgraded.block !== card.block) {
    changes.push(`Block: ${card.block} → ${upgraded.block}`);
  }

  if (upgraded.cost !== card.cost) {
    changes.push(`Cost: ${card.cost} → ${upgraded.cost}`);
  }

  if (changes.length === 0) {
    changes.push("Enhanced effects");
  }

  return changes.join(", ");
};
