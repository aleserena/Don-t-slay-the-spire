/**
 * Things that must hold in any game state a player can reach. The simulator
 * checks them after every action, which turns each simulated run into a test
 * of the rules.
 */

import { MAX_BONUS_ENERGY, MAX_HAND_SIZE } from "../engine/constants";
import { isTemporaryCard } from "../engine/deck";
import { StoreState } from "../store/types";
import { Card, GamePhase, TurnPhase } from "../types/game";

const duplicates = (ids: string[]): string[] => [
  ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
];

const ids = (cards: Card[]): string[] => cards.map((card) => card.id);

/** Returns a description of every invariant the state breaks. */
export const checkInvariants = (state: StoreState): string[] => {
  const problems: string[] = [];
  const check = (ok: boolean, message: string) => {
    if (!ok) problems.push(message);
  };

  const { player } = state;
  const inCombat = state.gamePhase === GamePhase.COMBAT;
  const runOver =
    state.gamePhase === GamePhase.GAME_OVER ||
    state.gamePhase === GamePhase.VICTORY;

  // Player
  check(Number.isFinite(player.health), `health is ${player.health}`);
  check(player.health >= 0, `health is negative (${player.health})`);
  check(
    player.health <= player.maxHealth,
    `health ${player.health} exceeds max health ${player.maxHealth}`,
  );
  check(player.maxHealth > 0, `max health is ${player.maxHealth}`);
  check(player.block >= 0, `block is negative (${player.block})`);
  check(player.gold >= 0, `gold is negative (${player.gold})`);
  check(
    player.energy >= 0 && player.energy <= player.maxEnergy + MAX_BONUS_ENERGY,
    `energy is ${player.energy}`,
  );
  check(
    player.statusEffects.every((effect) => effect.stacks > 0),
    "the player has a status with no stacks",
  );
  check(
    duplicates(player.relics.map((relic) => relic.id)).length === 0,
    `duplicate relics: ${duplicates(player.relics.map((r) => r.id)).join(", ")}`,
  );
  if (!runOver && state.gamePhase !== GamePhase.TITLE) {
    check(player.health > 0, "the run continues with no health");
  }

  // Deck
  const deckIds = ids(state.persistentDeck);
  check(
    duplicates(deckIds).length === 0,
    `duplicate card ids in the deck: ${duplicates(deckIds).join(", ")}`,
  );
  check(
    !state.persistentDeck.some(isTemporaryCard),
    "a temporary card is in the deck",
  );
  check(state.persistentDeck.length > 0, "the deck is empty");

  const piles = [
    ...state.hand,
    ...state.drawPile,
    ...state.discardPile,
    ...state.exhaustPile,
  ];
  const pileIds = ids(piles);
  check(
    duplicates(pileIds).length === 0,
    `a card is in two piles: ${duplicates(pileIds).join(", ")}`,
  );

  if (inCombat) {
    check(
      state.hand.length <= MAX_HAND_SIZE,
      `the hand has ${state.hand.length} cards`,
    );
    const deck = new Set(deckIds);
    const strays = piles.filter(
      (card) => !isTemporaryCard(card) && !deck.has(card.id),
    );
    check(
      strays.length === 0,
      `cards in combat that are not in the deck: ${ids(strays).join(", ")}`,
    );

    // Enemies
    check(state.enemies.length > 0, "a combat has no enemies");
    check(
      duplicates(state.enemies.map((enemy) => enemy.id)).length === 0,
      "two enemies share an id",
    );
    for (const enemy of state.enemies) {
      check(enemy.block >= 0, `${enemy.name} has negative block`);
      check(
        enemy.health <= enemy.maxHealth,
        `${enemy.name} has more health than its maximum`,
      );
      check(
        enemy.statusEffects.every((effect) => effect.stacks > 0),
        `${enemy.name} has a status with no stacks`,
      );
      if (state.currentTurn === TurnPhase.PLAYER_TURN) {
        check(enemy.health > 0, `${enemy.name} is dead but still in combat`);
        check(
          enemy.currentCard !== undefined,
          `${enemy.name} has no card to play`,
        );
      }
    }
  } else if (!runOver) {
    // Out of combat the whole deck sits in the draw pile
    check(
      state.hand.length === 0 &&
        state.discardPile.length === 0 &&
        state.exhaustPile.length === 0,
      "cards are left in combat piles outside a combat",
    );
    check(
      state.drawPile.length === state.persistentDeck.length &&
        ids(state.drawPile).every((id) => deckIds.includes(id)),
      "the draw pile does not match the deck outside a combat",
    );
    check(
      player.statusEffects.length === 0 && player.powerCards.length === 0,
      "statuses or powers are left over outside a combat",
    );
  }

  // Map
  if (state.gamePhase === GamePhase.MAP) {
    check(
      (state.map?.nodes ?? []).some(
        (node) => node.available && !node.completed,
      ),
      "the map has nowhere to go",
    );
  }

  // Randomness
  check(
    Number.isInteger(state.rngState) && state.rngState >= 0,
    `the random state is ${state.rngState}`,
  );

  return problems;
};
