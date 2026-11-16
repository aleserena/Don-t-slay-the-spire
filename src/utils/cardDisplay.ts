/**
 * How cards are presented, derived from card data so that screens do not
 * need to know about individual cards.
 */

import { Card, CardType, EffectType, TargetType } from "../types/game";

/** Start and end colors of the background gradient for each card type. */
const CARD_TYPE_COLORS: Record<CardType, [string, string]> = {
  [CardType.ATTACK]: ["#ff6b6b", "#ee5a52"],
  [CardType.SKILL]: ["#4ecdc4", "#44a08d"],
  [CardType.POWER]: ["#ffe66d", "#ffcc02"],
};

const DEFAULT_TYPE_COLORS: [string, string] = ["#95a5a6", "#7f8c8d"];

const RARITY_COLORS: Record<string, string> = {
  base: "#34495e",
  common: "#95a5a6",
  uncommon: "#3498db",
  rare: "#f39c12",
};

const getTypeColors = (type: CardType | string): [string, string] =>
  CARD_TYPE_COLORS[type as CardType] ?? DEFAULT_TYPE_COLORS;

/** Main color for a card type. */
export const getCardTypeColor = (type: CardType | string): string =>
  getTypeColors(type)[0];

/** CSS background gradient for a card type. */
export const getCardTypeGradient = (type: CardType | string): string => {
  const [from, to] = getTypeColors(type);
  return `linear-gradient(135deg, ${from}, ${to})`;
};

export const getRarityColor = (rarity: string): string =>
  RARITY_COLORS[rarity] ?? RARITY_COLORS.common;

/** Text for a card's cost circle. */
export const getCardCostLabel = (card: Card): string => String(card.cost);

export interface CardStatBadge {
  kind: "damage" | "block";
  label: string;
}

const isDamageEffect = (type: EffectType): boolean =>
  type === EffectType.DAMAGE ||
  type === EffectType.DAMAGE_MULTIPLIER_BLOCK ||
  type === EffectType.DAMAGE_MULTIPLIER_ENERGY;

const allEnemiesSuffix = (target: TargetType): string =>
  target === TargetType.ALL_ENEMIES ? " to ALL" : "";

/**
 * The damage and block badges to show on a card, read from its effects:
 *
 * - repeated identical hits are shown once as `5 × 2`
 * - hits on every enemy are marked `to ALL`
 * - damage per energy spent is shown as `5×X`
 * - damage based on the player's block is shown as `1x Block`
 */
export const getCardStatBadges = (card: Card): CardStatBadge[] => {
  const effects = card.effects ?? [];
  const badges: CardStatBadge[] = [];
  const hits: { value: number; target: TargetType; count: number }[] = [];

  for (const effect of effects) {
    if (effect.type !== EffectType.DAMAGE) continue;
    const sameHit = hits.find(
      (hit) => hit.value === effect.value && hit.target === effect.target,
    );
    if (sameHit) {
      sameHit.count++;
    } else {
      hits.push({ value: effect.value, target: effect.target, count: 1 });
    }
  }

  for (const hit of hits) {
    const repeat = hit.count > 1 ? ` × ${hit.count}` : "";
    badges.push({
      kind: "damage",
      label: `${hit.value}${repeat}${allEnemiesSuffix(hit.target)}`,
    });
  }

  for (const effect of effects) {
    if (effect.type === EffectType.DAMAGE_MULTIPLIER_ENERGY) {
      badges.push({
        kind: "damage",
        label: `${effect.value}×X${allEnemiesSuffix(effect.target)}`,
      });
    } else if (effect.type === EffectType.DAMAGE_MULTIPLIER_BLOCK) {
      badges.push({
        kind: "damage",
        label: `${effect.multiplier || 1}x Block`,
      });
    }
  }

  // Cards that only carry a direct damage number and no damage effects
  if (
    card.damage &&
    card.damage > 0 &&
    !effects.some((effect) => isDamageEffect(effect.type))
  ) {
    badges.push({ kind: "damage", label: String(card.damage) });
  }

  if (card.block && card.block > 0) {
    badges.push({ kind: "block", label: String(card.block) });
  }

  return badges;
};
