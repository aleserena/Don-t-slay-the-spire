/** Applies the outcomes of event choices to the player and their deck. */

import { Card, CardType, Player, Relic, RelicRarity } from "../types/game";
import { ConsequenceType, EventChoice, EventConsequence } from "../types/map";
import { getAllCards } from "../data/cards";
import { getAllRelics } from "../data/relics";
import { canUpgradeCard, upgradeCard } from "../utils/cardUpgrades";
import { pickRandom, Rng } from "../utils/random";
import { createCardInstance, removeCard, replaceCard } from "./deck";
import { pickRelicReward } from "./rewards";

/** The part of the game an event can change. */
export interface EventOutcome {
  player: Player;
  persistentDeck: Card[];
}

const RANDOM_RELIC_RARITIES: Record<string, RelicRarity> = {
  random_common: RelicRarity.COMMON,
  random_uncommon: RelicRarity.UNCOMMON,
  random_rare: RelicRarity.RARE,
};

const RANDOM_CARD_TYPES: Record<string, CardType> = {
  random_attack: CardType.ATTACK,
  random_skill: CardType.SKILL,
};

const resolveRelic = (
  player: Player,
  relicId: string | undefined,
  rng: Rng,
): Relic | undefined => {
  if (!relicId) return undefined;
  const rarity = RANDOM_RELIC_RARITIES[relicId];
  return rarity
    ? pickRelicReward(player, [rarity], rng)
    : getAllRelics().find((relic) => relic.id === relicId);
};

const resolveCard = (
  cardId: string | undefined,
  rng: Rng,
): Card | undefined => {
  if (!cardId) return undefined;
  const cards = getAllCards();
  const type = RANDOM_CARD_TYPES[cardId];
  return type
    ? pickRandom(
        cards.filter((card) => card.type === type),
        rng,
      )
    : cards.find((card) => card.baseId === cardId);
};

/**
 * Finds the card an upgrade/remove consequence applies to: the named card if
 * `cardId` matches one in the deck (by instance id or base id), otherwise a
 * random eligible card.
 */
const findDeckCard = (
  deck: Card[],
  cardId: string | undefined,
  isEligible: (card: Card) => boolean,
  rng: Rng,
): Card | undefined => {
  const eligible = deck.filter(isEligible);
  return (
    eligible.find((card) => card.id === cardId || card.baseId === cardId) ??
    pickRandom(eligible, rng)
  );
};

export const applyEventConsequence = (
  consequence: EventConsequence,
  { player, persistentDeck }: EventOutcome,
  rng: Rng = Math.random,
): EventOutcome => {
  const amount = consequence.value || 0;

  switch (consequence.type) {
    case ConsequenceType.GAIN_GOLD:
      return {
        persistentDeck,
        player: { ...player, gold: player.gold + amount },
      };

    case ConsequenceType.LOSE_GOLD:
      return {
        persistentDeck,
        player: { ...player, gold: Math.max(0, player.gold - amount) },
      };

    case ConsequenceType.GAIN_HEALTH:
      return {
        persistentDeck,
        player: {
          ...player,
          health: Math.min(player.maxHealth, player.health + amount),
        },
      };

    case ConsequenceType.LOSE_HEALTH:
      return {
        persistentDeck,
        player: { ...player, health: Math.max(0, player.health - amount) },
      };

    case ConsequenceType.GAIN_MAX_HEALTH:
      return {
        persistentDeck,
        player: {
          ...player,
          maxHealth: player.maxHealth + amount,
          health: player.health + amount,
        },
      };

    case ConsequenceType.GAIN_RELIC: {
      const relic = resolveRelic(player, consequence.relicId, rng);
      return relic
        ? {
            persistentDeck,
            player: { ...player, relics: [...player.relics, relic] },
          }
        : { player, persistentDeck };
    }

    case ConsequenceType.GAIN_CARD: {
      const card = resolveCard(consequence.cardId, rng);
      return card
        ? {
            player,
            persistentDeck: [...persistentDeck, createCardInstance(card)],
          }
        : { player, persistentDeck };
    }

    case ConsequenceType.UPGRADE_CARD: {
      const card = findDeckCard(
        persistentDeck,
        consequence.cardId,
        canUpgradeCard,
        rng,
      );
      return card
        ? {
            player,
            persistentDeck: replaceCard(persistentDeck, card.id, upgradeCard),
          }
        : { player, persistentDeck };
    }

    case ConsequenceType.REMOVE_CARD: {
      const card = findDeckCard(
        persistentDeck,
        consequence.cardId,
        () => true,
        rng,
      );
      return card
        ? { player, persistentDeck: removeCard(persistentDeck, card.id) }
        : { player, persistentDeck };
    }

    default:
      return { player, persistentDeck };
  }
};

/** Gold an event choice takes from the player. */
export const getChoiceGoldCost = (choice: EventChoice): number =>
  choice.consequences
    .filter((consequence) => consequence.type === ConsequenceType.LOSE_GOLD)
    .reduce((total, consequence) => total + (consequence.value || 0), 0);

/** Whether the player can pay for an event choice. */
export const canChooseEventOption = (
  choice: EventChoice,
  player: Player,
): boolean => player.gold >= getChoiceGoldCost(choice);

/** Applies every consequence of an event choice, in order. */
export const applyEventChoice = (
  choice: EventChoice,
  outcome: EventOutcome,
  rng: Rng = Math.random,
): EventOutcome =>
  choice.consequences.reduce(
    (current, consequence) => applyEventConsequence(consequence, current, rng),
    outcome,
  );
