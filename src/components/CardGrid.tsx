import React from "react";
import { Card } from "../types/game";
import { CardView } from "./ui/CardView";
import { Modal, Tone } from "./ui/Modal";

interface CardGridProps {
  cards: Card[];
  title: string;
  onClose: () => void;
  /** Makes every card a button */
  onCardClick?: (card: Card) => void;
  /** Color of the dialog frame, by what the list is for */
  tone?: Tone;
  /** Shows under each card what upgrading it would change */
  getUpgradePreview?: (card: Card) => string;
}

/** A dialog listing cards: a pile, the whole deck, or cards to pick from. */
export const CardGrid: React.FC<CardGridProps> = ({
  cards,
  title,
  onClose,
  onCardClick,
  tone = "info",
  getUpgradePreview,
}) => (
  <Modal
    title={`${title} (${cards.length} ${cards.length === 1 ? "card" : "cards"})`}
    tone={tone}
    onClose={onClose}
  >
    {cards.length === 0 && <p className="screen__note">No cards.</p>}
    {cards.map((card, index) => (
      <CardView
        key={`${card.id}-${index}`}
        card={card}
        size="grid"
        onActivate={onCardClick ? () => onCardClick(card) : undefined}
        footer={getUpgradePreview?.(card)}
      />
    ))}
  </Modal>
);
