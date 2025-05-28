import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { StatusType, CardType, EffectType, TargetType } from '../types/game';
import { getActualCardDamage, getEnhancedCardDescription } from '../utils/cardUtils';

describe('Damage Debug and Card Display', () => {
  beforeEach(() => {
    const store = useGameStore.getState();
    store.startNewRun();
  });

  describe('Enhanced Card Descriptions', () => {
    it('should show modified damage in card description when player has strength', () => {
      const store = useGameStore.getState();
      
      // Create a bash card
      const bashCard = {
        id: 'bash_test',
        baseId: 'bash',
        name: 'Bash',
        cost: 2,
        type: CardType.ATTACK,
        rarity: 'common' as any,
        description: 'Deal 8 damage. Apply 2 Vulnerable.',
        upgraded: false,
        effects: [{
          type: EffectType.DAMAGE,
          value: 8,
          target: TargetType.ENEMY
        }]
      };
      
      // Player with no strength
      let player = store.player;
      let description = getEnhancedCardDescription(bashCard, player);
      expect(description).toBe('Deal 8 damage. Apply 2 Vulnerable.');
      
      // Player with 3 strength
      player = {
        ...store.player,
        statusEffects: [{
          type: StatusType.STRENGTH,
          stacks: 3,
          duration: undefined
        }]
      };
      
      description = getEnhancedCardDescription(bashCard, player);
      expect(description).toBe('Deal 8 (11) damage. Apply 2 Vulnerable.');
    });

    it('should calculate actual damage correctly with strength', () => {
      const store = useGameStore.getState();
      
      // Create a bash card
      const bashCard = {
        id: 'bash_test',
        baseId: 'bash',
        name: 'Bash',
        cost: 2,
        type: CardType.ATTACK,
        rarity: 'common' as any,
        description: 'Deal 8 damage. Apply 2 Vulnerable.',
        upgraded: false,
        effects: [{
          type: EffectType.DAMAGE,
          value: 8,
          target: TargetType.ENEMY
        }]
      };
      
      // Player with no strength
      let player = store.player;
      let actualDamage = getActualCardDamage(bashCard, player);
      expect(actualDamage).toBe(8);
      
      // Player with 3 strength
      player = {
        ...store.player,
        statusEffects: [{
          type: StatusType.STRENGTH,
          stacks: 3,
          duration: undefined
        }]
      };
      
      actualDamage = getActualCardDamage(bashCard, player);
      expect(actualDamage).toBe(11); // 8 base + 3 strength
    });

    it('should handle weak status effect correctly', () => {
      const store = useGameStore.getState();
      
      // Create a strike card
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
      
      // Player with weak status
      const player = {
        ...store.player,
        statusEffects: [{
          type: StatusType.WEAK,
          stacks: 1,
          duration: undefined
        }]
      };
      
      const actualDamage = getActualCardDamage(strikeCard, player);
      expect(actualDamage).toBe(4); // 6 * 0.75 = 4.5, rounded down to 4
      
      const description = getEnhancedCardDescription(strikeCard, player);
      expect(description).toBe('Deal 6 (4) damage.');
    });

    it('should handle both strength and weak together', () => {
      const store = useGameStore.getState();
      
      // Create a strike card
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
      
      // Player with both strength and weak
      const player = {
        ...store.player,
        statusEffects: [
          {
            type: StatusType.STRENGTH,
            stacks: 2,
            duration: undefined
          },
          {
            type: StatusType.WEAK,
            stacks: 1,
            duration: undefined
          }
        ]
      };
      
      const actualDamage = getActualCardDamage(strikeCard, player);
      // (6 + 2) * 0.75 = 8 * 0.75 = 6
      expect(actualDamage).toBe(6);
      
      const description = getEnhancedCardDescription(strikeCard, player);
      // Since the final damage (6) equals the base damage (6), no modifier is shown
      expect(description).toBe('Deal 6 damage.');
    });
  });

  describe('Damage Debug Panel Integration', () => {
    it('should show debug mode state correctly', () => {
      const store = useGameStore.getState();
      
      // Debug mode should be off by default
      expect(store.debugMode).toBe(false);
      
      // Toggle debug mode
      store.toggleDebugMode();
      expect(useGameStore.getState().debugMode).toBe(true);
      
      // Toggle back
      store.toggleDebugMode();
      expect(useGameStore.getState().debugMode).toBe(false);
    });
  });
}); 