import "@testing-library/jest-dom";
import {
  Card,
  CardRarity,
  CardType,
  EffectType,
  Enemy,
  IntentType,
  MonsterCard,
  MonsterCardType,
  Player,
  TargetType,
} from "../types/game";
import { getEnemyDeck } from "../data/monsterCards";

/**
 * Creates a test enemy with all required properties including deck
 * @param overrides - Optional properties to override defaults
 * @returns A complete Enemy object suitable for testing
 */
export const createTestEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  id: "test_enemy",
  name: "Test Enemy",
  health: 50,
  maxHealth: 50,
  block: 0,
  intent: {
    type: IntentType.ATTACK,
    value: 10,
  },
  statusEffects: [],
  deck: getEnemyDeck("cultist"),
  ...overrides,
});

/**
 * Creates multiple test enemies with the required deck property
 * @param count - Number of enemies to create
 * @param overrides - Optional properties to override defaults
 * @returns Array of Enemy objects
 */
export const createTestEnemies = (
  count: number,
  overrides: Partial<Enemy> = {},
): Enemy[] => {
  return Array.from({ length: count }, (_, index) =>
    createTestEnemy({
      id: `test_enemy_${index + 1}`,
      ...overrides,
    }),
  );
};

/**
 * Creates a test player with no relics, status effects or power cards
 * @param overrides - Optional properties to override defaults
 */
export const createTestPlayer = (overrides: Partial<Player> = {}): Player => ({
  health: 50,
  maxHealth: 80,
  block: 0,
  energy: 3,
  maxEnergy: 3,
  statusEffects: [],
  gold: 100,
  relics: [],
  powerCards: [],
  ...overrides,
});

/**
 * Creates a test attack card that deals 6 damage to one enemy
 * @param overrides - Optional properties to override defaults
 */
export const createTestCard = (overrides: Partial<Card> = {}): Card => ({
  id: "test_card",
  baseId: "test_card",
  name: "Test Card",
  cost: 1,
  type: CardType.ATTACK,
  rarity: CardRarity.COMMON,
  description: "Deal 6 damage.",
  effects: [{ type: EffectType.DAMAGE, value: 6, target: TargetType.ENEMY }],
  ...overrides,
});

/**
 * Creates the given number of distinct test cards (test_card_1, ...)
 */
export const createTestCards = (count: number): Card[] =>
  Array.from({ length: count }, (_, index) =>
    createTestCard({ id: `test_card_${index + 1}` }),
  );

/**
 * Creates a monster attack card that deals the given damage to the player
 */
export const createTestMonsterAttack = (damage: number): MonsterCard => ({
  id: "test_attack",
  baseId: "test_attack",
  name: "Test Attack",
  type: MonsterCardType.ATTACK,
  description: `Deal ${damage} damage.`,
  damage,
  priority: 1,
  effects: [
    { type: EffectType.DAMAGE, value: damage, target: TargetType.ENEMY },
  ],
});
