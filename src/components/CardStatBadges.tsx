import React from "react";
import { Card } from "../types/game";
import { BadgeContext, getCardStatBadges } from "../utils/cardDisplay";
import { ICON } from "./ui/icons";

type BadgeSize = "tiny" | "small" | "medium";

interface CardStatBadgesProps {
  card: Card;
  /**
   * `tiny` for the hand, `small` for card grids, `medium` for the larger
   * reward and shop cards
   */
  size?: BadgeSize;
  /** Shows the numbers with this player's modifiers applied */
  context?: BadgeContext;
}

/** The damage and block badges of a card, as a row of pills. */
export const CardStatBadges: React.FC<CardStatBadgesProps> = ({
  card,
  size = "medium",
  context,
}) => (
  <>
    {getCardStatBadges(card, context).map((badge) => (
      <div
        key={`${badge.kind}-${badge.label}`}
        className="badge"
        data-kind={badge.kind}
        data-size={size}
      >
        <span aria-hidden="true">{ICON[badge.kind]}</span>
        {badge.label}
      </div>
    ))}
  </>
);
