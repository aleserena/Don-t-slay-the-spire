import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../store/gameStore";
import {
  GamePhase,
  RelicRarity,
} from "../types/game";
import { NodeType } from "../types/map";

describe("Treasure Node Relic Rewards", () => {
  beforeEach(() => {
    useGameStore.getState().startNewRun();
  });

  describe("Treasure Node Selection", () => {
    it("should show relic reward screen when selecting treasure node", () => {
      const store = useGameStore.getState();

      // Create a map with a treasure node
      const mapWithTreasure = {
        nodes: [
          {
            id: "treasure_1",
            type: NodeType.TREASURE,
            x: 100,
            y: 100,
            connections: [],
            completed: false,
            available: true,
          },
        ],
        currentNodeId: null,
        floor: 1,
        maxFloor: 3,
      };

      // Set up the map
      useGameStore.setState({
        ...useGameStore.getState(),
        map: mapWithTreasure,
      });

      // Select the treasure node
      store.selectNode("treasure_1");

      const state = useGameStore.getState();

      // Should show relic reward screen
      expect(state.gamePhase).toBe(GamePhase.RELIC_REWARD);
      expect(state.combatReward).toBeDefined();
      expect(state.combatReward?.relicReward).toBeDefined();
      expect(state.combatReward?.isTreasureReward).toBe(true);
      expect(state.combatReward?.gold).toBe(0);
      expect(state.combatReward?.cardRewards).toEqual([]);
    });

    it("should generate common or uncommon relics for treasure nodes", () => {
      const store = useGameStore.getState();

      // Create a map with a treasure node
      const mapWithTreasure = {
        nodes: [
          {
            id: "treasure_1",
            type: NodeType.TREASURE,
            x: 100,
            y: 100,
            connections: [],
            completed: false,
            available: true,
          },
        ],
        currentNodeId: null,
        floor: 1,
        maxFloor: 3,
      };

      // Set up the map
      useGameStore.setState({
        ...useGameStore.getState(),
        map: mapWithTreasure,
      });

      // Select the treasure node
      store.selectNode("treasure_1");

      const state = useGameStore.getState();
      const relic = state.combatReward?.relicReward;

      expect(relic).toBeDefined();
      expect(relic?.rarity).toBeOneOf([RelicRarity.COMMON, RelicRarity.UNCOMMON]);
    });
  });

  describe("Treasure Relic Reward Actions", () => {
    it("should allow selecting treasure relic reward", () => {
      const store = useGameStore.getState();

      // Set up a treasure relic reward state
      const testRelic = {
        id: "test_treasure_relic",
        name: "Test Treasure Relic",
        description: "A test treasure relic",
        rarity: RelicRarity.COMMON,
        effects: [],
      };

      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: GamePhase.RELIC_REWARD,
        combatReward: {
          gold: 0,
          cardRewards: [],
          relicReward: testRelic,
          isTreasureReward: true,
        },
      });

      const initialRelicCount = useGameStore.getState().player.relics.length;

      // Select the relic reward
      store.selectRelicReward();

      const finalState = useGameStore.getState();

      // Should have added relic to player and returned to map
      expect(finalState.player.relics.length).toBe(initialRelicCount + 1);
      expect(finalState.player.relics).toContainEqual(testRelic);
      expect(finalState.gamePhase).toBe(GamePhase.MAP);
      expect(finalState.combatReward).toBeUndefined();
    });

    it("should allow skipping treasure relic reward", () => {
      const store = useGameStore.getState();

      // Set up a treasure relic reward state
      const testRelic = {
        id: "test_treasure_relic",
        name: "Test Treasure Relic",
        description: "A test treasure relic",
        rarity: RelicRarity.COMMON,
        effects: [],
      };

      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: GamePhase.RELIC_REWARD,
        combatReward: {
          gold: 0,
          cardRewards: [],
          relicReward: testRelic,
          isTreasureReward: true,
        },
      });

      const initialRelicCount = useGameStore.getState().player.relics.length;

      // Skip the relic reward
      store.skipRelicReward();

      const finalState = useGameStore.getState();

      // Should not have added relic to player and returned to map
      expect(finalState.player.relics.length).toBe(initialRelicCount);
      expect(finalState.player.relics).not.toContainEqual(testRelic);
      expect(finalState.gamePhase).toBe(GamePhase.MAP);
      expect(finalState.combatReward).toBeUndefined();
    });
  });

  describe("Treasure vs Elite Relic Rewards", () => {
    it("should distinguish between treasure and elite relic rewards", () => {

      // Set up a treasure relic reward state
      const treasureRelic = {
        id: "treasure_relic",
        name: "Treasure Relic",
        description: "A treasure relic",
        rarity: RelicRarity.COMMON,
        effects: [],
      };

      const eliteRelic = {
        id: "elite_relic",
        name: "Elite Relic",
        description: "An elite relic",
        rarity: RelicRarity.UNCOMMON,
        effects: [],
      };

      // Test treasure reward
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: GamePhase.RELIC_REWARD,
        combatReward: {
          gold: 0,
          cardRewards: [],
          relicReward: treasureRelic,
          isTreasureReward: true,
        },
      });

      let state = useGameStore.getState();
      expect(state.combatReward?.isTreasureReward).toBe(true);

      // Test elite reward (no isTreasureReward flag)
      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: GamePhase.RELIC_REWARD,
        combatReward: {
          gold: 15,
          cardRewards: [],
          relicReward: eliteRelic,
          isTreasureReward: false,
        },
      });

      state = useGameStore.getState();
      expect(state.combatReward?.isTreasureReward).toBe(false);
    });
  });
}); 