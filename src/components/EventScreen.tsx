import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../store/gameStore";
import { EventConsequence } from "../types/map";
import { canChooseEventOption, getChoiceGoldCost } from "../engine/events";

export const EventScreen: React.FC = () => {
  const { currentEvent, selectEventChoice, player } = useGameStore(
    useShallow((state) => ({
      currentEvent: state.currentEvent,
      selectEventChoice: state.selectEventChoice,
      player: state.player,
    })),
  );

  if (!currentEvent) return null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        color: "white",
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
          border: "3px solid #4ecdc4",
          textAlign: "center",
          maxWidth: "700px",
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            color: "#4ecdc4",
            marginBottom: "20px",
            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
          }}
        >
          {currentEvent.name}
        </h1>

        <div
          style={{
            fontSize: "18px",
            lineHeight: "1.6",
            marginBottom: "40px",
            padding: "20px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          {currentEvent.description}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          {currentEvent.choices.map((choice) => {
            const affordable = canChooseEventOption(choice, player);
            return (
              <button
                key={choice.id}
                onClick={() => selectEventChoice(choice.id)}
                disabled={!affordable}
                title={
                  affordable
                    ? undefined
                    : `Not enough gold (needs ${getChoiceGoldCost(choice)})`
                }
                style={{
                  opacity: affordable ? 1 : 0.5,
                  padding: "20px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  background: "linear-gradient(135deg, #4ecdc4, #45b7d1)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: affordable ? "pointer" : "not-allowed",
                  transition: "all 0.3s ease",
                  textAlign: "left",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!affordable) return;
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, #45b7d1, #4ecdc4)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(78, 205, 196, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, #4ecdc4, #45b7d1)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  {choice.text}
                  {!affordable && " (not enough gold)"}
                </div>

                {/* Show consequences preview */}
                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.8,
                    fontStyle: "italic",
                  }}
                >
                  {choice.consequences.map((consequence, index) => (
                    <div key={index} style={{ marginBottom: "2px" }}>
                      {getConsequencePreview(consequence)}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const getConsequencePreview = (consequence: EventConsequence): string => {
  switch (consequence.type) {
    case "gain_gold":
      return `💰 Gain ${consequence.value} gold`;
    case "lose_gold":
      return `💸 Lose ${consequence.value} gold`;
    case "gain_health":
      return `❤️ Heal ${consequence.value} HP`;
    case "lose_health":
      return `💔 Lose ${consequence.value} HP`;
    case "gain_max_health":
      return `💪 Gain ${consequence.value} Max HP`;
    case "gain_relic":
      return `🎁 Gain a relic`;
    case "gain_card":
      return `🃏 Gain a card`;
    case "remove_card":
      return `🗑️ Remove a card`;
    case "upgrade_card":
      return `⬆️ Upgrade a card`;
    default:
      return consequence.description || "Unknown effect";
  }
};
