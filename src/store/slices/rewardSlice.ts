import { Card, GamePhase, TurnPhase } from "../../types/game";
import { createCardInstance } from "../../engine/deck";
import { createOutOfCombatPiles } from "../initialState";
import { GameStore, RewardActions, SliceCreator } from "../types";

/** Back to the map with the given deck, with the reward screens finished. */
const finishRewards = (deck: Card[]) => ({
  ...createOutOfCombatPiles(deck),
  gamePhase: GamePhase.MAP,
  combatReward: undefined,
  currentTurn: TurnPhase.PLAYER_TURN,
  selectedCard: null,
});

/**
 * After the card reward is taken or skipped: move on to the relic reward if
 * there is one, otherwise go back to the map.
 */
const afterCardReward = (state: GameStore, deck: Card[]) => {
  if (!state.combatReward?.relicReward) return finishRewards(deck);

  return {
    ...createOutOfCombatPiles(deck),
    gamePhase: GamePhase.RELIC_REWARD,
    combatReward: { ...state.combatReward, cardRewards: [] },
    selectedCard: null,
  };
};

/** The deck as it stands on the reward screens. */
const getCurrentDeck = (state: GameStore): Card[] => [
  ...state.drawPile,
  ...state.discardPile,
  ...state.hand,
];

export const createRewardSlice: SliceCreator<RewardActions> = (set) => ({
  selectCardReward: (cardId) =>
    set((state) => {
      const card = state.combatReward?.cardRewards.find((c) => c.id === cardId);
      if (!card) return state;

      return afterCardReward(state, [
        ...getCurrentDeck(state),
        createCardInstance(card),
      ]);
    }),

  skipCardReward: () =>
    set((state) => afterCardReward(state, getCurrentDeck(state))),

  selectRelicReward: () =>
    set((state) => {
      const relic = state.combatReward?.relicReward;
      if (!relic) return state;

      return {
        ...finishRewards(state.persistentDeck),
        player: { ...state.player, relics: [...state.player.relics, relic] },
      };
    }),

  skipRelicReward: () => set((state) => finishRewards(state.persistentDeck)),
});
