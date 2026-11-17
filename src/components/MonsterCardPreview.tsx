import React from "react";
import { getCardEffects } from "../engine/effects";
import { CardEffect, EffectType, MonsterCard } from "../types/game";
import { getStatusEffectName } from "../utils/statusEffects";
import { ICON, MONSTER_CARD_ICON } from "./ui/icons";

/** One line for an effect of an enemy's card, read from the effect itself. */
const describeEffect = (effect: CardEffect): string => {
  switch (effect.type) {
    case EffectType.DAMAGE:
      return `Deal ${effect.value} damage`;
    case EffectType.BLOCK:
      return `Gain ${effect.value} Block`;
    case EffectType.APPLY_STATUS:
      return `Apply ${effect.value} ${
        effect.statusType ? getStatusEffectName(effect.statusType) : "status"
      }`;
    case EffectType.HEAL:
      return `Heal ${effect.value} HP`;
    default:
      return effect.type;
  }
};

/** The details of the card an enemy is about to play. */
export const MonsterCardPreview: React.FC<{ card: MonsterCard }> = ({
  card,
}) => {
  const effects = getCardEffects(card);
  const total = (type: EffectType) =>
    effects
      .filter((effect) => effect.type === type)
      .reduce((sum, effect) => sum + effect.value, 0);
  const damage = total(EffectType.DAMAGE);
  const block = total(EffectType.BLOCK);

  return (
    <span className="monster-card">
      <span className="tooltip__title">
        <span aria-hidden="true">{MONSTER_CARD_ICON[card.type]}</span>{" "}
        {card.name}
      </span>
      {(damage > 0 || block > 0) && (
        <span className="monster-card__stats">
          {damage > 0 && (
            <span className="badge" data-kind="damage" data-size="small">
              <span aria-hidden="true">{ICON.damage}</span>
              {damage}
            </span>
          )}
          {block > 0 && (
            <span className="badge" data-kind="block" data-size="small">
              <span aria-hidden="true">{ICON.block}</span>
              {block}
            </span>
          )}
        </span>
      )}
      <span>{card.description}</span>
      {effects.length > 0 && (
        <span className="tooltip__note">
          {effects.map(describeEffect).join(" · ")}
        </span>
      )}
    </span>
  );
};

export default MonsterCardPreview;
