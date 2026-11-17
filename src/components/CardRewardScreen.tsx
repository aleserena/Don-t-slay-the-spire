import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../store/gameStore";
import { Card } from "../types/game";
import { UnifiedHeader } from "./UnifiedHeader";
import { CardStatBadges } from "./CardStatBadges";
import {
  getCardCostLabel,
  getCardTypeColor,
  getRarityColor,
} from "../utils/cardDisplay";

export const CardRewardScreen: React.FC = () => {
  const { combatReward, selectCardReward, skipCardReward } = useGameStore(
    useShallow((state) => ({
      combatReward: state.combatReward,
      selectCardReward: state.selectCardReward,
      skipCardReward: state.skipCardReward,
    })),
  );

  if (!combatReward) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <UnifiedHeader />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        {/* Victory Message */}
        <div
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            marginBottom: "20px",
            textAlign: "center",
            textShadow: "3px 3px 6px rgba(0,0,0,0.5)",
            background: "linear-gradient(45deg, #f39c12, #e74c3c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          🎉 Victory! 🎉
        </div>

        <div
          style={{
            fontSize: "24px",
            marginBottom: "20px",
            textAlign: "center",
            opacity: 0.9,
          }}
        >
          You earned {combatReward.gold} gold!
        </div>

        <div
          style={{
            fontSize: "20px",
            marginBottom: "10px",
            textAlign: "center",
            color: "#ffe66d",
          }}
        >
          Choose a card to add to your deck
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          {combatReward.cardRewards.map((card) => (
            <CardRewardCard
              key={card.id}
              card={card}
              onSelect={() => selectCardReward(card.id)}
            />
          ))}
        </div>

        <button
          onClick={skipCardReward}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            fontWeight: "bold",
            background: "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#7f8c8d";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#95a5a6";
          }}
        >
          Skip Reward
        </button>
      </div>
    </div>
  );
};

interface CardRewardCardProps {
  card: Card;
  onSelect: () => void;
}

const CardRewardCard: React.FC<CardRewardCardProps> = ({ card, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      style={{
        width: "200px",
        height: "280px",
        background: `linear-gradient(135deg, ${getCardTypeColor(card.type)}, ${getCardTypeColor(card.type)}dd)`,
        border: `3px solid ${getRarityColor(card.rarity)}`,
        borderRadius: "15px",
        padding: "15px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05) translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1) translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
      }}
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

      {/* Rarity indicator */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          padding: "4px 8px",
          background: getRarityColor(card.rarity),
          borderRadius: "10px",
          fontSize: "10px",
          fontWeight: "bold",
          textTransform: "uppercase",
        }}
      >
        {card.rarity}
      </div>

      {/* Card name */}
      <div
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          textAlign: "center",
          marginTop: "40px",
          marginBottom: "10px",
          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
        }}
      >
        {card.name}
      </div>

      {/* Card type */}
      <div
        style={{
          fontSize: "12px",
          textAlign: "center",
          marginBottom: "15px",
          textTransform: "uppercase",
          opacity: 0.8,
        }}
      >
        {card.type}
      </div>

      {/* Card stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          marginBottom: "15px",
        }}
      >
        <CardStatBadges card={card} size="medium" />
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "12px",
          textAlign: "center",
          lineHeight: "1.4",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 5px",
          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
        }}
      >
        {card.description}
      </div>
    </div>
  );
};
