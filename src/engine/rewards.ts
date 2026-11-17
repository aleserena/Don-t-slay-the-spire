/** Pure helpers for combat rewards, treasure and shop inventory. */

import {
  Card,
  CardRarity,
  CombatReward,
  Enemy,
  Player,
  Relic,
  RelicRarity,
} from "../types/game";
import { Shop } from "../types/map";
import { generateCardRewards } from "../data/cards";
import { getAllRelics } from "../data/relics";
import { pickRandom, randomInt, shuffle, Rng } from "../utils/random";
import {
  CARD_REWARD_COUNT,
  SHOP_CARD_BASE_COST,
  SHOP_CARD_COUNT,
  SHOP_RELIC_BASE_COST,
  SHOP_RELIC_COUNT,
  SHOP_REMOVE_CARD_COST,
  VICTORY_GOLD_MAX,
  VICTORY_GOLD_MIN,
} from "./constants";

const CARD_RARITY_SURCHARGE: Partial<Record<CardRarity, number>> = {
  [CardRarity.UNCOMMON]: 25,
  [CardRarity.RARE]: 50,
};

const RELIC_RARITY_SURCHARGE: Partial<Record<RelicRarity, number>> = {
  [RelicRarity.UNCOMMON]: 50,
  [RelicRarity.RARE]: 100,
  [RelicRarity.BOSS]: 200,
};

export const ELITE_RELIC_RARITIES = [
  RelicRarity.COMMON,
  RelicRarity.UNCOMMON,
  RelicRarity.RARE,
];

export const TREASURE_RELIC_RARITIES = [
  RelicRarity.COMMON,
  RelicRarity.UNCOMMON,
];

export const getShopCardCost = (card: Card): number =>
  SHOP_CARD_BASE_COST + (CARD_RARITY_SURCHARGE[card.rarity] ?? 0);

export const getShopRelicCost = (relic: Relic): number =>
  SHOP_RELIC_BASE_COST + (RELIC_RARITY_SURCHARGE[relic.rarity] ?? 0);

/** Relics of the given rarities that the player does not own yet. */
const getObtainableRelics = (
  player: Player,
  rarities: RelicRarity[],
): Relic[] => {
  const owned = new Set(player.relics.map((relic) => relic.id));
  return getAllRelics().filter(
    (relic) => rarities.includes(relic.rarity) && !owned.has(relic.id),
  );
};

/**
 * Picks a random relic the player does not own yet. Returns `undefined`
 * once the player owns every relic of the given rarities.
 */
export const pickRelicReward = (
  player: Player,
  rarities: RelicRarity[],
  rng: Rng = Math.random,
): Relic | undefined => pickRandom(getObtainableRelics(player, rarities), rng);

/** Rewards for winning a combat; defeating an elite also awards a relic. */
export const createCombatReward = (
  player: Player,
  defeatedEnemies: Enemy[],
  rng: Rng = Math.random,
): CombatReward => ({
  gold: randomInt(VICTORY_GOLD_MIN, VICTORY_GOLD_MAX, rng),
  cardRewards: generateCardRewards(CARD_REWARD_COUNT, rng),
  relicReward: defeatedEnemies.some((enemy) => enemy.isElite)
    ? pickRelicReward(player, ELITE_RELIC_RARITIES, rng)
    : undefined,
});

export const createTreasureReward = (
  player: Player,
  rng: Rng = Math.random,
): CombatReward => ({
  gold: 0,
  cardRewards: [],
  relicReward: pickRelicReward(player, TREASURE_RELIC_RARITIES, rng),
  isTreasureReward: true,
});

export const createShop = (player: Player, rng: Rng = Math.random): Shop => ({
  cards: generateCardRewards(SHOP_CARD_COUNT, rng).map((card) => ({
    card,
    cost: getShopCardCost(card),
    purchased: false,
  })),
  relics: shuffle(
    getObtainableRelics(player, [
      RelicRarity.COMMON,
      RelicRarity.UNCOMMON,
      RelicRarity.RARE,
      RelicRarity.BOSS,
    ]),
    rng,
  )
    .slice(0, SHOP_RELIC_COUNT)
    .map((relic) => ({
      relic,
      cost: getShopRelicCost(relic),
      purchased: false,
    })),
  removeCardCost: SHOP_REMOVE_CARD_COST,
});
