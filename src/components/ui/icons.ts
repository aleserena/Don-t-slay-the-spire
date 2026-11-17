/**
 * The symbols the interface uses for the game's concepts. They stand for
 * kinds of things (a shop, an attack), never for a specific card, relic or
 * enemy, so they stay valid whatever the content is.
 */
import { IntentType, MonsterCardType } from "../../types/game";
import { ConsequenceType, EventConsequence, NodeType } from "../../types/map";

export const ICON = {
  health: "❤️",
  block: "🛡️",
  energy: "⚡",
  gold: "💰",
  damage: "⚔️",
  deck: "📚",
  discard: "🗂️",
  relic: "🏺",
} as const;

export const NODE_ICON: Record<NodeType, string> = {
  [NodeType.COMBAT]: "⚔️",
  [NodeType.ELITE]: "👹",
  [NodeType.BOSS]: "💀",
  [NodeType.EVENT]: "❓",
  [NodeType.SHOP]: "🏪",
  [NodeType.REST]: "🔥",
  [NodeType.TREASURE]: "💰",
};

export const NODE_LABEL: Record<NodeType, string> = {
  [NodeType.COMBAT]: "Combat",
  [NodeType.ELITE]: "Elite",
  [NodeType.BOSS]: "Boss",
  [NodeType.EVENT]: "Event",
  [NodeType.SHOP]: "Shop",
  [NodeType.REST]: "Rest",
  [NodeType.TREASURE]: "Treasure",
};

export const INTENT_ICON: Record<IntentType, string> = {
  [IntentType.ATTACK]: "⚔️",
  [IntentType.DEFEND]: "🛡️",
  [IntentType.BUFF]: "💪",
  [IntentType.DEBUFF]: "💀",
  [IntentType.UNKNOWN]: "❓",
};

export const INTENT_LABEL: Record<IntentType, string> = {
  [IntentType.ATTACK]: "Attack",
  [IntentType.DEFEND]: "Defend",
  [IntentType.BUFF]: "Buff",
  [IntentType.DEBUFF]: "Debuff",
  [IntentType.UNKNOWN]: "Unknown",
};

export const MONSTER_CARD_ICON: Record<MonsterCardType, string> = {
  [MonsterCardType.ATTACK]: "⚔️",
  [MonsterCardType.DEFEND]: "🛡️",
  [MonsterCardType.BUFF]: "💪",
  [MonsterCardType.DEBUFF]: "💀",
  [MonsterCardType.SPECIAL]: "✨",
};

/** One line describing an outcome of an event choice. */
export const describeConsequence = (consequence: EventConsequence): string => {
  const amount = consequence.value;
  switch (consequence.type) {
    case ConsequenceType.GAIN_GOLD:
      return `💰 Gain ${amount} gold`;
    case ConsequenceType.LOSE_GOLD:
      return `💸 Lose ${amount} gold`;
    case ConsequenceType.GAIN_HEALTH:
      return `❤️ Heal ${amount} HP`;
    case ConsequenceType.LOSE_HEALTH:
      return `💔 Lose ${amount} HP`;
    case ConsequenceType.GAIN_MAX_HEALTH:
      return `💪 Gain ${amount} Max HP`;
    case ConsequenceType.GAIN_RELIC:
      return "🎁 Gain a relic";
    case ConsequenceType.GAIN_CARD:
      return "🃏 Gain a card";
    case ConsequenceType.REMOVE_CARD:
      return "🗑️ Remove a card";
    case ConsequenceType.UPGRADE_CARD:
      return "⬆️ Upgrade a card";
    default:
      return consequence.description || "Unknown effect";
  }
};
