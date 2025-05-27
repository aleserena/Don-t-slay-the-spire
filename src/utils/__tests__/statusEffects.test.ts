import { describe, it, expect } from 'vitest';
import { 
  applyStatusEffect, 
  processStatusEffects, 
  calculateDamage, 
  calculateBlock,
  getStatusEffectDuration 
} from '../statusEffects';
import { StatusType, Player, Enemy, IntentType } from '../../types/game';

describe('StatusEffects', () => {
  const createMockPlayer = (): Player => ({
    health: 80,
    maxHealth: 80,
    block: 0,
    energy: 3,
    maxEnergy: 3,
    statusEffects: [],
    gold: 50,
    relics: []
  });

  const createMockEnemy = (): Enemy => ({
    id: 'test_enemy',
    name: 'Test Enemy',
    health: 50,
    maxHealth: 50,
    block: 0,
    intent: { type: IntentType.ATTACK, value: 10 },
    statusEffects: []
  });

  describe('applyStatusEffect', () => {
    it('should add new status effect', () => {
      const player = createMockPlayer();
      const result = applyStatusEffect(player, StatusType.STRENGTH, 2) as Player;
      
      expect(result.statusEffects).toHaveLength(1);
      expect(result.statusEffects[0]).toEqual({
        type: StatusType.STRENGTH,
        stacks: 2,
        duration: undefined
      });
    });

    it('should stack existing status effect', () => {
      const player = createMockPlayer();
      player.statusEffects = [{ type: StatusType.STRENGTH, stacks: 1, duration: undefined }];
      
      const result = applyStatusEffect(player, StatusType.STRENGTH, 2) as Player;
      
      expect(result.statusEffects).toHaveLength(1);
      expect(result.statusEffects[0].stacks).toBe(3);
    });

    it('should apply status effect with duration', () => {
      const player = createMockPlayer();
      const result = applyStatusEffect(player, StatusType.WEAK, 1) as Player;
      
      expect(result.statusEffects[0]).toEqual({
        type: StatusType.WEAK,
        stacks: 1,
        duration: 3
      });
    });
  });

  describe('getStatusEffectDuration', () => {
    it('should return correct duration for temporary effects', () => {
      expect(getStatusEffectDuration(StatusType.WEAK)).toBe(3);
      expect(getStatusEffectDuration(StatusType.VULNERABLE)).toBe(3);
    });

    it('should return undefined for permanent effects', () => {
      expect(getStatusEffectDuration(StatusType.STRENGTH)).toBeUndefined();
      expect(getStatusEffectDuration(StatusType.POISON)).toBeUndefined();
    });
  });

  describe('processStatusEffects', () => {
    it('should apply poison damage', () => {
      const player = createMockPlayer();
      player.statusEffects = [{ type: StatusType.POISON, stacks: 5, duration: undefined }];
      
      const result = processStatusEffects(player) as Player;
      
      expect(result.health).toBe(75); // 80 - 5 poison damage
    });

    it('should reduce duration of temporary effects', () => {
      const player = createMockPlayer();
      player.statusEffects = [{ type: StatusType.WEAK, stacks: 1, duration: 3 }];
      
      const result = processStatusEffects(player) as Player;
      
      expect(result.statusEffects[0].duration).toBe(2);
    });

    it('should remove expired effects', () => {
      const player = createMockPlayer();
      player.statusEffects = [{ type: StatusType.WEAK, stacks: 1, duration: 1 }];
      
      const result = processStatusEffects(player) as Player;
      
      expect(result.statusEffects).toHaveLength(0);
    });

    it('should not reduce duration of permanent effects', () => {
      const player = createMockPlayer();
      player.statusEffects = [{ type: StatusType.STRENGTH, stacks: 2, duration: undefined }];
      
      const result = processStatusEffects(player) as Player;
      
      expect(result.statusEffects).toHaveLength(1);
      expect(result.statusEffects[0].stacks).toBe(2);
    });
  });

  describe('calculateDamage', () => {
    it('should calculate base damage', () => {
      const attacker = createMockPlayer();
      const target = createMockEnemy();
      
      const damage = calculateDamage(10, attacker, target);
      expect(damage).toBe(10);
    });

    it('should apply strength bonus', () => {
      const attacker = createMockPlayer();
      attacker.statusEffects = [{ type: StatusType.STRENGTH, stacks: 3, duration: undefined }];
      const target = createMockEnemy();
      
      const damage = calculateDamage(10, attacker, target);
      expect(damage).toBe(13);
    });

    it('should apply weak debuff', () => {
      const attacker = createMockPlayer();
      attacker.statusEffects = [{ type: StatusType.WEAK, stacks: 1, duration: 3 }];
      const target = createMockEnemy();
      
      const damage = calculateDamage(10, attacker, target);
      expect(damage).toBe(7); // 10 * 0.75 = 7.5, floored to 7
    });

    it('should apply vulnerable on target', () => {
      const attacker = createMockPlayer();
      const target = createMockEnemy();
      target.statusEffects = [{ type: StatusType.VULNERABLE, stacks: 1, duration: 3 }];
      
      const damage = calculateDamage(10, attacker, target);
      expect(damage).toBe(15); // 10 * 1.5 = 15
    });

    it('should apply multiple modifiers', () => {
      const attacker = createMockPlayer();
      attacker.statusEffects = [
        { type: StatusType.STRENGTH, stacks: 2, duration: undefined },
        { type: StatusType.WEAK, stacks: 1, duration: 3 }
      ];
      const target = createMockEnemy();
      target.statusEffects = [{ type: StatusType.VULNERABLE, stacks: 1, duration: 3 }];
      
      const damage = calculateDamage(10, attacker, target);
      // (10 + 2) * 0.75 * 1.5 = 12 * 0.75 * 1.5 = 13.5, floored to 13
      expect(damage).toBe(13);
    });

    it('should not return negative damage', () => {
      const attacker = createMockPlayer();
      const target = createMockEnemy();
      
      const damage = calculateDamage(-5, attacker, target);
      expect(damage).toBe(0);
    });
  });

  describe('calculateBlock', () => {
    it('should calculate base block', () => {
      const defender = createMockPlayer();
      
      const block = calculateBlock(8, defender);
      expect(block).toBe(8);
    });

    it('should apply dexterity bonus', () => {
      const defender = createMockPlayer();
      defender.statusEffects = [{ type: StatusType.DEXTERITY, stacks: 3, duration: undefined }];
      
      const block = calculateBlock(8, defender);
      expect(block).toBe(11);
    });

    it('should not return negative block', () => {
      const defender = createMockPlayer();
      
      const block = calculateBlock(-3, defender);
      expect(block).toBe(0);
    });
  });
}); 