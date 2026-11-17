/**
 * Bots of different strength. Comparing them shows how much of a result is
 * the game and how much is the player.
 */

import { getCardEffects, isDamageEffect } from "../engine/effects";
import { GameStore } from "../store/types";
import { Card, CardRarity, CardType, EffectType, Player } from "../types/game";
import {
  ConsequenceType,
  EventChoice,
  GameMap,
  MapNode,
  NodeType,
} from "../types/map";
import { canUpgradeCard, upgradeCard } from "../utils/cardUpgrades";
import { cardNeedsTarget } from "../utils/cardUtils";
import { createSeededRng, pickRandom, Rng } from "../utils/random";
import { findBestPlay, getIncomingDamage } from "./search";
import { Policy, ShopAction } from "./types";

const isPlayable = (card: Card, player: Player): boolean =>
  card.cost === "X" ? player.energy > 0 : card.cost <= player.energy;

const energyOf = (card: Card, player: Player): number =>
  card.cost === "X" ? player.energy : card.cost;

const hasImmediate = (card: Card, isType: (type: EffectType) => boolean) =>
  getCardEffects(card).some((effect) => !effect.trigger && isType(effect.type));

const RARITY_VALUE: Record<CardRarity, number> = {
  [CardRarity.BASE]: 0,
  [CardRarity.COMMON]: 1,
  [CardRarity.UNCOMMON]: 2,
  [CardRarity.RARE]: 3,
};

/**
 * A rough worth of a card from its numbers alone: what its effects add up
 * to for the energy it costs. Knows nothing about specific cards.
 */
export const estimateCardValue = (card: Card): number => {
  const points = getCardEffects(card).reduce((total, effect) => {
    // An ongoing effect pays out every turn
    const turns = effect.trigger ? 3 : 1;
    switch (effect.type) {
      case EffectType.DAMAGE:
      case EffectType.DAMAGE_MULTIPLIER_ENERGY:
        return total + effect.value * turns;
      case EffectType.DAMAGE_MULTIPLIER_BLOCK:
        return total + 8 * (effect.multiplier || 1);
      case EffectType.BLOCK:
        return total + effect.value * 0.9 * turns;
      case EffectType.APPLY_STATUS:
        return total + effect.value * 2.5 * turns;
      case EffectType.DRAW_CARDS:
        return total + effect.value * 3;
      case EffectType.GAIN_ENERGY:
        return total + effect.value * 4;
      case EffectType.HEAL:
        return total + effect.value * 1.5 * turns;
      case EffectType.UPGRADE_CARD:
        return total + 3;
      case EffectType.LIMIT_BLOCK_LOSS:
        return total + 12;
      case EffectType.LOSE_HP:
      case EffectType.LOSE_ENERGY:
        return total - effect.value * 2;
      default:
        return total;
    }
  }, 0);

  const cost = card.cost === "X" ? 2 : card.cost;
  return points / Math.max(1, cost) + RARITY_VALUE[card.rarity];
};

/** What each consequence of an event choice is worth to the player. */
const scoreEventChoice = (choice: EventChoice, player: Player): number =>
  choice.consequences.reduce((total, consequence) => {
    const value = consequence.value ?? 0;
    const hurt = player.health < player.maxHealth * 0.5;
    switch (consequence.type) {
      case ConsequenceType.GAIN_GOLD:
        return total + value * 0.15;
      case ConsequenceType.LOSE_GOLD:
        return total - value * 0.15;
      case ConsequenceType.GAIN_HEALTH:
        return total + Math.min(value, player.maxHealth - player.health);
      case ConsequenceType.LOSE_HEALTH:
        return value >= player.health
          ? -Infinity
          : total - value * (hurt ? 2.5 : 1.2);
      case ConsequenceType.GAIN_MAX_HEALTH:
        return total + value * 2;
      case ConsequenceType.GAIN_RELIC:
        return total + 25;
      case ConsequenceType.GAIN_CARD:
        return total + 4;
      case ConsequenceType.UPGRADE_CARD:
      case ConsequenceType.REMOVE_CARD:
        return total + 8;
      default:
        return total;
    }
  }, 0);

/**
 * Picks the node whose best route to the boss is worth the most, valuing
 * each kind of node by what the player needs right now.
 */
const chooseRoute = (
  map: GameMap,
  nodes: MapNode[],
  player: Player,
): MapNode => {
  const healthRatio = player.health / player.maxHealth;
  const nodeValue = (node: MapNode): number => {
    switch (node.type) {
      case NodeType.REST:
        return healthRatio < 0.6 ? 12 : 5;
      case NodeType.ELITE:
        return healthRatio > 0.75 ? 4 : -14;
      case NodeType.SHOP:
        return player.gold >= 150 ? 7 : 1;
      case NodeType.TREASURE:
        return 10;
      case NodeType.EVENT:
        return 4;
      case NodeType.COMBAT:
        return healthRatio > 0.5 ? 3 : -3;
      default:
        return 0;
    }
  };

  const byId = new Map(map.nodes.map((node) => [node.id, node]));
  const memo = new Map<string, number>();
  const routeValue = (node: MapNode): number => {
    const known = memo.get(node.id);
    if (known !== undefined) return known;

    const next = node.connections
      .map((id) => byId.get(id))
      .filter((child): child is MapNode => child !== undefined)
      .map(routeValue);
    // Nodes further up count a little less: the state will have changed
    const value = nodeValue(node) + 0.9 * (next.length ? Math.max(...next) : 0);
    memo.set(node.id, value);
    return value;
  };

  return [...nodes].sort(
    (a, b) => routeValue(b) - routeValue(a) || a.x - b.x,
  )[0];
};

/**
 * Simple rules of thumb: block when about to be hit, otherwise attack the
 * weakest enemy; rest when hurt; avoid elites; take the rarest card; never
 * shop.
 */
export const greedyPolicy: Policy = {
  name: "greedy",

  chooseNode: (state, nodes) => {
    const hurt = state.player.health < state.player.maxHealth * 0.6;
    const order = [
      NodeType.BOSS,
      NodeType.TREASURE,
      NodeType.EVENT,
      NodeType.COMBAT,
      NodeType.SHOP,
      NodeType.ELITE,
    ];
    const rank = (node: MapNode) => {
      if (node.type === NodeType.REST) return hurt ? -1 : 3.5;
      return order.indexOf(node.type);
    };
    return [...nodes].sort((a, b) => rank(a) - rank(b) || a.x - b.x)[0];
  },

  chooseCard: (state) => {
    const { player } = state;
    const playable = state.hand.filter((card) => isPlayable(card, player));
    if (playable.length === 0) return null;

    const needsBlock =
      getIncomingDamage(player, state.enemies) > state.player.block;
    const byCost = (a: Card, b: Card) =>
      energyOf(a, player) - energyOf(b, player);
    const withEffect = (isType: (type: EffectType) => boolean) =>
      playable.filter((card) => hasImmediate(card, isType)).sort(byCost)[0];

    const card =
      (needsBlock && withEffect((type) => type === EffectType.BLOCK)) ||
      withEffect(isDamageEffect) ||
      [...playable].sort(byCost)[0];

    const weakest = [...state.enemies].sort((a, b) => a.health - b.health)[0];
    return { card, targetId: cardNeedsTarget(card) ? weakest?.id : undefined };
  },

  chooseReward: (_state, cards) =>
    [...cards].sort(
      (a, b) => RARITY_VALUE[b.rarity] - RARITY_VALUE[a.rarity],
    )[0] ?? null,

  chooseEventChoice: (_state, choices) => choices[0],

  chooseRestAction: (state) => {
    const upgradable = state.persistentDeck.find(canUpgradeCard);
    return state.player.health < state.player.maxHealth * 0.7 || !upgradable
      ? { type: "heal" }
      : { type: "upgrade", cardId: upgradable.id };
  },

  chooseShopAction: () => null,
};

/** Decks larger than this stop taking middling cards. */
const COMFORTABLE_DECK_SIZE = 18;

/**
 * Plans each turn by looking ahead through the hand, plans a route over the
 * map, weighs event choices, shops, and rates cards by their numbers.
 */
export const lookaheadPolicy: Policy = {
  name: "lookahead",

  chooseNode: (state, nodes) => chooseRoute(state.map!, nodes, state.player),

  chooseCard: (state) => findBestPlay(state),

  chooseReward: (state, cards) => {
    const best = [...cards].sort(
      (a, b) => estimateCardValue(b) - estimateCardValue(a),
    )[0];
    if (!best) return null;

    // A big deck draws its best cards less often, so be picky
    const deck = state.persistentDeck;
    if (deck.length < COMFORTABLE_DECK_SIZE) return best;
    const average =
      deck.reduce((total, card) => total + estimateCardValue(card), 0) /
      deck.length;
    return estimateCardValue(best) > average + 1 ? best : null;
  },

  chooseEventChoice: (state, choices) =>
    [...choices].sort(
      (a, b) =>
        scoreEventChoice(b, state.player) - scoreEventChoice(a, state.player),
    )[0],

  chooseRestAction: (state) => {
    const { player } = state;
    const upgradable = state.persistentDeck
      .filter(canUpgradeCard)
      .map((card) => ({
        card,
        gain: estimateCardValue(upgradeCard(card)) - estimateCardValue(card),
      }))
      .sort((a, b) => b.gain - a.gain)[0];

    return player.health < player.maxHealth * 0.6 || !upgradable
      ? { type: "heal" }
      : { type: "upgrade", cardId: upgradable.card.id };
  },

  chooseShopAction: (state): ShopAction => {
    const shop = state.currentShop;
    if (!shop) return null;
    const { gold } = state.player;

    // Relics last the whole run: the cheapest one that can be paid for
    const relic = shop.relics
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.purchased && item.cost <= gold)
      .sort((a, b) => a.item.cost - b.item.cost)[0];
    if (relic) return { type: "buyRelic", index: relic.index };

    // Thinning the weakest starting card out of the deck
    const weakest = state.persistentDeck
      .filter((card) => card.rarity === CardRarity.BASE)
      .sort((a, b) => estimateCardValue(a) - estimateCardValue(b))[0];
    if (weakest && shop.removeCardCost <= gold && shop.removeCardCost <= 100) {
      return { type: "removeCard", cardId: weakest.id };
    }

    // A clearly good card
    const card = shop.cards
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.purchased && item.cost <= gold)
      .sort(
        (a, b) =>
          estimateCardValue(b.item.card) - estimateCardValue(a.item.card),
      )[0];
    if (
      card &&
      estimateCardValue(card.item.card) >= 8 &&
      card.item.card.type !== CardType.POWER
    ) {
      return { type: "buyCard", index: card.index };
    }

    return null;
  },
};

/**
 * Picks at random among everything a player could do, including buying and
 * removing cards. Not a player to measure balance with: it wanders into
 * states the other bots never reach, which is what a fuzz test needs.
 */
export const createRandomPolicy = (seed: number): Policy => {
  const rng: Rng = createSeededRng(seed);
  const chance = (probability: number) => rng() < probability;

  return {
    name: "random",

    chooseNode: (_state, nodes) => pickRandom(nodes, rng)!,

    chooseCard: (state) => {
      const playable = state.hand.filter((card) =>
        isPlayable(card, state.player),
      );
      // Sometimes ends the turn with cards left to play
      if (playable.length === 0 || chance(0.1)) return null;

      const card = pickRandom(playable, rng)!;
      return {
        card,
        targetId: cardNeedsTarget(card)
          ? pickRandom(state.enemies, rng)?.id
          : undefined,
      };
    },

    chooseReward: (_state, cards) =>
      chance(0.2) ? null : (pickRandom(cards, rng) ?? null),

    chooseEventChoice: (_state, choices) => pickRandom(choices, rng)!,

    chooseRestAction: (state) => {
      const upgradable = state.persistentDeck.filter(canUpgradeCard);
      return chance(0.5) || upgradable.length === 0
        ? { type: "heal" }
        : { type: "upgrade", cardId: pickRandom(upgradable, rng)!.id };
    },

    chooseShopAction: (state: GameStore): ShopAction => {
      const shop = state.currentShop;
      if (!shop || chance(0.3)) return null;
      const { gold } = state.player;

      const actions: ShopAction[] = [
        ...shop.cards.flatMap((item, index) =>
          !item.purchased && item.cost <= gold
            ? [{ type: "buyCard" as const, index }]
            : [],
        ),
        ...shop.relics.flatMap((item, index) =>
          !item.purchased && item.cost <= gold
            ? [{ type: "buyRelic" as const, index }]
            : [],
        ),
        // Never removes the last cards of the deck
        ...(shop.removeCardCost <= gold && state.persistentDeck.length > 5
          ? [
              {
                type: "removeCard" as const,
                cardId: pickRandom(state.persistentDeck, rng)!.id,
              },
            ]
          : []),
      ];
      return pickRandom(actions, rng) ?? null;
    },
  };
};
