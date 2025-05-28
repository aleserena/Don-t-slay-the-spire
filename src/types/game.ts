export interface Card {
  id: string;
  baseId: string;
  name: string;
  cost: number | 'X';
  type: CardType;
  rarity: CardRarity;
  description: string;
  damage?: number;
  block?: number;
  effects?: CardEffect[];
  upgraded?: boolean;
}

export enum CardType {
  ATTACK = 'attack',
  SKILL = 'skill',
  POWER = 'power'
}

export enum CardRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare'
}

export interface CardEffect {
  type: EffectType;
  value: number;
  multiplier?: number;
  target: TargetType;
  statusType?: StatusType;
}

export enum EffectType {
  DAMAGE = 'damage',
  DAMAGE_MULTIPLIER_BLOCK = 'damage_multiplier_block',
  DAMAGE_MULTIPLIER_ENERGY = 'damage_multiplier_energy',
  BLOCK = 'block',
  HEAL = 'heal',
  DRAW_CARDS = 'draw_cards',
  GAIN_ENERGY = 'gain_energy',
  LOSE_ENERGY = 'lose_energy',
  APPLY_STATUS = 'apply_status',
  ADD_CARD_TO_DISCARD = 'add_card_to_discard',
  UPGRADE_CARD = 'upgrade_card'
}

export enum TargetType {
  SELF = 'self',
  ENEMY = 'enemy',
  ALL_ENEMIES = 'all_enemies'
}

export interface Enemy {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  block: number;
  intent: EnemyIntent;
  statusEffects: StatusEffect[];
  isElite?: boolean;
  isBoss?: boolean;
}

export interface EnemyIntent {
  type: IntentType;
  value?: number;
}

export enum IntentType {
  ATTACK = 'attack',
  DEFEND = 'defend',
  BUFF = 'buff',
  DEBUFF = 'debuff',
  UNKNOWN = 'unknown'
}

export interface StatusEffect {
  type: StatusType;
  stacks: number;
  duration?: number;
}

export enum StatusType {
  POISON = 'poison',
  WEAK = 'weak',
  VULNERABLE = 'vulnerable',
  STRENGTH = 'strength',
  DEXTERITY = 'dexterity'
}

export interface Player {
  health: number;
  maxHealth: number;
  block: number;
  energy: number;
  maxEnergy: number;
  statusEffects: StatusEffect[];
  gold: number;
  relics: Relic[];
  powerCards: PowerCard[];
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  hand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  exhaustPile: Card[];
  currentTurn: TurnPhase;
  combatReward?: CombatReward;
  gamePhase: GamePhase;
  map?: import('./map').GameMap;
  currentEvent?: import('./map').Event;
  currentShop?: import('./map').Shop;
  firstAttackThisCombat?: boolean;
}

export enum GamePhase {
  TITLE = 'title',
  MAP = 'map',
  COMBAT = 'combat',
  CARD_REWARD = 'card_reward',
  EVENT = 'event',
  SHOP = 'shop',
  REST = 'rest',
  GAME_OVER = 'game_over',
  VICTORY = 'victory'
}

export enum TurnPhase {
  PLAYER_TURN = 'player_turn',
  ENEMY_TURN = 'enemy_turn',
  COMBAT_END = 'combat_end'
}

export interface CombatReward {
  gold: number;
  cardRewards: Card[];
  relicReward?: Relic;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  rarity: RelicRarity;
  effects: RelicEffect[];
}

export interface RelicEffect {
  trigger: RelicTrigger;
  effect: EffectType;
  value?: number;
  statusType?: StatusType;
  target?: string;
}

export enum RelicTrigger {
  COMBAT_START = 'combat_start',
  TURN_START = 'turn_start',
  TURN_END = 'turn_end',
  CARD_PLAYED = 'card_played',
  DAMAGE_TAKEN = 'damage_taken',
  ENEMY_DEATH = 'enemy_death',
  REST = 'rest'
}

export enum RelicRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  BOSS = 'boss',
  STARTER = 'starter'
}

export interface PowerCard {
  id: string;
  name: string;
  description: string;
  effects: PowerCardEffect[];
}

export interface PowerCardEffect {
  trigger: PowerTrigger;
  type: EffectType;
  value: number;
  target: TargetType;
  statusType?: StatusType;
}

export enum PowerTrigger {
  TURN_START = 'turn_start',
  TURN_END = 'turn_end',
  COMBAT_START = 'combat_start',
  CARD_PLAYED = 'card_played',
  DAMAGE_TAKEN = 'damage_taken'
} 