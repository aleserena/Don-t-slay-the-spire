import React from "react";
import { useGameStore } from "../store/gameStore";
import { canUpgradeCard, getUpgradePreview } from "../utils/cardUpgrades";
import { UnifiedHeader } from "./UnifiedHeader";
import { CardGrid } from "./CardGrid";

export const RestScreen: React.FC = () => {
  const {
    drawPile,
    discardPile,
    showCardUpgradeModal,
    restAndHeal,
    upgradeCardAtRest,
    openCardUpgradeModal,
    closeCardUpgradeModal,
  } = useGameStore();

  const upgradableCards = [...drawPile, ...discardPile].filter(canUpgradeCard);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        color: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Unified Header */}
      <UnifiedHeader />

      {/* Rest Site Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.8)",
            padding: "40px",
            borderRadius: "20px",
            border: "3px solid #96ceb4",
            textAlign: "center",
            maxWidth: "800px",
            width: "100%",
          }}
        >
          <h1
            style={{
              fontSize: "36px",
              color: "#96ceb4",
              marginBottom: "20px",
              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            }}
          >
            🔥 Rest Site
          </h1>

          <div
            style={{
              fontSize: "18px",
              lineHeight: "1.6",
              marginBottom: "40px",
              padding: "20px",
              background: "rgba(150, 206, 180, 0.1)",
              borderRadius: "10px",
              border: "1px solid rgba(150, 206, 180, 0.3)",
            }}
          >
            You find a peaceful campfire. The warmth soothes your mind and
            offers you a choice.
            <br />
            <br />
            <strong style={{ color: "#96ceb4" }}>
              Choose your rest activity:
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              gap: "30px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "30px",
            }}
          >
            {/* Rest Option */}
            <div
              style={{
                background: "rgba(150, 206, 180, 0.2)",
                border: "2px solid #96ceb4",
                borderRadius: "15px",
                padding: "30px",
                minWidth: "300px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                textAlign: "center",
              }}
              onClick={restAndHeal}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow =
                  "0 8px 16px rgba(150, 206, 180, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "15px" }}>❤️</div>
              <h3
                style={{
                  fontSize: "24px",
                  marginBottom: "15px",
                  color: "#96ceb4",
                }}
              >
                Rest
              </h3>
              <p style={{ fontSize: "16px", marginBottom: "15px" }}>
                Heal 30 HP and remove all debuffs
              </p>
            </div>

            {/* Upgrade Option */}
            <div
              style={{
                background: "rgba(255, 215, 0, 0.2)",
                border: "2px solid #ffd700",
                borderRadius: "15px",
                padding: "30px",
                minWidth: "300px",
                cursor: upgradableCards.length > 0 ? "pointer" : "not-allowed",
                transition: "all 0.3s ease",
                textAlign: "center",
                opacity: upgradableCards.length > 0 ? 1 : 0.6,
              }}
              onClick={
                upgradableCards.length > 0 ? openCardUpgradeModal : undefined
              }
              onMouseEnter={(e) => {
                if (upgradableCards.length > 0) {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(255, 215, 0, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (upgradableCards.length > 0) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "15px" }}>⚡</div>
              <h3
                style={{
                  fontSize: "24px",
                  marginBottom: "15px",
                  color: "#ffd700",
                }}
              >
                Upgrade
              </h3>
              <p style={{ fontSize: "16px", marginBottom: "15px" }}>
                {upgradableCards.length > 0
                  ? "Upgrade a card permanently"
                  : "No cards available to upgrade"}
              </p>
              <div
                style={{
                  background: "rgba(255, 215, 0, 0.3)",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                {upgradableCards.length > 0
                  ? `${upgradableCards.length} card${upgradableCards.length === 1 ? "" : "s"} can be upgraded`
                  : "All cards are already upgraded"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Upgrade Modal - Using CardGrid */}
      {showCardUpgradeModal && (
        <CardGrid
          cards={upgradableCards}
          title="Select Card to Upgrade"
          onCardClick={(card) => upgradeCardAtRest(card.id)}
          onClose={closeCardUpgradeModal}
          borderColor="#ffd700"
          showUpgradePreview={true}
          getUpgradePreview={getUpgradePreview}
          clickable={true}
          hoverBorderColor="#ffcc02"
        />
      )}
    </div>
  );
};
