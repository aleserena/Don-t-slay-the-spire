import { describe, it, expect } from 'vitest';
import { upgradeCard, canUpgradeCard, getUpgradePreview } from '../cardUpgrades';
import { Card, CardType, CardRarity } from '../../types/game';

describe('CardUpgrades', () => {
  const createMockCard = (overrides: Partial<Card> = {}): Card => ({
    id: 'test_card',
    name: 'Test Card',
    cost: 1,
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    description: 'A test card',
    damage: 6,
    upgraded: false,
    ...overrides
  });

  describe('upgradeCard', () => {
    it('should not upgrade already upgraded card', () => {
      const card = createMockCard({ upgraded: true });
      const result = upgradeCard(card);
      
      expect(result).toEqual(card);
    });

    it('should upgrade Strike card', () => {
      const card = createMockCard({ 
        id: 'strike', 
        name: 'Strike', 
        damage: 6,
        description: 'Deal 6 damage.'
      });
      const result = upgradeCard(card);
      
      expect(result.name).toBe('Strike+');
      expect(result.damage).toBe(9);
      expect(result.description).toBe('Deal 9 damage.');
      expect(result.upgraded).toBe(true);
    });

    it('should upgrade Defend card', () => {
      const card = createMockCard({ 
        id: 'defend', 
        name: 'Defend', 
        type: CardType.SKILL,
        damage: undefined,
        block: 5,
        description: 'Gain 5 Block.'
      });
      const result = upgradeCard(card);
      
      expect(result.name).toBe('Defend+');
      expect(result.block).toBe(8);
      expect(result.description).toBe('Gain 8 Block.');
      expect(result.upgraded).toBe(true);
    });

    it('should upgrade Bash card', () => {
      const card = createMockCard({ 
        id: 'bash', 
        name: 'Bash', 
        damage: 8,
        description: 'Deal 8 damage. Apply 2 Vulnerable.'
      });
      const result = upgradeCard(card);
      
      expect(result.name).toBe('Bash+');
      expect(result.damage).toBe(10);
      expect(result.description).toBe('Deal 10 damage. Apply 2 Vulnerable.');
      expect(result.upgraded).toBe(true);
    });

    it('should upgrade Iron Wave card', () => {
      const card = createMockCard({ 
        id: 'iron_wave', 
        name: 'Iron Wave', 
        damage: 5,
        block: 5,
        description: 'Gain 5 Block. Deal 5 damage.'
      });
      const result = upgradeCard(card);
      
      expect(result.name).toBe('Iron Wave+');
      expect(result.damage).toBe(7);
      expect(result.block).toBe(7);
      expect(result.description).toBe('Gain 7 Block. Deal 7 damage.');
      expect(result.upgraded).toBe(true);
    });

    it('should upgrade Pommel Strike card', () => {
      const card = createMockCard({ 
        id: 'pommel_strike', 
        name: 'Pommel Strike', 
        damage: 9,
        description: 'Deal 9 damage. Draw 1 card.'
      });
      const result = upgradeCard(card);
      
      expect(result.name).toBe('Pommel Strike+');
      expect(result.damage).toBe(10);
      expect(result.description).toBe('Deal 10 damage. Draw 1 card.');
      expect(result.upgraded).toBe(true);
    });

    it('should upgrade Cleave card', () => {
      const card = createMockCard({ 
        id: 'cleave', 
        name: 'Cleave', 
        damage: 8,
        description: 'Deal 8 damage to ALL enemies.'
      });
      const result = upgradeCard(card);
      
      expect(result.name).toBe('Cleave+');
      expect(result.damage).toBe(11);
      expect(result.description).toBe('Deal 11 damage to ALL enemies.');
      expect(result.upgraded).toBe(true);
    });

    it('should apply generic attack upgrade', () => {
      const card = createMockCard({ 
        id: 'unknown_attack', 
        name: 'Unknown Attack', 
        damage: 10,
        cost: 2
      });
      const result = upgradeCard(card);
      
      expect(result.name).toBe('Unknown Attack+');
      expect(result.damage).toBe(13);
      expect(result.cost).toBe(1);
      expect(result.upgraded).toBe(true);
    });

    it('should apply generic skill upgrade', () => {
      const card = createMockCard({ 
        id: 'unknown_skill', 
        name: 'Unknown Skill', 
        type: CardType.SKILL,
        damage: undefined,
        block: 8,
        cost: 2
      });
      const result = upgradeCard(card);
      
      expect(result.name).toBe('Unknown Skill+');
      expect(result.block).toBe(11);
      expect(result.cost).toBe(1);
      expect(result.upgraded).toBe(true);
    });

    it('should apply generic power upgrade', () => {
      const card = createMockCard({ 
        id: 'unknown_power', 
        name: 'Unknown Power', 
        type: CardType.POWER,
        damage: undefined,
        cost: 3
      });
      const result = upgradeCard(card);
      
      expect(result.name).toBe('Unknown Power+');
      expect(result.cost).toBe(2);
      expect(result.upgraded).toBe(true);
    });

    it('should not reduce cost below 0', () => {
      const card = createMockCard({ 
        id: 'free_card', 
        name: 'Free Card', 
        cost: 0
      });
      const result = upgradeCard(card);
      
      expect(result.cost).toBe(0);
    });
  });

  describe('canUpgradeCard', () => {
    it('should return true for non-upgraded card', () => {
      const card = createMockCard({ upgraded: false });
      expect(canUpgradeCard(card)).toBe(true);
    });

    it('should return false for upgraded card', () => {
      const card = createMockCard({ upgraded: true });
      expect(canUpgradeCard(card)).toBe(false);
    });
  });

  describe('getUpgradePreview', () => {
    it('should return already upgraded message for upgraded card', () => {
      const card = createMockCard({ upgraded: true });
      const preview = getUpgradePreview(card);
      
      expect(preview).toBe('Already upgraded');
    });

    it('should show damage increase preview', () => {
      const card = createMockCard({ 
        id: 'strike', 
        damage: 6 
      });
      const preview = getUpgradePreview(card);
      
      expect(preview).toBe('Damage: 6 → 9');
    });

    it('should show block increase preview', () => {
      const card = createMockCard({ 
        id: 'defend', 
        type: CardType.SKILL,
        damage: undefined,
        block: 5 
      });
      const preview = getUpgradePreview(card);
      
      expect(preview).toBe('Block: 5 → 8');
    });

    it('should show cost reduction preview', () => {
      const card = createMockCard({ 
        id: 'unknown_attack', 
        cost: 2,
        damage: 10 
      });
      const preview = getUpgradePreview(card);
      
      expect(preview).toBe('Damage: 10 → 13, Cost: 2 → 1');
    });

    it('should show multiple changes preview', () => {
      const card = createMockCard({ 
        id: 'iron_wave', 
        damage: 5,
        block: 5 
      });
      const preview = getUpgradePreview(card);
      
      expect(preview).toBe('Damage: 5 → 7, Block: 5 → 7');
    });

    it('should show enhanced effects for cards with no stat changes', () => {
      const card = createMockCard({ 
        id: 'unknown_card',
        damage: undefined,
        block: undefined,
        cost: 0
      });
      const preview = getUpgradePreview(card);
      
      expect(preview).toBe('Enhanced effects');
    });
  });
}); 