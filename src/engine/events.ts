/** Applies the outcomes of event choices to the player and their deck. */

import { Card, CardType, Player, Relic, RelicRarity } from "../types/game";
import { ConsequenceType, EventChoice, EventConsequence } from "../types/map";
import { getAllCards } from "../data/cards";
import { getAllRelics } from "../data/relics";
import { canUpgradeCard, upgradeCard } from "../utils/cardUpgrades";
import { pickRandom } from "../utils/random";
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

const resolveRelic = (player: Player, relicId?: string): Relic | undefined => {
  if (!relicId) return undefined;
  const rarity = RANDOM_RELIC_RARITIES[relicId];
  return rarity
    ? pickRelicReward(player, [rarity])
    : getAllRelics().find((relic) => relic.id === relicId);
};

const resolveCard = (cardId?: string): Card | undefined => {
  if (!cardId) return undefined;
  const cards = getAllCards();
  const type = RANDOM_CARD_TYPES[cardId];
  return type
    ? pickRandom(cards.filter((card) => card.type === type))
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
): Card | undefined => {
  const eligible = deck.filter(isEligible);
  return (
    eligible.find((card) => card.id === cardId || card.baseId === cardId) ??
    pickRandom(eligible)
  );
};

export const applyEventConsequence = (
  consequence: EventConsequence,
  { player, persistentDeck }: EventOutcome,
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
      const relic = resolveRelic(player, consequence.relicId);
      return relic
        ? {
            persistentDeck,
            player: { ...player, relics: [...player.relics, relic] },
          }
        : { player, persistentDeck };
    }

    case ConsequenceType.GAIN_CARD: {
      const card = resolveCard(consequence.cardId);
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
      );
      return card
        ? {
            player,
            persistentDeck: replaceCard(persistentDeck, card.id, upgradeCard),
          }
        : { player, persistentDeck };
    }

    case ConsequenceType.REMOVE_CARD: {
      const card = findDeckCard(persistentDeck, consequence.cardId, () => true);
      return card
        ? { player, persistentDeck: removeCard(persistentDeck, card.id) }
        : { player, persistentDeck };
    }

    default:
      return { player, persistentDeck };
  }
};

/** Applies every consequence of an event choice, in order. */
export const applyEventChoice = (
  choice: EventChoice,
  outcome: EventOutcome,
): EventOutcome =>
  choice.consequences.reduce(
    (current, consequence) => applyEventConsequence(consequence, current),
    outcome,
  );
