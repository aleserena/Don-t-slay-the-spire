import { MonsterCard } from "../types/game";

interface MonsterCardPreviewProps {
  card: MonsterCard;
  position: { x: number; y: number };
  _onClose: () => void;
}

export default function MonsterCardPreview({
  card,
  position,
}: MonsterCardPreviewProps) {
  const getCardTypeColor = (type: string): string => {
    switch (type) {
      case "attack":
        return "#e74c3c";
      case "defend":
        return "#3498db";
      case "buff":
        return "#27ae60";
      case "debuff":
        return "#8e44ad";
      case "special":
        return "#f39c12";
      default:
        return "#95a5a6";
    }
  };

  const getCardTypeIcon = (type: string): string => {
    switch (type) {
      case "attack":
        return "⚔️";
      case "defend":
        return "🛡️";
      case "buff":
        return "💪";
      case "debuff":
        return "💀";
      case "special":
        return "✨";
      default:
        return "❓";
    }
  };

  const formatEffectDescription = (effect: {
    type: string;
    value?: number;
    statusType?: string;
  }): string => {
    switch (effect.type) {
      case "damage":
        return `Deal ${effect.value} damage`;
      case "block":
        return `Gain ${effect.value} Block`;
      case "apply_status": {
        const statusName = effect.statusType
          ? effect.statusType.charAt(0).toUpperCase() +
            effect.statusType.slice(1)
          : "Unknown";
        return `Apply ${effect.value} ${statusName}`;
      }
      case "heal":
        return `Heal ${effect.value} HP`;
      default:
        return effect.type;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        left: Math.min(position.x + 10, window.innerWidth - 320),
        top: Math.min(position.y - 10, window.innerHeight - 400),
        width: "300px",
        background: "linear-gradient(135deg, #2c3e50, #34495e)",
        border: `3px solid ${getCardTypeColor(card.type)}`,
        borderRadius: "15px",
        padding: "20px",
        color: "white",
        zIndex: 1000,
        pointerEvents: "none",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "15px",
          borderBottom: `2px solid ${getCardTypeColor(card.type)}`,
          paddingBottom: "10px",
        }}
      >
        <div
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#ecf0f1",
          }}
        >
          {card.name}
        </div>
        <div
          style={{
            background: getCardTypeColor(card.type),
            padding: "4px 8px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>{getCardTypeIcon(card.type)}</span>
          <span>{card.type.toUpperCase()}</span>
        </div>
      </div>

      {/* Card Stats */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "15px",
          flexWrap: "wrap",
        }}
      >
        {card.damage && card.damage > 0 && (
          <div
            style={{
              background: "rgba(231, 76, 60, 0.8)",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>⚔️</span>
            <span>{card.damage}</span>
          </div>
        )}
        {card.block && card.block > 0 && (
          <div
            style={{
              background: "rgba(52, 152, 219, 0.8)",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>🛡️</span>
            <span>{card.block}</span>
          </div>
        )}
        <div
          style={{
            background: "rgba(155, 89, 182, 0.8)",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>⭐</span>
          <span>{card.priority}</span>
        </div>
      </div>

      {/* Card Description */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "15px",
          fontSize: "14px",
          lineHeight: "1.4",
          color: "#bdc3c7",
        }}
      >
        {card.description}
      </div>

      {/* Card Effects */}
      {card.effects && card.effects.length > 0 && (
        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "8px",
              color: "#ecf0f1",
            }}
          >
            Effects:
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            {card.effects.map((effect, index) => (
              <div
                key={index}
                style={{
                  background: "rgba(52, 73, 94, 0.6)",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#ecf0f1",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                • {formatEffectDescription(effect)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
