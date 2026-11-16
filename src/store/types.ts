import { StoreApi } from "zustand";
import { Card, Enemy, GameState } from "../types/game";

/** State kept by the store on top of the core game state. */
export interface StoreState extends GameState {
  /** Whether the next attack card is the first one played this combat */
  firstAttackThisCombat: boolean;
  /** Card currently selected for targeting */
  selectedCard: Card | null;
  /** Whether the card removal modal is open */
  showCardRemovalModal: boolean;
  /** Whether the card upgrade modal is open */
  showCardUpgradeModal: boolean;
  /** Whether debug mode is enabled */
  debugMode: boolean;
  /** Current floor number */
  currentFloor: number;
  /** Whether there is a saved game available */
  hasSavedGame: boolean;
  /** 1-based player turn of the current combat (0 before the first turn) */
  playerTurnThisCombat: number;
}

export interface RunActions {
  /** Resets all progress and returns to the title screen */
  startNewRun: () => void;
  /** Resets all progress and goes straight to the map */
  startNewGame: () => void;
  returnToTitle: () => void;
  /** Continues a previously saved game, if there is one */
  loadSavedGame: () => void;
}

export interface UiActions {
  /** Selects a card for targeting, or clears the selection with `null` */
  setSelectedCard: (card: Card | null) => void;
  openCardRemovalModal: () => void;
  closeCardRemovalModal: () => void;
  openCardUpgradeModal: () => void;
  closeCardUpgradeModal: () => void;
  toggleDebugMode: () => void;
}

export interface MapActions {
  /** Enters an available map node (combat, event, shop, rest, treasure) */
  selectNode: (nodeId: string) => void;
  /** Leaves the current screen and goes back to the map */
  returnToMap: () => void;
  selectEventChoice: (choiceId: string) => void;
  restAndHeal: () => void;
  /** Upgrades a card at a rest site; without a card id it opens the picker */
  upgradeCardAtRest: (cardId?: string) => void;
}

export interface CombatActions {
  /** Starts a combat against the given enemies and deals the first hand */
  startCombat: (enemies?: Enemy[]) => void;
  /** Starts the player's turn: refills energy, applies effects, draws a hand */
  startPlayerTurn: () => void;
  /** Plays a card from the hand, aimed at `targetId` if it needs a target */
  playCard: (cardId: string, targetId?: string) => void;
  /** Ends the player's turn and runs the enemy turn */
  endTurn: () => Promise<void>;
  /** Runs the enemy turn, then starts the next player turn */
  processEnemyTurn: () => Promise<void>;
  drawCards: (count: number) => void;
  shuffleDiscardIntoDraw: () => void;
}

export interface RewardActions {
  selectCardReward: (cardId: string) => void;
  skipCardReward: () => void;
  selectRelicReward: () => void;
  skipRelicReward: () => void;
}

export interface ShopActions {
  purchaseShopCard: (index: number) => void;
  purchaseShopRelic: (index: number) => void;
  /** Pays to remove a card; without a card id it opens the picker */
  removeCardFromDeck: (cardId?: string) => void;
}

export type GameStore = StoreState &
  RunActions &
  UiActions &
  MapActions &
  CombatActions &
  RewardActions &
  ShopActions;

/** A group of related store actions, given access to the whole store. */
export type SliceCreator<T> = (
  set: StoreApi<GameStore>["setState"],
  get: StoreApi<GameStore>["getState"],
) => T;
