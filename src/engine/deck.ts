/**
 * Pure helpers for the player's deck and combat piles.
 *
 * The "persistent deck" is the deck the player owns between combats. During
 * a combat its cards are spread over the draw pile, hand and discard pile,
 * together with temporary cards created by card effects.
 */

import { Card } from "../types/game";
import { createInstanceId } from "../utils/ids";
import { shuffle, Rng } from "../utils/random";

/** Id tag that marks a card created during combat that must not persist. */
const TEMPORARY_TAG = "copy";

export interface CombatPiles {
  drawPile: Card[];
  discardPile: Card[];
  hand: Card[];
}

/** Creates a new owned copy of a card definition with a unique id. */
export const createCardInstance = (card: Card, tag?: string): Card => ({
  ...card,
  id: createInstanceId(card.baseId, tag),
});

/** Creates a copy of a card that only lasts until the end of the combat. */
export const createTemporaryCopy = (card: Card): Card =>
  createCardInstance(card, TEMPORARY_TAG);

export const isTemporaryCard = (card: Card): boolean =>
  card.id.includes(`_${TEMPORARY_TAG}_`);

export const withoutTemporaryCards = (cards: Card[]): Card[] =>
  cards.filter((card) => !isTemporaryCard(card));

/**
 * Draws up to `count` cards from the top (end) of the draw pile into the
 * hand. When the draw pile runs out the discard pile is shuffled into it.
 * Draws fewer cards if both piles are empty.
 */
export const drawCards = (
  piles: CombatPiles,
  count: number,
  rng?: Rng,
): CombatPiles => {
  let drawPile = [...piles.drawPile];
  let discardPile = [...piles.discardPile];
  const hand = [...piles.hand];

  for (let drawn = 0; drawn < count; drawn++) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      drawPile = shuffle(discardPile, rng);
      discardPile = [];
    }
    hand.push(drawPile.pop()!);
  }

  return { drawPile, discardPile, hand };
};

/** Replaces the card with the given id, leaving the list untouched if absent. */
export const replaceCard = (
  cards: Card[],
  cardId: string,
  update: (card: Card) => Card,
): Card[] => cards.map((card) => (card.id === cardId ? update(card) : card));

export const removeCard = (cards: Card[], cardId: string): Card[] =>
  cards.filter((card) => card.id !== cardId);
