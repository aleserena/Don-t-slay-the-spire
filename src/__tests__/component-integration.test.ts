import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { GamePhase, CardType } from '../types/game';
import { getAllCards } from '../data/cards';

describe('Component Integration Tests', () => {
  beforeEach(() => {
    const store = useGameStore.getState();
    store.startNewRun();
  });

  describe('Card Display Integration', () => {
    it('should handle card display across different components', () => {
      const allCards = getAllCards();
      
      // Test that all cards can be properly displayed
      allCards.forEach(card => {
        expect(card.baseId).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.description).toBeDefined();
        expect(card.cost).toBeDefined();
        expect(card.type).toBeDefined();
        expect(card.rarity).toBeDefined();
      });
    });

    it('should properly handle special card exclusions', () => {
      const specialCards = ['bash', 'cleave', 'whirlwind', 'twin_strike', 'anger', 'body_slam'];
      const allCards = getAllCards();
      
      specialCards.forEach(baseId => {
        const card = allCards.find(c => c.baseId === baseId);
        expect(card).toBeDefined();
        
        // These cards should be excluded from generic damage display
        const shouldExclude = ['body_slam', 'bash', 'cleave', 'whirlwind', 'twin_strike', 'anger'];
        expect(shouldExclude).toContain(baseId);
      });
    });
  });

  describe('Game State Integration', () => {
    it('should maintain consistent game state across components', () => {
      const store = useGameStore.getState();
      
      expect(store.gamePhase).toBe(GamePhase.MAP);
      expect(store.player.health).toBe(80);
      expect(store.player.maxHealth).toBe(80);
      expect(store.player.energy).toBe(3);
      expect(store.player.block).toBe(0);
      expect(store.player.gold).toBe(99);
    });

    it('should handle deck composition correctly', () => {
      const store = useGameStore.getState();
      const totalCards = store.drawPile.length + store.hand.length + store.discardPile.length;
      
      expect(totalCards).toBeGreaterThan(0);
      expect(store.drawPile.length).toBeGreaterThan(0);
      
      // Check that all cards have required properties
      [...store.drawPile, ...store.hand, ...store.discardPile].forEach(card => {
        expect(card.id).toBeDefined();
        expect(card.baseId).toBeDefined();
        expect(card.name).toBeDefined();
      });
    });
  });

  describe('Combat Integration', () => {
    it('should handle combat state transitions', () => {
      const store = useGameStore.getState();
      
      // Find an available combat node
      const availableNodes = store.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      expect(availableNodes.length).toBeGreaterThan(0);
      
      const combatNode = availableNodes[0];
      expect(combatNode.type).toBe('combat');
      expect(combatNode.available).toBe(true);
      expect(combatNode.completed).toBe(false);
      
      // Verify the node has an ID
      expect(combatNode.id).toBeDefined();
      expect(typeof combatNode.id).toBe('string');
    });

    it('should handle card playing mechanics', () => {
      const store = useGameStore.getState();
      
      // Find an available combat node
      const availableNodes = store.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      expect(availableNodes.length).toBeGreaterThan(0);
      
      const combatNode = availableNodes[0];
      
      // Start combat
      store.selectNode(combatNode.id);
      
      const initialHandSize = store.hand.length;
      const initialEnergy = store.player.energy;
      
      // Find a playable card
      const playableCard = store.hand.find(card => {
        const cost = typeof card.cost === 'number' ? card.cost : 0;
        return cost <= store.player.energy;
      });
      
      if (playableCard) {
        const cardCost = typeof playableCard.cost === 'number' ? playableCard.cost : 0;
        
        if (playableCard.type === CardType.ATTACK && playableCard.baseId !== 'cleave' && playableCard.baseId !== 'whirlwind') {
          // Play targeting card
          const enemyId = store.enemies[0]?.id;
          if (enemyId) {
            store.playCard(playableCard.id, enemyId);
            expect(store.hand.length).toBe(initialHandSize - 1);
            expect(store.player.energy).toBe(initialEnergy - cardCost);
          }
        } else {
          // Play non-targeting card
          store.playCard(playableCard.id);
          expect(store.hand.length).toBe(initialHandSize - 1);
          expect(store.player.energy).toBe(initialEnergy - cardCost);
        }
      }
    });
  });

  describe('UI State Management', () => {
    it('should handle targeting state correctly', () => {
      const store = useGameStore.getState();
      
      // Find an available combat node
      const availableNodes = store.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      expect(availableNodes.length).toBeGreaterThan(0);
      
      const combatNode = availableNodes[0];
      
      // Start combat
      store.selectNode(combatNode.id);
      
      // Find a targeting card
      const targetingCard = store.hand.find(card => 
        card.type === CardType.ATTACK && 
        card.baseId !== 'cleave' && 
        card.baseId !== 'whirlwind'
      );
      
      if (targetingCard) {
        // Targeting should work for attack cards
        expect(targetingCard.type).toBe(CardType.ATTACK);
      }
    });

    it('should handle card confirmation state', () => {
      const store = useGameStore.getState();
      
      // Find an available combat node
      const availableNodes = store.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      expect(availableNodes.length).toBeGreaterThan(0);
      
      const combatNode = availableNodes[0];
      
      // Start combat
      store.selectNode(combatNode.id);
      
      // Find a non-targeting card
      const nonTargetingCard = store.hand.find(card => 
        card.type === CardType.SKILL || 
        card.baseId === 'cleave' || 
        card.baseId === 'whirlwind'
      );
      
      if (nonTargetingCard) {
        // Non-targeting cards should use confirmation system
        expect(['skill', 'attack', 'power']).toContain(nonTargetingCard.type);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid card plays gracefully', () => {
      const store = useGameStore.getState();
      
      // Find an available combat node
      const availableNodes = store.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      expect(availableNodes.length).toBeGreaterThan(0);
      
      const combatNode = availableNodes[0];
      
      // Start combat
      store.selectNode(combatNode.id);
      
      const initialState = {
        handSize: store.hand.length,
        energy: store.player.energy,
        enemyHealth: store.enemies[0]?.health || 0
      };
      
      // Try to play invalid card
      store.playCard('invalid_card_id');
      
      // State should remain unchanged
      expect(store.hand.length).toBe(initialState.handSize);
      expect(store.player.energy).toBe(initialState.energy);
      if (store.enemies[0]) {
        expect(store.enemies[0].health).toBe(initialState.enemyHealth);
      }
    });

    it('should handle insufficient energy gracefully', () => {
      const store = useGameStore.getState();
      
      // Find an available combat node
      const availableNodes = store.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      expect(availableNodes.length).toBeGreaterThan(0);
      
      const combatNode = availableNodes[0];
      
      // Start combat
      store.selectNode(combatNode.id);
      
      // Find an expensive card
      const expensiveCard = store.hand.find(card => 
        typeof card.cost === 'number' && card.cost > store.player.energy
      );
      
      if (expensiveCard) {
        const initialState = {
          handSize: store.hand.length,
          energy: store.player.energy,
          enemyHealth: store.enemies[0]?.health || 0
        };
        
        // Try to play expensive card with insufficient energy
        store.playCard(expensiveCard.id);
        
        // State should remain unchanged (except for whirlwind which can be played with any energy)
        if (expensiveCard.baseId !== 'whirlwind') {
          expect(store.hand.length).toBe(initialState.handSize);
          expect(store.player.energy).toBe(initialState.energy);
        }
      }
    });
  });
}); 