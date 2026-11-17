import React from "react";
import { Card } from "../../types/game";
import { BadgeContext, getCardCostLabel } from "../../utils/cardDisplay";
import { CardStatBadges } from "../CardStatBadges";
import { asButton } from "./asButton";
import { ICON } from "./icons";

type CardSize = "hand" | "grid" | "large";

interface CardViewProps {
  card: Card;
  /** `hand` in combat, `grid` in lists, `large` for rewards and the shop */
  size?: CardSize;
  /** Shows the numbers with this player's modifiers applied */
  context?: BadgeContext;
  /** Text to show instead of the card's own description */
  description?: string;
  /** Shows the rarity and type under the name */
  showMeta?: boolean;
  selected?: boolean;
  confirming?: boolean;
  /** The card is there but cannot be used right now */
  disabled?: boolean;
  /** Price tag, for shops */
  price?: number;
  affordable?: boolean;
  sold?: boolean;
  /** A short instruction floating above the card */
  banner?: string;
  /** Extra line at the bottom, e.g. what an upgrade changes */
  footer?: React.ReactNode;
  /** Makes the card a button */
  onActivate?: () => void;
  /** What a screen reader says; defaults to name, cost and description */
  label?: string;
}

const BADGE_SIZE = { hand: "tiny", grid: "small", large: "medium" } as const;

/**
 * A card, drawn from its data alone. Its colors come from its type and
 * rarity through the theme; its numbers from its effects.
 */
export const CardView: React.FC<CardViewProps> = ({
  card,
  size = "grid",
  context,
  description,
  showMeta = false,
  selected = false,
  confirming = false,
  disabled = false,
  price,
  affordable = true,
  sold = false,
  banner,
  footer,
  onActivate,
  label,
}) => {
  const cost = getCardCostLabel(card);
  const text = description ?? card.description;
  const className = [
    "card",
    selected && "is-selected",
    confirming && "is-confirming",
    sold && "is-sold",
  ]
    .filter(Boolean)
    .join(" ");

  const buttonProps = onActivate
    ? {
        ...asButton(onActivate, {
          disabled,
          label:
            label ??
            `${card.name}, cost ${cost}. ${text}${
              price !== undefined ? ` Price: ${price} gold.` : ""
            }${sold ? " Sold." : ""}`,
        }),
        "aria-pressed": selected || confirming || undefined,
      }
    : {};

  return (
    <div
      className={className}
      data-type={card.type}
      data-rarity={card.rarity}
      data-size={size}
      {...buttonProps}
    >
      <span className="card__cost" aria-hidden={onActivate ? true : undefined}>
        {cost}
      </span>
      {price !== undefined && (
        <span className="card__price" data-affordable={affordable}>
          {price} {ICON.gold}
        </span>
      )}
      {banner && <span className="card__banner">{banner}</span>}

      <div className="card__name">{card.name}</div>
      {showMeta && (
        <div className="card__meta">
          {card.rarity} · {card.type}
        </div>
      )}
      <div className="card__badges">
        <CardStatBadges card={card} size={BADGE_SIZE[size]} context={context} />
      </div>
      <div className="card__text">{text}</div>
      {footer && <div className="card__footer">{footer}</div>}
      {sold && <div className="card__sold">SOLD</div>}
    </div>
  );
};
