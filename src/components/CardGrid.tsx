import React from "react";
import { Card } from "../types/game";
import { CardStatBadges } from "./CardStatBadges";
import {
  getCardCostLabel,
  getCardTypeGradient,
  getRarityColor,
} from "../utils/cardDisplay";

interface CardGridProps {
  cards: Card[];
  title: string;
  onCardClick?: (card: Card) => void;
  onClose: () => void;
  borderColor?: string;
  showUpgradePreview?: boolean;
  getUpgradePreview?: (card: Card) => string;
  clickable?: boolean;
  hoverBorderColor?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  cards,
  title,
  onCardClick,
  onClose,
  borderColor = "#3498db",
  showUpgradePreview = false,
  getUpgradePreview,
  clickable = false,
  hoverBorderColor = "#e74c3c",
}) => {
  // Add custom scrollbar styles
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .card-grid-container::-webkit-scrollbar {
        width: 8px;
      }
      .card-grid-container::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
      .card-grid-container::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        transition: background 0.2s ease;
      }
      .card-grid-container::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }
      /* Firefox */
      .card-grid-container {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e, #16213e)",
          borderRadius: "15px",
          padding: "30px",
          maxWidth: "90%",
          maxHeight: "90%",
          overflow: "hidden",
          border: `3px solid ${borderColor}`,
          width: "fit-content",
          minWidth: "500px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ color: "white", margin: 0 }}>
            {title} ({cards.length} cards)
          </h2>
          <button
            onClick={onClose}
            style={{
              background: borderColor,
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              color: "white",
              fontSize: "20px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ×
          </button>
        </div>

        <div
          className="card-grid-container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "15px",
            maxHeight: "500px",
            overflow: "auto",
            overflowX: "hidden",
            padding: "10px",
            justifyItems: "center",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {cards.map((card: Card, index: number) => (
            <div
              key={`card-${card.id}-${index}`}
              onClick={
                clickable && onCardClick ? () => onCardClick(card) : undefined
              }
              style={{
                background: getCardTypeGradient(card.type),
                border: `2px solid ${getRarityColor(card.rarity)}`,
                borderRadius: "8px",
                padding: "12px",
                fontSize: "12px",
                textAlign: "center",
                color: "white",
                transition: "transform 0.2s ease",
                cursor: clickable ? "pointer" : "default",
                position: "relative",
                width: "140px",
                height: "200px",
                display: "flex",
                flexDirection: "column",
                minWidth: "0",
                maxWidth: "140px",
              }}
              onMouseEnter={(e) => {
                if (clickable) {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.border = `2px solid ${hoverBorderColor}`;
                }
              }}
              onMouseLeave={(e) => {
                if (clickable) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.border = `2px solid ${getRarityColor(card.rarity)}`;
                }
              }}
            >
              {/* Cost Circle */}
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

              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "8px",
                  fontSize: "14px",
                  marginTop: "8px",
                }}
              >
                {card.name}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "6px",
                  flexWrap: "wrap",
                  minHeight: "30px",
                  alignItems: "center",
                }}
              >
                <CardStatBadges card={card} size="small" />
              </div>

              <div
                style={{
                  fontSize: "10px",
                  opacity: 0.8,
                  lineHeight: "1.2",
                  marginBottom: showUpgradePreview ? "10px" : "0",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "0 4px",
                }}
              >
                {card.description}
              </div>

              {showUpgradePreview && getUpgradePreview && (
                <div
                  style={{
                    background: "rgba(255, 215, 0, 0.2)",
                    padding: "6px",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: "#ffd700",
                    border: "1px solid rgba(255, 215, 0, 0.4)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    textAlign: "center",
                    minHeight: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Upgrade: {getUpgradePreview(card)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
