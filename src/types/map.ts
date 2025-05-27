export interface MapNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  connections: string[]; // IDs of connected nodes
  completed: boolean;
  available: boolean;
}

export enum NodeType {
  COMBAT = 'combat',
  ELITE = 'elite',
  BOSS = 'boss',
  EVENT = 'event',
  SHOP = 'shop',
  REST = 'rest',
  TREASURE = 'treasure'
}

export interface GameMap {
  nodes: MapNode[];
  currentNodeId: string | null;
  floor: number;
  maxFloor: number;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  choices: EventChoice[];
}

export interface EventChoice {
  id: string;
  text: string;
  consequences: EventConsequence[];
}

export interface EventConsequence {
  type: ConsequenceType;
  value?: number;
  cardId?: string;
  relicId?: string;
  description: string;
}

export enum ConsequenceType {
  GAIN_GOLD = 'gain_gold',
  LOSE_GOLD = 'lose_gold',
  GAIN_HEALTH = 'gain_health',
  LOSE_HEALTH = 'lose_health',
  GAIN_MAX_HEALTH = 'gain_max_health',
  GAIN_CARD = 'gain_card',
  REMOVE_CARD = 'remove_card',
  GAIN_RELIC = 'gain_relic',
  UPGRADE_CARD = 'upgrade_card'
}

export interface Shop {
  cards: ShopCard[];
  relics: ShopRelic[];
  removeCardCost: number;
}

export interface ShopCard {
  card: import('./game').Card;
  cost: number;
  purchased: boolean;
}

export interface ShopRelic {
  relic: import('./game').Relic;
  cost: number;
  purchased: boolean;
} 