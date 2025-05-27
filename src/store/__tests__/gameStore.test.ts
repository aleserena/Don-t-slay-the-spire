import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';
import { TurnPhase, GamePhase, StatusType, IntentType, CardType, CardRarity, EffectType, TargetType } from '../../types/game';

describe('GameStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.getState().startNewRun();
  });

  describe('Initial State', () => {
    it('should have correct initial player state', () => {
      const store = useGameStore.getState();
      
      expect(store.player.health).toBe(80);
      expect(store.player.maxHealth).toBe(80);
      expect(store.player.energy).toBe(3);
      expect(store.player.maxEnergy).toBe(3);
      expect(store.player.block).toBe(0);
      expect(store.player.gold).toBe(99);
      expect(store.player.statusEffects).toEqual([]);
      expect(store.player.relics).toHaveLength(1); // Starter relic
    });

    it('should have correct initial game state', () => {
      const store = useGameStore.getState();
      
      expect(store.enemies).toEqual([]);
      expect(store.hand).toEqual([]);
      expect(store.discardPile).toEqual([]);
      expect(store.exhaustPile).toEqual([]);
      expect(store.currentTurn).toBe(TurnPhase.PLAYER_TURN);
      expect(store.gamePhase).toBe(GamePhase.MAP);
      expect(store.drawPile.length).toBeGreaterThan(0); // Should have initial deck
    });

    it('should have a valid map', () => {
      const store = useGameStore.getState();
      
      expect(store.map).toBeDefined();
      expect(store.map?.nodes).toBeDefined();
      expect(store.map?.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('Card Playing', () => {
    it('should play a card and reduce energy', () => {
      const { playCard, drawCards } = useGameStore.getState();
      
      // Set up a combat scenario
      useGameStore.setState({
        gamePhase: GamePhase.COMBAT,
        enemies: [{
          id: 'test_enemy',
          name: 'Test Enemy',
          health: 50,
          maxHealth: 50,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 10 },
          statusEffects: []
        }],
        currentTurn: TurnPhase.PLAYER_TURN
      });
      
      drawCards(1);
      
      const store = useGameStore.getState();
      const initialEnergy = store.player.energy;
      const cardToPlay = store.hand[0];
      
      if (cardToPlay) {
        playCard(cardToPlay.id);
        
        const newStore = useGameStore.getState();
        expect(newStore.player.energy).toBe(initialEnergy - cardToPlay.cost);
        expect(newStore.hand.find(c => c.id === cardToPlay.id)).toBeUndefined();
        expect(newStore.discardPile.find(c => c.id === cardToPlay.id)).toBeDefined();
      }
    });

    it('should not play card if insufficient energy', () => {
      const { playCard, drawCards } = useGameStore.getState();
      
      // Set up a combat scenario
      useGameStore.setState({
        gamePhase: GamePhase.COMBAT,
        enemies: [{
          id: 'test_enemy',
          name: 'Test Enemy',
          health: 50,
          maxHealth: 50,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 10 },
          statusEffects: []
        }],
        currentTurn: TurnPhase.PLAYER_TURN,
        player: { ...useGameStore.getState().player, energy: 0 }
      });
      
      drawCards(1);
      
      const store = useGameStore.getState();
      const cardToPlay = store.hand[0];
      const initialHandSize = store.hand.length;
      
      if (cardToPlay && cardToPlay.cost > 0) {
        playCard(cardToPlay.id);
        
        const newStore = useGameStore.getState();
        // Hand should remain unchanged
        expect(newStore.hand.length).toBe(initialHandSize);
        expect(newStore.player.energy).toBe(0);
      }
    });

    it('should not play card during enemy turn', () => {
      const { playCard, drawCards } = useGameStore.getState();
      
      // Set up a combat scenario
      useGameStore.setState({
        gamePhase: GamePhase.COMBAT,
        enemies: [{
          id: 'test_enemy',
          name: 'Test Enemy',
          health: 50,
          maxHealth: 50,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 10 },
          statusEffects: []
        }],
        currentTurn: TurnPhase.ENEMY_TURN
      });
      
      drawCards(1);
      
      const store = useGameStore.getState();
      const cardToPlay = store.hand[0];
      const initialHandSize = store.hand.length;
      
      if (cardToPlay) {
        playCard(cardToPlay.id);
        
        const newStore = useGameStore.getState();
        // Hand should remain unchanged
        expect(newStore.hand.length).toBe(initialHandSize);
      }
    });
  });

  describe('Turn Management', () => {
    it('should end player turn and transition to enemy turn', () => {
      const { endTurn, drawCards } = useGameStore.getState();
      
      // Set up a combat scenario
      useGameStore.setState({
        gamePhase: GamePhase.COMBAT,
        enemies: [{
          id: 'test_enemy',
          name: 'Test Enemy',
          health: 50,
          maxHealth: 50,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 10 },
          statusEffects: []
        }],
        currentTurn: TurnPhase.PLAYER_TURN
      });
      
      drawCards(2);
      
      expect(useGameStore.getState().currentTurn).toBe(TurnPhase.PLAYER_TURN);
      
      endTurn();
      
      const newStore = useGameStore.getState();
      expect(newStore.currentTurn).toBe(TurnPhase.ENEMY_TURN);
      expect(newStore.hand).toEqual([]); // Hand should be discarded
      expect(newStore.player.block).toBe(0); // Block should be reset
    });
  });

  describe('Drawing Cards', () => {
    it('should draw cards from draw pile to hand', () => {
      const { drawCards } = useGameStore.getState();
      
      const initialStore = useGameStore.getState();
      const initialDrawPileSize = initialStore.drawPile.length;
      const initialHandSize = initialStore.hand.length;
      
      drawCards(3);
      
      const newStore = useGameStore.getState();
      expect(newStore.hand.length).toBe(initialHandSize + 3);
      expect(newStore.drawPile.length).toBe(initialDrawPileSize - 3);
    });

    it('should shuffle discard pile when draw pile is empty', () => {
      const { drawCards } = useGameStore.getState();
      
      const initialStore = useGameStore.getState();
      
      // Move all cards to discard pile
      useGameStore.setState({
        drawPile: [],
        discardPile: [...initialStore.drawPile],
        hand: []
      });
      
      const storeAfterMove = useGameStore.getState();
      const discardPileSize = storeAfterMove.discardPile.length;
      
      drawCards(1);
      
      const finalStore = useGameStore.getState();
      expect(finalStore.hand.length).toBe(1);
      // After shuffling, the discard pile should be empty and draw pile should have the remaining cards
      expect(finalStore.discardPile.length).toBe(0);
      expect(finalStore.drawPile.length).toBe(discardPileSize - 1);
    });

    it('should not draw more cards than available', () => {
      const { drawCards } = useGameStore.getState();
      
      const initialStore = useGameStore.getState();
      
      // Set up scenario with limited cards
      useGameStore.setState({
        drawPile: [initialStore.drawPile[0]],
        discardPile: [],
        hand: []
      });
      
      drawCards(5); // Try to draw more than available
      
      const finalStore = useGameStore.getState();
      expect(finalStore.hand.length).toBe(1); // Should only draw what's available
      expect(finalStore.drawPile.length).toBe(0);
    });
  });

  describe('Combat Management', () => {
    it('should start combat correctly', () => {
      const { startCombat } = useGameStore.getState();
      
      startCombat();
      
      const store = useGameStore.getState();
      expect(store.hand.length).toBe(5); // Should draw starting hand
      expect(store.currentTurn).toBe(TurnPhase.PLAYER_TURN);
      expect(store.player.energy).toBe(store.player.maxEnergy);
    });

    it('should end combat when all enemies are defeated', () => {
      const { playCard } = useGameStore.getState();
      
      // Set up combat with low-health enemy
      useGameStore.setState({
        gamePhase: GamePhase.COMBAT,
        enemies: [{
          id: 'weak_enemy',
          name: 'Weak Enemy',
          health: 1,
          maxHealth: 10,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 5 },
          statusEffects: []
        }],
        hand: [{
          id: 'test_strike',
          name: 'Strike',
          cost: 1,
          type: CardType.ATTACK,
          rarity: CardRarity.COMMON,
          description: 'Deal 6 damage',
          damage: 10,
          upgraded: false
        }],
        currentTurn: TurnPhase.PLAYER_TURN
      });
      
      // Play attack card to defeat enemy
      playCard('test_strike', 'weak_enemy');
      
      const store = useGameStore.getState();
      expect(store.enemies.length).toBe(0);
      expect(store.currentTurn).toBe(TurnPhase.COMBAT_END);
      expect(store.gamePhase).toBe(GamePhase.CARD_REWARD);
      expect(store.combatReward).toBeDefined();
    });
  });

  describe('Progression System', () => {
    it('should start new run correctly', () => {
      const { startNewRun } = useGameStore.getState();
      
      // Modify state
      useGameStore.setState({
        player: { ...useGameStore.getState().player, health: 50, gold: 200 }
      });
      
      startNewRun();
      
      const store = useGameStore.getState();
      // Should reset to initial state
      expect(store.player.health).toBe(80);
      expect(store.player.gold).toBe(99);
      expect(store.gamePhase).toBe(GamePhase.MAP);
    });

    it('should select card reward correctly', () => {
      const { selectCardReward } = useGameStore.getState();
      
      const testCard = {
        id: 'test_reward_card',
        name: 'Test Card',
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: 'Test card',
        damage: 5,
        upgraded: false
      };
      
      // Set up card reward scenario
      useGameStore.setState({
        gamePhase: GamePhase.CARD_REWARD,
        combatReward: {
          gold: 20,
          cardRewards: [testCard]
        }
      });
      
      const initialStore = useGameStore.getState();
      const initialDeckSize = initialStore.drawPile.length + initialStore.discardPile.length;
      
      selectCardReward(testCard.id);
      
      const finalStore = useGameStore.getState();
      expect(finalStore.gamePhase).toBe(GamePhase.MAP);
      expect(finalStore.combatReward).toBeUndefined();
      expect(finalStore.drawPile.length + finalStore.discardPile.length).toBe(initialDeckSize + 1);
    });

    it('should skip card reward correctly', () => {
      const { skipCardReward } = useGameStore.getState();
      
      // Set up card reward scenario
      useGameStore.setState({
        gamePhase: GamePhase.CARD_REWARD,
        combatReward: {
          gold: 20,
          cardRewards: []
        }
      });
      
      const initialStore = useGameStore.getState();
      const initialDeckSize = initialStore.drawPile.length + initialStore.discardPile.length;
      
      skipCardReward();
      
      const finalStore = useGameStore.getState();
      expect(finalStore.gamePhase).toBe(GamePhase.MAP);
      expect(finalStore.combatReward).toBeUndefined();
      expect(finalStore.drawPile.length + finalStore.discardPile.length).toBe(initialDeckSize);
    });
  });

  describe('Shop System', () => {
    it('should purchase shop card correctly', () => {
      const { purchaseShopCard } = useGameStore.getState();
      
      const testCard = {
        id: 'shop_card',
        name: 'Shop Card',
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: 'Shop card',
        damage: 5,
        upgraded: false
      };
      
      // Set up shop scenario
      useGameStore.setState({
        gamePhase: GamePhase.SHOP,
        currentShop: {
          cards: [{
            card: testCard,
            cost: 50,
            purchased: false
          }],
          relics: [],
          removeCardCost: 75
        },
        player: { ...useGameStore.getState().player, gold: 100 }
      });
      
      const initialStore = useGameStore.getState();
      const initialGold = initialStore.player.gold;
      const initialDeckSize = initialStore.drawPile.length + initialStore.discardPile.length;
      
      purchaseShopCard(0);
      
      const finalStore = useGameStore.getState();
      expect(finalStore.player.gold).toBe(initialGold - 50);
      expect(finalStore.drawPile.length + finalStore.discardPile.length).toBe(initialDeckSize + 1);
      expect(finalStore.currentShop?.cards[0].purchased).toBe(true);
    });

    it('should not purchase shop card with insufficient gold', () => {
      const { purchaseShopCard } = useGameStore.getState();
      
      const testCard = {
        id: 'expensive_card',
        name: 'Expensive Card',
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.RARE,
        description: 'Expensive card',
        damage: 10,
        upgraded: false
      };
      
      // Set up shop scenario with insufficient gold
      useGameStore.setState({
        gamePhase: GamePhase.SHOP,
        currentShop: {
          cards: [{
            card: testCard,
            cost: 200,
            purchased: false
          }],
          relics: [],
          removeCardCost: 75
        },
        player: { ...useGameStore.getState().player, gold: 50 }
      });
      
      const initialStore = useGameStore.getState();
      const initialGold = initialStore.player.gold;
      const initialDeckSize = initialStore.drawPile.length + initialStore.discardPile.length;
      
      purchaseShopCard(0);
      
      const finalStore = useGameStore.getState();
      expect(finalStore.player.gold).toBe(initialGold);
      expect(finalStore.drawPile.length + finalStore.discardPile.length).toBe(initialDeckSize);
      expect(finalStore.currentShop?.cards[0].purchased).toBe(false);
    });
  });

  describe('Status Effects Integration', () => {
    it('should apply status effects from cards', () => {
      const { playCard } = useGameStore.getState();
      
      // Set up combat with enemy
      useGameStore.setState({
        gamePhase: GamePhase.COMBAT,
        enemies: [{
          id: 'test_enemy',
          name: 'Test Enemy',
          health: 50,
          maxHealth: 50,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 10 },
          statusEffects: []
        }],
        hand: [{
          id: 'bash',
          name: 'Bash',
          cost: 2,
          type: CardType.ATTACK,
          rarity: CardRarity.COMMON,
          description: 'Deal 8 damage. Apply 2 Vulnerable.',
          damage: 8,
          upgraded: false,
          effects: [{
            type: EffectType.APPLY_STATUS,
            value: 2,
            target: TargetType.ENEMY,
            statusType: StatusType.VULNERABLE
          }]
        }],
        currentTurn: TurnPhase.PLAYER_TURN,
        player: { ...useGameStore.getState().player, energy: 3 }
      });
      
      playCard('bash', 'test_enemy');
      
      const store = useGameStore.getState();
      const enemy = store.enemies[0];
      expect(enemy).toBeDefined();
      expect(enemy.statusEffects.some(effect => effect.type === StatusType.VULNERABLE)).toBe(true);
    });
  });
}); 