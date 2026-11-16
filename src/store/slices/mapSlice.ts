import { GamePhase, TurnPhase } from "../../types/game";
import { NodeType } from "../../types/map";
import { getRandomEvent } from "../../data/events";
import { createEncounter, isCombatNode } from "../../engine/combat";
import { REST_HEAL_AMOUNT } from "../../engine/constants";
import { replaceCard } from "../../engine/deck";
import { applyEventChoice } from "../../engine/events";
import { createShop, createTreasureReward } from "../../engine/rewards";
import { upgradeCard } from "../../utils/cardUpgrades";
import { completeNode } from "../../utils/mapGeneration";
import { createOutOfCombatPiles } from "../initialState";
import { MapActions, SliceCreator } from "../types";

export const createMapSlice: SliceCreator<MapActions> = (set, get) => ({
  selectNode: (nodeId) => {
    const state = get();
    if (!state.map) return;

    const node = state.map.nodes.find((n) => n.id === nodeId);
    if (!node || !node.available || node.completed) return;

    set({ map: completeNode(state.map, nodeId) });

    if (isCombatNode(node.type)) {
      get().startCombat(createEncounter(node.type, node.y));
      return;
    }

    switch (node.type) {
      case NodeType.EVENT:
        set({ gamePhase: GamePhase.EVENT, currentEvent: getRandomEvent() });
        break;

      case NodeType.REST:
        set({ gamePhase: GamePhase.REST });
        break;

      case NodeType.TREASURE:
        set({
          gamePhase: GamePhase.RELIC_REWARD,
          combatReward: createTreasureReward(state.player),
        });
        break;

      case NodeType.SHOP:
        set({
          gamePhase: GamePhase.SHOP,
          currentShop: createShop(state.player),
        });
        break;
    }
  },

  returnToMap: () =>
    set((state) => ({
      ...createOutOfCombatPiles(state.persistentDeck),
      gamePhase: GamePhase.MAP,
      currentEvent: undefined,
      currentShop: undefined,
      combatReward: undefined,
      currentTurn: TurnPhase.PLAYER_TURN,
      enemies: [],
      selectedCard: null,
    })),

  selectEventChoice: (choiceId) => {
    const state = get();
    const choice = state.currentEvent?.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    const outcome = applyEventChoice(choice, {
      player: state.player,
      persistentDeck: state.persistentDeck,
    });

    set({
      ...createOutOfCombatPiles(outcome.persistentDeck),
      player: outcome.player,
      // An event can cost the player their last health
      gamePhase:
        outcome.player.health > 0 ? GamePhase.MAP : GamePhase.GAME_OVER,
      currentEvent: undefined,
      selectedCard: null,
    });
  },

  restAndHeal: () =>
    set((state) => ({
      gamePhase: GamePhase.MAP,
      player: {
        ...state.player,
        health: Math.min(
          state.player.maxHealth,
          state.player.health + REST_HEAL_AMOUNT,
        ),
      },
      selectedCard: null,
    })),

  upgradeCardAtRest: (cardId) => {
    if (!cardId) {
      get().openCardUpgradeModal();
      return;
    }

    const state = get();
    const card = [
      ...state.persistentDeck,
      ...state.drawPile,
      ...state.discardPile,
    ].find((c) => c.id === cardId);
    if (!card || card.upgraded) return;

    set({
      drawPile: replaceCard(state.drawPile, cardId, upgradeCard),
      discardPile: replaceCard(state.discardPile, cardId, upgradeCard),
      persistentDeck: replaceCard(state.persistentDeck, cardId, upgradeCard),
      showCardUpgradeModal: false,
      gamePhase: GamePhase.MAP,
      selectedCard: null,
    });
  },
});
