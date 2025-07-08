import React from "react";
import { useGameStore } from "../store/gameStore";
import { UnifiedHeader } from "./UnifiedHeader";

export const RelicRewardScreen: React.FC = () => {
  const { combatReward, selectRelicReward, skipRelicReward } = useGameStore();

  if (!combatReward?.relicReward) return null;

  const relic = combatReward.relicReward;

  const getRelicRarityColor = (rarity: string): string => {
    switch (rarity) {
      case "common":
        return "#95a5a6";
      case "uncommon":
        return "#3498db";
      case "rare":
        return "#e74c3c";
      case "boss":
        return "#f39c12";
      default:
        return "#95a5a6";
    }
  };

  const getRelicRarityIcon = (rarity: string): string => {
    switch (rarity) {
      case "common":
        return "⚪";
      case "uncommon":
        return "🔵";
      case "rare":
        return "🔴";
      case "boss":
        return "🟡";
      default:
        return "⚪";
    }
  };

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
          🏆 Elite Defeated! 🏆
        </div>

        <div
          style={{
            fontSize: "24px",
            marginBottom: "40px",
            textAlign: "center",
            opacity: 0.9,
          }}
        >
          Choose your reward!
        </div>

        {/* Relic Display */}
        <div
          style={{
            background: "linear-gradient(135deg, #2c3e50, #34495e)",
            border: `4px solid ${getRelicRarityColor(relic.rarity)}`,
            borderRadius: "20px",
            padding: "30px",
            margin: "20px",
            minWidth: "400px",
            maxWidth: "500px",
            textAlign: "center",
            boxShadow: "0 12px 24px rgba(0,0,0,0.4)",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          onClick={selectRelicReward}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 16px 32px rgba(0,0,0,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.4)";
          }}
        >
          {/* Relic Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              borderBottom: `2px solid ${getRelicRarityColor(relic.rarity)}`,
              paddingBottom: "15px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#ecf0f1",
              }}
            >
              {relic.name}
            </div>
            <div
              style={{
                background: getRelicRarityColor(relic.rarity),
                padding: "6px 12px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>{getRelicRarityIcon(relic.rarity)}</span>
              <span>{relic.rarity.toUpperCase()}</span>
            </div>
          </div>

          {/* Relic Description */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.3)",
              padding: "20px",
              borderRadius: "12px",
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#bdc3c7",
              marginBottom: "20px",
            }}
          >
            {relic.description}
          </div>

          {/* Relic Effects */}
          {relic.effects && relic.effects.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  marginBottom: "12px",
                  color: "#ecf0f1",
                }}
              >
                Effects:
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {relic.effects.map((effect, index) => (
                  <div
                    key={index}
                    style={{
                      background: "rgba(52, 73, 94, 0.6)",
                      padding: "10px 15px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: "#ecf0f1",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      textAlign: "left",
                    }}
                  >
                    • {effect.trigger}: {effect.effect}
                    {effect.value && ` (${effect.value})`}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: "20px",
              fontSize: "14px",
              color: "#95a5a6",
              fontStyle: "italic",
            }}
          >
            Click to take this relic
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "30px",
          }}
        >
          <button
            onClick={selectRelicReward}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #27ae60, #2ecc71)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 6px 12px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.3)";
            }}
          >
            ✨ Take Relic
          </button>

          <button
            onClick={skipRelicReward}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #95a5a6, #7f8c8d)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 6px 12px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.3)";
            }}
          >
            ❌ Skip
          </button>
        </div>

        <div
          style={{
            marginTop: "20px",
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.7)",
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          Elite enemies drop powerful relics that provide permanent benefits
          throughout your run.
        </div>
      </div>
    </div>
  );
};
