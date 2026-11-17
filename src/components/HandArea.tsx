import React, { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { getEnergyCost } from "../engine/cardPlay";
import { useGameStore } from "../store/gameStore";
import { Card } from "../types/game";
import { getCardCostLabel } from "../utils/cardDisplay";
import {
  cardNeedsTarget,
  getEnhancedCardDescription,
} from "../utils/cardUtils";
import { CardView } from "./ui/CardView";

interface HandAreaProps {
  selectedCardId: string | null;
  onCardSelect: (card: Card) => void;
  onCardConfirming?: (card: Card | null) => void;
}

/**
 * The cards in hand. A card that needs a target is selected with one click
 * and played by picking an enemy; any other card is played with a second
 * click on it.
 */
export const HandArea: React.FC<HandAreaProps> = ({
  selectedCardId,
  onCardSelect,
  onCardConfirming,
}) => {
  const { hand, player, firstAttackThisCombat } = useGameStore(
    useShallow((state) => ({
      hand: state.hand,
      player: state.player,
      firstAttackThisCombat: state.firstAttackThisCombat,
    })),
  );
  const [confirmingCard, setConfirmingCard] = useState<string | null>(null);

  const canPlayCard = (card: Card): boolean =>
    player.energy >= getEnergyCost(card, player);

  const clearConfirmation = () => {
    setConfirmingCard(null);
    onCardConfirming?.(null);
  };

  const handleCardClick = (card: Card) => {
    if (!canPlayCard(card)) return;

    // Acting on another card drops a pending confirmation
    if (confirmingCard && confirmingCard !== card.id) clearConfirmation();

    if (cardNeedsTarget(card)) {
      // Selects the card for targeting, or deselects it if already selected
      onCardSelect(card);
      if (confirmingCard) clearConfirmation();
    } else if (confirmingCard === card.id) {
      // Second activation: play it
      onCardSelect(card);
      clearConfirmation();
    } else {
      // First activation: ask for confirmation
      setConfirmingCard(card.id);
      onCardConfirming?.(card);
    }
  };

  // Keyboard: 1-9 and 0 act on the card in that position, Escape cancels.
  // While a card is waiting for a target the digits pick the enemy instead
  // (handled by the board).
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const element = event.target as HTMLElement | null;
      if (element && /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName)) return;

      if (event.key === "Escape") {
        clearConfirmation();
        return;
      }
      if (!/^[0-9]$/.test(event.key) || selectedCardId) return;

      const card = hand[event.key === "0" ? 9 : Number(event.key) - 1];
      if (card) {
        event.preventDefault();
        handleCardClick(card);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="hand" role="group" aria-label="Hand">
      {hand.map((card, index) => {
        const isSelected = selectedCardId === card.id;
        const isConfirming = confirmingCard === card.id;
        const playable = canPlayCard(card);
        const needsTarget = cardNeedsTarget(card);

        return (
          <CardView
            key={`${card.id}-${index}`}
            card={card}
            size="hand"
            context={{ player, isFirstAttack: firstAttackThisCombat }}
            description={getEnhancedCardDescription(card, player)}
            selected={isSelected}
            confirming={isConfirming}
            disabled={!playable}
            banner={
              isSelected && needsTarget
                ? "Select target enemy"
                : isConfirming && !needsTarget
                  ? "Click again to confirm"
                  : undefined
            }
            onActivate={() => handleCardClick(card)}
            label={`${index < 10 ? `${(index + 1) % 10}: ` : ""}${
              card.name
            }, cost ${getCardCostLabel(card)}. ${card.description}${
              playable ? "" : " Not enough energy."
            }${isSelected ? " Selected: choose a target." : ""}${
              isConfirming ? " Activate again to play." : ""
            }`}
          />
        );
      })}
    </div>
  );
};
