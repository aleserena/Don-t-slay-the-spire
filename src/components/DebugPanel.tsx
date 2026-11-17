import React, { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../store/gameStore";
import { StatusType, GamePhase, TurnPhase } from "../types/game";
import { getAllCards } from "../data/cards";
import { getAllRelics } from "../data/relics";
import { createInstanceId } from "../utils/ids";

export const DebugPanel: React.FC = () => {
  const {
    player,
    enemies,
    hand,
    drawPile,
    discardPile,
    exhaustPile,
    gamePhase,
    currentFloor,
    drawCards,
    endTurn,
    debugMode,
    startNewGame,
    returnToTitle,
  } = useGameStore(
    useShallow((state) => ({
      player: state.player,
      enemies: state.enemies,
      hand: state.hand,
      drawPile: state.drawPile,
      discardPile: state.discardPile,
      exhaustPile: state.exhaustPile,
      gamePhase: state.gamePhase,
      currentFloor: state.currentFloor,
      drawCards: state.drawCards,
      endTurn: state.endTurn,
      debugMode: state.debugMode,
      startNewGame: state.startNewGame,
      returnToTitle: state.returnToTitle,
    })),
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "player" | "enemies" | "cards" | "game" | "debug"
  >("player");

  // Don't render anything if debug mode is off
  if (!debugMode) {
    return null;
  }

  const handleHealPlayer = () => {
    useGameStore.setState({
      player: {
        ...player,
        health: player.maxHealth,
      },
    });
  };

  const handleAddEnergy = () => {
    useGameStore.setState({
      player: {
        ...player,
        energy: Math.min(player.maxEnergy + 3, player.energy + 1),
      },
    });
  };

  const handleAddGold = () => {
    useGameStore.setState({
      player: {
        ...player,
        gold: player.gold + 100,
      },
    });
  };

  const handleAddBlock = () => {
    useGameStore.setState({
      player: {
        ...player,
        block: player.block + 10,
      },
    });
  };

  const handleKillAllEnemies = () => {
    useGameStore.setState({
      enemies: enemies.map((enemy) => ({
        ...enemy,
        health: 0,
      })),
    });
  };

  const handleAddVulnerable = () => {
    if (enemies.length > 0) {
      useGameStore.setState({
        enemies: enemies.map((enemy) => ({
          ...enemy,
          statusEffects: [
            ...enemy.statusEffects,
            {
              type: StatusType.VULNERABLE,
              stacks: 3,
              duration: undefined,
            },
          ],
        })),
      });
    }
  };

  const handleAddRandomCard = () => {
    const allCards = getAllCards();
    const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
    const cardWithId = {
      ...randomCard,
      id: createInstanceId(randomCard.baseId, "debug"),
    };

    useGameStore.setState({
      hand: [...hand, cardWithId],
    });
  };

  const handleAddRandomRelic = () => {
    const allRelics = getAllRelics();
    const availableRelics = allRelics.filter(
      (relic) =>
        !player.relics.some((playerRelic) => playerRelic.id === relic.id),
    );

    if (availableRelics.length > 0) {
      const randomRelic =
        availableRelics[Math.floor(Math.random() * availableRelics.length)];
      useGameStore.setState({
        player: {
          ...player,
          relics: [...player.relics, randomRelic],
        },
      });
    }
  };

  const handleAddPowerCard = () => {
    const powerCards = getAllCards().filter((card) => card.type === "power");
    const card = powerCards[Math.floor(Math.random() * powerCards.length)];
    if (!card) return;

    useGameStore.setState({
      hand: [...hand, { ...card, id: createInstanceId(card.baseId, "debug") }],
    });
  };

  /** Adds a relic that grants energy every turn, if the player lacks one. */
  const handleAddEnergyRelic = () => {
    const energyRelic = getAllRelics().find(
      (relic) =>
        !player.relics.some((owned) => owned.id === relic.id) &&
        relic.effects.some(
          (effect) =>
            effect.trigger === "turn_start" &&
            effect.effect === "gain_energy" &&
            !effect.nextTurn,
        ),
    );
    if (energyRelic) {
      useGameStore.setState({
        player: { ...player, relics: [...player.relics, energyRelic] },
      });
    }
  };

  const handleClearHand = () => {
    useGameStore.setState({
      discardPile: [...discardPile, ...hand],
      hand: [],
    });
  };

  const handleDrawCards = () => {
    drawCards(3);
  };

  const handleResetCombat = () => {
    useGameStore.setState({
      player: {
        ...player,
        energy: player.maxEnergy,
        block: 0,
        statusEffects: [],
      },
      enemies: enemies.map((enemy) => ({
        ...enemy,
        health: enemy.maxHealth,
        block: 0,
        statusEffects: [],
      })),
      hand: [],
      drawPile: [...drawPile, ...discardPile, ...hand],
      discardPile: [],
      currentTurn: "player_turn" as TurnPhase,
    });

    setTimeout(() => drawCards(5), 100);
  };

  // New debug functions
  const handleAddStrength = () => {
    useGameStore.setState({
      player: {
        ...player,
        statusEffects: [
          ...player.statusEffects.filter((e) => e.type !== StatusType.STRENGTH),
          {
            type: StatusType.STRENGTH,
            stacks:
              (player.statusEffects.find((e) => e.type === StatusType.STRENGTH)
                ?.stacks || 0) + 3,
            duration: undefined,
          },
        ],
      },
    });
  };

  const handleAddWeakToEnemies = () => {
    if (enemies.length > 0) {
      useGameStore.setState({
        enemies: enemies.map((enemy) => ({
          ...enemy,
          statusEffects: [
            ...enemy.statusEffects.filter((e) => e.type !== StatusType.WEAK),
            {
              type: StatusType.WEAK,
              stacks: 3,
              duration: undefined,
            },
          ],
        })),
      });
    }
  };

  const handleMaxEnergy = () => {
    useGameStore.setState({
      player: {
        ...player,
        energy: 10,
        maxEnergy: 10,
      },
    });
  };

  const handleTeleportToFloor = (floor: number) => {
    useGameStore.setState({
      currentFloor: floor,
    });
  };

  const handleForceGamePhase = (phase: GamePhase) => {
    useGameStore.setState({
      gamePhase: phase,
    });
  };

  const handleAddSpecificCard = (cardId: string) => {
    const allCards = getAllCards();
    const card = allCards.find((c) => c.baseId === cardId);
    if (card) {
      const cardWithId = {
        ...card,
        id: createInstanceId(card.baseId, "debug"),
      };
      useGameStore.setState({
        hand: [...hand, cardWithId],
      });
    }
  };

  const handleClearStatusEffects = () => {
    useGameStore.setState({
      player: {
        ...player,
        statusEffects: [],
      },
      enemies: enemies.map((enemy) => ({
        ...enemy,
        statusEffects: [],
      })),
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "#e74c3c",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "8px 12px",
          fontSize: "12px",
          cursor: "pointer",
          zIndex: 1000,
          fontWeight: "bold",
        }}
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "70px",
        right: "20px",
        background: "rgba(0, 0, 0, 0.95)",
        color: "white",
        border: "2px solid #e74c3c",
        borderRadius: "8px",
        padding: "15px",
        zIndex: 1000,
        minWidth: "300px",
        maxHeight: "80vh",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h3 style={{ margin: 0, color: "#e74c3c" }}>🐛 Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          ×
        </button>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "15px",
          borderBottom: "1px solid #666",
          paddingBottom: "8px",
        }}
      >
        {[
          { id: "player", label: "👤", title: "Player" },
          { id: "enemies", label: "👹", title: "Enemies" },
          { id: "cards", label: "🃏", title: "Cards" },
          { id: "game", label: "🎮", title: "Game" },
          { id: "debug", label: "🔍", title: "Debug" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(
                tab.id as "player" | "enemies" | "cards" | "game" | "debug",
              )
            }
            style={{
              ...tabButtonStyle,
              background: activeTab === tab.id ? "#e74c3c" : "#555",
              color: activeTab === tab.id ? "white" : "#ccc",
            }}
            title={tab.title}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Player Tab */}
        {activeTab === "player" && (
          <>
            <button onClick={handleHealPlayer} style={buttonStyle}>
              ❤️ Heal to Full
            </button>
            <button onClick={handleAddEnergy} style={buttonStyle}>
              ⚡ +1 Energy
            </button>
            <button onClick={handleMaxEnergy} style={buttonStyle}>
              🔋 Max Energy (10)
            </button>
            <button onClick={handleAddGold} style={buttonStyle}>
              💰 +100 Gold
            </button>
            <button onClick={handleAddBlock} style={buttonStyle}>
              🛡️ +10 Block
            </button>
            <button onClick={handleAddStrength} style={buttonStyle}>
              💪 +3 Strength
            </button>
            <button onClick={handleClearStatusEffects} style={buttonStyle}>
              🧹 Clear All Status Effects
            </button>
          </>
        )}

        {/* Enemies Tab */}
        {activeTab === "enemies" && (
          <>
            <button onClick={handleKillAllEnemies} style={buttonStyle}>
              💀 Kill All Enemies
            </button>
            <button onClick={handleAddVulnerable} style={buttonStyle}>
              🎯 Add Vulnerable (3)
            </button>
            <button onClick={handleAddWeakToEnemies} style={buttonStyle}>
              💔 Add Weak (3)
            </button>
            <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "8px" }}>
              {enemies.length > 0 ? (
                enemies.map((enemy, i) => (
                  <div key={i}>
                    {enemy.name}: {enemy.health}/{enemy.maxHealth} HP
                    {enemy.statusEffects.length > 0 && (
                      <span style={{ color: "#ffd700" }}>
                        {" "}
                        [
                        {enemy.statusEffects
                          .map((e) => `${e.type}:${e.stacks}`)
                          .join(", ")}
                        ]
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div>No enemies in combat</div>
              )}
            </div>
          </>
        )}

        {/* Cards Tab */}
        {activeTab === "cards" && (
          <>
            <button onClick={handleAddRandomCard} style={buttonStyle}>
              🎲 Add Random Card
            </button>
            <button onClick={handleDrawCards} style={buttonStyle}>
              📚 Draw 3 Cards
            </button>
            <button onClick={handleClearHand} style={buttonStyle}>
              🗑️ Clear Hand
            </button>
            <div style={{ fontSize: "10px", marginTop: "8px" }}>
              <strong>Add Specific Cards:</strong>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4px",
                maxHeight: "160px",
                overflowY: "auto",
              }}
            >
              {getAllCards().map((card) => (
                <button
                  key={card.baseId}
                  onClick={() => handleAddSpecificCard(card.baseId)}
                  style={{
                    ...buttonStyle,
                    fontSize: "10px",
                    padding: "4px 6px",
                  }}
                >
                  {card.name}
                </button>
              ))}
            </div>
            <button onClick={handleAddPowerCard} style={buttonStyle}>
              🎭 Add Random Power
            </button>
          </>
        )}

        {/* Game Tab */}
        {activeTab === "game" && (
          <>
            <button onClick={handleResetCombat} style={buttonStyle}>
              🔄 Reset Combat
            </button>
            <button onClick={endTurn} style={buttonStyle}>
              ⏭️ Force End Turn
            </button>
            <button onClick={handleAddRandomRelic} style={buttonStyle}>
              🏺 Add Random Relic
            </button>
            <button onClick={handleAddEnergyRelic} style={buttonStyle}>
              🔋 Add Energy Relic
            </button>
            <div style={{ fontSize: "10px", marginTop: "8px" }}>
              <strong>Game Phase:</strong>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4px",
              }}
            >
              {[
                { phase: GamePhase.TITLE, label: "Title" },
                { phase: GamePhase.MAP, label: "Map" },
                { phase: GamePhase.COMBAT, label: "Combat" },
                { phase: GamePhase.SHOP, label: "Shop" },
                { phase: GamePhase.REST, label: "Rest" },
                { phase: GamePhase.GAME_OVER, label: "Game Over" },
              ].map(({ phase, label }) => (
                <button
                  key={phase}
                  onClick={() => handleForceGamePhase(phase)}
                  style={{
                    ...buttonStyle,
                    fontSize: "10px",
                    padding: "4px 6px",
                    background: gamePhase === phase ? "#27ae60" : "#3498db",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: "10px", marginTop: "8px" }}>
              <strong>Floor:</strong>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "2px",
              }}
            >
              {[1, 5, 10, 15, 20].map((floor) => (
                <button
                  key={floor}
                  onClick={() => handleTeleportToFloor(floor)}
                  style={{
                    ...buttonStyle,
                    fontSize: "10px",
                    padding: "2px 4px",
                    background: currentFloor === floor ? "#27ae60" : "#3498db",
                  }}
                >
                  {floor}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
              <button
                onClick={() => startNewGame()}
                style={{ ...buttonStyle, flex: 1 }}
              >
                🆕 New Game
              </button>
              <button
                onClick={returnToTitle}
                style={{ ...buttonStyle, flex: 1 }}
              >
                🏠 Title
              </button>
            </div>
          </>
        )}

        {/* Debug Tab */}
        {activeTab === "debug" && (
          <>
            <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "8px" }}>
              <div>
                <strong>Debug Info:</strong>
              </div>
              <div>Debug Mode: {debugMode ? "✅ ON" : "❌ OFF"}</div>
              <div>Press D to toggle debug mode</div>
              <div style={{ marginTop: "8px" }}>
                <strong>Available Debug Features:</strong>
                <div>• Player stats manipulation</div>
                <div>• Enemy status effects</div>
                <div>• Card addition and testing</div>
                <div>• Game state controls</div>
              </div>
            </div>
            <span style={{ color: "red" }}>
              DEBUG MODE - For development only!
            </span>
          </>
        )}

        {/* Status Bar */}
        <div
          style={{
            borderTop: "1px solid #666",
            paddingTop: "8px",
            marginTop: "15px",
            fontSize: "10px",
            opacity: 0.7,
          }}
        >
          <div>
            <strong>Game State:</strong>
          </div>
          <div>
            Phase: {gamePhase} | Floor: {currentFloor}
          </div>
          <div>
            Hand: {hand.length} | Draw: {drawPile.length} | Discard:{" "}
            {discardPile.length} | Exhaust: {exhaustPile.length}
          </div>
          <div>
            Health: {player.health}/{player.maxHealth} | Energy: {player.energy}
            /{player.maxEnergy} | Block: {player.block}
          </div>
          <div>
            Gold: {player.gold} | Relics: {player.relics.length}
          </div>
          {player.statusEffects.length > 0 && (
            <div>
              Status:{" "}
              {player.statusEffects
                .map((e) => `${e.type}:${e.stacks}`)
                .join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  background: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "4px",
  padding: "6px 10px",
  fontSize: "12px",
  cursor: "pointer",
  transition: "background 0.2s ease",
  textAlign: "left",
};

const tabButtonStyle: React.CSSProperties = {
  background: "#555",
  color: "#ccc",
  border: "none",
  borderRadius: "50%",
  width: "24px",
  height: "24px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold",
};
