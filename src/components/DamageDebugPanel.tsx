import React from "react";
import { useGameStore } from "../store/gameStore";

export const DamageDebugPanel: React.FC = () => {
  const { debugMode, player, enemies } = useGameStore();

  // Don't render if debug mode is off
  if (!debugMode) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        background: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "15px",
        borderRadius: "8px",
        border: "2px solid #ffd700",
        fontSize: "12px",
        zIndex: 1000,
        minWidth: "300px",
        maxHeight: "400px",
        overflow: "auto",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", color: "#ffd700" }}>
        🔍 Damage Debug Panel
      </h3>

      {/* Player Status */}
      <div style={{ marginBottom: "15px" }}>
        <strong style={{ color: "#4CAF50" }}>Player Status:</strong>
        <div>
          Health: {player.health}/{player.maxHealth}
        </div>
        <div>Block: {player.block}</div>
        <div>
          Energy: {player.energy}/{player.maxEnergy}
        </div>
        {player.statusEffects.length > 0 && (
          <div>
            Status Effects:
            {player.statusEffects.map((effect, i) => (
              <div key={i} style={{ marginLeft: "10px", fontSize: "11px" }}>
                • {effect.type}: {effect.stacks} stacks
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enemy Status */}
      <div style={{ marginBottom: "15px" }}>
        <strong style={{ color: "#f44336" }}>Enemies:</strong>
        {enemies.map((enemy) => (
          <div
            key={enemy.id}
            style={{ marginLeft: "10px", marginBottom: "8px" }}
          >
            <div>
              <strong>{enemy.name}</strong>
            </div>
            <div>
              Health: {enemy.health}/{enemy.maxHealth}
            </div>
            <div>Block: {enemy.block}</div>
            <div>
              Intent: {enemy.intent.type}{" "}
              {enemy.intent.value ? `(${enemy.intent.value})` : ""}
            </div>
            {enemy.statusEffects.length > 0 && (
              <div>
                Status Effects:
                {enemy.statusEffects.map((effect, j) => (
                  <div key={j} style={{ marginLeft: "10px", fontSize: "11px" }}>
                    • {effect.type}: {effect.stacks} stacks
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Damage Calculation Info */}
      <div style={{ marginBottom: "10px" }}>
        <strong style={{ color: "#ff9800" }}>Damage Modifiers:</strong>
        <div style={{ fontSize: "11px", marginLeft: "10px" }}>
          <div>• Strength adds +1 damage per stack</div>
          <div>• Weak reduces damage by 25%</div>
          <div>• Vulnerable increases damage taken by 50%</div>
          <div>• Block reduces incoming damage</div>
        </div>
      </div>

      <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "10px" }}>
        Press D to toggle debug mode
      </div>

      <span style={{ color: "red" }}>DEBUG MODE - For development only!</span>
    </div>
  );
};
