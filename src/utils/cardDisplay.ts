/**
 * How cards are presented, derived from card data so that screens do not
 * need to know about individual cards.
 */

import {
  Card,
  CardType,
  EffectType,
  Enemy,
  Player,
  TargetType,
} from "../types/game";
import { getCardEffects } from "../engine/effects";
import { calculateBlock, calculateDamage } from "./statusEffects";

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

/**
 * The player whose modifiers (Strength, Dexterity, first-attack bonus,
 * current block and energy) the badges should include. Without it the
 * badges show the card's own numbers.
 */
export interface BadgeContext {
  player: Player;
  /** Whether the card would be the first attack of the combat. */
  isFirstAttack?: boolean;
}

/** Stands in for "an enemy with no statuses" when working out damage. */
const NEUTRAL_TARGET = { statusEffects: [] } as unknown as Enemy;

const allEnemiesSuffix = (target: TargetType): string =>
  target === TargetType.ALL_ENEMIES ? " to ALL" : "";

/**
 * The damage and block badges to show on a card, read from its effects, so
 * no screen needs to know about individual cards:
 *
 * - repeated identical hits are shown once as `5 × 2`
 * - hits on every enemy are marked `to ALL`
 * - damage per energy spent is shown as `5×X` (or `5×3` with a player)
 * - damage based on the player's block is shown as `1x Block` (or the
 *   number, with a player)
 *
 * Ongoing effects of power cards are not shown: they do not happen when the
 * card is played.
 */
export const getCardStatBadges = (
  card: Card,
  context?: BadgeContext,
): CardStatBadge[] => {
  const effects = getCardEffects(card).filter((effect) => !effect.trigger);
  const badges: CardStatBadge[] = [];
  const hits: { value: number; target: TargetType; count: number }[] = [];
  const player = context?.player;

  // The first-attack bonus applies to the first hit of the card only
  let firstAttack =
    (context?.isFirstAttack ?? false) && card.type === CardType.ATTACK;
  const damageOf = (value: number, strengthMultiplier?: number): number => {
    if (!player) return value;
    const damage = calculateDamage(
      value,
      player,
      NEUTRAL_TARGET,
      firstAttack,
      strengthMultiplier,
    );
    firstAttack = false;
    return damage;
  };

  for (const effect of effects) {
    if (effect.type !== EffectType.DAMAGE) continue;
    const value = damageOf(effect.value, effect.strengthMultiplier);
    const sameHit = hits.find(
      (hit) => hit.value === value && hit.target === effect.target,
    );
    if (sameHit) {
      sameHit.count++;
    } else {
      hits.push({ value, target: effect.target, count: 1 });
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
        label: `${damageOf(effect.value)}×${
          player ? player.energy : "X"
        }${allEnemiesSuffix(effect.target)}`,
      });
    } else if (effect.type === EffectType.DAMAGE_MULTIPLIER_BLOCK) {
      const multiplier = effect.multiplier || 1;
      badges.push({
        kind: "damage",
        label: player
          ? String(damageOf(player.block * multiplier))
          : `${multiplier}x Block`,
      });
    }
  }

  for (const effect of effects) {
    if (effect.type !== EffectType.BLOCK || effect.value <= 0) continue;
    badges.push({
      kind: "block",
      label: String(
        player ? calculateBlock(effect.value, player) : effect.value,
      ),
    });
  }

  return badges;
};
