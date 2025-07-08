import "@testing-library/jest-dom";
import { Enemy, IntentType } from "../types/game";
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
