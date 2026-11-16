/** Tunable numbers for the game rules, kept in one place. */

/** Cards drawn at the start of each player turn. */
export const HAND_SIZE = 5;

/** Energy can exceed the player's maximum by at most this much. */
export const MAX_BONUS_ENERGY = 3;

/** Health restored by resting at a rest site. */
export const REST_HEAL_AMOUNT = 30;

/** Elite encounters multiply enemy health by this. */
export const ELITE_HEALTH_MULTIPLIER = 1.5;

/** Gold awarded for winning a combat (inclusive range). */
export const VICTORY_GOLD_MIN = 10;
export const VICTORY_GOLD_MAX = 29;

/** Cards offered after winning a combat. */
export const CARD_REWARD_COUNT = 3;

export const SHOP_CARD_COUNT = 5;
export const SHOP_RELIC_COUNT = 2;
export const SHOP_CARD_BASE_COST = 50;
export const SHOP_RELIC_BASE_COST = 150;
export const SHOP_REMOVE_CARD_COST = 75;
export const SHOP_REMOVE_CARD_COST_INCREASE = 25;
