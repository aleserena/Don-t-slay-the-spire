/** Tunable numbers for the game rules, kept in one place. */

/** Cards drawn at the start of each player turn. */
export const HAND_SIZE = 5;

/** The hand never holds more cards than this; further draws are skipped. */
export const MAX_HAND_SIZE = 10;

/** Energy can exceed the player's maximum by at most this much. */
export const MAX_BONUS_ENERGY = 3;

/** Health restored by resting at a rest site. */
export const REST_HEAL_AMOUNT = 30;

/** Last (0-based) floor that still uses the easy encounters. */
export const EASY_FLOORS_END = 2;

/** First (0-based) floor on which enemies are tougher. */
export const HARD_FLOORS_START = 9;

/** Enemy health is multiplied by this from `HARD_FLOORS_START` on. */
export const HARD_HEALTH_MULTIPLIER = 1.25;

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
