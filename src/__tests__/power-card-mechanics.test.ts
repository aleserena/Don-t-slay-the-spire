import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { StatusType, CardType } from '../types/game';
import { getAllCards } from '../data/cards';

describe('Power Card Mechanics', () => {
  beforeEach(() => {
    const store = useGameStore.getState();
    store.startNewRun();
  });

  describe('Power Card Attachment', () => {
    it('should attach power cards to player and discard them normally', () => {
      const store = useGameStore.getState();
      
      // Start combat
      const availableNodes = store.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      expect(availableNodes.length).toBeGreaterThan(0);
      
      const combatNode = availableNodes[0];
      store.selectNode(combatNode.id);
      
      // Get actual inflame card from the card definitions
      const allCards = getAllCards();
      const inflameTemplate = allCards.find((c: any) => c.baseId === 'inflame');
      
      if (!inflameTemplate) {
        throw new Error('Inflame card not found in card definitions');
      }
      
      // Create a copy with unique ID
      const inflameCard = { ...inflameTemplate, id: 'inflame_test' };
      
      useGameStore.setState({
        hand: [...store.hand, inflameCard],
        player: { ...store.player, energy: 3 }
      });
      
      const initialDiscardSize = useGameStore.getState().discardPile.length;
      const initialPowerCardsCount = useGameStore.getState().player.powerCards.length;
      
      // Play the power card
      store.playCard('inflame_test');
      
      const finalState = useGameStore.getState();
      
      // Power card should be in discard pile (discarded normally)
      expect(finalState.discardPile.length).toBe(initialDiscardSize + 1);
      expect(finalState.discardPile.find(c => c.id === 'inflame_test')).toBeDefined();
      
      // Power card should be attached to player
      expect(finalState.player.powerCards.length).toBe(initialPowerCardsCount + 1);
      
      // Player should have gained strength
      const strengthEffect = finalState.player.statusEffects.find(e => e.type === StatusType.STRENGTH);
      expect(strengthEffect).toBeDefined();
      expect(strengthEffect?.stacks).toBe(2);
    });

    it('should allow multiple copies of the same power card to be attached', () => {
      const store = useGameStore.getState();
      
      // Start combat
      const availableNodes = store.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      const combatNode = availableNodes[0];
      store.selectNode(combatNode.id);
      
      // Add two copies of the same power card
      const inflameCard1 = {
        id: 'inflame_test_1',
        baseId: 'inflame',
        name: 'Inflame',
        cost: 1,
        type: CardType.POWER,
        rarity: 'common' as any,
        description: 'Gain 2 Strength.',
        upgraded: false
      };
      
      const inflameCard2 = {
        id: 'inflame_test_2',
        baseId: 'inflame',
        name: 'Inflame',
        cost: 1,
        type: CardType.POWER,
        rarity: 'common' as any,
        description: 'Gain 2 Strength.',
        upgraded: false
      };
      
      useGameStore.setState({
        hand: [...store.hand, inflameCard1, inflameCard2],
        player: { ...store.player, energy: 3 }
      });
      
      // Play first power card
      store.playCard('inflame_test_1');
      const afterFirst = useGameStore.getState().player.powerCards.length;
      expect(afterFirst).toBe(1);
      
      // Play second power card (same type)
      store.playCard('inflame_test_2');
      const afterSecond = useGameStore.getState().player.powerCards.length;
      
      // Should allow multiple copies of the same power card
      expect(afterSecond).toBe(2);
      
      // Both cards should be in discard pile
      const finalState = useGameStore.getState();
      const discardedInflameCards = finalState.discardPile.filter(c => c.baseId === 'inflame');
      expect(discardedInflameCards.length).toBe(2);
    });

    it('should stack effects when multiple copies of the same power card are played', () => {
      const store = useGameStore.getState();
      
      // Start a new run and combat
      store.startNewRun();
      const gameState = useGameStore.getState();
      const availableNodes = gameState.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      const combatNode = availableNodes[0];
      store.selectNode(combatNode.id);
      
      // Clear any existing status effects and add energy
      useGameStore.setState(state => ({
        ...state,
        player: {
          ...state.player,
          statusEffects: [],
          energy: 3
        }
      }));
      
      // Get actual inflame cards from the card definitions
      const allCards = getAllCards();
      const inflameTemplate = allCards.find((c: any) => c.baseId === 'inflame');
      
      if (!inflameTemplate) {
        throw new Error('Inflame card not found in card definitions');
      }
      
      // Create two copies with unique IDs
      const inflameCard1 = { ...inflameTemplate, id: 'inflame_stack_1' };
      const inflameCard2 = { ...inflameTemplate, id: 'inflame_stack_2' };
      
      useGameStore.setState(state => ({
        ...state,
        hand: [...state.hand, inflameCard1, inflameCard2]
      }));
      
      // Check initial strength
      const initialState = useGameStore.getState();
      const initialStrength = initialState.player.statusEffects.find(e => e.type === StatusType.STRENGTH);
      expect(initialStrength).toBeUndefined(); // Should start with no strength
      
      // Play first Inflame
      store.playCard('inflame_stack_1');
      const afterFirst = useGameStore.getState();
      const strengthAfterFirst = afterFirst.player.statusEffects.find(e => e.type === StatusType.STRENGTH);
      expect(strengthAfterFirst?.stacks).toBe(2);
      
      // Play second Inflame
      store.playCard('inflame_stack_2');
      const afterSecond = useGameStore.getState();
      const strengthAfterSecond = afterSecond.player.statusEffects.find(e => e.type === StatusType.STRENGTH);
      expect(strengthAfterSecond?.stacks).toBe(4); // Should stack to 4 total strength
      
      // Verify both power cards are attached
      expect(afterSecond.player.powerCards.length).toBe(2);
    });
  });

  describe('Strength Mechanics', () => {
    it('should add 1 damage per stack of strength', () => {
      const store = useGameStore.getState();
      
      // Start combat
      const availableNodes = store.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      const combatNode = availableNodes[0];
      store.selectNode(combatNode.id);
      
      // Add strength to player
      useGameStore.setState({
        player: {
          ...store.player,
          statusEffects: [{
            type: StatusType.STRENGTH,
            stacks: 3,
            duration: undefined
          }]
        }
      });
      
      // Find a strike card
      const strikeCard = store.hand.find(card => card.baseId === 'strike');
      if (strikeCard) {
        const enemy = store.enemies[0];
        const initialEnemyHealth = enemy.health;
        
        // Play strike card
        store.playCard(strikeCard.id, enemy.id);
        
        const finalEnemy = useGameStore.getState().enemies.find(e => e.id === enemy.id);
        if (finalEnemy) {
          // Strike normally does 6 damage, with 3 strength should do 9 damage
          const expectedDamage = 6 + 3; // base damage + strength
          const actualDamage = initialEnemyHealth - finalEnemy.health;
          
          expect(actualDamage).toBe(expectedDamage);
        }
      }
    });

    it('should apply strength bonus to all attack cards', () => {
      const store = useGameStore.getState();
      
      // Start combat
      const availableNodes = store.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      const combatNode = availableNodes[0];
      store.selectNode(combatNode.id);
      
      // Add strength to player
      useGameStore.setState({
        player: {
          ...store.player,
          statusEffects: [{
            type: StatusType.STRENGTH,
            stacks: 2,
            duration: undefined
          }]
        }
      });
      
      // Test with different attack cards
      const attackCards = store.hand.filter(card => card.type === 'attack');
      
      if (attackCards.length > 0) {
        const attackCard = attackCards[0];
        const enemy = store.enemies[0];
        const initialEnemyHealth = enemy.health;
        
        // Play attack card
        store.playCard(attackCard.id, enemy.id);
        
        const finalEnemy = useGameStore.getState().enemies.find(e => e.id === enemy.id);
        if (finalEnemy) {
          const actualDamage = initialEnemyHealth - finalEnemy.health;
          
          // Damage should be increased by strength amount
          expect(actualDamage).toBeGreaterThan(0);
          
          // For strike (6 base damage) + 2 strength = 8 damage
          if (attackCard.baseId === 'strike') {
            expect(actualDamage).toBe(8);
          }
        }
      }
    });
  });

  describe('Power Card Clearing', () => {
    it('should clear power cards after combat ends', () => {
      const store = useGameStore.getState();
      
      // Start a new run first (since game starts at title screen)
      store.startNewRun();
      
      // Get updated state after starting new run
      const gameState = useGameStore.getState();
      
      // Start combat
      const availableNodes = gameState.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      expect(availableNodes.length).toBeGreaterThan(0);
      
      const combatNode = availableNodes[0];
      store.selectNode(combatNode.id);
      
      // Verify we're in combat
      const combatState = useGameStore.getState();
      expect(combatState.gamePhase).toBe('combat');
      expect(combatState.enemies.length).toBeGreaterThan(0);
      
      // Add a power card to the player
      const inflameCard = {
        id: 'inflame_test',
        baseId: 'inflame',
        name: 'Inflame',
        cost: 1,
        type: CardType.POWER,
        rarity: 'common' as any,
        description: 'Gain 2 Strength.',
        upgraded: false
      };
      
      // Add the power card to hand and play it
      useGameStore.setState(state => ({
        ...state,
        hand: [...state.hand, inflameCard]
      }));
      
      // Play the power card
      store.playCard(inflameCard.id);
      
      // Verify power card was attached to player
      const stateAfterPowerCard = useGameStore.getState();
      expect(stateAfterPowerCard.player.powerCards.length).toBe(1);
      expect(stateAfterPowerCard.player.powerCards[0].id).toBe('inflame');
      
      // Kill all enemies to end combat
      useGameStore.setState(state => ({
        ...state,
        enemies: []
      }));
      
      // Play any card to trigger combat end check
      const strikeCard = {
        id: 'strike_test',
        baseId: 'strike',
        name: 'Strike',
        cost: 1,
        type: CardType.ATTACK,
        rarity: 'common' as any,
        description: 'Deal 6 damage.',
        damage: 6,
        upgraded: false
      };
      
      useGameStore.setState(state => ({
        ...state,
        hand: [strikeCard]
      }));
      
      store.playCard(strikeCard.id);
      
      // Verify combat ended and power cards were cleared
      const finalState = useGameStore.getState();
      expect(finalState.gamePhase).toBe('card_reward');
      expect(finalState.currentTurn).toBe('combat_end');
      expect(finalState.player.powerCards.length).toBe(0); // Power cards should be cleared
    });

    it('should persist power cards during combat but clear them between combats', () => {
      const store = useGameStore.getState();
      
      // Start a new run
      store.startNewRun();
      
      // Start first combat
      const gameState = useGameStore.getState();
      const availableNodes = gameState.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      const combatNode = availableNodes[0];
      store.selectNode(combatNode.id);
      
      // Add and play a power card
      const inflameCard = {
        id: 'inflame_test',
        baseId: 'inflame',
        name: 'Inflame',
        cost: 1,
        type: CardType.POWER,
        rarity: 'common' as any,
        description: 'Gain 2 Strength.',
        upgraded: false
      };
      
      useGameStore.setState(state => ({
        ...state,
        hand: [...state.hand, inflameCard]
      }));
      
      store.playCard(inflameCard.id);
      
      // Verify power card is active during combat
      let currentState = useGameStore.getState();
      expect(currentState.player.powerCards.length).toBe(1);
      
      // End turn and verify power card still persists
      store.endTurn();
      
      // Wait for enemy turn to complete
      setTimeout(() => {
        currentState = useGameStore.getState();
        expect(currentState.player.powerCards.length).toBe(1); // Should still be there during combat
        
        // End combat by killing all enemies
        useGameStore.setState(state => ({
          ...state,
          enemies: []
        }));
        
        // Trigger combat end
        const strikeCard = {
          id: 'strike_test',
          baseId: 'strike',
          name: 'Strike',
          cost: 1,
          type: CardType.ATTACK,
          rarity: 'common' as any,
          description: 'Deal 6 damage.',
          damage: 6,
          upgraded: false
        };
        
        useGameStore.setState(state => ({
          ...state,
          hand: [strikeCard]
        }));
        
        store.playCard(strikeCard.id);
        
        // Verify power cards are cleared after combat
        const finalState = useGameStore.getState();
        expect(finalState.player.powerCards.length).toBe(0);
      }, 1100); // Wait for enemy turn delay
    });

    it('should make power cards available again in future fights', () => {
      const store = useGameStore.getState();
      
      // Start a new run
      store.startNewRun();
      
      // Start first combat
      const gameState = useGameStore.getState();
      const availableNodes = gameState.map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      const combatNode = availableNodes[0];
      store.selectNode(combatNode.id);
      
      // Add a power card to the deck
      const inflameCard = {
        id: 'inflame_deck',
        baseId: 'inflame',
        name: 'Inflame',
        cost: 1,
        type: CardType.POWER,
        rarity: 'common' as any,
        description: 'Gain 2 Strength.',
        upgraded: false
      };
      
      // Add power card to draw pile
      useGameStore.setState(state => ({
        ...state,
        drawPile: [...state.drawPile, inflameCard]
      }));
      
      // Draw the power card and play it
      store.drawCards(1);
      const stateWithCard = useGameStore.getState();
      const drawnInflame = stateWithCard.hand.find(c => c.baseId === 'inflame');
      
      if (drawnInflame) {
        store.playCard(drawnInflame.id);
        
        // Verify power card is attached and discarded
        const afterPlay = useGameStore.getState();
        expect(afterPlay.player.powerCards.length).toBe(1);
        expect(afterPlay.discardPile.find(c => c.baseId === 'inflame')).toBeDefined();
        
        // End combat
        useGameStore.setState(state => ({ ...state, enemies: [] }));
        
        const strikeCard = {
          id: 'strike_end',
          baseId: 'strike',
          name: 'Strike',
          cost: 1,
          type: CardType.ATTACK,
          rarity: 'common' as any,
          description: 'Deal 6 damage.',
          damage: 6,
          upgraded: false
        };
        
        useGameStore.setState(state => ({ ...state, hand: [strikeCard] }));
        store.playCard(strikeCard.id);
        
        // Skip card reward to return to map
        store.skipCardReward();
        
        // Verify power cards are cleared but card is still in deck
        const afterCombat = useGameStore.getState();
        expect(afterCombat.player.powerCards.length).toBe(0);
        expect(afterCombat.drawPile.find(c => c.baseId === 'inflame')).toBeDefined();
      }
    });
  });
}); 