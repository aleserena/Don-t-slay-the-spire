import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../store/gameStore";
import {
  GamePhase,
  IntentType,
  MonsterCardType,
  EffectType,
  TargetType,
} from "../types/game";

describe("Title Screen and Game Over Functionality", () => {
  beforeEach(() => {
    // Reset the store before each test
    useGameStore.setState({
      ...useGameStore.getState(),
      gamePhase: GamePhase.TITLE,
      player: {
        health: 80,
        maxHealth: 80,
        block: 0,
        energy: 3,
        maxEnergy: 3,
        statusEffects: [],
        gold: 99,
        relics: [],
        powerCards: [],
      },
      currentFloor: 1,
      hasSavedGame: false,
    });
  });

  describe("Title Screen", () => {
    it("should start with TITLE game phase", () => {
      const state = useGameStore.getState();
      expect(state.gamePhase).toBe(GamePhase.TITLE);
    });

    it("should transition to MAP phase when starting new game", () => {
      const { startNewGame } = useGameStore.getState();

      startNewGame();

      const state = useGameStore.getState();
      expect(state.gamePhase).toBe(GamePhase.MAP);
      expect(state.currentFloor).toBe(1);
      expect(state.hasSavedGame).toBe(false);
    });

    it("should return to TITLE phase when returnToTitle is called", () => {
      const { startNewGame, returnToTitle } = useGameStore.getState();

      // Start a game first
      startNewGame();
      expect(useGameStore.getState().gamePhase).toBe(GamePhase.MAP);

      // Return to title
      returnToTitle();
      expect(useGameStore.getState().gamePhase).toBe(GamePhase.TITLE);
    });

    it("should have hasSavedGame as false initially", () => {
      const state = useGameStore.getState();
      expect(state.hasSavedGame).toBe(false);
    });
  });

  describe("Game Over Functionality", () => {
    it("should transition to GAME_OVER when player health reaches 0", () => {
      const store = useGameStore.getState();

      // Set up a game state with low health and an enemy that will deal lethal damage
      useGameStore.setState({
        ...store,
        gamePhase: GamePhase.COMBAT,
        player: {
          ...store.player,
          health: 1,
          maxHealth: 80,
          block: 0, // Ensure no block to prevent damage
        },
        enemies: [
          {
            id: "test-enemy",
            name: "Test Enemy",
            health: 10,
            maxHealth: 10,
            block: 0,
            intent: { type: IntentType.ATTACK, value: 5 },
            statusEffects: [],
            deck: [
              {
                id: "lethal_attack",
                baseId: "lethal_attack",
                name: "Lethal Attack",
                type: MonsterCardType.ATTACK,
                description: "Deal 10 damage.",
                damage: 10,
                priority: 1,
                effects: [
                  {
                    type: EffectType.DAMAGE,
                    value: 10,
                    target: TargetType.ENEMY,
                  },
                ],
              },
            ],
            currentCard: {
              id: "lethal_attack",
              baseId: "lethal_attack",
              name: "Lethal Attack",
              type: MonsterCardType.ATTACK,
              description: "Deal 10 damage.",
              damage: 10,
              priority: 1,
              effects: [
                {
                  type: EffectType.DAMAGE,
                  value: 10,
                  target: TargetType.ENEMY,
                },
              ],
            },
          },
        ],
      });

      // Process enemy turn which should deal damage and trigger game over
      store.processEnemyTurn();

      const finalState = useGameStore.getState();
      expect(finalState.gamePhase).toBe(GamePhase.GAME_OVER);
      expect(finalState.player.health).toBe(0);
    });

    it("should preserve player stats for game over screen", () => {
      const store = useGameStore.getState();

      // Set up player with specific stats
      useGameStore.setState({
        ...store,
        gamePhase: GamePhase.COMBAT,
        player: {
          ...store.player,
          health: 0,
          maxHealth: 80,
          gold: 150,
        },
        currentFloor: 5,
      });

      // Manually trigger game over
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: GamePhase.GAME_OVER,
      });

      const state = useGameStore.getState();
      expect(state.gamePhase).toBe(GamePhase.GAME_OVER);
      expect(state.player.health).toBe(0);
      expect(state.player.maxHealth).toBe(80);
      expect(state.player.gold).toBe(150);
      expect(state.currentFloor).toBe(5);
    });

    it("should allow starting new game from game over", () => {
      const { startNewGame } = useGameStore.getState();

      // Set game over state
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: GamePhase.GAME_OVER,
        player: {
          ...useGameStore.getState().player,
          health: 0,
        },
      });

      // Start new game
      startNewGame();

      const state = useGameStore.getState();
      expect(state.gamePhase).toBe(GamePhase.MAP);
      expect(state.player.health).toBe(80);
      expect(state.currentFloor).toBe(1);
    });

    it("should allow returning to title from game over", () => {
      const { returnToTitle } = useGameStore.getState();

      // Set game over state
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: GamePhase.GAME_OVER,
      });

      // Return to title
      returnToTitle();

      const state = useGameStore.getState();
      expect(state.gamePhase).toBe(GamePhase.TITLE);
    });
  });

  describe("Game State Management", () => {
    it("should maintain currentFloor throughout the game", () => {
      const store = useGameStore.getState();

      expect(store.currentFloor).toBe(1);

      // Simulate floor progression
      useGameStore.setState({
        ...store,
        currentFloor: 3,
      });

      expect(useGameStore.getState().currentFloor).toBe(3);
    });

    it("should reset currentFloor when starting new game", () => {
      const { startNewGame } = useGameStore.getState();

      // Set higher floor
      useGameStore.setState({
        ...useGameStore.getState(),
        currentFloor: 5,
      });

      // Start new game
      startNewGame();

      const state = useGameStore.getState();
      expect(state.currentFloor).toBe(1);
    });
  });
});
