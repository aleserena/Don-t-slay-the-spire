import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { GamePhase, TurnPhase, CardType, IntentType } from '../types/game';
import { createInitialDeck } from '../data/cards';
import { generateMap } from '../utils/mapGeneration';

describe('Integration Tests', () => {
  beforeEach(() => {
    useGameStore.getState().startNewRun();
  });

  describe('Complete Game Flow', () => {
    it('should handle a complete game run from start to combat', () => {
      const store = useGameStore.getState();
      
      // 1. Game should start in MAP phase
      expect(store.gamePhase).toBe(GamePhase.MAP);
      expect(store.player.health).toBe(80);
      expect(store.player.gold).toBe(99);
      expect(store.drawPile.length).toBe(10); // Initial deck
      
      // 2. Player should have a valid map
      expect(store.map).toBeDefined();
      expect(store.map?.nodes.length).toBeGreaterThan(0);
      
      // 3. Start combat and get fresh state
      const { startCombat } = useGameStore.getState();
      startCombat();
      const newStore = useGameStore.getState();
      expect(newStore.hand.length).toBe(5); // Starting hand
      expect(newStore.currentTurn).toBe(TurnPhase.PLAYER_TURN);
      expect(newStore.player.energy).toBe(3);
    });

    it('should handle card playing and combat mechanics', () => {
      const { startCombat, playCard, drawCards } = useGameStore.getState();
      
      // Set up combat scenario
      useGameStore.setState({
        gamePhase: GamePhase.COMBAT,
        enemies: [{
          id: 'test_enemy',
          name: 'Test Enemy',
          health: 20,
          maxHealth: 20,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 8 },
          statusEffects: []
        }],
        currentTurn: TurnPhase.PLAYER_TURN
      });
      
      drawCards(3);
      const store = useGameStore.getState();
      
      // Should be able to play cards
      const attackCard = store.hand.find(card => card.type === CardType.ATTACK);
      if (attackCard) {
        const initialEnergy = store.player.energy;
        playCard(attackCard.id, 'test_enemy');
        
        const newStore = useGameStore.getState();
        expect(newStore.player.energy).toBe(initialEnergy - attackCard.cost);
        expect(newStore.hand.find(c => c.id === attackCard.id)).toBeUndefined();
      }
    });

    it('should handle deck building mechanics', () => {
      const initialDeck = createInitialDeck();
      
      // Verify initial deck composition
      expect(initialDeck).toHaveLength(10);
      
      const strikes = initialDeck.filter(card => card.name === 'Strike');
      const defends = initialDeck.filter(card => card.name === 'Defend');
      const bashes = initialDeck.filter(card => card.name === 'Bash');
      
      expect(strikes).toHaveLength(5);
      expect(defends).toHaveLength(4);
      expect(bashes).toHaveLength(1);
      
      // All cards should have required properties
      initialDeck.forEach(card => {
        expect(card.id).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.cost).toBeGreaterThanOrEqual(0);
        expect(card.type).toBeDefined();
        expect(card.rarity).toBeDefined();
        expect(card.upgraded).toBe(false);
      });
    });

    it('should handle map generation and progression', () => {
      const map = generateMap();
      
      // Map should have proper structure
      expect(map.nodes.length).toBeGreaterThan(0);
      expect(map.floor).toBe(0);
      expect(map.maxFloor).toBe(14);
      
      // Should have starting nodes available
      const availableNodes = map.nodes.filter(node => node.available && !node.completed);
      expect(availableNodes.length).toBeGreaterThan(0);
      
      // First floor should be available
      const firstFloorNodes = map.nodes.filter(node => node.y === 0);
      expect(firstFloorNodes.every(node => node.available)).toBe(true);
    });

    it('should handle status effects and combat calculations', () => {
      const { playCard } = useGameStore.getState();
      
      // Set up combat with Bash card (applies Vulnerable)
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
          id: 'bash_test',
          name: 'Bash',
          cost: 2,
          type: CardType.ATTACK,
          rarity: 'common' as any,
          description: 'Deal 8 damage. Apply 2 Vulnerable.',
          damage: 8,
          upgraded: false,
          effects: [{
            type: 'apply_status' as any,
            value: 2,
            target: 'enemy' as any,
            statusType: 'vulnerable' as any
          }]
        }],
        currentTurn: TurnPhase.PLAYER_TURN,
        player: { ...useGameStore.getState().player, energy: 3 }
      });
      
      playCard('bash_test', 'test_enemy');
      
      const store = useGameStore.getState();
      const enemy = store.enemies[0];
      
      // Enemy should have taken damage and received vulnerable status
      expect(enemy.health).toBeLessThan(50);
      expect(enemy.statusEffects.length).toBeGreaterThan(0);
    });

    it('should handle shop and progression systems', () => {
      const { purchaseShopCard, selectCardReward } = useGameStore.getState();
      
      // Test card reward selection
      const testCard = {
        id: 'reward_card',
        name: 'Test Reward',
        cost: 1,
        type: CardType.ATTACK,
        rarity: 'common' as any,
        description: 'Test card',
        damage: 5,
        upgraded: false
      };
      
      useGameStore.setState({
        gamePhase: GamePhase.CARD_REWARD,
        combatReward: {
          gold: 25,
          cardRewards: [testCard]
        }
      });
      
      const initialDeckSize = useGameStore.getState().drawPile.length + useGameStore.getState().discardPile.length;
      
      selectCardReward(testCard.id);
      
      const finalStore = useGameStore.getState();
      expect(finalStore.gamePhase).toBe(GamePhase.MAP);
      expect(finalStore.drawPile.length + finalStore.discardPile.length).toBe(initialDeckSize + 1);
    });

    it('should maintain game state consistency', () => {
      const store = useGameStore.getState();
      
      // Player should always have valid stats
      expect(store.player.health).toBeGreaterThan(0);
      expect(store.player.health).toBeLessThanOrEqual(store.player.maxHealth);
      expect(store.player.energy).toBeGreaterThanOrEqual(0);
      expect(store.player.energy).toBeLessThanOrEqual(store.player.maxEnergy);
      expect(store.player.block).toBeGreaterThanOrEqual(0);
      expect(store.player.gold).toBeGreaterThanOrEqual(0);
      
      // Deck should always have cards
      const totalCards = store.hand.length + store.drawPile.length + store.discardPile.length + store.exhaustPile.length;
      expect(totalCards).toBeGreaterThan(0);
      
      // Game phase should be valid
      expect(Object.values(GamePhase)).toContain(store.gamePhase);
      expect(Object.values(TurnPhase)).toContain(store.currentTurn);
    });
  });
}); 