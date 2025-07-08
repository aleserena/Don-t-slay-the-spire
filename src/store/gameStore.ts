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
} from "../types/game";
import { createInitialDeck, getAllCards } from "../data/cards";
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
  endTurn: () => void;

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
  processEnemyTurn: () => void;

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
            player: {
              ...state.player,
              energy: state.player.maxEnergy,
              block: 0,
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
            player: {
              ...state.player,
              energy: state.player.maxEnergy,
              block: 0,
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
            player: {
              ...state.player,
              energy: state.player.maxEnergy,
              block: 0,
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
          // Give player a random relic
          const treasureRelic = getAllRelics().filter(
            (r: Relic) => r.rarity === "common" || r.rarity === "uncommon",
          )[
            Math.floor(
              Math.random() *
                getAllRelics().filter(
                  (r: Relic) =>
                    r.rarity === "common" || r.rarity === "uncommon",
                ).length,
            )
          ];

          return {
            ...state,
            gamePhase: GamePhase.MAP,
            map: updatedMap,
            player: {
              ...state.player,
              relics: [...state.player.relics, treasureRelic],
            },
          };
        }

        case "shop": {
          const shopCards = getAllCards()
            .filter(() => Math.random() < 0.3)
            .slice(0, 5)
            .map((card) => ({
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

      if (hasRelicReward) {
        // Go to relic reward screen, keep the relic in combatReward
        return {
          ...state,
          drawPile: [
            ...state.drawPile,
            { ...card, id: `${card.baseId}_${Date.now()}` },
          ],
          gamePhase: GamePhase.RELIC_REWARD,
          combatReward: {
            ...state.combatReward!,
            cardRewards: [], // Clear card rewards since one was selected
          },
          selectedCard: null,
        };
      } else {
        // No relic reward, go back to map
        const allCards = [
          ...state.drawPile,
          ...state.discardPile,
          ...state.exhaustPile,
          ...state.hand,
        ].filter((c) => !c.id.includes("_copy_")); // Remove cards created during combat

        return {
          ...state,
          drawPile: [
            ...allCards,
            { ...card, id: `${card.baseId}_${Date.now()}` },
          ],
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

      if (hasRelicReward) {
        // Go to relic reward screen
        return {
          ...state,
          gamePhase: GamePhase.RELIC_REWARD,
          combatReward: {
            ...state.combatReward!,
            cardRewards: [], // Clear card rewards since they were skipped
          },
          selectedCard: null,
        };
      } else {
        // No relic reward, go back to map
        const allCards = [
          ...state.drawPile,
          ...state.discardPile,
          ...state.exhaustPile,
          ...state.hand,
        ].filter((c) => !c.id.includes("_copy_")); // Remove cards created during combat

        return {
          ...state,
          drawPile: allCards,
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
        newState = processEventConsequence(consequence, newState);
      });

      return {
        ...newState,
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
      // Combine ALL cards back into the draw pile, but filter out cards created during combat
      const allCards = [
        ...state.drawPile,
        ...state.discardPile,
        ...state.exhaustPile,
        ...state.hand,
      ].filter((c) => !c.id.includes("_copy_")); // Remove cards created during combat

      return {
        ...state,
        gamePhase: GamePhase.MAP,
        currentEvent: undefined,
        currentShop: undefined,
        combatReward: undefined,
        drawPile: allCards,
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
    const state = get();
    const card = state.hand.find((c) => c.id === cardId);

    if (!card || state.currentTurn !== TurnPhase.PLAYER_TURN) return;

    // Calculate energy cost
    let energyCost = typeof card.cost === "number" ? card.cost : 0;

    // For X-cost cards like whirlwind, consume ALL energy
    if (card.cost === "X") {
      energyCost = state.player.energy; // Consume all available energy
    }

    // Check if player has enough energy (X-cost cards can be played with 0 energy)
    if (card.cost !== "X" && state.player.energy < energyCost) return;

    set((state) => {
      const newHand = state.hand.filter((c) => c.id !== cardId);

      // All cards (including power cards) are discarded normally
      const newDiscardPile = [...state.discardPile, card];

      // Store original energy for X-cost cards before any effects are applied
      const originalEnergy = state.player.energy;

      // Calculate whirlwind hits BEFORE consuming energy
      let whirlwindHits = 1;
      if (card.baseId === "whirlwind") {
        whirlwindHits = originalEnergy; // Number of hits equals original energy
      }

      // Consume energy (for X-cost cards, this will be ALL energy)
      let newPlayer = {
        ...state.player,
        energy: state.player.energy - energyCost,
      };
      let newEnemies = [...state.enemies];

      // Check if this is an attack card for Akabeko effect
      const isAttackCard = card.type === "attack";
      const isFirstAttack = state.firstAttackThisCombat && isAttackCard;

      // Apply card effects using the modular system
      if (card.effects) {
        for (const effect of card.effects) {
          switch (effect.type) {
            case EffectType.DAMAGE:
              if (effect.target === TargetType.ALL_ENEMIES) {
                newEnemies = newEnemies.map((enemy) => {
                  const finalDamage = calculateDamage(
                    effect.value,
                    newPlayer,
                    enemy,
                    isFirstAttack,
                  );
                  const damageAfterBlock = Math.max(
                    0,
                    finalDamage - enemy.block,
                  );

                  return {
                    ...enemy,
                    health: enemy.health - damageAfterBlock,
                    block: Math.max(0, enemy.block - finalDamage),
                  };
                });
              } else if (effect.target === TargetType.ENEMY && targetId) {
                const enemyIndex = newEnemies.findIndex(
                  (e) => e.id === targetId,
                );
                if (enemyIndex !== -1) {
                  const finalDamage = calculateDamage(
                    effect.value,
                    newPlayer,
                    newEnemies[enemyIndex],
                    isFirstAttack,
                  );
                  const damageAfterBlock = Math.max(
                    0,
                    finalDamage - newEnemies[enemyIndex].block,
                  );

                  newEnemies[enemyIndex] = {
                    ...newEnemies[enemyIndex],
                    health: newEnemies[enemyIndex].health - damageAfterBlock,
                    block: Math.max(
                      0,
                      newEnemies[enemyIndex].block - finalDamage,
                    ),
                  };
                }
              }
              break;

            case EffectType.DAMAGE_MULTIPLIER_BLOCK:
              if (effect.target === TargetType.ENEMY && targetId) {
                const enemyIndex = newEnemies.findIndex(
                  (e) => e.id === targetId,
                );
                if (enemyIndex !== -1) {
                  const blockDamage =
                    newPlayer.block * (effect.multiplier || 1);
                  const finalDamage = calculateDamage(
                    blockDamage,
                    newPlayer,
                    newEnemies[enemyIndex],
                    isFirstAttack,
                  );
                  const damageAfterBlock = Math.max(
                    0,
                    finalDamage - newEnemies[enemyIndex].block,
                  );

                  newEnemies[enemyIndex] = {
                    ...newEnemies[enemyIndex],
                    health: newEnemies[enemyIndex].health - damageAfterBlock,
                    block: Math.max(
                      0,
                      newEnemies[enemyIndex].block - finalDamage,
                    ),
                  };
                }
              }
              break;

            case EffectType.DAMAGE_MULTIPLIER_ENERGY:
              if (effect.target === TargetType.ALL_ENEMIES) {
                // Apply damage X times where X = energy spent (use original energy before consumption)
                // Only deal damage if energy was actually spent
                if (whirlwindHits > 0) {
                  const damageResults: {
                    target: Enemy;
                    damageDealt: number;
                  }[] = [];

                  for (let i = 0; i < whirlwindHits; i++) {
                    newEnemies = newEnemies.map((enemy) => {
                      const finalDamage = calculateDamage(
                        effect.value,
                        state.player,
                        enemy,
                        isFirstAttack && i === 0,
                      );
                      const damageAfterBlock = Math.max(
                        0,
                        finalDamage - enemy.block,
                      );

                      // Track damage for debugging
                      const existingResult = damageResults.find(
                        (r) => r.target.id === enemy.id,
                      );
                      if (existingResult) {
                        existingResult.damageDealt += damageAfterBlock;
                      } else {
                        damageResults.push({
                          target: enemy,
                          damageDealt: damageAfterBlock,
                        });
                      }

                      return {
                        ...enemy,
                        health: enemy.health - damageAfterBlock,
                        block: Math.max(0, enemy.block - finalDamage),
                      };
                    });
                  }
                }
              }
              break;

            case EffectType.BLOCK:
              if (effect.target === TargetType.SELF) {
                const finalBlock = calculateBlock(effect.value, newPlayer);
                newPlayer.block += finalBlock;
              }
              break;

            case EffectType.APPLY_STATUS:
              if (effect.statusType) {
                if (effect.target === TargetType.SELF) {
                  newPlayer = applyStatusEffect(
                    newPlayer,
                    effect.statusType,
                    effect.value,
                  ) as Player;
                } else if (effect.target === TargetType.ENEMY && targetId) {
                  const enemyIndex = newEnemies.findIndex(
                    (e) => e.id === targetId,
                  );
                  if (enemyIndex !== -1) {
                    newEnemies[enemyIndex] = applyStatusEffect(
                      newEnemies[enemyIndex],
                      effect.statusType,
                      effect.value,
                    ) as Enemy;
                  }
                } else if (effect.target === TargetType.ALL_ENEMIES) {
                  newEnemies = newEnemies.map(
                    (enemy) =>
                      applyStatusEffect(
                        enemy,
                        effect.statusType!,
                        effect.value,
                      ) as Enemy,
                  );
                }
              }
              break;

            case EffectType.DRAW_CARDS:
              if (effect.target === TargetType.SELF) {
                setTimeout(() => get().drawCards(effect.value), 0);
              }
              break;

            case EffectType.HEAL:
              if (effect.target === TargetType.SELF) {
                newPlayer.health = Math.min(
                  newPlayer.maxHealth,
                  newPlayer.health + effect.value,
                );
              }
              break;

            case EffectType.GAIN_ENERGY:
              if (effect.target === TargetType.SELF) {
                newPlayer.energy = Math.min(
                  newPlayer.maxEnergy + 3,
                  newPlayer.energy + effect.value,
                );
              }
              break;

            case EffectType.LOSE_ENERGY:
              if (effect.target === TargetType.SELF) {
                newPlayer.energy = Math.max(0, newPlayer.energy - effect.value);
              }
              break;

            case EffectType.ADD_CARD_TO_DISCARD:
              if (effect.target === TargetType.SELF) {
                // Add a copy of the current card to the discard pile
                const cardCopy = {
                  ...card,
                  id: `${card.baseId}_copy_${Date.now()}`,
                };
                newDiscardPile.push(cardCopy);
              }
              break;

            case EffectType.UPGRADE_CARD:
              if (effect.target === TargetType.SELF) {
                // Upgrade a random card in hand (in a real implementation, player would choose)
                const upgradableCards = newHand.filter((c) => !c.upgraded);
                if (upgradableCards.length > 0) {
                  const randomIndex = Math.floor(
                    Math.random() * upgradableCards.length,
                  );
                  const cardToUpgrade = upgradableCards[randomIndex];
                  const handIndex = newHand.findIndex(
                    (c) => c.id === cardToUpgrade.id,
                  );

                  if (handIndex !== -1) {
                    newHand[handIndex] = upgradeCard(cardToUpgrade);
                  }
                }
              }
              break;
          }
        }
      }

      // Legacy support: Handle cards with direct damage property (only if no damage effects)
      if (
        card.damage &&
        card.damage > 0 &&
        (!card.effects ||
          !card.effects.some(
            (effect) =>
              effect.type === EffectType.DAMAGE ||
              effect.type === EffectType.DAMAGE_MULTIPLIER_BLOCK ||
              effect.type === EffectType.DAMAGE_MULTIPLIER_ENERGY,
          ))
      ) {
        if (targetId) {
          const enemyIndex = newEnemies.findIndex((e) => e.id === targetId);
          if (enemyIndex !== -1) {
            const finalDamage = calculateDamage(
              card.damage,
              newPlayer,
              newEnemies[enemyIndex],
              isFirstAttack,
            );
            const damageAfterBlock = Math.max(
              0,
              finalDamage - newEnemies[enemyIndex].block,
            );

            newEnemies[enemyIndex] = {
              ...newEnemies[enemyIndex],
              health: newEnemies[enemyIndex].health - damageAfterBlock,
              block: Math.max(0, newEnemies[enemyIndex].block - finalDamage),
            };
          }
        }
      }

      // Legacy support: Handle cards with direct block property (only if no block effects)
      if (
        card.block &&
        card.block > 0 &&
        (!card.effects ||
          !card.effects.some((effect) => effect.type === EffectType.BLOCK))
      ) {
        const finalBlock = calculateBlock(card.block, newPlayer);
        newPlayer.block += finalBlock;
      }

      // Handle power cards
      if (card.type === CardType.POWER) {
        const powerCardDef = getPowerCardDefinition(card.baseId);
        if (powerCardDef) {
          // Always add the power card (allow multiple copies)
          newPlayer.powerCards = [...newPlayer.powerCards, powerCardDef];

          // Only apply immediate power card effects if the card doesn't have its own effects
          // This prevents double application for cards like Inflame
          if (!card.effects || card.effects.length === 0) {
            const powerResult = processPowerCardEffects(
              PowerTrigger.COMBAT_START,
              newPlayer,
              newEnemies,
            );
            newPlayer = powerResult.player;
            newEnemies = powerResult.enemies;
          }
        }
      }

      // Remove dead enemies
      newEnemies = newEnemies.filter((e) => e.health > 0);

      // Check for combat end
      if (newEnemies.length === 0) {
        const rewardGold = 10 + Math.floor(Math.random() * 20);
        const rewardCards = getAllCards()
          .filter(() => Math.random() < 0.4)
          .slice(0, 3);

        // Check if any defeated enemy was an elite
        const hadEliteEnemy = state.enemies.some((enemy) => enemy.isElite);
        let relicReward = undefined;

        if (hadEliteEnemy) {
          // Get a random relic for elite reward
          const availableRelics = getAllRelics().filter(
            (r: Relic) =>
              r.rarity === "common" ||
              r.rarity === "uncommon" ||
              r.rarity === "rare",
          );
          if (availableRelics.length > 0) {
            relicReward =
              availableRelics[
                Math.floor(Math.random() * availableRelics.length)
              ];
          }
        }

        // Clear temporary status effects and power cards at end of combat
        const clearedPlayer = {
          ...newPlayer,
          gold: newPlayer.gold + rewardGold,
          statusEffects: newPlayer.statusEffects.filter(
            (effect) =>
              effect.type !== StatusType.WEAK &&
              effect.type !== StatusType.VULNERABLE &&
              effect.type !== StatusType.STRENGTH,
          ),
          powerCards: [], // Clear all power cards after combat
        };

        return {
          ...state,
          hand: newHand,
          discardPile: newDiscardPile,
          player: clearedPlayer,
          enemies: newEnemies,
          currentTurn: TurnPhase.COMBAT_END,
          gamePhase: GamePhase.CARD_REWARD,
          combatReward: {
            gold: rewardGold,
            cardRewards: rewardCards,
            relicReward: relicReward,
          },
          selectedCard: null,
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
  },

  /**
   * Processes the enemy turn (AI actions, damage calculation)
   */
  processEnemyTurn: () => {
    set((state) => {
      let newPlayer = { ...state.player };
      let newEnemies = [...state.enemies];

      // Process status effects on enemies
      newEnemies = newEnemies.map(
        (enemy) => processStatusEffects(enemy) as Enemy,
      );

      // Remove dead enemies (health <= 0)
      newEnemies = newEnemies.filter((enemy) => enemy.health > 0);

      // Process status effects on player
      newPlayer = processStatusEffects(newPlayer) as Player;

      // Reset enemy block at start of their turn
      newEnemies = newEnemies.map((enemy) => ({
        ...enemy,
        block: 0,
      }));

      // Reset player block at start of player turn
      newPlayer = {
        ...newPlayer,
        energy: newPlayer.maxEnergy,
        block: 0,
      };

      // Process power card turn start effects (like Demon Form)
      const powerResult = processPowerCardEffects(
        PowerTrigger.TURN_START,
        newPlayer,
        newEnemies,
      );
      newPlayer = powerResult.player;
      newEnemies = powerResult.enemies;

      // Process relic turn start effects (like Energy Core)
      const relicResult = processRelicEffects(
        RelicTrigger.TURN_START,
        newPlayer,
        newEnemies,
      );
      newPlayer = relicResult.player;
      newEnemies = relicResult.enemies;

      // Each enemy plays their current card
      for (let i = 0; i < newEnemies.length; i++) {
        const enemy = newEnemies[i];

        if (enemy.currentCard) {
          // Process the monster card effects
          const cardResult = processMonsterCardEffects(
            enemy.currentCard,
            newPlayer,
            enemy,
          );
          newPlayer = cardResult.player;
          newEnemies[i] = cardResult.enemy;

          // Check for game over after each enemy action
          if (newPlayer.health <= 0) {
            return {
              ...state,
              player: { ...newPlayer, health: 0 },
              gamePhase: GamePhase.GAME_OVER,
              selectedCard: null,
            };
          }

          // Process damage taken relic effects if player took damage
          const initialHealth = state.player.health;
          const damageDealt = initialHealth - newPlayer.health;
          if (damageDealt > 0) {
            const context: { damage: number; shouldDrawCards?: number } = {
              damage: damageDealt,
            };
            const relicResult = processRelicEffects(
              RelicTrigger.DAMAGE_TAKEN,
              newPlayer,
              newEnemies,
              context,
            );
            newPlayer = relicResult.player;
            newEnemies = relicResult.enemies;

            // Remove dead enemies after relic effects (e.g., Bronze Scales)
            newEnemies = newEnemies.filter((enemy) => enemy.health > 0);

            // Handle Centennial Puzzle card drawing
            if (context.shouldDrawCards && context.shouldDrawCards > 0) {
              setTimeout(() => get().drawCards(context.shouldDrawCards!), 100);
            }
          }
        }

        // Select new card for next turn if enemy is still alive
        if (newEnemies[i] && newEnemies[i].health > 0) {
          const newCard = selectEnemyCard(
            newEnemies[i].deck,
            newEnemies[i].health,
            newEnemies[i].maxHealth,
          );

          // Convert card type to intent type for UI display
          const convertCardTypeToIntentType = (
            cardType: MonsterCardType,
          ): IntentType => {
            switch (cardType) {
              case MonsterCardType.ATTACK:
                return IntentType.ATTACK;
              case MonsterCardType.DEFEND:
                return IntentType.DEFEND;
              case MonsterCardType.BUFF:
                return IntentType.BUFF;
              case MonsterCardType.DEBUFF:
                return IntentType.DEBUFF;
              case MonsterCardType.SPECIAL:
                return IntentType.UNKNOWN;
              default:
                return IntentType.UNKNOWN;
            }
          };

          newEnemies[i] = {
            ...newEnemies[i],
            currentCard: newCard,
            intent: {
              type: convertCardTypeToIntentType(newCard.type),
              value: newCard.damage || newCard.block,
              card: newCard,
            },
          };
        }
      }

      // Check if combat should end (all enemies dead)
      const combatEnded = newEnemies.length === 0;

      return {
        ...state,
        player: newPlayer,
        enemies: newEnemies,
        currentTurn: combatEnded ? TurnPhase.COMBAT_END : TurnPhase.PLAYER_TURN,
        selectedCard: null,
      };
    });

    // Draw new hand for player turn
    get().drawCards(5);
  },

  /**
   * Ends the current player turn and starts enemy turn
   */
  endTurn: () => {
    const state = get();

    if (state.currentTurn === TurnPhase.PLAYER_TURN) {
      set((currentState) => {
        let newPlayer = { ...currentState.player };
        let newEnemies = [...currentState.enemies];

        // Process power card turn end effects (like Metallicize)
        const powerResult = processPowerCardEffects(
          PowerTrigger.TURN_END,
          newPlayer,
          newEnemies,
        );
        newPlayer = powerResult.player;
        newEnemies = powerResult.enemies;

        // Discard remaining hand
        const newDiscardPile = [
          ...currentState.discardPile,
          ...currentState.hand,
        ];

        return {
          ...currentState,
          hand: [],
          discardPile: newDiscardPile,
          currentTurn: TurnPhase.ENEMY_TURN,
          player: newPlayer,
          enemies: newEnemies,
          selectedCard: null,
          // Block is NOT reset here - it resets at start of next player turn
        };
      });

      // Process enemy turn
      setTimeout(() => {
        get().processEnemyTurn();
      }, 1000); // Add delay for better UX
    }
  },

  /**
   * Starts a new combat encounter
   */
  startCombat: () => {
    // Preserve current player state and deck, but reset combat-specific state
    set((state) => ({
      ...state,
      enemies: [],
      hand: [],
      // Keep the current deck composition (drawPile + discardPile + exhaustPile)
      drawPile: [...state.drawPile, ...state.discardPile, ...state.exhaustPile],
      discardPile: [],
      exhaustPile: [],
      currentTurn: TurnPhase.PLAYER_TURN,
      gamePhase: GamePhase.COMBAT,
      combatReward: undefined,
      // Reset player's combat state but keep progression
      player: {
        ...state.player,
        block: 0,
        energy: state.player.maxEnergy,
      },
    }));

    get().drawCards(5);
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

      for (let i = 0; i < count; i++) {
        if (newDrawPile.length === 0 && newDiscardPile.length > 0) {
          // Shuffle discard pile into draw pile
          newDrawPile = [...newDiscardPile].sort(() => Math.random() - 0.5);
          newDiscardPile = [];
        }

        if (newDrawPile.length > 0) {
          const drawnCard = newDrawPile.pop()!;
          newHand.push(drawnCard);
        }
      }

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

      return {
        ...state,
        player: {
          ...state.player,
          gold: state.player.gold - shopCard.cost,
        },
        drawPile: [
          ...state.drawPile,
          { ...shopCard.card, id: `${shopCard.card.baseId}_${Date.now()}` },
        ],
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
        showCardRemovalModal: false,
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

      // Combine ALL cards back into the draw pile, but filter out cards created during combat
      const allCards = [
        ...state.drawPile,
        ...state.discardPile,
        ...state.exhaustPile,
        ...state.hand,
      ].filter((c) => !c.id.includes("_copy_")); // Remove cards created during combat

      return {
        ...state,
        drawPile: allCards,
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
      // Combine ALL cards back into the draw pile, but filter out cards created during combat
      const allCards = [
        ...state.drawPile,
        ...state.discardPile,
        ...state.exhaustPile,
        ...state.hand,
      ].filter((c) => !c.id.includes("_copy_")); // Remove cards created during combat

      return {
        ...state,
        drawPile: allCards,
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
}));
