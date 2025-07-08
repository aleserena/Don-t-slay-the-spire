import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../store/gameStore";
import { generateMap, completeNode } from "../utils/mapGeneration";
import {
  GamePhase,
  TurnPhase,
  CardType,
  StatusType,
  IntentType,
  EffectType,
  TargetType,
  Card,
  CardRarity,
  Player,
  Enemy,
} from "../types/game";
import { NodeType } from "../types/map";
import {
  calculateDamage,
  getStatusEffectDescription,
  getStatusEffectName,
} from "../utils/statusEffects";
import { getEnemyDeck } from "../data/monsterCards";

describe("Bug Fixes", () => {
  beforeEach(() => {
    useGameStore.getState().startNewRun();
  });

  describe("Card Deck Preservation Bug Fix", () => {
    it("should preserve deck composition after completing a level", () => {
      const { selectCardReward, startCombat } = useGameStore.getState();

      // Add a card to the deck through card reward
      const testCard: Card = {
        id: "test_card",
        baseId: "test_card",
        name: "Test Card",
        cost: 1,
        type: CardType.ATTACK,
        rarity: "common" as CardRarity,
        description: "A test card",
        damage: 5,
        upgraded: false,
      };

      useGameStore.setState({
        gamePhase: GamePhase.CARD_REWARD,
        combatReward: {
          gold: 25,
          cardRewards: [testCard],
        },
      });

      // Select the card reward
      selectCardReward(testCard.id);

      const storeAfterReward = useGameStore.getState();
      const deckSizeAfterReward =
        storeAfterReward.drawPile.length + storeAfterReward.discardPile.length;
      expect(deckSizeAfterReward).toBe(11); // 10 initial + 1 reward

      // Start a new combat
      startCombat();

      const storeAfterCombat = useGameStore.getState();
      const deckSizeAfterCombat =
        storeAfterCombat.drawPile.length +
        storeAfterCombat.discardPile.length +
        storeAfterCombat.hand.length;

      // Deck should still have the same total number of cards
      expect(deckSizeAfterCombat).toBe(11);
      expect(storeAfterCombat.gamePhase).toBe(GamePhase.COMBAT);
    });

    it("should preserve player gold and relics after starting combat", () => {
      const { startCombat } = useGameStore.getState();

      // Modify player state
      useGameStore.setState({
        player: {
          ...useGameStore.getState().player,
          gold: 150,
          health: 70,
        },
      });

      const storeBeforeCombat = useGameStore.getState();
      const goldBefore = storeBeforeCombat.player.gold;
      const relicsBefore = storeBeforeCombat.player.relics;
      const healthBefore = storeBeforeCombat.player.health;

      startCombat();

      const storeAfterCombat = useGameStore.getState();

      // Player progression should be preserved
      expect(storeAfterCombat.player.gold).toBe(goldBefore);
      expect(storeAfterCombat.player.relics).toEqual(relicsBefore);
      expect(storeAfterCombat.player.health).toBe(healthBefore);

      // But combat state should be reset
      expect(storeAfterCombat.player.block).toBe(0);
      expect(storeAfterCombat.player.energy).toBe(
        storeAfterCombat.player.maxEnergy,
      );
    });
  });

  describe("Map Progression Bug Fix", () => {
    it("should only make next floor nodes available after completing a node", () => {
      const map = generateMap();

      // Find a node on floor 0 (starting floor)
      const startingNode = map.nodes.find(
        (node) => node.y === 0 && node.available,
      );
      expect(startingNode).toBeDefined();

      if (startingNode) {
        // Complete the starting node
        const updatedMap = completeNode(map, startingNode.id);

        // Check that the node is marked as completed
        const completedNode = updatedMap.nodes.find(
          (n) => n.id === startingNode.id,
        );
        expect(completedNode?.completed).toBe(true);

        // Check that only nodes on floor 1 (next floor) are made available
        const availableNodes = updatedMap.nodes.filter(
          (node) => node.available && !node.completed,
        );

        // All available nodes should be on floor 1 or higher
        availableNodes.forEach((node) => {
          expect(node.y).toBeGreaterThan(0);
        });

        // No nodes on floor 0 should be available (except if they were already completed)
        const floor0AvailableNodes = updatedMap.nodes.filter(
          (node) => node.y === 0 && node.available && !node.completed,
        );
        expect(floor0AvailableNodes).toHaveLength(0);
      }
    });

    it("should not make nodes on the same floor available", () => {
      const map = generateMap();

      // Create a test scenario with multiple nodes on floor 1
      const testMap = {
        ...map,
        nodes: [
          // Floor 0 - starting node
          {
            id: "start",
            type: "combat" as NodeType,
            x: 3,
            y: 0,
            connections: ["node1", "node2"],
            completed: false,
            available: true,
          },
          // Floor 1 - target nodes
          {
            id: "node1",
            type: "combat" as NodeType,
            x: 2,
            y: 1,
            connections: ["node3"],
            completed: false,
            available: false,
          },
          {
            id: "node2",
            type: "combat" as NodeType,
            x: 4,
            y: 1,
            connections: ["node3"],
            completed: false,
            available: false,
          },
          // Floor 2 - next level
          {
            id: "node3",
            type: "combat" as NodeType,
            x: 3,
            y: 2,
            connections: [],
            completed: false,
            available: false,
          },
        ],
      };

      // Complete the starting node
      const updatedMap = completeNode(testMap, "start");

      // Check that nodes on floor 1 are now available
      const node1 = updatedMap.nodes.find((n) => n.id === "node1");
      const node2 = updatedMap.nodes.find((n) => n.id === "node2");
      const node3 = updatedMap.nodes.find((n) => n.id === "node3");

      expect(node1?.available).toBe(true);
      expect(node2?.available).toBe(true);
      expect(node3?.available).toBe(false); // Should not be available yet

      // Now complete node1 and check that node2 becomes unavailable
      const updatedMap2 = completeNode(updatedMap, "node1");
      const node2After = updatedMap2.nodes.find((n) => n.id === "node2");
      const node3After = updatedMap2.nodes.find((n) => n.id === "node3");

      // node2 should now be unavailable (same floor as completed node1)
      expect(node2After?.available).toBe(false);
      // node3 should now be available (it's on the next floor)
      expect(node3After?.available).toBe(true);
    });

    it("should update floor counter correctly", () => {
      const map = generateMap();
      expect(map.floor).toBe(0);

      const startingNode = map.nodes.find(
        (node) => node.y === 0 && node.available,
      );
      if (startingNode) {
        const updatedMap = completeNode(map, startingNode.id);
        expect(updatedMap.floor).toBe(1);
        expect(updatedMap.currentNodeId).toBe(startingNode.id);
      }
    });

    it("should only allow one node per floor to be visited", () => {
      const map = generateMap();

      // Create a test scenario with multiple nodes on floor 1
      const testMap = {
        ...map,
        nodes: [
          // Floor 0 - starting node
          {
            id: "start",
            type: "combat" as NodeType,
            x: 3,
            y: 0,
            connections: ["node1", "node2", "node3"],
            completed: false,
            available: true,
          },
          // Floor 1 - multiple nodes
          {
            id: "node1",
            type: "combat" as NodeType,
            x: 1,
            y: 1,
            connections: ["node4"],
            completed: false,
            available: false,
          },
          {
            id: "node2",
            type: "elite" as NodeType,
            x: 3,
            y: 1,
            connections: ["node4"],
            completed: false,
            available: false,
          },
          {
            id: "node3",
            type: "shop" as NodeType,
            x: 5,
            y: 1,
            connections: ["node4"],
            completed: false,
            available: false,
          },
          // Floor 2 - next level
          {
            id: "node4",
            type: "combat" as NodeType,
            x: 3,
            y: 2,
            connections: [],
            completed: false,
            available: false,
          },
        ],
      };

      // Complete the starting node - all floor 1 nodes should become available
      const updatedMap = completeNode(testMap, "start");

      const node1 = updatedMap.nodes.find((n) => n.id === "node1");
      const node2 = updatedMap.nodes.find((n) => n.id === "node2");
      const node3 = updatedMap.nodes.find((n) => n.id === "node3");
      const node4 = updatedMap.nodes.find((n) => n.id === "node4");

      // All floor 1 nodes should be available
      expect(node1?.available).toBe(true);
      expect(node2?.available).toBe(true);
      expect(node3?.available).toBe(true);
      expect(node4?.available).toBe(false);

      // Complete node2 (elite) - other floor 1 nodes should become unavailable
      const updatedMap2 = completeNode(updatedMap, "node2");

      const node1After = updatedMap2.nodes.find((n) => n.id === "node1");
      const node2After = updatedMap2.nodes.find((n) => n.id === "node2");
      const node3After = updatedMap2.nodes.find((n) => n.id === "node3");
      const node4After = updatedMap2.nodes.find((n) => n.id === "node4");

      // Only the completed node should remain available on floor 1
      expect(node1After?.available).toBe(false);
      expect(node2After?.completed).toBe(true);
      expect(node3After?.available).toBe(false);
      // Floor 2 node should now be available
      expect(node4After?.available).toBe(true);
    });
  });

  describe("Elite Energy Bug Fix", () => {
    it("should properly reset energy when starting elite combat", () => {
      const { selectNode } = useGameStore.getState();

      // Set up a scenario with reduced energy
      useGameStore.setState({
        player: {
          ...useGameStore.getState().player,
          energy: 1, // Reduced energy
          maxEnergy: 3,
        },
      });

      // Create a mock elite node
      const mockMap = {
        ...useGameStore.getState().map!,
        nodes: [
          {
            id: "elite_node",
            type: "elite" as NodeType,
            x: 3,
            y: 1,
            connections: [],
            completed: false,
            available: true,
          },
        ],
      };

      useGameStore.setState({ map: mockMap });

      // Select the elite node
      selectNode("elite_node");

      const store = useGameStore.getState();

      // Energy should be restored to max
      expect(store.player.energy).toBe(store.player.maxEnergy);
      expect(store.player.block).toBe(0);
      expect(store.gamePhase).toBe(GamePhase.COMBAT);
    });
  });

  describe("Damage Calculation with Vulnerable", () => {
    it("should correctly calculate damage with vulnerable status", () => {
      const player: Player = {
        health: 50,
        maxHealth: 50,
        block: 0,
        energy: 3,
        maxEnergy: 3,
        statusEffects: [],
        gold: 0,
        relics: [],
        powerCards: [],
      };

      const enemy: Enemy = {
        id: "test_enemy",
        name: "Test Enemy",
        health: 50,
        maxHealth: 50,
        block: 0,
        intent: { type: IntentType.ATTACK, value: 10 },
        statusEffects: [
          {
            type: StatusType.VULNERABLE,
            stacks: 1,
            duration: 3,
          },
        ],
        deck: [],
      };

      const baseDamage = 10;
      const finalDamage = calculateDamage(baseDamage, player, enemy);

      // Vulnerable should increase damage by 50%
      expect(finalDamage).toBe(15); // 10 * 1.5 = 15
    });

    it("should correctly calculate damage with strength and vulnerable", () => {
      const player: Player = {
        health: 50,
        maxHealth: 50,
        block: 0,
        energy: 3,
        maxEnergy: 3,
        statusEffects: [
          {
            type: StatusType.STRENGTH,
            stacks: 2,
          },
        ],
        gold: 0,
        relics: [],
        powerCards: [],
      };

      const enemy: Enemy = {
        id: "test_enemy",
        name: "Test Enemy",
        health: 50,
        maxHealth: 50,
        block: 0,
        intent: { type: IntentType.ATTACK, value: 10 },
        statusEffects: [
          {
            type: StatusType.VULNERABLE,
            stacks: 1,
            duration: 3,
          },
        ],
        deck: [],
      };

      const baseDamage = 10;
      const finalDamage = calculateDamage(baseDamage, player, enemy);

      // Should be (10 + 2) * 1.5 = 18
      expect(finalDamage).toBe(18);
    });

    it("should correctly calculate damage with weak debuff", () => {
      const player: Player = {
        health: 50,
        maxHealth: 50,
        block: 0,
        energy: 3,
        maxEnergy: 3,
        statusEffects: [
          {
            type: StatusType.WEAK,
            stacks: 1,
            duration: 3,
          },
        ],
        gold: 0,
        relics: [],
        powerCards: [],
      };

      const enemy: Enemy = {
        id: "test_enemy",
        name: "Test Enemy",
        health: 50,
        maxHealth: 50,
        block: 0,
        intent: { type: IntentType.ATTACK, value: 10 },
        statusEffects: [],
        deck: [],
      };

      const baseDamage = 10;
      const finalDamage = calculateDamage(baseDamage, player, enemy);

      // Weak should reduce damage by 25% (multiply by 0.75)
      expect(finalDamage).toBe(7); // Math.floor(10 * 0.75) = 7
    });
  });

  describe("Game State Consistency", () => {
    it("should maintain proper game flow after fixes", () => {
      // Start a new game to transition from TITLE to MAP
      const { startNewGame } = useGameStore.getState();
      startNewGame();

      const store = useGameStore.getState();

      // Start with map phase
      expect(store.gamePhase).toBe(GamePhase.MAP);

      // Start combat should preserve deck but reset combat state
      const initialDeckSize = store.drawPile.length;
      store.startCombat();

      const afterCombat = useGameStore.getState();
      expect(afterCombat.gamePhase).toBe(GamePhase.COMBAT);
      expect(afterCombat.hand.length).toBe(5);
      expect(afterCombat.drawPile.length + afterCombat.hand.length).toBe(
        initialDeckSize,
      );
    });

    it("should provide proper status effect descriptions for tooltips", () => {
      // Test status effect descriptions
      expect(getStatusEffectDescription(StatusType.VULNERABLE)).toBe(
        "Takes 50% more damage from attacks.",
      );
      expect(getStatusEffectDescription(StatusType.WEAK)).toBe(
        "Deals 25% less damage with attacks.",
      );
      expect(getStatusEffectDescription(StatusType.STRENGTH)).toBe(
        "Increases damage dealt by attacks.",
      );
      expect(getStatusEffectDescription(StatusType.POISON)).toBe(
        "Takes damage at the start of each turn, then reduces by 1.",
      );

      // Test status effect names
      expect(getStatusEffectName(StatusType.VULNERABLE)).toBe("Vulnerable");
      expect(getStatusEffectName(StatusType.WEAK)).toBe("Weak");
      expect(getStatusEffectName(StatusType.STRENGTH)).toBe("Strength");
      expect(getStatusEffectName(StatusType.POISON)).toBe("Poison");
    });

    it("should handle Anger card effect correctly", () => {
      const { playCard } = useGameStore.getState();

      // Create an Anger card
      const angerCard = {
        id: "anger_test",
        baseId: "anger",
        name: "Anger",
        cost: 0,
        type: CardType.ATTACK,
        rarity: "common" as CardRarity,
        description:
          "Deal 6 damage. Add a copy of this card into your discard pile.",
        damage: 6,
        upgraded: false,
        effects: [
          {
            type: EffectType.ADD_CARD_TO_DISCARD,
            value: 1,
            target: TargetType.SELF,
          },
        ],
      };

      // Set up combat with Anger card in hand
      useGameStore.setState({
        gamePhase: GamePhase.COMBAT,
        enemies: [
          {
            id: "test_enemy",
            name: "Test Enemy",
            health: 5, // Low health so it can be killed with one attack
            maxHealth: 50,
            block: 0,
            intent: {
              type: IntentType.ATTACK,
              value: 10,
            },
            statusEffects: [],
            deck: getEnemyDeck("cultist"),
          },
        ],
        hand: [angerCard],
        drawPile: [],
        discardPile: [],
        exhaustPile: [],
        currentTurn: TurnPhase.PLAYER_TURN,
        player: {
          ...useGameStore.getState().player,
          energy: 3,
        },
      });

      const beforePlay = useGameStore.getState();
      expect(beforePlay.discardPile.length).toBe(0);

      // Play the Anger card
      playCard(angerCard.id, "test_enemy");

      const afterPlay = useGameStore.getState();

      // Should have 2 cards in discard pile: the original Anger card + the copy
      expect(afterPlay.discardPile.length).toBe(2);

      // Both should be Anger cards
      const angerCards = afterPlay.discardPile.filter(
        (card) => card.name === "Anger",
      );
      expect(angerCards.length).toBe(2);

      // They should have different IDs
      expect(angerCards[0].id).not.toBe(angerCards[1].id);
    });

    it("should preserve deck through complete combat cycle: 10 cards -> use 5 -> win -> add 1 reward -> 11 cards total", () => {
      const { playCard, selectCardReward, startCombat } =
        useGameStore.getState();

      // Start fresh
      useGameStore.getState().startNewRun();

      // Verify starting deck has 10 cards
      const initialState = useGameStore.getState();
      expect(initialState.drawPile.length).toBe(10);

      // Set up combat scenario
      useGameStore.setState({
        ...initialState,
        gamePhase: GamePhase.COMBAT,
        enemies: [
          {
            id: "test_enemy",
            name: "Test Enemy",
            health: 5, // Low health so it can be killed with one attack
            maxHealth: 50,
            block: 0,
            intent: {
              type: IntentType.ATTACK,
              value: 10,
            },
            statusEffects: [],
            deck: getEnemyDeck("cultist"),
          },
        ],
        hand: initialState.drawPile.slice(0, 5), // Draw 5 cards
        drawPile: initialState.drawPile.slice(5), // Remaining 5 in draw pile
        discardPile: [],
        exhaustPile: [],
        currentTurn: TurnPhase.PLAYER_TURN,
      });

      // Verify we have 10 cards total (5 in hand + 5 in draw pile)
      const combatState = useGameStore.getState();
      expect(combatState.hand.length + combatState.drawPile.length).toBe(10);

      // Play an attack card to defeat the enemy
      const attackCard = combatState.hand.find(
        (card) => card.damage && card.damage > 0,
      );
      expect(attackCard).toBeDefined();

      if (attackCard) {
        playCard(attackCard.id, "test_enemy");

        // Combat should end and go to card reward phase
        const afterCombat = useGameStore.getState();
        expect(afterCombat.enemies.length).toBe(0);
        expect(afterCombat.gamePhase).toBe(GamePhase.CARD_REWARD);
        expect(afterCombat.combatReward).toBeDefined();

        // Total cards should still be 10 (4 in hand + 5 in draw + 1 in discard)
        const totalCards =
          afterCombat.hand.length +
          afterCombat.drawPile.length +
          afterCombat.discardPile.length;
        expect(totalCards).toBe(10);

        // Select a card reward
        const rewardCard = afterCombat.combatReward!.cardRewards[0];
        expect(rewardCard).toBeDefined();

        selectCardReward(rewardCard.id);

        // Should return to map with 11 cards total
        const afterReward = useGameStore.getState();
        expect(afterReward.gamePhase).toBe(GamePhase.MAP);
        expect(afterReward.drawPile.length).toBe(11); // All cards should be in draw pile
        expect(afterReward.discardPile.length).toBe(0);
        expect(afterReward.exhaustPile.length).toBe(0);
        expect(afterReward.hand.length).toBe(0);

        // Start next combat to verify deck is preserved
        startCombat();

        const nextCombat = useGameStore.getState();
        expect(nextCombat.gamePhase).toBe(GamePhase.COMBAT);
        expect(nextCombat.hand.length).toBe(5); // Should draw 5 cards
        expect(nextCombat.drawPile.length + nextCombat.hand.length).toBe(11); // Total should be 11
      }
    });

    it("should properly handle deck state transitions", () => {
      const { selectCardReward, skipCardReward, returnToMap } =
        useGameStore.getState();

      // Test that the functions exist and can be called without errors
      expect(typeof selectCardReward).toBe("function");
      expect(typeof skipCardReward).toBe("function");
      expect(typeof returnToMap).toBe("function");

      // Test basic functionality - these functions should not throw errors
      expect(() => {
        useGameStore.setState({
          gamePhase: GamePhase.CARD_REWARD,
          combatReward: { gold: 25, cardRewards: [] },
        });
        skipCardReward();
      }).not.toThrow();

      expect(() => {
        useGameStore.setState({ gamePhase: GamePhase.SHOP });
        returnToMap();
      }).not.toThrow();
    });
  });

  describe("Map Connectivity Fixes", () => {
    it("should generate maps where all nodes are reachable", () => {
      const map = generateMap();

      // Check that every node (except floor 0) has at least one incoming connection
      for (let floor = 1; floor < 15; floor++) {
        const nodesOnFloor = map.nodes.filter((n) => n.y === floor);

        nodesOnFloor.forEach((node) => {
          // Find if any node from previous floor connects to this node
          const previousFloorNodes = map.nodes.filter((n) => n.y === floor - 1);
          const hasIncomingConnection = previousFloorNodes.some((prevNode) =>
            prevNode.connections.includes(node.id),
          );

          expect(hasIncomingConnection).toBe(true);
        });
      }
    });

    it("should not make same-floor nodes available after completing a node", () => {
      const map = generateMap();

      // Find first available node
      const firstNode = map.nodes.find((n) => n.available && !n.completed);
      expect(firstNode).toBeDefined();

      if (firstNode) {
        const updatedMap = completeNode(map, firstNode.id);

        // No nodes on the same floor should become available
        const sameFloorNodes = updatedMap.nodes.filter(
          (n) =>
            n.y === firstNode.y &&
            n.id !== firstNode.id &&
            n.available &&
            !n.completed,
        );

        expect(sameFloorNodes.length).toBe(0);
      }
    });
  });
});
