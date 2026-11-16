import React, { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { Card } from "../types/game";
import {
  cardNeedsTarget,
  getCardDisplayDamage,
  getEnhancedCardDescription,
  getActualCardDamage,
} from "../utils/cardUtils";
import { getEnergyCost } from "../engine/cardPlay";
import { getFirstAttackBonus } from "../utils/statusEffects";
import { getCardCostLabel, getCardTypeGradient } from "../utils/cardDisplay";

interface HandAreaProps {
  selectedCardId: string | null;
  onCardSelect: (card: Card) => void;
  onCardConfirming?: (card: Card | null) => void;
}

export const HandArea: React.FC<HandAreaProps> = ({
  selectedCardId,
  onCardSelect,
  onCardConfirming,
}) => {
  const { hand, player, enemies, firstAttackThisCombat } = useGameStore();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [confirmingCard, setConfirmingCard] = useState<string | null>(null);

  // Add CSS animation for pulse effect
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; transform: translateX(-50%) scale(1); }
        50% { opacity: 0.8; transform: translateX(-50%) scale(1.05); }
        100% { opacity: 1; transform: translateX(-50%) scale(1); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const canPlayCard = (card: Card): boolean =>
    player.energy >= getEnergyCost(card, player);

  const getCardDamage = (card: Card): number => {
    let baseDamage = getCardDisplayDamage(card, player, enemies);

    // Add the first-attack bonus for attack cards
    if (card.type === "attack" && firstAttackThisCombat) {
      baseDamage += getFirstAttackBonus(player);
    }

    return baseDamage;
  };

  const handleCardClick = (card: Card) => {
    if (!canPlayCard(card)) return;

    const needsTarget = cardNeedsTarget(card);

    // Clear any existing confirmation or targeting when clicking any card
    if (confirmingCard && confirmingCard !== card.id) {
      setConfirmingCard(null);
      onCardConfirming?.(null);
    }

    if (needsTarget) {
      // For targeting cards, enter targeting mode immediately on first click
      // If the same card is already selected, deselect it
      if (selectedCardId === card.id) {
        // Deselect the currently selected targeting card
        onCardSelect(card); // This will deselect in GameBoard
        return;
      }

      // Select this card for targeting
      onCardSelect(card);
      // Clear any existing confirmation when entering targeting mode
      if (confirmingCard) {
        setConfirmingCard(null);
        onCardConfirming?.(null);
      }
    } else {
      // For non-targeting cards, use the confirmation system
      if (confirmingCard === card.id) {
        // Second click - confirm and play
        onCardSelect(card);
        setConfirmingCard(null);
        onCardConfirming?.(null);
      } else {
        // First click - show confirmation
        setConfirmingCard(card.id);
        onCardConfirming?.(card);
        // If there's a selected targeting card, we need to clear it
        // but we should NOT call onCardSelect as that would play the card
        // Instead, we'll let the parent component handle clearing the targeting state
        // when it sees that we're setting a confirming card
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 20px",
        minHeight: "160px",
        position: "relative",
      }}
    >
      {hand.map((card, index) => {
        const isSelected = selectedCardId === card.id;
        const isHovered = hoveredCard === card.id;
        const isConfirming = confirmingCard === card.id;
        const playable = canPlayCard(card);
        const damage = getCardDamage(card);

        return (
          <div
            key={`${card.id}-${index}`}
            style={{
              width: "120px",
              height: "160px",
              background: getCardTypeGradient(card.type),
              border: isSelected
                ? "3px solid #ffd700"
                : isConfirming
                  ? "3px solid #ff6b6b"
                  : playable
                    ? "2px solid #ffffff"
                    : "2px solid #666666",
              borderRadius: "12px",
              padding: "12px",
              cursor: playable ? "pointer" : "not-allowed",
              opacity: playable ? 1 : 0.6,
              transform: isSelected
                ? "translateY(-15px) scale(1.1)"
                : isConfirming
                  ? "translateY(-12px) scale(1.08)"
                  : isHovered && playable
                    ? "translateY(-10px) scale(1.05)"
                    : "translateY(0) scale(1)",
              transition: "all 0.3s ease",
              color: "white",
              fontSize: "11px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: isSelected
                ? "0 12px 24px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4)"
                : isConfirming
                  ? "0 12px 24px rgba(255, 107, 107, 0.6), 0 0 30px rgba(255, 107, 107, 0.4)"
                  : isHovered && playable
                    ? "0 8px 16px rgba(0,0,0,0.4)"
                    : "0 4px 8px rgba(0,0,0,0.3)",
              zIndex: isSelected ? 15 : isConfirming ? 14 : isHovered ? 10 : 1,
              position: "relative",
            }}
            onClick={() => handleCardClick(card)}
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Cost Circle - Top Left */}
            <div
              style={{
                position: "absolute",
                top: "-8px",
                left: "-8px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ffd700, #ffcc02)",
                border: "2px solid #fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
                color: "#000",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                zIndex: 20,
              }}
            >
              {getCardCostLabel(card)}
            </div>

            {/* Confirmation Indicator */}
            {isConfirming && !cardNeedsTarget(card) && (
              <div
                style={{
                  position: "absolute",
                  top: "-35px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(255, 107, 107, 0.95)",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  zIndex: 25,
                  border: "2px solid #fff",
                  boxShadow:
                    "0 4px 8px rgba(0,0,0,0.4), 0 0 15px rgba(255, 107, 107, 0.5)",
                  animation: "pulse 2s infinite",
                }}
              >
                Click again to confirm
              </div>
            )}

            {/* Targeting Indicator */}
            {isSelected && cardNeedsTarget(card) && (
              <div
                style={{
                  position: "absolute",
                  top: "-35px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(255, 215, 0, 0.95)",
                  color: "#000",
                  padding: "6px 12px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  zIndex: 25,
                  border: "2px solid #fff",
                  boxShadow:
                    "0 4px 8px rgba(0,0,0,0.4), 0 0 15px rgba(255, 215, 0, 0.5)",
                  animation: "pulse 2s infinite",
                }}
              >
                Select target enemy
              </div>
            )}

            {/* Card Header */}
            <div>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                  fontSize: "12px",
                  lineHeight: "1.2",
                  marginTop: "8px", // Add space for cost circle
                }}
              >
                {card.name}
              </div>
            </div>

            {/* Card Effects */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {/* Generic Damage - only for cards without special displays */}
              {((card.damage !== undefined && card.damage > 0) ||
                card.effects?.some(
                  (effect) =>
                    effect.type === "damage" ||
                    effect.type === "damage_multiplier_block" ||
                    effect.type === "damage_multiplier_energy",
                )) &&
              card.baseId !== "body_slam" &&
              card.baseId !== "cleave" &&
              card.baseId !== "whirlwind" &&
              card.baseId !== "twin_strike" &&
              card.baseId !== "bash" &&
              card.baseId !== "anger" ? (
                <div
                  style={{
                    background: "rgba(255, 107, 107, 0.9)",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "11px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  ⚔️ {damage}
                </div>
              ) : null}

              {/* Block */}
              {card.block !== undefined && card.block > 0 ? (
                <div
                  style={{
                    background: "rgba(68, 68, 255, 0.9)",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "11px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  🛡️ {card.block}
                </div>
              ) : null}

              {/* Special Effects - These replace the generic damage display */}
              {card.baseId === "bash" && (
                <div
                  style={{
                    background: "rgba(255, 107, 107, 0.9)",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "10px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  ⚔️ {getActualCardDamage(card, player)}
                </div>
              )}
              {card.baseId === "cleave" && (
                <div
                  style={{
                    background: "rgba(255, 107, 107, 0.9)",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "10px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  ⚔️ {damage} to ALL
                </div>
              )}
              {card.baseId === "whirlwind" && (
                <div
                  style={{
                    background: "rgba(255, 107, 107, 0.9)",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "10px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  ⚔️ 5×{player.energy} to ALL
                </div>
              )}
              {card.baseId === "body_slam" && (
                <div
                  style={{
                    background: "rgba(255, 107, 107, 0.9)",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "10px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  ⚔️ {card.upgraded ? "2x" : "1x"} Block
                </div>
              )}
              {card.baseId === "twin_strike" && (
                <div
                  style={{
                    background: "rgba(255, 107, 107, 0.9)",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "10px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  ⚔️ {getActualCardDamage(card, player)} × 2
                </div>
              )}
              {card.baseId === "anger" && (
                <div
                  style={{
                    background: "rgba(255, 107, 107, 0.9)",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "10px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  ⚔️ {getActualCardDamage(card, player)}
                </div>
              )}
            </div>

            {/* Card Description */}
            <div
              style={{
                fontSize: "9px",
                opacity: 0.8,
                lineHeight: "1.2",
                marginTop: "4px",
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              {getEnhancedCardDescription(card, player)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
