import React from "react";
import { useGameStore } from "../store/gameStore";

export const TitleScreen: React.FC = () => {
  const { startNewGame, loadSavedGame, hasSavedGame } = useGameStore();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "200px",
          height: "200px",
          background:
            "radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "float 6s ease-in-out infinite",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "15%",
          width: "150px",
          height: "150px",
          background:
            "radial-gradient(circle, rgba(231, 76, 60, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "float 8s ease-in-out infinite reverse",
        }}
      />

      {/* Main content */}
      <div
        style={{
          textAlign: "center",
          zIndex: 10,
          maxWidth: "800px",
          padding: "40px",
        }}
      >
        {/* Game title */}
        <h1
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "#ffd700",
            textShadow: "4px 4px 8px rgba(0,0,0,0.8)",
            marginBottom: "20px",
            letterSpacing: "2px",
          }}
        >
          SLAY THE SPIRE
        </h1>

        <h2
          style={{
            fontSize: "32px",
            color: "#4ecdc4",
            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            marginBottom: "60px",
            fontWeight: "normal",
            opacity: 0.9,
          }}
        >
          Clone
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "18px",
            color: "#95a5a6",
            marginBottom: "80px",
            lineHeight: "1.6",
            maxWidth: "600px",
            margin: "0 auto 80px auto",
          }}
        >
          Craft a unique deck, encounter bizarre creatures, discover relics of
          immense power, and slay the spire!
        </p>

        {/* Menu buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            alignItems: "center",
          }}
        >
          {/* New Game Button */}
          <button
            onClick={startNewGame}
            style={{
              padding: "20px 60px",
              fontSize: "24px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #e74c3c, #c0392b)",
              color: "white",
              border: "none",
              borderRadius: "15px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 8px 16px rgba(231, 76, 60, 0.3)",
              minWidth: "300px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 12px 24px rgba(231, 76, 60, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow =
                "0 8px 16px rgba(231, 76, 60, 0.3)";
            }}
          >
            ⚔️ New Game
          </button>

          {/* Continue Button */}
          <button
            onClick={loadSavedGame}
            disabled={!hasSavedGame}
            style={{
              padding: "20px 60px",
              fontSize: "24px",
              fontWeight: "bold",
              background: hasSavedGame
                ? "linear-gradient(135deg, #3498db, #2980b9)"
                : "linear-gradient(135deg, #7f8c8d, #95a5a6)",
              color: "white",
              border: "none",
              borderRadius: "15px",
              cursor: hasSavedGame ? "pointer" : "not-allowed",
              transition: "all 0.3s ease",
              boxShadow: hasSavedGame
                ? "0 8px 16px rgba(52, 152, 219, 0.3)"
                : "0 4px 8px rgba(127, 140, 141, 0.3)",
              minWidth: "300px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              opacity: hasSavedGame ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (hasSavedGame) {
                e.currentTarget.style.transform =
                  "translateY(-3px) scale(1.05)";
                e.currentTarget.style.boxShadow =
                  "0 12px 24px rgba(52, 152, 219, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (hasSavedGame) {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 8px 16px rgba(52, 152, 219, 0.3)";
              }
            }}
          >
            📖 Continue
          </button>
        </div>

        {/* Version info */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            fontSize: "14px",
            color: "#7f8c8d",
            opacity: 0.7,
          }}
        >
          v1.22.0
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};
