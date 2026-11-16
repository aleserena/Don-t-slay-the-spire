/**
 * @fileoverview Core Game State Management
 *
 * This file contains the main game store using Zustand for state management.
 * It handles all game logic including combat, progression, card playing, and UI state.
 *
 * Key responsibilities:
 * - Game state management (player, enemies, deck, hand, etc.)
 * - Combat mechanics (turns, damage calculation, status effects)
 * - Progression system (map navigation, rewards, shops)
 * - UI state management (modals, card selection, debug mode)
 *
 * @example
 * ```typescript
 * // Access game state
 * const { player, enemies, hand } = useGameStore();
 *
 * // Perform actions
 * const { playCard, endTurn, startNewGame } = useGameStore();
 * playCard('strike', 'enemy_1');
 * ```
 *
 * @since v1.0.0
 * @author Development Team
 */

import { create } from "zustand";
import {
  GameState,
  Player,
  Enemy,
  TurnPhase,
  EffectType,
  TargetType,
  StatusType,
  IntentType,
  GamePhase,
  Relic,
  RelicTrigger,
  Card,
  CardType,
  PowerTrigger,
  MonsterCardType,
  MonsterCard,
} from "../types/game";
import { createInitialDeck, generateCardRewards } from "../data/cards";
import { getBossForFloor } from "../data/bosses";
import { getStarterRelic, getAllRelics } from "../data/relics";
import { generateMap, completeNode } from "../utils/mapGeneration";
import { getRandomEvent, processEventConsequence } from "../data/events";
import { processRelicEffects } from "../utils/relicEffects";
import { processPowerCardEffects } from "../utils/powerCardEffects";
import { getPowerCardDefinition } from "../data/powerCards";
import { selectEnemyCard } from "../data/monsterCards";
import { processMonsterCardEffects } from "../utils/monsterCardEffects";
import {
  applyStatusEffect,
  processStatusEffects,
  calculateDamage,
  calculateBlock,
} from "../utils/statusEffects";
import { upgradeCard } from "../utils/cardUpgrades";
import { getRandomEnemyEncounter } from "../data/enemies";

/**
 * Pause between the steps of the enemy turn so the UI can show each one.
 * Disabled outside the browser and under test, where the enemy turn resolves
 * synchronously.
 */
const STEP_DELAY_MS =
  typeof window === "undefined" || import.meta.env.MODE === "test" ? 0 : 300;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Converts a monster card type to the intent shown in the UI. */
const cardTypeToIntentType = (cardType: MonsterCardType): IntentType => {
  switch (cardType) {
    case MonsterCardType.ATTACK:
      return IntentType.ATTACK;
    case MonsterCardType.DEFEND:
      return IntentType.DEFEND;
    case MonsterCardType.BUFF:
      return IntentType.BUFF;
    case MonsterCardType.DEBUFF:
      return IntentType.DEBUFF;
    default:
      return IntentType.UNKNOWN;
  }
};

/**
 * Builds the state changes for winning a combat: rewards (gold, cards, and a
 * relic if an elite was defeated), clearing combat-only player state, and
 * restoring the deck from the persistent deck.
 */
const createVictoryState = (
  state: GameState,
  player: Player,
  defeatedEnemies: Enemy[],
) => {
  const rewardGold = 10 + Math.floor(Math.random() * 20);

  let relicReward: Relic | undefined = undefined;
  if (defeatedEnemies.some((enemy) => enemy.isElite)) {
    const availableRelics = getAllRelics().filter(
      (r: Relic) =>
        r.rarity === "common" || r.rarity === "uncommon" || r.rarity === "rare",
    );
    relicReward =
      availableRelics[Math.floor(Math.random() * availableRelics.length)];
  }

  return {
    hand: [],
    discardPile: [],
    exhaustPile: [],
    // Temporary copies created during combat do not persist
    drawPile: state.persistentDeck.filter(
      (card) => !card.id.includes("_copy_"),
    ),
    player: {
      ...player,
      gold: player.gold + rewardGold,
      statusEffects: player.statusEffects.filter(
        (effect) =>
          effect.type !== StatusType.WEAK &&
          effect.type !== StatusType.VULNERABLE &&
          effect.type !== StatusType.STRENGTH,
      ),
      powerCards: [], // Power cards only last for one combat
    },
    enemies: [],
    currentTurn: TurnPhase.COMBAT_END,
    gamePhase: GamePhase.CARD_REWARD,
    combatReward: {
      gold: rewardGold,
      cardRewards: generateCardRewards(3),
      relicReward,
    },
    selectedCard: null,
    playerTurnThisCombat: 0,
  };
};

/**
 * Extended game store interface that includes UI state and actions.
 *
 * This interface extends the base GameState with additional UI-specific state
 * and all the actions that can be performed in the game.
 *
 * @interface GameStore
 * @extends {GameState} - Base game state (player, enemies, deck, etc.)
 */
interface GameStore extends GameState {
  // Additional state
  /** Tracks if this is the first attack in the current combat */
  firstAttackThisCombat: boolean;
  /** Currently selected card for targeting */
  selectedCard: Card | null;
  /** Whether the card removal modal is open */
  showCardRemovalModal: boolean;
  /** Whether the card upgrade modal is open */
  showCardUpgradeModal: boolean;
  /** Whether debug mode is enabled */
  debugMode: boolean;
  /** Current floor number in the spire */
  currentFloor: number;
  /** Whether there's a saved game available */
  hasSavedGame: boolean;
  /** Tracks the current turn in the combat */
  playerTurnThisCombat: number;
  /** Stores the original deck before combat starts (to preserve it after combat) */
  originalDeckBeforeCombat: Card[];
  /** Indicates if an enemy step animation is in progress */
  stepInProgress: boolean;
  /** Internal resolver for the current step */
  _resolveStep?: (value?: unknown) => void;
  /** Call this to resolve the current step and continue the enemy turn */
  resolveStep: () => void;
  /** Type of step currently in progress */
  stepType?: "before" | "attack" | "after";
  /** Persistent deck of cards */
  persistentDeck: Card[];

  // Actions
  /**
   * Plays a card from the player's hand
   * @param cardId - ID of the card to play
   * @param targetId - Optional target ID for targeting cards
   */
  playCard: (cardId: string, targetId?: string) => void;

  /**
   * Ends the current player turn and starts enemy turn
   */
  endTurn: () => Promise<void>;

  /**
   * Starts a new combat encounter
   */
  startCombat: () => void;

  /**
   * Draws a specified number of cards from draw pile to hand
   * @param count - Number of cards to draw
   */
  drawCards: (count: number) => void;

  /**
   * Shuffles the discard pile back into the draw pile
   */
  shuffleDiscardIntoDraw: () => void;

  /**
   * Processes the enemy turn (AI actions, damage calculation)
   */
  processEnemyTurn: () => Promise<void>;

  // Progression actions
  /**
   * Starts a completely new run (resets all progress)
   */
  startNewRun: () => void;

  /**
   * Starts a new game from the title screen
   */
  startNewGame: () => void;

  /**
   * Returns to the title screen
   */
  returnToTitle: () => void;

  /**
   * Loads a previously saved game
   */
  loadSavedGame: () => void;

  /**
   * Selects a node on the map to progress
   * @param nodeId - ID of the node to select
   */
  selectNode: (nodeId: string) => void;

  /**
   * Selects a card reward after combat
   * @param cardId - ID of the card to add to deck
   */
  selectCardReward: (cardId: string) => void;

  /**
   * Skips the card reward (removes all options)
   */
  skipCardReward: () => void;

  /**
   * Selects a choice in an event
   * @param choiceId - ID of the choice to make
   */
  selectEventChoice: (choiceId: string) => void;

  /**
   * Returns to the map view
   */
  returnToMap: () => void;

  // Shop actions
  /**
   * Purchases a card from the shop
   * @param index - Index of the card in the shop inventory
   */
  purchaseShopCard: (index: number) => void;

  /**
   * Purchases a relic from the shop
   * @param index - Index of the relic in the shop inventory
   */
  purchaseShopRelic: (index: number) => void;

  /**
   * Removes a card from the player's deck
   * @param cardId - Optional card ID to remove (if not specified, opens modal)
   */
  removeCardFromDeck: (cardId?: string) => void;

  /**
   * Opens the card removal modal
   */
  openCardRemovalModal: () => void;

  /**
   * Closes the card removal modal
   */
  closeCardRemovalModal: () => void;

  // Rest site actions
  /**
   * Rests and heals the player
   */
  restAndHeal: () => void;

  /**
   * Upgrades a card at the rest site
   * @param cardId - Optional card ID to upgrade (if not specified, opens modal)
   */
  upgradeCardAtRest: (cardId?: string) => void;

  /**
   * Opens the card upgrade modal
   */
  openCardUpgradeModal: () => void;

  /**
   * Closes the card upgrade modal
   */
  closeCardUpgradeModal: () => void;

  // Card selection
  /**
   * Sets the currently selected card for targeting
   * @param card - Card to select, or null to deselect
   */
  setSelectedCard: (card: Card | null) => void;

  // Debug actions
  /**
   * Toggles debug mode on/off
   */
  toggleDebugMode: () => void;

  // Relic reward actions
  /**
   * Selects a relic reward
   */
  selectRelicReward: () => void;

  /**
   * Skips the relic reward
   */
  skipRelicReward: () => void;

  /**
   * Starts the player's turn (increments turn, resets energy/block, processes effects, draws hand)
   */
  startPlayerTurn: () => void;

  /**
   * Processes before-attack effects for an enemy (poison damage, etc.)
   */
  processBeforeAttackEffects: (player: Player, enemy: Enemy) => Player;

  /**
   * Processes enemy attack with proper trigger resolution (LIFO stack)
   */
  processEnemyAttack: (
    card: MonsterCard,
    player: Player,
    enemy: Enemy,
  ) => { player: Player; enemy: Enemy };

  /**
   * Processes after-attack effects for an enemy
   */
  processAfterAttackEffects: (player: Player, _enemy: Enemy) => Player;
}

/**
 * Creates a new player with default starting stats and the starter relic.
 *
 * @returns {Player} A new player with 80 HP, 3 energy, 99 gold, and starter relic
 *
 * @example
 * ```typescript
 * const player = createInitialPlayer();
 * console.log(player.health); // 80
 * console.log(player.relics.length); // 1 (starter relic)
 * ```
 */
const createInitialPlayer = (): Player => ({
  health: 80,
  maxHealth: 80,
  block: 0,
  energy: 3,
  maxEnergy: 3,
  statusEffects: [],
  gold: 99,
  relics: [getStarterRelic()],
  powerCards: [],
});

/**
 * Creates the initial game state with a fresh deck and empty combat state.
 *
 * @returns {GameState} Complete initial game state ready for a new run
 *
 * @example
 * ```typescript
 * const initialState = createInitialGameState();
 * console.log(initialState.gamePhase); // GamePhase.TITLE
 * console.log(initialState.drawPile.length); // 10 (starter deck)
 * ```
 */
const createInitialGameState = (): GameState => {
  const deck = createInitialDeck();
  return {
    player: createInitialPlayer(),
    enemies: [],
    hand: [],
    drawPile: [...deck],
    discardPile: [],
    exhaustPile: [],
    currentTurn: TurnPhase.PLAYER_TURN,
    gamePhase: GamePhase.TITLE,
    map: generateMap(),
    stepInProgress: false,
    _resolveStep: undefined,
    stepType: undefined,
    persistentDeck: deck,
  };
};

/**
 * Main game store using Zustand for state management.
 *
 * This is the central store that manages all game state and provides
 * actions for all game interactions. It uses Zustand for efficient
 * state updates and React integration.
 *
 * @example
 * ```typescript
 * // Access state
 * const { player, enemies, hand } = useGameStore();
 *
 * // Access actions
 * const { playCard, endTurn } = useGameStore();
 *
 * // Perform actions
 * playCard('strike', 'enemy_1');
 * endTurn();
 * ```
 *
 * @since v1.0.0
 * @author Development Team
 */
export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialGameState(),
  firstAttackThisCombat: true,
  selectedCard: null,
  showCardRemovalModal: false,
  showCardUpgradeModal: false,
  debugMode: false,
  currentFloor: 1,
  hasSavedGame: false,
  playerTurnThisCombat: 1,
  originalDeckBeforeCombat: [],

  /**
   * Starts a completely new run, resetting all progress but preserving debug mode.
   *
   * This action resets the entire game state to initial values, including:
   * - Player stats and deck
   * - Map progress
   * - Combat state
   * - All UI modals and selections
   *
   * @example
   * ```typescript
   * const { startNewRun } = useGameStore();
   * startNewRun(); // Resets everything to initial state
   * ```
   */
  startNewRun: () => {
    set((state) => ({
      ...createInitialGameState(),
      firstAttackThisCombat: true,
      selectedCard: null,
      showCardRemovalModal: false,
      showCardUpgradeModal: false,
      debugMode: state.debugMode, // Preserve debug mode
    }));
  },

  /**
   * Selects a node on the map to progress the game.
   *
   * This action handles all node types (combat, boss, elite, event, rest, shop)
   * and transitions the game to the appropriate phase. It also:
   * - Validates node availability
   * - Updates map completion status
   * - Sets up appropriate game state for the node type
   *
   * @param nodeId - The ID of the node to select
   *
   * @example
   * ```typescript
   * const { selectNode } = useGameStore();
   * selectNode('combat_1'); // Starts a combat encounter
   * selectNode('shop_1');   // Opens the shop
   * ```
   */
  selectNode: (nodeId: string) => {
    const state = get();
    if (!state.map) return;

    const node = state.map.nodes.find((n) => n.id === nodeId);
    if (!node || !node.available || node.completed) return;

    set((state) => {
      const updatedMap = completeNode(state.map!, nodeId);

      switch (node.type) {
        case "combat": {
          return {
            ...state,
            gamePhase: GamePhase.COMBAT,
            enemies: getRandomEnemyEncounter(),
            map: updatedMap,
            hand: [],
            drawPile: [...state.drawPile],
            discardPile: [],
            exhaustPile: [],
            currentTurn: TurnPhase.PLAYER_TURN,
            firstAttackThisCombat: true,
            playerTurnThisCombat: 1,
            player: {
              ...state.player,
              block: 0,
              energy: state.player.maxEnergy,
              relics: state.player.relics,
              powerCards: state.player.powerCards,
            },
          };
        }

        case "boss": {
          const bossEnemy = getBossForFloor(node.y);
          return {
            ...state,
            gamePhase: GamePhase.COMBAT,
            enemies: [bossEnemy],
            map: updatedMap,
            hand: [],
            drawPile: [...state.drawPile],
            discardPile: [],
            exhaustPile: [],
            currentTurn: TurnPhase.PLAYER_TURN,
            firstAttackThisCombat: true,
            playerTurnThisCombat: 1,
            player: {
              ...state.player,
              block: 0,
              energy: state.player.maxEnergy,
              relics: state.player.relics,
              powerCards: state.player.powerCards,
            },
          };
        }

        case "elite": {
          const eliteEnemies = getRandomEnemyEncounter().map((e: Enemy) => ({
            ...e,
            isElite: true,
            health: Math.floor(e.health * 1.5),
            maxHealth: Math.floor(e.maxHealth * 1.5),
          }));
          return {
            ...state,
            gamePhase: GamePhase.COMBAT,
            enemies: eliteEnemies,
            map: updatedMap,
            hand: [],
            drawPile: [...state.drawPile],
            discardPile: [],
            exhaustPile: [],
            currentTurn: TurnPhase.PLAYER_TURN,
            firstAttackThisCombat: true,
            playerTurnThisCombat: 1,
            player: {
              ...state.player,
              block: 0,
              energy: state.player.maxEnergy,
              relics: state.player.relics,
              powerCards: state.player.powerCards,
            },
          };
        }

        case "event":
          return {
            ...state,
            gamePhase: GamePhase.EVENT,
            currentEvent: getRandomEvent(),
            map: updatedMap,
          };

        case "rest":
          return {
            ...state,
            gamePhase: GamePhase.REST,
            map: updatedMap,
          };

        case "treasure": {
          // Generate a random treasure relic
          const availableRelics = getAllRelics().filter(
            (r: Relic) => r.rarity === "common" || r.rarity === "uncommon",
          );
          const treasureRelic =
            availableRelics[Math.floor(Math.random() * availableRelics.length)];

          return {
            ...state,
            gamePhase: GamePhase.RELIC_REWARD,
            map: updatedMap,
            combatReward: {
              gold: 0,
              cardRewards: [],
              relicReward: treasureRelic,
              isTreasureReward: true,
            },
          };
        }

        case "shop": {
          const shopCards = generateCardRewards(5).map((card) => ({
            card,
            cost:
              50 +
              (card.rarity === "uncommon"
                ? 25
                : card.rarity === "rare"
                  ? 50
                  : 0),
            purchased: false,
          }));

          const shopRelics = getAllRelics()
            .filter((r: Relic) => r.rarity !== "starter" && Math.random() < 0.2)
            .slice(0, 2)
            .map((relic: Relic) => ({
              relic,
              cost:
                150 +
                (relic.rarity === "uncommon"
                  ? 50
                  : relic.rarity === "rare"
                    ? 100
                    : relic.rarity === "boss"
                      ? 200
                      : 0),
              purchased: false,
            }));

          return {
            ...state,
            gamePhase: GamePhase.SHOP,
            currentShop: {
              cards: shopCards,
              relics: shopRelics,
              removeCardCost: 75,
            },
            map: updatedMap,
          };
        }

        default:
          return {
            ...state,
            map: updatedMap,
          };
      }
    });

    // Start combat if it's a combat node
    if (
      node.type === "combat" ||
      node.type === "elite" ||
      node.type === "boss"
    ) {
      setTimeout(() => {
        // Apply combat start relic effects
        const state = get();
        const relicResult = processRelicEffects(
          RelicTrigger.COMBAT_START,
          state.player,
          state.enemies,
        );

        set((currentState) => ({
          ...currentState,
          player: relicResult.player,
          enemies: relicResult.enemies,
        }));

        get().drawCards(5);
      }, 100);
    }
  },

  /**
   * Selects a card reward after combat
   * @param cardId - ID of the card to add to deck
   */
  selectCardReward: (cardId: string) => {
    set((state) => {
      const card = state.combatReward?.cardRewards.find((c) => c.id === cardId);
      if (!card) return state;

      // Check if there's a relic reward to show next
      const hasRelicReward = state.combatReward?.relicReward;

      // Use current deck (which includes previously added reward cards) and add the new card
      const currentDeck = [
        ...state.drawPile,
        ...state.discardPile,
        ...state.hand,
      ];
      const newCard = { ...card, id: `${card.baseId}_${Date.now()}` };
      const updatedDeck = [...currentDeck, newCard];

      if (hasRelicReward) {
        // Go to relic reward screen, keep the relic in combatReward
        return {
          ...state,
          drawPile: updatedDeck,
          persistentDeck: updatedDeck,
          gamePhase: GamePhase.RELIC_REWARD,
          combatReward: {
            ...state.combatReward!,
            cardRewards: [], // Clear card rewards since one was selected
          },
          selectedCard: null,
        };
      } else {
        // No relic reward, go back to map
        return {
          ...state,
          drawPile: updatedDeck,
          persistentDeck: updatedDeck,
          discardPile: [],
          exhaustPile: [],
          hand: [],
          gamePhase: GamePhase.MAP,
          combatReward: undefined,
          currentTurn: TurnPhase.PLAYER_TURN,
          selectedCard: null,
        };
      }
    });
  },

  /**
   * Skips the card reward (removes all options)
   */
  skipCardReward: () => {
    set((state) => {
      // Check if there's a relic reward to show next
      const hasRelicReward = state.combatReward?.relicReward;
      // Use the current deck as the persistent deck
      const currentDeck = [
        ...state.drawPile,
        ...state.discardPile,
        ...state.hand,
      ];
      if (hasRelicReward) {
        // Go to relic reward screen
        return {
          ...state,
          persistentDeck: currentDeck,
          gamePhase: GamePhase.RELIC_REWARD,
          combatReward: {
            ...state.combatReward!,
            cardRewards: [], // Clear card rewards since they were skipped
          },
          selectedCard: null,
        };
      } else {
        // No relic reward, go back to map
        return {
          ...state,
          drawPile: currentDeck,
          persistentDeck: currentDeck,
          discardPile: [],
          exhaustPile: [],
          hand: [],
          gamePhase: GamePhase.MAP,
          combatReward: undefined,
          currentTurn: TurnPhase.PLAYER_TURN,
          selectedCard: null,
        };
      }
    });
  },

  /**
   * Selects a choice in an event
   * @param choiceId - ID of the choice to make
   */
  selectEventChoice: (choiceId: string) => {
    const state = get();
    if (!state.currentEvent) return;

    const choice = state.currentEvent.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    set((currentState) => {
      let newState = { ...currentState };

      // Apply all consequences
      choice.consequences.forEach((consequence) => {
        const processedState = processEventConsequence(consequence, newState);
        // Merge the processed state back into our GameStore, preserving additional properties
        newState = {
          ...newState,
          ...processedState,
        };
      });

      return {
        ...newState,
        // Events can add or remove cards; keep the persistent deck in sync
        persistentDeck:
          newState.drawPile === currentState.drawPile
            ? currentState.persistentDeck
            : [...newState.drawPile],
        gamePhase: GamePhase.MAP,
        currentEvent: undefined,
        selectedCard: null,
      };
    });
  },

  /**
   * Returns to the map view
   */
  returnToMap: () => {
    set((state) => {
      // Use persistentDeck as the source of truth for the deck
      const filteredPersistentDeck = state.persistentDeck.filter(
        (card) => !card.id.includes("_copy_"),
      );
      return {
        ...state,
        gamePhase: GamePhase.MAP,
        currentEvent: undefined,
        currentShop: undefined,
        combatReward: undefined,
        drawPile: filteredPersistentDeck,
        discardPile: [],
        exhaustPile: [],
        hand: [],
        currentTurn: TurnPhase.PLAYER_TURN,
        enemies: [],
        selectedCard: null,
      };
    });
  },

  /**
   * Plays a card from the player's hand
   * @param cardId - ID of the card to play
   * @param targetId - Optional target ID for targeting cards
   */
  playCard: (cardId: string, targetId?: string) => {
    const current = get();
    const playedCard = current.hand.find((c) => c.id === cardId);

    if (!playedCard || current.currentTurn !== TurnPhase.PLAYER_TURN) return;

    // X-cost cards consume all available energy (and can be played with 0)
    const energyCost =
      playedCard.cost === "X" ? current.player.energy : playedCard.cost;
    if (current.player.energy < energyCost) return;

    let cardsToDraw = 0;

    set((state) => {
      const card = state.hand.find((c) => c.id === cardId);
      if (!card) return state;

      const newHand = state.hand.filter((c) => c.id !== cardId);
      // All cards (including power cards) are discarded normally
      const newDiscardPile = [...state.discardPile, card];

      let newPlayer: Player = {
        ...state.player,
        energy: state.player.energy - energyCost,
      };
      let newEnemies = [...state.enemies];

      // First attack of the combat (Akabeko)
      const isFirstAttack =
        state.firstAttackThisCombat && card.type === CardType.ATTACK;

      const hitEnemy = (
        enemy: Enemy,
        baseDamage: number,
        firstAttack: boolean,
        strengthMultiplier: number = 1,
      ): Enemy => {
        const damage = calculateDamage(
          baseDamage,
          newPlayer,
          enemy,
          firstAttack,
          strengthMultiplier,
        );
        return {
          ...enemy,
          health: enemy.health - Math.max(0, damage - enemy.block),
          block: Math.max(0, enemy.block - damage),
        };
      };

      const hitTarget = (
        baseDamage: number,
        firstAttack: boolean,
        strengthMultiplier: number = 1,
      ) => {
        if (!targetId) return;
        newEnemies = newEnemies.map((enemy) =>
          enemy.id === targetId
            ? hitEnemy(enemy, baseDamage, firstAttack, strengthMultiplier)
            : enemy,
        );
      };

      if (card.effects) {
        for (const effect of card.effects) {
          switch (effect.type) {
            case EffectType.DAMAGE:
              if (effect.target === TargetType.ALL_ENEMIES) {
                newEnemies = newEnemies.map((enemy) =>
                  hitEnemy(
                    enemy,
                    effect.value,
                    isFirstAttack,
                    effect.strengthMultiplier,
                  ),
                );
              } else if (effect.target === TargetType.ENEMY) {
                hitTarget(
                  effect.value,
                  isFirstAttack,
                  effect.strengthMultiplier,
                );
              }
              break;

            case EffectType.DAMAGE_MULTIPLIER_BLOCK:
              if (effect.target === TargetType.ENEMY) {
                hitTarget(
                  newPlayer.block * (effect.multiplier || 1),
                  isFirstAttack,
                );
              }
              break;

            case EffectType.DAMAGE_MULTIPLIER_ENERGY:
              if (effect.target === TargetType.ALL_ENEMIES) {
                // One hit per energy spent
                for (let hit = 0; hit < energyCost; hit++) {
                  newEnemies = newEnemies.map((enemy) =>
                    hitEnemy(enemy, effect.value, isFirstAttack && hit === 0),
                  );
                }
              }
              break;

            case EffectType.BLOCK:
              if (effect.target === TargetType.SELF) {
                newPlayer = {
                  ...newPlayer,
                  block:
                    newPlayer.block + calculateBlock(effect.value, newPlayer),
                };
              }
              break;

            case EffectType.APPLY_STATUS:
              if (effect.statusType) {
                const statusType = effect.statusType;
                if (effect.target === TargetType.SELF) {
                  newPlayer = applyStatusEffect(
                    newPlayer,
                    statusType,
                    effect.value,
                  ) as Player;
                } else if (effect.target === TargetType.ENEMY && targetId) {
                  newEnemies = newEnemies.map((enemy) =>
                    enemy.id === targetId
                      ? (applyStatusEffect(
                          enemy,
                          statusType,
                          effect.value,
                        ) as Enemy)
                      : enemy,
                  );
                } else if (effect.target === TargetType.ALL_ENEMIES) {
                  newEnemies = newEnemies.map(
                    (enemy) =>
                      applyStatusEffect(
                        enemy,
                        statusType,
                        effect.value,
                      ) as Enemy,
                  );
                }
              }
              break;

            case EffectType.DRAW_CARDS:
              if (effect.target === TargetType.SELF) {
                cardsToDraw += effect.value;
              }
              break;

            case EffectType.HEAL:
              if (effect.target === TargetType.SELF) {
                newPlayer = {
                  ...newPlayer,
                  health: Math.min(
                    newPlayer.maxHealth,
                    newPlayer.health + effect.value,
                  ),
                };
              }
              break;

            case EffectType.GAIN_ENERGY:
              if (effect.target === TargetType.SELF) {
                newPlayer = {
                  ...newPlayer,
                  energy: Math.min(
                    newPlayer.maxEnergy + 3,
                    newPlayer.energy + effect.value,
                  ),
                };
              }
              break;

            case EffectType.LOSE_ENERGY:
              if (effect.target === TargetType.SELF) {
                newPlayer = {
                  ...newPlayer,
                  energy: Math.max(0, newPlayer.energy - effect.value),
                };
              }
              break;

            case EffectType.ADD_CARD_TO_DISCARD:
              if (effect.target === TargetType.SELF) {
                // Add a temporary copy of the played card to the discard pile
                newDiscardPile.push({
                  ...card,
                  id: `${card.baseId}_copy_${Date.now()}`,
                });
              }
              break;

            case EffectType.UPGRADE_CARD:
              if (effect.target === TargetType.SELF) {
                // Upgrade a random card in hand
                const upgradableCards = newHand.filter((c) => !c.upgraded);
                if (upgradableCards.length > 0) {
                  const cardToUpgrade =
                    upgradableCards[
                      Math.floor(Math.random() * upgradableCards.length)
                    ];
                  const handIndex = newHand.findIndex(
                    (c) => c.id === cardToUpgrade.id,
                  );
                  newHand[handIndex] = upgradeCard(cardToUpgrade);
                }
              }
              break;
          }
        }
      }

      // Legacy support: cards with a direct damage property and no damage effects
      if (
        card.damage &&
        card.damage > 0 &&
        !card.effects?.some(
          (effect) =>
            effect.type === EffectType.DAMAGE ||
            effect.type === EffectType.DAMAGE_MULTIPLIER_BLOCK ||
            effect.type === EffectType.DAMAGE_MULTIPLIER_ENERGY,
        )
      ) {
        hitTarget(card.damage, isFirstAttack);
      }

      // Legacy support: cards with a direct block property and no block effects
      if (
        card.block &&
        card.block > 0 &&
        !card.effects?.some((effect) => effect.type === EffectType.BLOCK)
      ) {
        newPlayer = {
          ...newPlayer,
          block: newPlayer.block + calculateBlock(card.block, newPlayer),
        };
      }

      // Power cards stay attached to the player for the rest of the combat
      if (card.type === CardType.POWER) {
        const powerCardDef = getPowerCardDefinition(card.baseId);
        if (powerCardDef) {
          newPlayer = {
            ...newPlayer,
            powerCards: [...newPlayer.powerCards, powerCardDef],
          };

          // Only apply the definition's immediate effects when the card has
          // no effects of its own (prevents double application, e.g. Inflame)
          if (!card.effects || card.effects.length === 0) {
            const powerResult = processPowerCardEffects(
              PowerTrigger.COMBAT_START,
              { ...newPlayer, powerCards: [powerCardDef] },
              newEnemies,
            );
            newPlayer = {
              ...powerResult.player,
              powerCards: newPlayer.powerCards,
            };
            newEnemies = powerResult.enemies;
          }
        }
      }

      // Remove dead enemies
      newEnemies = newEnemies.filter((e) => e.health > 0);

      if (newEnemies.length === 0) {
        cardsToDraw = 0;
        return {
          ...state,
          ...createVictoryState(state, newPlayer, state.enemies),
        };
      }

      return {
        ...state,
        hand: newHand,
        discardPile: newDiscardPile,
        player: newPlayer,
        enemies: newEnemies,
        firstAttackThisCombat: isFirstAttack
          ? false
          : state.firstAttackThisCombat,
        selectedCard: null,
      };
    });

    // Draw cards from card effects once the played card has left the hand
    if (cardsToDraw > 0) {
      get().drawCards(cardsToDraw);
    }
  },

  /**
   * Processes the enemy turn (status effects, enemy cards, relic reactions),
   * then starts the next player turn.
   *
   * Runs step by step with a short pause between steps so the UI can show
   * each one. When step delays are disabled the whole turn resolves
   * synchronously.
   */
  processEnemyTurn: async () => {
    const enemiesAtTurnStart = get().enemies;
    let newPlayer = { ...get().player };
    let newEnemies = [...enemiesAtTurnStart];

    const endSteps = { stepInProgress: false, stepType: undefined };

    const isPlayerDead = () => {
      if (newPlayer.health > 0) return false;
      set((s) => ({
        ...s,
        ...endSteps,
        player: { ...newPlayer, health: 0 },
        gamePhase: GamePhase.GAME_OVER,
        selectedCard: null,
      }));
      return true;
    };

    // Status effects tick on enemies first (poison damage, etc.)
    newEnemies = newEnemies
      .map((enemy) => processStatusEffects(enemy) as Enemy)
      .filter((enemy) => enemy.health > 0)
      // Enemy block resets at the start of their turn
      .map((enemy) => ({ ...enemy, block: 0 }));

    newPlayer = processStatusEffects(newPlayer) as Player;
    if (isPlayerDead()) return;

    for (const enemyId of newEnemies.map((enemy) => enemy.id)) {
      const findEnemy = () => newEnemies.find((e) => e.id === enemyId);
      const enemy = findEnemy();
      if (!enemy) continue;

      // Step 1: before-attack effects
      if (STEP_DELAY_MS > 0) await delay(STEP_DELAY_MS);
      set((s) => ({ ...s, stepInProgress: true, stepType: "before" }));
      newPlayer = get().processBeforeAttackEffects(newPlayer, enemy);
      set((s) => ({ ...s, player: newPlayer }));
      if (isPlayerDead()) return;

      // Step 2: the enemy plays its current card
      if (enemy.currentCard) {
        if (STEP_DELAY_MS > 0) await delay(STEP_DELAY_MS);
        set((s) => ({ ...s, stepInProgress: true, stepType: "attack" }));

        const attackResult = get().processEnemyAttack(
          enemy.currentCard,
          newPlayer,
          enemy,
        );
        newPlayer = attackResult.player;
        // The enemy may have died from retaliation damage (e.g. Bronze Scales)
        newEnemies = newEnemies
          .map((e) => (e.id === enemyId ? attackResult.enemy : e))
          .filter((e) => e.health > 0);

        set((s) => ({ ...s, player: newPlayer, enemies: newEnemies }));
        if (isPlayerDead()) return;
      }

      // Step 3: after-attack effects
      if (STEP_DELAY_MS > 0) await delay(STEP_DELAY_MS);
      set((s) => ({ ...s, stepInProgress: true, stepType: "after" }));
      newPlayer = get().processAfterAttackEffects(newPlayer, enemy);
      set((s) => ({ ...s, player: newPlayer }));
      if (isPlayerDead()) return;

      // Surviving enemies pick their card for next turn
      const survivor = findEnemy();
      if (survivor) {
        const newCard = selectEnemyCard(
          survivor.deck,
          survivor.health,
          survivor.maxHealth,
        );
        newEnemies = newEnemies.map((e) =>
          e.id === enemyId
            ? {
                ...e,
                currentCard: newCard,
                intent: {
                  type: cardTypeToIntentType(newCard.type),
                  value: newCard.damage || newCard.block,
                  card: newCard,
                },
              }
            : e,
        );
        set((s) => ({ ...s, enemies: newEnemies }));
      }
    }

    if (newEnemies.length === 0) {
      set((s) => ({
        ...s,
        ...endSteps,
        ...createVictoryState(s, newPlayer, enemiesAtTurnStart),
      }));
      return;
    }

    set((s) => ({
      ...s,
      ...endSteps,
      player: newPlayer,
      enemies: newEnemies,
      selectedCard: null,
    }));
    get().startPlayerTurn();
  },

  /**
   * Ends the current player turn and starts enemy turn
   */
  endTurn: async () => {
    if (get().currentTurn !== TurnPhase.PLAYER_TURN) return;

    set((state) => {
      // Power card turn end effects (like Metallicize)
      const powerResult = processPowerCardEffects(
        PowerTrigger.TURN_END,
        state.player,
        state.enemies,
      );

      return {
        ...state,
        // The remaining hand is discarded
        hand: [],
        discardPile: [...state.discardPile, ...state.hand],
        currentTurn: TurnPhase.ENEMY_TURN,
        player: powerResult.player,
        enemies: powerResult.enemies,
        selectedCard: null,
        // Block is NOT reset here - it resets at start of next player turn
      };
    });

    await get().processEnemyTurn();
  },

  /**
   * Starts a new combat encounter
   */
  startCombat: () => {
    set((state) => {
      // Use persistentDeck as the source of truth for the deck
      const shuffledDeck = [...state.persistentDeck].sort(
        () => Math.random() - 0.5,
      );
      console.log(
        `[DEBUG] startCombat - Shuffling ${state.persistentDeck.length} cards from persistentDeck into drawPile`,
      );
      console.log(
        `[DEBUG] Persistent deck cards:`,
        state.persistentDeck.map((c) => c.name),
      );
      console.log(
        `[DEBUG] Shuffled deck cards:`,
        shuffledDeck.map((c) => c.name),
      );

      return {
        ...state,
        enemies: [],
        hand: [],
        drawPile: shuffledDeck,
        discardPile: [],
        exhaustPile: [],
        currentTurn: TurnPhase.PLAYER_TURN,
        gamePhase: GamePhase.COMBAT,
        combatReward: undefined,
        playerTurnThisCombat: 0, // Will be incremented to 1 on first player turn
        player: {
          ...state.player,
          block: 0,
          energy: state.player.maxEnergy,
          relics: state.player.relics,
          powerCards: state.player.powerCards,
        },
      };
    });
    get().startPlayerTurn();
  },

  /**
   * Draws a specified number of cards from draw pile to hand
   * @param count - Number of cards to draw
   */
  drawCards: (count: number) => {
    set((state) => {
      let newDrawPile = [...state.drawPile];
      let newDiscardPile = [...state.discardPile];
      const newHand = [...state.hand];

      console.log(
        `[DEBUG] drawCards called - count: ${count}, drawPile: ${newDrawPile.length}, discardPile: ${newDiscardPile.length}`,
      );

      let drawn = 0;
      while (drawn < count) {
        if (newDrawPile.length === 0 && newDiscardPile.length > 0) {
          // Shuffle discard pile into draw pile
          console.log(
            `[DEBUG] Draw pile empty, shuffling ${newDiscardPile.length} cards from discard pile into draw pile`,
          );
          newDrawPile = [...newDiscardPile].sort(() => Math.random() - 0.5);
          newDiscardPile = [];
          console.log(
            `[DEBUG] After shuffle - drawPile: ${newDrawPile.length}, discardPile: ${newDiscardPile.length}`,
          );
        }
        if (newDrawPile.length > 0) {
          const drawnCard = newDrawPile.pop()!;
          newHand.push(drawnCard);
          drawn++;
          console.log(`[DEBUG] Drew card: ${drawnCard.name} (${drawnCard.id})`);
        } else {
          console.log(
            `[DEBUG] No cards available to draw (drawPile: ${newDrawPile.length}, discardPile: ${newDiscardPile.length})`,
          );
          break;
        }
      }

      console.log(
        `[DEBUG] drawCards complete - hand: ${newHand.length}, drawPile: ${newDrawPile.length}, discardPile: ${newDiscardPile.length}`,
      );

      return {
        ...state,
        hand: newHand,
        drawPile: newDrawPile,
        discardPile: newDiscardPile,
        selectedCard: null,
      };
    });
  },

  /**
   * Shuffles the discard pile back into the draw pile
   */
  shuffleDiscardIntoDraw: () => {
    set((state) => ({
      ...state,
      drawPile: [...state.drawPile, ...state.discardPile].sort(
        () => Math.random() - 0.5,
      ),
      discardPile: [],
      selectedCard: null,
    }));
  },

  /**
   * Purchases a card from the shop
   * @param index - Index of the card in the shop inventory
   */
  purchaseShopCard: (index: number) => {
    set((state) => {
      if (!state.currentShop || index >= state.currentShop.cards.length)
        return state;

      const shopCard = state.currentShop.cards[index];
      if (shopCard.purchased || state.player.gold < shopCard.cost) return state;

      const newShop = { ...state.currentShop };
      newShop.cards = [...newShop.cards];
      newShop.cards[index] = { ...shopCard, purchased: true };

      const purchasedCard = {
        ...shopCard.card,
        id: `${shopCard.card.baseId}_${Date.now()}`,
      };

      return {
        ...state,
        player: {
          ...state.player,
          gold: state.player.gold - shopCard.cost,
        },
        drawPile: [...state.drawPile, purchasedCard],
        persistentDeck: [...state.persistentDeck, purchasedCard],
        currentShop: newShop,
        selectedCard: null,
      };
    });
  },

  /**
   * Purchases a relic from the shop
   * @param index - Index of the relic in the shop inventory
   */
  purchaseShopRelic: (index: number) => {
    set((state) => {
      if (!state.currentShop || index >= state.currentShop.relics.length)
        return state;

      const shopRelic = state.currentShop.relics[index];
      if (shopRelic.purchased || state.player.gold < shopRelic.cost)
        return state;

      const newShop = { ...state.currentShop };
      newShop.relics = [...newShop.relics];
      newShop.relics[index] = { ...shopRelic, purchased: true };

      return {
        ...state,
        player: {
          ...state.player,
          gold: state.player.gold - shopRelic.cost,
          relics: [...state.player.relics, shopRelic.relic],
        },
        currentShop: newShop,
        selectedCard: null,
      };
    });
  },

  /**
   * Removes a card from the player's deck
   * @param cardId - Optional card ID to remove (if not specified, opens modal)
   */
  removeCardFromDeck: (cardId?: string) => {
    set((state) => {
      if (
        !state.currentShop ||
        state.player.gold < state.currentShop.removeCardCost
      )
        return state;

      if (!cardId) {
        // If no cardId provided, open the card removal modal
        return {
          ...state,
          showCardRemovalModal: true,
          selectedCard: null,
        };
      }

      // Remove the specific card
      const allCards = [...state.drawPile, ...state.discardPile];
      const cardToRemove = allCards.find((c) => c.id === cardId);

      if (!cardToRemove) return state;

      const newDrawPile = [...state.drawPile];
      const newDiscardPile = [...state.discardPile];
      const newPersistentDeck = state.persistentDeck.filter(
        (c) => c.id !== cardId,
      );

      // Remove the card from the appropriate pile
      const drawIndex = newDrawPile.findIndex((c) => c.id === cardId);
      if (drawIndex !== -1) {
        newDrawPile.splice(drawIndex, 1);
      } else {
        const discardIndex = newDiscardPile.findIndex((c) => c.id === cardId);
        if (discardIndex !== -1) {
          newDiscardPile.splice(discardIndex, 1);
        }
      }

      return {
        ...state,
        player: {
          ...state.player,
          gold: state.player.gold - state.currentShop.removeCardCost,
        },
        drawPile: newDrawPile,
        discardPile: newDiscardPile,
        persistentDeck: newPersistentDeck,
        currentShop: {
          ...state.currentShop,
          removeCardCost: state.currentShop.removeCardCost + 25,
        },
        selectedCard: null,
      };
    });
  },

  /**
   * Sets the currently selected card for targeting
   * @param card - Card to select, or null to deselect
   */
  setSelectedCard: (card: Card | null) => {
    set((state) => ({
      ...state,
      selectedCard: card,
    }));
  },

  /**
   * Opens the card removal modal
   */
  openCardRemovalModal: () => {
    set((state) => ({
      ...state,
      showCardRemovalModal: true,
      selectedCard: null,
    }));
  },

  /**
   * Closes the card removal modal
   */
  closeCardRemovalModal: () => {
    set((state) => ({
      ...state,
      showCardRemovalModal: false,
      selectedCard: null,
    }));
  },

  /**
   * Toggles debug mode on/off
   */
  toggleDebugMode: () => {
    set((state) => ({
      ...state,
      debugMode: !state.debugMode,
    }));
  },

  /**
   * Rests and heals the player
   */
  restAndHeal: () => {
    set((state) => ({
      ...state,
      gamePhase: GamePhase.MAP,
      player: {
        ...state.player,
        health: Math.min(state.player.maxHealth, state.player.health + 30),
      },
      selectedCard: null,
    }));
  },

  /**
   * Upgrades a card at the rest site
   * @param cardId - Optional card ID to upgrade (if not specified, opens modal)
   */
  upgradeCardAtRest: (cardId?: string) => {
    set((state) => {
      if (!cardId) {
        // If no cardId provided, open the card upgrade modal
        return {
          ...state,
          showCardUpgradeModal: true,
          selectedCard: null,
        };
      }

      // Upgrade the specific card
      const allCards = [...state.drawPile, ...state.discardPile];
      const cardToUpgrade = allCards.find((c) => c.id === cardId);

      if (!cardToUpgrade || cardToUpgrade.upgraded) return state;

      const newDrawPile = [...state.drawPile];
      const newDiscardPile = [...state.discardPile];

      // Find and upgrade the card in the appropriate pile
      const drawIndex = newDrawPile.findIndex((c) => c.id === cardId);
      if (drawIndex !== -1) {
        newDrawPile[drawIndex] = upgradeCard(cardToUpgrade);
      } else {
        const discardIndex = newDiscardPile.findIndex((c) => c.id === cardId);
        if (discardIndex !== -1) {
          newDiscardPile[discardIndex] = upgradeCard(cardToUpgrade);
        }
      }

      return {
        ...state,
        drawPile: newDrawPile,
        discardPile: newDiscardPile,
        persistentDeck: state.persistentDeck.map((c) =>
          c.id === cardId ? upgradeCard(cardToUpgrade) : c,
        ),
        showCardUpgradeModal: false,
        gamePhase: GamePhase.MAP,
        selectedCard: null,
      };
    });
  },

  /**
   * Opens the card upgrade modal
   */
  openCardUpgradeModal: () => {
    set((state) => ({
      ...state,
      showCardUpgradeModal: true,
      selectedCard: null,
    }));
  },

  /**
   * Closes the card upgrade modal
   */
  closeCardUpgradeModal: () => {
    set((state) => ({
      ...state,
      showCardUpgradeModal: false,
      selectedCard: null,
    }));
  },

  /**
   * Starts a new game from the title screen
   */
  startNewGame: () => {
    set((state) => ({
      ...createInitialGameState(),
      firstAttackThisCombat: true,
      selectedCard: null,
      showCardRemovalModal: false,
      showCardUpgradeModal: false,
      debugMode: state.debugMode,
      currentFloor: 1,
      hasSavedGame: false,
      gamePhase: GamePhase.MAP,
    }));
  },

  /**
   * Returns to the title screen
   */
  returnToTitle: () => {
    set((state) => ({
      ...state,
      gamePhase: GamePhase.TITLE,
      selectedCard: null,
    }));
  },

  /**
   * Loads a previously saved game
   */
  loadSavedGame: () => {
    // For now, just start a new game - in the future this could load from localStorage
    const state = get();
    if (state.hasSavedGame) {
      set((state) => ({
        ...state,
        gamePhase: GamePhase.MAP,
      }));
    }
  },

  /**
   * Selects a relic reward
   */
  selectRelicReward: () => {
    set((state) => {
      const relic = state.combatReward?.relicReward;
      if (!relic) return state;
      // Use persistentDeck as the source of truth for the deck
      const filteredPersistentDeck = state.persistentDeck.filter(
        (c) => !c.id.includes("_copy_"),
      );
      return {
        ...state,
        drawPile: filteredPersistentDeck,
        discardPile: [],
        exhaustPile: [],
        hand: [],
        player: {
          ...state.player,
          relics: [...state.player.relics, relic],
        },
        gamePhase: GamePhase.MAP,
        combatReward: undefined,
        currentTurn: TurnPhase.PLAYER_TURN,
        selectedCard: null,
      };
    });
  },

  /**
   * Skips the relic reward
   */
  skipRelicReward: () => {
    set((state) => {
      // Use persistentDeck as the source of truth for the deck
      const filteredPersistentDeck = state.persistentDeck.filter(
        (c) => !c.id.includes("_copy_"),
      );
      return {
        ...state,
        drawPile: filteredPersistentDeck,
        discardPile: [],
        exhaustPile: [],
        hand: [],
        gamePhase: GamePhase.MAP,
        combatReward: undefined,
        currentTurn: TurnPhase.PLAYER_TURN,
        selectedCard: null,
      };
    });
  },

  /**
   * Starts the player's turn (increments turn, resets energy/block, processes effects, draws hand)
   */
  startPlayerTurn: () => {
    console.log("[DEBUG] startPlayerTurn called");

    set((state) => {
      const nextPlayerTurnThisCombat = (state.playerTurnThisCombat || 0) + 1;
      console.log(
        `[DEBUG] Starting player turn ${nextPlayerTurnThisCombat} in combat`,
      );
      console.log(
        `[DEBUG] Player health: ${state.player.health}/${state.player.maxHealth}, Energy: ${state.player.energy}/${state.player.maxEnergy}, Block: ${state.player.block}`,
      );
      console.log(
        `[DEBUG] Enemies: ${state.enemies.length}, Hand: ${state.hand.length}, Draw pile: ${state.drawPile.length}`,
      );
      console.log(
        `[DEBUG] Player relics before reset:`,
        state.player.relics.map((r) => r.name),
      );

      let newPlayer = {
        ...state.player,
        energy: state.player.maxEnergy,
        block: 0,
      };
      let newEnemies = [...state.enemies];

      console.log(
        `[DEBUG] Reset energy to ${newPlayer.energy}, block to ${newPlayer.block}`,
      );
      console.log(
        `[DEBUG] Player relics after reset:`,
        newPlayer.relics.map((r) => r.name),
      );

      // Power card TURN_START effects
      console.log("[DEBUG] Processing power card TURN_START effects");
      const powerResult = processPowerCardEffects(
        PowerTrigger.TURN_START,
        newPlayer,
        newEnemies,
      );
      newPlayer = powerResult.player;
      newEnemies = powerResult.enemies;

      // Relic TURN_START effects (use computed nextPlayerTurnThisCombat)
      console.log(
        `[DEBUG] Processing relic TURN_START effects for turn ${nextPlayerTurnThisCombat}`,
      );
      console.log(
        `[DEBUG] Player has ${newPlayer.relics.length} relics:`,
        newPlayer.relics.map((r) => r.name),
      );

      const relicResult = processRelicEffects(
        RelicTrigger.TURN_START,
        newPlayer,
        newEnemies,
        { playerTurnThisCombat: nextPlayerTurnThisCombat },
      );
      newPlayer = relicResult.player;
      newEnemies = relicResult.enemies;

      console.log(
        `[DEBUG] After relic effects - Energy: ${newPlayer.energy}, Block: ${newPlayer.block}`,
      );
      console.log(
        `[DEBUG] Player relics after relic effects:`,
        newPlayer.relics.map((r) => r.name),
      );

      console.log(
        `[DEBUG] Final state - Hand: ${state.hand.length}, Draw pile: ${state.drawPile.length}, Energy: ${newPlayer.energy}, Block: ${newPlayer.block}`,
      );
      console.log(
        `[DEBUG] Final player relics:`,
        newPlayer.relics.map((r) => r.name),
      );

      return {
        ...state,
        player: newPlayer,
        enemies: newEnemies,
        currentTurn: TurnPhase.PLAYER_TURN,
        playerTurnThisCombat: nextPlayerTurnThisCombat,
        selectedCard: null,
      };
    });

    // Draw cards after state update (this will handle reshuffle if needed)
    get().drawCards(5);
  },

  /**
   * Processes before-attack effects for an enemy (poison damage, etc.)
   */
  processBeforeAttackEffects: (player: Player, enemy: Enemy): Player => {
    const newPlayer = { ...player };

    // Process poison damage on enemy (enemy takes damage, not player)
    const poisonEffect = enemy.statusEffects.find(
      (e) => e.type === StatusType.POISON,
    );
    if (poisonEffect && poisonEffect.stacks > 0) {
      // Apply poison damage to enemy (this is handled in processStatusEffects)
      // For now, just return the player unchanged
      // The actual poison damage will be processed in the main enemy turn loop
    }

    return newPlayer;
  },

  /**
   * Processes enemy attack with proper trigger resolution (LIFO stack)
   */
  processEnemyAttack: (
    card: MonsterCard,
    player: Player,
    enemy: Enemy,
  ): { player: Player; enemy: Enemy } => {
    let newPlayer = { ...player };
    let newEnemy = { ...enemy };

    // Process the monster card effects with proper trigger resolution
    const cardResult = processMonsterCardEffects(card, newPlayer, newEnemy);
    newPlayer = cardResult.player;
    newEnemy = cardResult.enemy;

    // Process damage taken relic effects if player took damage
    const initialHealth = player.health;
    const damageDealt = initialHealth - newPlayer.health;
    if (damageDealt > 0) {
      const context: { damage: number; shouldDrawCards?: number } = {
        damage: damageDealt,
      };
      const relicResult = processRelicEffects(
        RelicTrigger.DAMAGE_TAKEN,
        newPlayer,
        [newEnemy], // Pass as array for consistency
        context,
      );
      newPlayer = relicResult.player;
      newEnemy = relicResult.enemies[0] || newEnemy;

      // Handle Centennial Puzzle card drawing
      if (context.shouldDrawCards && context.shouldDrawCards > 0) {
        get().drawCards(context.shouldDrawCards!);
      }
    }

    // Ensure enemy health doesn't go below 0
    if (newEnemy.health < 0) {
      newEnemy.health = 0;
    }

    return { player: newPlayer, enemy: newEnemy };
  },

  /**
   * Processes after-attack effects for an enemy
   */
  processAfterAttackEffects: (player: Player, _enemy: Enemy): Player => {
    const newPlayer = { ...player };

    // Process any after-attack effects here
    // For now, this is a placeholder for future effects

    return newPlayer;
  },

  /**
   * Call this to resolve the current step and continue the enemy turn
   */
  resolveStep: () => {
    const resolver = get()._resolveStep;
    if (resolver) resolver();
  },
}));
