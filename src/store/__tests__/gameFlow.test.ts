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

  describe("other map nodes", () => {
    it.each([
      [NodeType.EVENT, GamePhase.EVENT],
      [NodeType.REST, GamePhase.REST],
      [NodeType.SHOP, GamePhase.SHOP],
      [NodeType.TREASURE, GamePhase.RELIC_REWARD],
    ])("should open the %s screen", (type, phase) => {
      useGameStore.setState({ map: createMap(type) });

      store().selectNode("node");

      expect(store().gamePhase).toBe(phase);
      expect(store().map?.nodes[0].completed).toBe(true);
    });

    it("should stock the shop and present an event", () => {
      useGameStore.setState({ map: createMap(NodeType.SHOP) });
      store().selectNode("node");
      expect(store().currentShop?.cards.length).toBeGreaterThan(0);

      store().returnToMap();
      expect(store().gamePhase).toBe(GamePhase.MAP);
      expect(store().currentShop).toBeUndefined();

      useGameStore.setState({ map: createMap(NodeType.EVENT) });
      store().selectNode("node");
      expect(store().currentEvent).toBeDefined();
    });
  });

  describe("rest site", () => {
    it("should heal without exceeding max health", () => {
      useGameStore.setState((state) => ({
        gamePhase: GamePhase.REST,
        player: { ...state.player, health: 70, maxHealth: 80 },
      }));

      store().restAndHeal();

      expect(store().player.health).toBe(80);
      expect(store().gamePhase).toBe(GamePhase.MAP);
    });

    it("should open the picker without a card and upgrade with one", () => {
      useGameStore.setState({ gamePhase: GamePhase.REST });

      store().upgradeCardAtRest();
      expect(store().showCardUpgradeModal).toBe(true);

      const [card] = store().persistentDeck;
      store().upgradeCardAtRest(card.id);

      const state = store();
      expect(state.showCardUpgradeModal).toBe(false);
      expect(state.gamePhase).toBe(GamePhase.MAP);
      expect(state.persistentDeck.find((c) => c.id === card.id)?.upgraded).toBe(
        true,
      );
      expect(state.drawPile.find((c) => c.id === card.id)?.upgraded).toBe(true);
    });

    it("should not upgrade an unknown or already upgraded card", () => {
      useGameStore.setState({ gamePhase: GamePhase.REST });
      const [card] = store().persistentDeck;
      store().upgradeCardAtRest(card.id);
      useGameStore.setState({ gamePhase: GamePhase.REST });

      store().upgradeCardAtRest(card.id);
      store().upgradeCardAtRest("missing");

      expect(store().gamePhase).toBe(GamePhase.REST);
    });
  });

  describe("shop relics and removal", () => {
    const relic = {
      id: "test_relic",
      name: "Test Relic",
      description: "",
      rarity: RelicRarity.COMMON,
      effects: [],
    };

    const openShop = (gold: number) =>
      useGameStore.setState((state) => ({
        gamePhase: GamePhase.SHOP,
        player: { ...state.player, gold },
        currentShop: {
          cards: [],
          relics: [{ relic, cost: 150, purchased: false }],
          removeCardCost: 75,
        },
      }));

    it("should buy a relic once", () => {
      openShop(400);
      const relicCount = store().player.relics.length;

      store().purchaseShopRelic(0);
      store().purchaseShopRelic(0);

      expect(store().player.gold).toBe(250);
      expect(store().player.relics).toHaveLength(relicCount + 1);
      expect(store().currentShop?.relics[0].purchased).toBe(true);
    });

    it("should refuse purchases the player cannot afford or that do not exist", () => {
      openShop(10);

      store().purchaseShopRelic(0);
      store().purchaseShopRelic(5);
      store().purchaseShopCard(5);
      store().removeCardFromDeck(store().persistentDeck[0].id);

      expect(store().player.gold).toBe(10);
      expect(store().persistentDeck).toHaveLength(10);
    });

    it("should open the removal picker without a card and ignore unknown cards", () => {
      openShop(400);

      store().removeCardFromDeck();
      expect(store().showCardRemovalModal).toBe(true);

      store().removeCardFromDeck("missing");
      expect(store().player.gold).toBe(400);
    });

    it("should do nothing outside a shop", () => {
      const gold = store().player.gold;

      store().purchaseShopCard(0);
      store().purchaseShopRelic(0);
      store().removeCardFromDeck(store().persistentDeck[0].id);

      expect(store().player.gold).toBe(gold);
    });
  });

  describe("rewards", () => {
    it("should move on to the relic reward before returning to the map", () => {
      const [card] = createTestCards(1);
      const relic = {
        id: "test_relic",
        name: "Test Relic",
        description: "",
        rarity: RelicRarity.COMMON,
        effects: [],
      };
      useGameStore.setState({
        gamePhase: GamePhase.CARD_REWARD,
        combatReward: { gold: 10, cardRewards: [card], relicReward: relic },
      });
      const deckSize = store().persistentDeck.length;

      store().selectCardReward("missing");
      expect(store().gamePhase).toBe(GamePhase.CARD_REWARD);

      store().selectCardReward(card.id);
      expect(store().gamePhase).toBe(GamePhase.RELIC_REWARD);
      expect(store().persistentDeck).toHaveLength(deckSize + 1);

      store().selectRelicReward();
      expect(store().gamePhase).toBe(GamePhase.MAP);
      expect(store().player.relics).toContainEqual(relic);
      expect(store().combatReward).toBeUndefined();
    });

    it("should skip both rewards", () => {
      useGameStore.setState({
        gamePhase: GamePhase.CARD_REWARD,
        combatReward: { gold: 10, cardRewards: [], relicReward: undefined },
      });
      const deckSize = store().persistentDeck.length;

      store().selectRelicReward();
      expect(store().gamePhase).toBe(GamePhase.CARD_REWARD);

      store().skipCardReward();
      expect(store().gamePhase).toBe(GamePhase.MAP);

      store().skipRelicReward();
      expect(store().persistentDeck).toHaveLength(deckSize);
    });
  });

  describe("title screen and UI state", () => {
    it("should only continue when there is a saved game", () => {
      store().loadSavedGame();
      expect(store().gamePhase).toBe(GamePhase.TITLE);

      useGameStore.setState({ hasSavedGame: true });
      store().loadSavedGame();
      expect(store().gamePhase).toBe(GamePhase.MAP);

      store().returnToTitle();
      expect(store().gamePhase).toBe(GamePhase.TITLE);
    });

    it("should open and close the card modals and track the selection", () => {
      const [card] = createTestCards(1);

      store().setSelectedCard(card);
      expect(store().selectedCard).toBe(card);

      store().openCardRemovalModal();
      expect(store().showCardRemovalModal).toBe(true);
      expect(store().selectedCard).toBeNull();
      store().closeCardRemovalModal();
      expect(store().showCardRemovalModal).toBe(false);

      store().openCardUpgradeModal();
      expect(store().showCardUpgradeModal).toBe(true);
      store().closeCardUpgradeModal();
      expect(store().showCardUpgradeModal).toBe(false);
    });

    it("should shuffle the discard pile back into the draw pile", () => {
      const cards = createTestCards(6);
      useGameStore.setState({
        drawPile: cards.slice(0, 2),
        discardPile: cards.slice(2),
      });

      store().shuffleDiscardIntoDraw();

      expect(store().drawPile).toHaveLength(6);
      expect(store().discardPile).toEqual([]);
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
