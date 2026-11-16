/**
 * Effect primitives shared by every side of a combat: the player's cards,
 * enemy cards, power cards and relics.
 */

import {
  Card,
  CardEffect,
  EffectType,
  Enemy,
  MonsterCard,
  Player,
  TargetType,
} from "../types/game";

/** Applies damage to a target: block absorbs it first, the rest hits health. */
export const takeDamage = <T extends Player | Enemy>(
  target: T,
  damage: number,
): T => {
  const amount = Math.max(0, damage);
  const block = Math.max(0, target.block);
  return {
    ...target,
    health: target.health - Math.max(0, amount - block),
    block: Math.max(0, block - amount),
  };
};

export const isDamageEffect = (type: EffectType): boolean =>
  type === EffectType.DAMAGE ||
  type === EffectType.DAMAGE_MULTIPLIER_BLOCK ||
  type === EffectType.DAMAGE_MULTIPLIER_ENERGY;

/**
 * Everything a card does, as a list of effects.
 *
 * Cards may still describe themselves with the legacy `damage` and `block`
 * fields. Those are turned into effects here, after the card's own effects,
 * unless the card already has an effect of that kind. This is the only place
 * that reads the legacy fields for resolving a card.
 */
export const getCardEffects = (
  card: Pick<Card | MonsterCard, "effects" | "damage" | "block">,
): CardEffect[] => {
  const effects = [...(card.effects ?? [])];

  if (
    card.damage &&
    card.damage > 0 &&
    !effects.some((effect) => isDamageEffect(effect.type))
  ) {
    effects.push({
      type: EffectType.DAMAGE,
      value: card.damage,
      target: TargetType.ENEMY,
    });
  }

  if (
    card.block &&
    card.block > 0 &&
    !(card.effects ?? []).some((effect) => effect.type === EffectType.BLOCK)
  ) {
    effects.push({
      type: EffectType.BLOCK,
      value: card.block,
      target: TargetType.SELF,
    });
  }

  return effects;
};
