import React from "react";
import { useGameStore } from "../store/gameStore";
import { NodeType } from "../types/map";
import { UnifiedHeader } from "./UnifiedHeader";

export const MapView: React.FC = () => {
  const { map, selectNode } = useGameStore();

  if (!map) return null;

  const getNodeIcon = (type: NodeType): string => {
    switch (type) {
      case NodeType.COMBAT:
        return "⚔️";
      case NodeType.ELITE:
        return "👹";
      case NodeType.BOSS:
        return "💀";
      case NodeType.EVENT:
        return "❓";
      case NodeType.SHOP:
        return "🏪";
      case NodeType.REST:
        return "🔥";
      case NodeType.TREASURE:
        return "💰";
      default:
        return "❓";
    }
  };

  const getNodeColor = (type: NodeType): string => {
    switch (type) {
      case NodeType.COMBAT:
        return "#ff6b6b";
      case NodeType.ELITE:
        return "#ff8c42";
      case NodeType.BOSS:
        return "#8b0000";
      case NodeType.EVENT:
        return "#4ecdc4";
      case NodeType.SHOP:
        return "#45b7d1";
      case NodeType.REST:
        return "#96ceb4";
      case NodeType.TREASURE:
        return "#feca57";
      default:
        return "#95a5a6";
    }
  };

  const handleNodeClick = (nodeId: string) => {
    const node = map.nodes.find((n) => n.id === nodeId);
    if (node && node.available && !node.completed) {
      selectNode(nodeId);
    }
  };

  // Group nodes by floor for rendering
  const nodesByFloor: { [floor: number]: typeof map.nodes } = {};
  map.nodes.forEach((node) => {
    if (!nodesByFloor[node.y]) {
      nodesByFloor[node.y] = [];
    }
    nodesByFloor[node.y].push(node);
  });

  const maxFloor = Math.max(...map.nodes.map((n) => n.y));

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Unified Header */}
      <UnifiedHeader />

      {/* Map Content */}
      <div
        style={{
          flex: 1,
          color: "white",
          padding: "20px",
          overflow: "auto",
          position: "relative",
        }}
      >
        {/* Sticky Legend - Right Side */}
        <div
          style={{
            position: "fixed",
            top: "50%",
            right: "20px",
            transform: "translateY(-50%)",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.8)",
            borderRadius: "10px",
            border: "2px solid #ffd700",
            zIndex: 100,
            minWidth: "200px",
          }}
        >
          <h3
            style={{
              marginBottom: "15px",
              color: "#ffd700",
              textAlign: "center",
            }}
          >
            Legend
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>⚔️</span> Combat
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>👹</span> Elite
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>💀</span> Boss
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>❓</span> Event
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🏪</span> Shop
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🔥</span> Rest
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>💰</span> Treasure
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minHeight: "100%",
            paddingRight: "240px", // Add padding to avoid overlap with legend
          }}
        >
          <h1
            style={{
              fontSize: "32px",
              marginBottom: "30px",
              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            }}
          >
            The Spire - Floor {map.floor + 1}
          </h1>

          <div
            style={{
              position: "relative",
              width: "800px",
              height: `${(maxFloor + 1) * 100}px`,
            }}
          >
            {/* Render connections first (behind nodes) */}
            {map.nodes.map((node) =>
              node.connections.map((connectionId) => {
                const connectedNode = map.nodes.find(
                  (n) => n.id === connectionId,
                );
                if (!connectedNode) return null;

                return (
                  <svg
                    key={`${node.id}-${connectionId}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  >
                    <line
                      x1={node.x * 100 + 50}
                      y1={(maxFloor - node.y) * 100 + 50}
                      x2={connectedNode.x * 100 + 50}
                      y2={(maxFloor - connectedNode.y) * 100 + 50}
                      stroke="rgba(255, 255, 255, 0.3)"
                      strokeWidth="2"
                    />
                  </svg>
                );
              }),
            )}

            {/* Render nodes */}
            {map.nodes.map((node) => (
              <div
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                style={{
                  position: "absolute",
                  left: `${node.x * 100}px`,
                  top: `${(maxFloor - node.y) * 100}px`,
                  width: "100px",
                  height: "100px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: node.completed
                    ? "rgba(100, 100, 100, 0.5)"
                    : node.available
                      ? getNodeColor(node.type)
                      : "rgba(50, 50, 50, 0.8)",
                  border:
                    node.available && !node.completed
                      ? "3px solid #ffd700"
                      : "2px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "50%",
                  cursor:
                    node.available && !node.completed ? "pointer" : "default",
                  transition: "all 0.3s ease",
                  zIndex: 2,
                  opacity: node.available || node.completed ? 1 : 0.5,
                  transform:
                    node.available && !node.completed
                      ? "scale(1)"
                      : "scale(0.9)",
                }}
                onMouseEnter={(e) => {
                  if (node.available && !node.completed) {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(255, 215, 0, 0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (node.available && !node.completed) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "5px" }}>
                  {getNodeIcon(node.type)}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    textAlign: "center",
                    fontWeight: "bold",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  {node.type.toUpperCase()}
                </div>
                {node.completed && (
                  <div
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      fontSize: "16px",
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
