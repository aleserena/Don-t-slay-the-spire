import React from "react";
import { useGameStore } from "../store/gameStore";

const statStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.08)",
  borderRadius: "10px",
  padding: "15px 20px",
  minWidth: "130px",
  textAlign: "center",
};

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div style={statStyle}>
    <div style={{ fontSize: "14px", color: "#bdc3c7", marginBottom: "5px" }}>
      {label}
    </div>
    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{value}</div>
  </div>
);

const buttonStyle: React.CSSProperties = {
  padding: "15px 30px",
  fontSize: "18px",
  fontWeight: "bold",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
};

/** Shown when the boss is defeated: a summary of the run that was won. */
export const VictoryScreen: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const deckSize = useGameStore((state) => state.persistentDeck.length);
  const currentFloor = useGameStore((state) => state.currentFloor);
  const combatsWon = useGameStore((state) => state.combatsWon);
  const seed = useGameStore((state) => state.seed);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const startNewRun = useGameStore((state) => state.startNewRun);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "48px", color: "#ffd700", marginBottom: "10px" }}>
        Victory!
      </h1>
      <p style={{ fontSize: "18px", marginBottom: "30px" }}>
        You reached the top and defeated the boss.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "15px",
          maxWidth: "640px",
          marginBottom: "20px",
        }}
      >
        <Stat label="Floors Climbed" value={currentFloor} />
        <Stat label="Combats Won" value={combatsWon} />
        <Stat label="Health" value={`${player.health} / ${player.maxHealth}`} />
        <Stat label="Gold" value={player.gold} />
        <Stat label="Deck Size" value={deckSize} />
        <Stat label="Relics" value={player.relics.length} />
      </div>

      <p style={{ fontSize: "14px", color: "#7f8c8d", marginBottom: "30px" }}>
        Seed {seed}
      </p>

      <div style={{ display: "flex", gap: "15px" }}>
        <button
          onClick={() => startNewGame()}
          style={{ ...buttonStyle, background: "#4CAF50" }}
        >
          New Run
        </button>
        <button
          onClick={() => startNewRun()}
          style={{ ...buttonStyle, background: "#34495e" }}
        >
          Title Screen
        </button>
      </div>
    </div>
  );
};
