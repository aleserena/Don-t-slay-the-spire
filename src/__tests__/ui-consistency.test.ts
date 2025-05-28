import { describe, it, expect } from 'vitest';
import { getAllCards } from '../data/cards';
import { CardType, CardRarity } from '../types/game';

describe('UI Consistency Tests', () => {
  const allCards = getAllCards();

  describe('Card Display Consistency', () => {
    it('should have baseId for all cards', () => {
      allCards.forEach(card => {
        expect(card.baseId).toBeDefined();
        expect(typeof card.baseId).toBe('string');
        expect(card.baseId.length).toBeGreaterThan(0);
      });
    });

    it('should have consistent cost types', () => {
      allCards.forEach(card => {
        expect(card.cost).toBeDefined();
        expect(typeof card.cost === 'number' || card.cost === 'X').toBe(true);
        if (typeof card.cost === 'number') {
          expect(card.cost).toBeGreaterThanOrEqual(0);
          expect(card.cost).toBeLessThanOrEqual(5);
        }
      });
    });

    it('should have proper card types', () => {
      const validTypes = Object.values(CardType);
      allCards.forEach(card => {
        expect(validTypes).toContain(card.type);
      });
    });

    it('should have proper card rarities', () => {
      const validRarities = Object.values(CardRarity);
      allCards.forEach(card => {
        expect(validRarities).toContain(card.rarity);
      });
    });

    it('should have descriptions for all cards', () => {
      allCards.forEach(card => {
        expect(card.description).toBeDefined();
        expect(typeof card.description).toBe('string');
        expect(card.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Special Card Handling', () => {
    const specialCards = ['bash', 'cleave', 'whirlwind', 'twin_strike', 'anger', 'body_slam'];

    it('should identify special cards correctly', () => {
      specialCards.forEach(baseId => {
        const card = allCards.find(c => c.baseId === baseId);
        expect(card).toBeDefined();
        expect(card?.baseId).toBe(baseId);
      });
    });

    it('should have effects for effect-based cards', () => {
      const effectBasedCards = ['bash', 'cleave', 'whirlwind', 'twin_strike', 'anger', 'body_slam'];
      
      effectBasedCards.forEach(baseId => {
        const card = allCards.find(c => c.baseId === baseId);
        expect(card).toBeDefined();
        expect(card?.effects).toBeDefined();
        expect(Array.isArray(card?.effects)).toBe(true);
        expect(card?.effects?.length).toBeGreaterThan(0);
      });
    });

    it('should not have legacy damage for converted cards', () => {
      const convertedCards = ['bash', 'anger'];
      
      convertedCards.forEach(baseId => {
        const card = allCards.find(c => c.baseId === baseId);
        expect(card).toBeDefined();
        expect(card?.damage).toBeUndefined();
      });
    });
  });

  describe('Card Upgrade Consistency', () => {
    it('should have upgrade flag set correctly', () => {
      allCards.forEach(card => {
        expect(typeof card.upgraded).toBe('boolean');
        expect(card.upgraded).toBe(false); // Base cards should not be upgraded
      });
    });

    it('should have consistent naming for base cards', () => {
      allCards.forEach(card => {
        expect(card.name).not.toContain('+');
        expect(card.name).not.toContain('Upgraded');
      });
    });
  });

  describe('X-Cost Card Handling', () => {
    it('should handle whirlwind X-cost correctly', () => {
      const whirlwind = allCards.find(c => c.baseId === 'whirlwind');
      expect(whirlwind).toBeDefined();
      expect(whirlwind?.cost).toBe('X');
      expect(whirlwind?.effects).toBeDefined();
      expect(whirlwind?.effects?.some(e => e.type === 'damage_multiplier_energy')).toBe(true);
    });
  });

  describe('Card Effect Types', () => {
    it('should have valid effect types for all cards with effects', () => {
      const validEffectTypes = [
        'damage', 'block', 'draw_cards', 'apply_status', 'upgrade_card',
        'add_card_to_discard', 'damage_multiplier_block', 'damage_multiplier_energy',
        'lose_energy'
      ];

      allCards.forEach(card => {
        if (card.effects) {
          card.effects.forEach(effect => {
            expect(validEffectTypes).toContain(effect.type);
            expect(effect.value).toBeDefined();
            expect(typeof effect.value).toBe('number');
            expect(effect.target).toBeDefined();
          });
        }
      });
    });
  });
}); 