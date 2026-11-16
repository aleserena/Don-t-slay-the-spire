import React from "react";
import { Card } from "../types/game";
import { CardStatBadge, getCardStatBadges } from "../utils/cardDisplay";

type BadgeSize = "small" | "medium";

interface CardStatBadgesProps {
  card: Card;
  /** `small` for card grids, `medium` for the larger reward and shop cards */
  size?: BadgeSize;
}

const SIZE_STYLES: Record<BadgeSize, React.CSSProperties> = {
  small: { fontSize: "14px", padding: "3px 6px", borderRadius: "6px" },
  medium: { fontSize: "16px", padding: "4px 8px", borderRadius: "8px" },
};

const ICON_SPACING: Record<BadgeSize, string> = {
  small: "3px",
  medium: "4px",
};

const KIND_STYLES: Record<
  CardStatBadge["kind"],
  { icon: string; background: string }
> = {
  damage: { icon: "⚔️", background: "rgba(255, 107, 107, 0.9)" },
  block: { icon: "🛡️", background: "rgba(68, 68, 255, 0.9)" },
};

/** The damage and block badges of a card, as a row of pills. */
export const CardStatBadges: React.FC<CardStatBadgesProps> = ({
  card,
  size = "medium",
}) => (
  <>
    {getCardStatBadges(card).map((badge) => (
      <div
        key={`${badge.kind}-${badge.label}`}
        style={{
          display: "flex",
          alignItems: "center",
          fontWeight: "bold",
          color: "#fff",
          background: KIND_STYLES[badge.kind].background,
          border: "2px solid rgba(255, 255, 255, 0.3)",
          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
          ...SIZE_STYLES[size],
        }}
      >
        <span style={{ marginRight: ICON_SPACING[size] }}>
          {KIND_STYLES[badge.kind].icon}
        </span>
        {badge.label}
      </div>
    ))}
  </>
);
