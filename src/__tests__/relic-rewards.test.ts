import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../store/gameStore";
import {
  GamePhase,
  IntentType,
  CardType,
  CardRarity,
  RelicRarity,
} from "../types/game";

describe("Relic Rewards System", () => {
  beforeEach(() => {
    useGameStore.getState().startNewRun();
  });

  describe("Elite Enemy Relic Rewards", () => {
    it("should provide relic reward when defeating elite enemies", () => {
      const store = useGameStore.getState();

      // Set up combat with elite enemy
      store.startCombat();
      const initialState = useGameStore.getState();

      // Manually set up an elite enemy
      useGameStore.setState({
        ...initialState,
        gamePhase: GamePhase.COMBAT,
        enemies: [
          {
            id: "elite_test",
            name: "Elite Test Enemy",
            health: 1,
            maxHealth: 50,
            block: 0,
            intent: { type: IntentType.ATTACK, value: 10 },
            statusEffects: [],
            isElite: true,
            deck: [],
            currentCard: undefined,
          },
        ],
      });

      // Play a card that should kill the elite enemy
      const testCard = {
        id: "test_strike",
        baseId: "strike",
        name: "Strike",
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: "Deal 6 damage.",
        damage: 10,
        upgraded: false,
      };

      // Add card to hand
      useGameStore.setState({
        ...useGameStore.getState(),
        hand: [testCard],
      });

      // Play the card to kill the elite
      store.playCard("test_strike", "elite_test");

      const finalState = useGameStore.getState();

      // Should have combat reward with relic
      expect(finalState.combatReward).toBeDefined();
      expect(finalState.combatReward?.relicReward).toBeDefined();
      expect(finalState.gamePhase).toBe(GamePhase.CARD_REWARD);
    });

    it("should not provide relic reward for non-elite enemies", () => {
      const store = useGameStore.getState();

      // Set up combat with regular enemy
      store.startCombat();
      const initialState = useGameStore.getState();

      // Manually set up a regular enemy
      useGameStore.setState({
        ...initialState,
        gamePhase: GamePhase.COMBAT,
        enemies: [
          {
            id: "regular_test",
            name: "Regular Test Enemy",
            health: 1,
            maxHealth: 50,
            block: 0,
            intent: { type: IntentType.ATTACK, value: 10 },
            statusEffects: [],
            isElite: false,
            deck: [],
            currentCard: undefined,
          },
        ],
      });

      // Play a card that should kill the regular enemy
      const testCard = {
        id: "test_strike",
        baseId: "strike",
        name: "Strike",
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: "Deal 6 damage.",
        damage: 10,
        upgraded: false,
      };

      // Add card to hand
      useGameStore.setState({
        ...useGameStore.getState(),
        hand: [testCard],
      });

      // Play the card to kill the regular enemy
      store.playCard("test_strike", "regular_test");

      const finalState = useGameStore.getState();

      // Should have combat reward but no relic
      expect(finalState.combatReward).toBeDefined();
      expect(finalState.combatReward?.relicReward).toBeUndefined();
      expect(finalState.gamePhase).toBe(GamePhase.CARD_REWARD);
    });
  });

  describe("Relic Reward Actions", () => {
    it("should allow selecting relic reward", () => {
      const store = useGameStore.getState();

      // Set up a relic reward state
      const testRelic = {
        id: "test_relic",
        name: "Test Relic",
        description: "A test relic",
        rarity: RelicRarity.COMMON,
        effects: [],
      };

      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: GamePhase.RELIC_REWARD,
        combatReward: {
          gold: 15,
          cardRewards: [],
          relicReward: testRelic,
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

    it("should allow skipping relic reward", () => {
      const store = useGameStore.getState();

      // Set up a relic reward state
      const testRelic = {
        id: "test_relic",
        name: "Test Relic",
        description: "A test relic",
        rarity: RelicRarity.COMMON,
        effects: [],
      };

      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: GamePhase.RELIC_REWARD,
        combatReward: {
          gold: 15,
          cardRewards: [],
          relicReward: testRelic,
        },
      });

      const initialRelicCount = useGameStore.getState().player.relics.length;

      // Skip the relic reward
      store.skipRelicReward();

      const finalState = useGameStore.getState();

      // Should not have added relic and returned to map
      expect(finalState.player.relics.length).toBe(initialRelicCount);
      expect(finalState.gamePhase).toBe(GamePhase.MAP);
      expect(finalState.combatReward).toBeUndefined();
    });
  });

  describe("Card to Relic Reward Flow", () => {
    it("should transition from card reward to relic reward when elite defeated", () => {
      const store = useGameStore.getState();

      // Set up card and relic reward state
      const testCard = {
        id: "reward_card",
        baseId: "test_card",
        name: "Test Card",
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: "A test card",
        upgraded: false,
      };

      const testRelic = {
        id: "test_relic",
        name: "Test Relic",
        description: "A test relic",
        rarity: RelicRarity.COMMON,
        effects: [],
      };

      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: GamePhase.CARD_REWARD,
        combatReward: {
          gold: 15,
          cardRewards: [testCard],
          relicReward: testRelic,
        },
      });

      // Select card reward
      store.selectCardReward("reward_card");

      const afterCardSelection = useGameStore.getState();

      // Should transition to relic reward phase
      expect(afterCardSelection.gamePhase).toBe(GamePhase.RELIC_REWARD);
      expect(afterCardSelection.combatReward?.relicReward).toEqual(testRelic);
      expect(afterCardSelection.combatReward?.cardRewards).toEqual([]);
    });

    it("should skip card reward and go to relic reward when elite defeated", () => {
      const store = useGameStore.getState();

      // Set up card and relic reward state
      const testCard = {
        id: "reward_card",
        baseId: "test_card",
        name: "Test Card",
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: "A test card",
        upgraded: false,
      };

      const testRelic = {
        id: "test_relic",
        name: "Test Relic",
        description: "A test relic",
        rarity: RelicRarity.COMMON,
        effects: [],
      };

      useGameStore.setState({
        ...useGameStore.getState(),
        gamePhase: GamePhase.CARD_REWARD,
        combatReward: {
          gold: 15,
          cardRewards: [testCard],
          relicReward: testRelic,
        },
      });

      // Skip card reward
      store.skipCardReward();

      const afterCardSkip = useGameStore.getState();

      // Should transition to relic reward phase
      expect(afterCardSkip.gamePhase).toBe(GamePhase.RELIC_REWARD);
      expect(afterCardSkip.combatReward?.relicReward).toEqual(testRelic);
      expect(afterCardSkip.combatReward?.cardRewards).toEqual([]);
    });
  });
});
