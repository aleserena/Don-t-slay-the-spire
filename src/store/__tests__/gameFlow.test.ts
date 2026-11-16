import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../gameStore";
import {
  EffectType,
  GamePhase,
  RelicRarity,
  RelicTrigger,
  TurnPhase,
} from "../../types/game";
import { ConsequenceType, GameMap, NodeType } from "../../types/map";
import {
  createTestCards,
  createTestEnemy,
  createTestMonsterAttack,
} from "../../test/setup";
import { isDebugMode } from "../../utils/debugUtils";

const createMap = (type: NodeType): GameMap => ({
  nodes: [
    {
      id: "node",
      type,
      x: 0,
      y: 0,
      connections: [],
      completed: false,
      available: true,
    },
  ],
  currentNodeId: null,
  floor: 0,
  maxFloor: 3,
});

const store = () => useGameStore.getState();

describe("Game flow", () => {
  beforeEach(() => {
    store().startNewRun();
    useGameStore.setState({ debugMode: false });
  });

  describe("entering a combat node", () => {
    it.each([NodeType.COMBAT, NodeType.ELITE, NodeType.BOSS])(
      "should deal the first hand immediately for a %s node",
      (type) => {
        useGameStore.setState({ map: createMap(type) });

        store().selectNode("node");

        const state = store();
        expect(state.gamePhase).toBe(GamePhase.COMBAT);
        expect(state.currentTurn).toBe(TurnPhase.PLAYER_TURN);
        expect(state.enemies.length).toBeGreaterThan(0);
        expect(state.hand).toHaveLength(5);
        expect(state.drawPile).toHaveLength(state.persistentDeck.length - 5);
        expect(state.playerTurnThisCombat).toBe(1);
      },
    );

    it("should mark elite enemies as elite", () => {
      useGameStore.setState({ map: createMap(NodeType.ELITE) });

      store().selectNode("node");

      expect(store().enemies.every((enemy) => enemy.isElite)).toBe(true);
    });

    it("should shuffle the deck instead of dealing it in deck order", () => {
      const deck = createTestCards(30);
      const deckOrder = deck.map((card) => card.id).join();
      const seenOrders = new Set<string>();

      for (let i = 0; i < 5; i++) {
        useGameStore.setState({ persistentDeck: deck });
        store().startCombat([createTestEnemy()]);
        const state = store();
        seenOrders.add(
          [...state.drawPile, ...[...state.hand].reverse()]
            .map((card) => card.id)
            .join(),
        );
      }

      expect(seenOrders.has(deckOrder)).toBe(false);
      expect(seenOrders.size).toBeGreaterThan(1);
    });

    it("should apply turn-start relic effects on the first turn", () => {
      useGameStore.setState((state) => ({
        map: createMap(NodeType.COMBAT),
        player: {
          ...state.player,
          relics: [
            {
              id: "test_relic",
              name: "Test Relic",
              description: "Gain 4 Block at the start of your turn.",
              rarity: RelicRarity.COMMON,
              effects: [
                {
                  trigger: RelicTrigger.TURN_START,
                  effect: EffectType.BLOCK,
                  value: 4,
                },
              ],
            },
          ],
        },
      }));

      store().selectNode("node");

      expect(store().player.block).toBe(4);
    });

    it("should ignore nodes that are not available", () => {
      const map = createMap(NodeType.COMBAT);
      map.nodes[0].available = false;
      useGameStore.setState({ map, gamePhase: GamePhase.MAP });

      store().selectNode("node");

      expect(store().gamePhase).toBe(GamePhase.MAP);
    });
  });

  describe("events", () => {
    const enterEvent = (
      consequences: { type: ConsequenceType; value?: number }[],
    ) =>
      useGameStore.setState({
        gamePhase: GamePhase.EVENT,
        currentEvent: {
          id: "test_event",
          name: "Test Event",
          description: "",
          choices: [
            {
              id: "choice",
              text: "Choice",
              consequences: consequences.map((consequence) => ({
                ...consequence,
                description: "",
              })),
            },
          ],
        },
      });

    it("should upgrade a card in the persistent deck", () => {
      enterEvent([{ type: ConsequenceType.UPGRADE_CARD }]);

      store().selectEventChoice("choice");

      const state = store();
      expect(state.gamePhase).toBe(GamePhase.MAP);
      expect(state.currentEvent).toBeUndefined();
      expect(state.persistentDeck.filter((card) => card.upgraded)).toHaveLength(
        1,
      );
      expect(state.drawPile).toEqual(state.persistentDeck);
    });

    it("should remove a card from the persistent deck", () => {
      const deckSize = store().persistentDeck.length;
      enterEvent([{ type: ConsequenceType.REMOVE_CARD }]);

      store().selectEventChoice("choice");

      expect(store().persistentDeck).toHaveLength(deckSize - 1);
      expect(store().drawPile).toHaveLength(deckSize - 1);
    });

    it("should end the run when an event takes the last health", () => {
      enterEvent([{ type: ConsequenceType.LOSE_HEALTH, value: 999 }]);

      store().selectEventChoice("choice");

      expect(store().player.health).toBe(0);
      expect(store().gamePhase).toBe(GamePhase.GAME_OVER);
    });

    it("should ignore an unknown choice", () => {
      enterEvent([{ type: ConsequenceType.GAIN_GOLD, value: 10 }]);
      const goldBefore = store().player.gold;

      store().selectEventChoice("missing");

      expect(store().gamePhase).toBe(GamePhase.EVENT);
      expect(store().player.gold).toBe(goldBefore);
    });
  });

  describe("shop", () => {
    it("should give two cards bought back to back different ids", () => {
      const card = createTestCards(1)[0];
      useGameStore.setState((state) => ({
        gamePhase: GamePhase.SHOP,
        player: { ...state.player, gold: 500 },
        currentShop: {
          cards: [
            { card, cost: 10, purchased: false },
            { card, cost: 10, purchased: false },
          ],
          relics: [],
          removeCardCost: 75,
        },
      }));
      const deckSize = store().persistentDeck.length;

      store().purchaseShopCard(0);
      store().purchaseShopCard(1);

      const deck = store().persistentDeck;
      expect(deck).toHaveLength(deckSize + 2);
      expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length);
    });

    it("should not sell the same item twice", () => {
      const card = createTestCards(1)[0];
      useGameStore.setState((state) => ({
        gamePhase: GamePhase.SHOP,
        player: { ...state.player, gold: 500 },
        currentShop: {
          cards: [{ card, cost: 10, purchased: false }],
          relics: [],
          removeCardCost: 75,
        },
      }));

      store().purchaseShopCard(0);
      store().purchaseShopCard(0);

      expect(store().player.gold).toBe(490);
    });

    it("should remove a card for gold and raise the price", () => {
      useGameStore.setState((state) => ({
        gamePhase: GamePhase.SHOP,
        player: { ...state.player, gold: 100 },
        currentShop: { cards: [], relics: [], removeCardCost: 75 },
      }));
      const [cardToRemove] = store().persistentDeck;
      const deckSize = store().persistentDeck.length;

      store().removeCardFromDeck(cardToRemove.id);

      const state = store();
      expect(state.persistentDeck).toHaveLength(deckSize - 1);
      expect(state.drawPile.some((c) => c.id === cardToRemove.id)).toBe(false);
      expect(state.player.gold).toBe(25);
      expect(state.currentShop?.removeCardCost).toBe(100);
    });
  });

  describe("enemy turn", () => {
    it("should end the run when an enemy attack is lethal", async () => {
      store().startCombat([
        createTestEnemy({ currentCard: createTestMonsterAttack(999) }),
      ]);

      await store().endTurn();

      expect(store().gamePhase).toBe(GamePhase.GAME_OVER);
      expect(store().player.health).toBe(0);
      expect(store().stepInProgress).toBe(false);
    });

    it("should start the next player turn with a fresh hand", async () => {
      store().startCombat([
        createTestEnemy({ currentCard: createTestMonsterAttack(1) }),
      ]);

      await store().endTurn();

      const state = store();
      expect(state.currentTurn).toBe(TurnPhase.PLAYER_TURN);
      expect(state.playerTurnThisCombat).toBe(2);
      expect(state.hand).toHaveLength(5);
      expect(state.enemies[0].currentCard).toBeDefined();
      expect(state.stepInProgress).toBe(false);
    });
  });

  describe("new run", () => {
    it("should reset run progress but keep debug mode", () => {
      useGameStore.setState((state) => ({
        debugMode: true,
        currentFloor: 7,
        playerTurnThisCombat: 4,
        showCardRemovalModal: true,
        player: { ...state.player, gold: 5 },
      }));

      store().startNewRun();

      const state = store();
      expect(state.debugMode).toBe(true);
      expect(state.currentFloor).toBe(1);
      expect(state.playerTurnThisCombat).toBe(0);
      expect(state.showCardRemovalModal).toBe(false);
      expect(state.player.gold).toBe(99);
      expect(state.gamePhase).toBe(GamePhase.TITLE);
    });
  });

  describe("debug mode", () => {
    it("should keep debug logging in sync with the store", () => {
      expect(isDebugMode()).toBe(false);

      store().toggleDebugMode();
      expect(isDebugMode()).toBe(true);

      useGameStore.setState({ debugMode: false });
      expect(isDebugMode()).toBe(false);
    });
  });
});
