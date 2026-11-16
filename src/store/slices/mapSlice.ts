import { GamePhase, TurnPhase } from "../../types/game";
import { NodeType } from "../../types/map";
import { getRandomEvent } from "../../data/events";
import { createEncounter, isCombatNode } from "../../engine/combat";
import { REST_HEAL_AMOUNT } from "../../engine/constants";
import { replaceCard } from "../../engine/deck";
import { applyEventChoice, canChooseEventOption } from "../../engine/events";
import { createShop, createTreasureReward } from "../../engine/rewards";
import { upgradeCard } from "../../utils/cardUpgrades";
import { completeNode } from "../../utils/mapGeneration";
import { createSeededRng } from "../../utils/random";
import { createOutOfCombatPiles } from "../initialState";
import { MapActions, SliceCreator } from "../types";

export const createMapSlice: SliceCreator<MapActions> = (set, get) => ({
  selectNode: (nodeId) => {
    const state = get();
    if (!state.map) return;

    const node = state.map.nodes.find((n) => n.id === nodeId);
    if (!node || !node.available || node.completed) return;

    const rng = createSeededRng(state.rngState);
    // The node is marked as entered in the same update that leaves the map,
    // so the run is never on the map with a node entered but not played
    const entered = {
      map: completeNode(state.map, nodeId),
      currentFloor: node.y + 1,
    };

    if (isCombatNode(node.type)) {
      const enemies = createEncounter(node.type, node.y, rng);
      set({ ...entered, gamePhase: GamePhase.COMBAT, rngState: rng.state });
      get().startCombat(enemies);
      return;
    }

    switch (node.type) {
      case NodeType.EVENT:
        set({
          ...entered,
          gamePhase: GamePhase.EVENT,
          currentEvent: getRandomEvent(rng),
          rngState: rng.state,
        });
        break;

      case NodeType.REST:
        set({ ...entered, gamePhase: GamePhase.REST });
        break;

      case NodeType.TREASURE:
        set({
          ...entered,
          gamePhase: GamePhase.RELIC_REWARD,
          combatReward: createTreasureReward(state.player, rng),
          rngState: rng.state,
        });
        break;

      case NodeType.SHOP:
        set({
          ...entered,
          gamePhase: GamePhase.SHOP,
          currentShop: createShop(state.player, rng),
          rngState: rng.state,
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
    if (!choice || !canChooseEventOption(choice, state.player)) return;

    const rng = createSeededRng(state.rngState);
    const outcome = applyEventChoice(
      choice,
      { player: state.player, persistentDeck: state.persistentDeck },
      rng,
    );

    set({
      ...createOutOfCombatPiles(outcome.persistentDeck),
      player: outcome.player,
      rngState: rng.state,
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
