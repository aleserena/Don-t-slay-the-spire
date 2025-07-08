import React from "react";
import { useGameStore } from "../store/gameStore";

export const GameOverScreen: React.FC = () => {
  const { startNewGame, returnToTitle, player, currentFloor } = useGameStore();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #2c3e50, #34495e)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.7)",
          zIndex: 1,
        }}
      />

      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "20%",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(231, 76, 60, 0.2) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "pulse 4s ease-in-out infinite",
        }}
      />

      {/* Main content */}
      <div
        style={{
          textAlign: "center",
          zIndex: 10,
          maxWidth: "800px",
          padding: "40px",
          background: "rgba(0, 0, 0, 0.8)",
          borderRadius: "20px",
          border: "3px solid #e74c3c",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Game Over title */}
        <h1
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            color: "#e74c3c",
            textShadow: "4px 4px 8px rgba(0,0,0,0.8)",
            marginBottom: "20px",
            letterSpacing: "2px",
          }}
        >
          💀 DEFEAT 💀
        </h1>

        {/* Death message */}
        <p
          style={{
            fontSize: "24px",
            color: "#ecf0f1",
            marginBottom: "30px",
            lineHeight: "1.4",
          }}
        >
          Your journey ends here...
        </p>

        {/* Stats */}
        <div
          style={{
            background: "rgba(52, 73, 94, 0.8)",
            padding: "30px",
            borderRadius: "15px",
            marginBottom: "40px",
            border: "2px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              color: "#ffd700",
              marginBottom: "20px",
              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            }}
          >
            Final Statistics
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                background: "rgba(231, 76, 60, 0.2)",
                padding: "15px",
                borderRadius: "10px",
                border: "2px solid #e74c3c",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#bdc3c7",
                  marginBottom: "5px",
                }}
              >
                Final Health
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#e74c3c",
                }}
              >
                💀 0 / {player.maxHealth}
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 215, 0, 0.2)",
                padding: "15px",
                borderRadius: "10px",
                border: "2px solid #ffd700",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#bdc3c7",
                  marginBottom: "5px",
                }}
              >
                Gold Collected
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#ffd700",
                }}
              >
                💰 {player.gold}
              </div>
            </div>

            <div
              style={{
                background: "rgba(52, 152, 219, 0.2)",
                padding: "15px",
                borderRadius: "10px",
                border: "2px solid #3498db",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#bdc3c7",
                  marginBottom: "5px",
                }}
              >
                Floor Reached
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#3498db",
                }}
              >
                🏗️ {currentFloor}
              </div>
            </div>

            <div
              style={{
                background: "rgba(155, 89, 182, 0.2)",
                padding: "15px",
                borderRadius: "10px",
                border: "2px solid #9b59b6",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#bdc3c7",
                  marginBottom: "5px",
                }}
              >
                Relics Found
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#9b59b6",
                }}
              >
                🏺 {player.relics.length}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "30px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {/* New Game Button */}
          <button
            onClick={startNewGame}
            style={{
              padding: "20px 40px",
              fontSize: "20px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #27ae60, #229954)",
              color: "white",
              border: "none",
              borderRadius: "15px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 8px 16px rgba(39, 174, 96, 0.3)",
              minWidth: "200px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 12px 24px rgba(39, 174, 96, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow =
                "0 8px 16px rgba(39, 174, 96, 0.3)";
            }}
          >
            🔄 Try Again
          </button>

          {/* Exit Button */}
          <button
            onClick={returnToTitle}
            style={{
              padding: "20px 40px",
              fontSize: "20px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #95a5a6, #7f8c8d)",
              color: "white",
              border: "none",
              borderRadius: "15px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 8px 16px rgba(149, 165, 166, 0.3)",
              minWidth: "200px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 12px 24px rgba(149, 165, 166, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow =
                "0 8px 16px rgba(149, 165, 166, 0.3)";
            }}
          >
            🏠 Main Menu
          </button>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};
