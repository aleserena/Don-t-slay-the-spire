import { describe, it, expect } from 'vitest';
import { createInitialDeck, getAllCards } from '../cards';
import { CardType, CardRarity } from '../../types/game';

describe('Cards Data', () => {
  describe('createInitialDeck', () => {
    it('should create a deck with correct number of cards', () => {
      const deck = createInitialDeck();
      
      expect(deck).toHaveLength(10); // 5 Strikes + 4 Defends + 1 Bash
    });

    it('should contain correct starting cards', () => {
      const deck = createInitialDeck();
      
      const strikes = deck.filter(card => card.name === 'Strike');
      const defends = deck.filter(card => card.name === 'Defend');
      const bashes = deck.filter(card => card.name === 'Bash');
      
      expect(strikes).toHaveLength(5);
      expect(defends).toHaveLength(4);
      expect(bashes).toHaveLength(1);
    });

    it('should create cards with unique IDs', () => {
      const deck = createInitialDeck();
      const cardIds = deck.map(card => card.id);
      const uniqueIds = new Set(cardIds);
      
      expect(uniqueIds.size).toBe(cardIds.length);
    });

    it('should create cards with correct properties', () => {
      const deck = createInitialDeck();
      
      deck.forEach(card => {
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('name');
        expect(card).toHaveProperty('cost');
        expect(card).toHaveProperty('type');
        expect(card).toHaveProperty('rarity');
        expect(card).toHaveProperty('description');
        expect(card).toHaveProperty('upgraded');
        expect(card.upgraded).toBe(false);
      });
    });

    it('should create Strike cards with correct stats', () => {
      const deck = createInitialDeck();
      const strike = deck.find(card => card.name === 'Strike');
      
      expect(strike).toBeDefined();
      expect(strike?.cost).toBe(1);
      expect(strike?.type).toBe(CardType.ATTACK);
      expect(strike?.rarity).toBe(CardRarity.COMMON);
      expect(strike?.damage).toBe(6);
    });

    it('should create Defend cards with correct stats', () => {
      const deck = createInitialDeck();
      const defend = deck.find(card => card.name === 'Defend');
      
      expect(defend).toBeDefined();
      expect(defend?.cost).toBe(1);
      expect(defend?.type).toBe(CardType.SKILL);
      expect(defend?.rarity).toBe(CardRarity.COMMON);
      expect(defend?.block).toBe(5);
    });

    it('should create Bash card with correct stats', () => {
      const deck = createInitialDeck();
      const bash = deck.find(card => card.name === 'Bash');
      
      expect(bash).toBeDefined();
      expect(bash?.cost).toBe(2);
      expect(bash?.type).toBe(CardType.ATTACK);
      expect(bash?.rarity).toBe(CardRarity.COMMON);
      expect(bash?.damage).toBe(8);
      expect(bash?.effects).toBeDefined();
      expect(bash?.effects?.length).toBeGreaterThan(0);
    });
  });

  describe('getAllCards', () => {
    it('should return an array of cards', () => {
      const allCards = getAllCards();
      
      expect(Array.isArray(allCards)).toBe(true);
      expect(allCards.length).toBeGreaterThan(0);
    });

    it('should include all card types', () => {
      const allCards = getAllCards();
      
      const cardTypes = allCards.map(card => card.type);
      const uniqueTypes = new Set(cardTypes);
      
      expect(uniqueTypes.has(CardType.ATTACK)).toBe(true);
      expect(uniqueTypes.has(CardType.SKILL)).toBe(true);
      expect(uniqueTypes.has(CardType.POWER)).toBe(true);
    });

    it('should include all card rarities', () => {
      const allCards = getAllCards();
      
      const cardRarities = allCards.map(card => card.rarity);
      const uniqueRarities = new Set(cardRarities);
      
      expect(uniqueRarities.has(CardRarity.COMMON)).toBe(true);
      expect(uniqueRarities.has(CardRarity.UNCOMMON)).toBe(true);
      expect(uniqueRarities.has(CardRarity.RARE)).toBe(true);
    });

    it('should have cards with valid properties', () => {
      const allCards = getAllCards();
      
      allCards.forEach(card => {
        expect(card.id).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.cost).toBeGreaterThanOrEqual(0);
        expect(card.type).toBeDefined();
        expect(card.rarity).toBeDefined();
        expect(card.description).toBeDefined();
        expect(typeof card.upgraded).toBe('boolean');
      });
    });

    it('should have unique card IDs', () => {
      const allCards = getAllCards();
      const cardIds = allCards.map(card => card.id);
      const uniqueIds = new Set(cardIds);
      
      expect(uniqueIds.size).toBe(cardIds.length);
    });

    it('should include starting deck cards', () => {
      const allCards = getAllCards();
      const cardNames = allCards.map(card => card.name);
      
      expect(cardNames).toContain('Strike');
      expect(cardNames).toContain('Defend');
      expect(cardNames).toContain('Bash');
    });

    it('should have attack cards with damage values', () => {
      const allCards = getAllCards();
      const attackCards = allCards.filter(card => card.type === CardType.ATTACK);
      
      attackCards.forEach(card => {
        expect(card.damage).toBeDefined();
        // Body Slam has 0 base damage by design (damage equals current block)
        if (card.id !== 'body_slam') {
          expect(card.damage).toBeGreaterThan(0);
        }
      });
    });

    it('should have skill cards with block or effects', () => {
      const allCards = getAllCards();
      const skillCards = allCards.filter(card => card.type === CardType.SKILL);
      
      skillCards.forEach(card => {
        const hasBlock = card.block !== undefined && card.block > 0;
        const hasEffects = card.effects !== undefined && card.effects.length > 0;
        
        expect(hasBlock || hasEffects).toBe(true);
      });
    });

    it('should have power cards with effects', () => {
      const allCards = getAllCards();
      const powerCards = allCards.filter(card => card.type === CardType.POWER);
      
      powerCards.forEach(card => {
        expect(card.effects).toBeDefined();
        expect(card.effects?.length).toBeGreaterThan(0);
      });
    });

    it('should have reasonable cost distribution', () => {
      const allCards = getAllCards();
      const costs = allCards.map(card => card.cost);
      
      // Should have cards with various costs
      expect(costs.some(cost => cost === 0)).toBe(true); // Free cards
      expect(costs.some(cost => cost === 1)).toBe(true); // Cheap cards
      expect(costs.some(cost => cost >= 2)).toBe(true); // Expensive cards
      
      // No card should cost more than 5 energy
      expect(costs.every(cost => cost <= 5)).toBe(true);
    });
  });
}); 