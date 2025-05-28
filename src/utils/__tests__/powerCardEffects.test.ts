import { describe, it, expect, beforeEach } from 'vitest';
import { processPowerCardEffects } from '../powerCardEffects';
import { PowerTrigger, EffectType, TargetType, StatusType, Player, Enemy } from '../../types/game';

describe('Power Card Effects', () => {
  let mockPlayer: Player;
  let mockEnemies: Enemy[];

  beforeEach(() => {
    mockPlayer = {
      health: 80,
      maxHealth: 80,
      block: 0,
      energy: 3,
      maxEnergy: 3,
      statusEffects: [],
      gold: 99,
      relics: [],
      powerCards: []
    };

    mockEnemies = [
      {
        id: 'enemy1',
        name: 'Test Enemy',
        health: 50,
        maxHealth: 50,
        block: 0,
        intent: { type: 'attack' as any, value: 10 },
        statusEffects: []
      }
    ];
  });

  describe('Metallicize', () => {
    it('should gain 3 block at end of turn', () => {
      mockPlayer.powerCards = [{
        id: 'metallicize',
        name: 'Metallicize',
        description: 'At the end of your turn, gain 3 Block.',
        effects: [{
          trigger: PowerTrigger.TURN_END,
          type: EffectType.BLOCK,
          value: 3,
          target: TargetType.SELF
        }]
      }];

      const result = processPowerCardEffects(PowerTrigger.TURN_END, mockPlayer, mockEnemies);
      
      expect(result.player.block).toBe(3);
      expect(result.enemies).toEqual(mockEnemies);
    });

    it('should not trigger on turn start', () => {
      mockPlayer.powerCards = [{
        id: 'metallicize',
        name: 'Metallicize',
        description: 'At the end of your turn, gain 3 Block.',
        effects: [{
          trigger: PowerTrigger.TURN_END,
          type: EffectType.BLOCK,
          value: 3,
          target: TargetType.SELF
        }]
      }];

      const result = processPowerCardEffects(PowerTrigger.TURN_START, mockPlayer, mockEnemies);
      
      expect(result.player.block).toBe(0);
    });
  });

  describe('Demon Form', () => {
    it('should gain 2 strength at start of turn', () => {
      mockPlayer.powerCards = [{
        id: 'demon_form',
        name: 'Demon Form',
        description: 'At the start of each turn, gain 2 Strength.',
        effects: [{
          trigger: PowerTrigger.TURN_START,
          type: EffectType.APPLY_STATUS,
          value: 2,
          target: TargetType.SELF,
          statusType: StatusType.STRENGTH
        }]
      }];

      const result = processPowerCardEffects(PowerTrigger.TURN_START, mockPlayer, mockEnemies);
      
      expect(result.player.statusEffects).toHaveLength(1);
      expect(result.player.statusEffects[0].type).toBe(StatusType.STRENGTH);
      expect(result.player.statusEffects[0].stacks).toBe(2);
    });

    it('should stack strength on multiple turns', () => {
      mockPlayer.powerCards = [{
        id: 'demon_form',
        name: 'Demon Form',
        description: 'At the start of each turn, gain 2 Strength.',
        effects: [{
          trigger: PowerTrigger.TURN_START,
          type: EffectType.APPLY_STATUS,
          value: 2,
          target: TargetType.SELF,
          statusType: StatusType.STRENGTH
        }]
      }];
      
      // Add existing strength
      mockPlayer.statusEffects = [{
        type: StatusType.STRENGTH,
        stacks: 3,
        duration: undefined
      }];

      const result = processPowerCardEffects(PowerTrigger.TURN_START, mockPlayer, mockEnemies);
      
      expect(result.player.statusEffects).toHaveLength(1);
      expect(result.player.statusEffects[0].type).toBe(StatusType.STRENGTH);
      expect(result.player.statusEffects[0].stacks).toBe(5); // 3 + 2
    });
  });

  describe('Inflame', () => {
    it('should gain 2 strength immediately when played', () => {
      mockPlayer.powerCards = [{
        id: 'inflame',
        name: 'Inflame',
        description: 'Gain 2 Strength.',
        effects: [{
          trigger: PowerTrigger.COMBAT_START,
          type: EffectType.APPLY_STATUS,
          value: 2,
          target: TargetType.SELF,
          statusType: StatusType.STRENGTH
        }]
      }];

      const result = processPowerCardEffects(PowerTrigger.COMBAT_START, mockPlayer, mockEnemies);
      
      expect(result.player.statusEffects).toHaveLength(1);
      expect(result.player.statusEffects[0].type).toBe(StatusType.STRENGTH);
      expect(result.player.statusEffects[0].stacks).toBe(2);
    });
  });

  describe('Multiple Power Cards', () => {
    it('should process multiple power cards in sequence', () => {
      mockPlayer.powerCards = [
        {
          id: 'metallicize',
          name: 'Metallicize',
          description: 'At the end of your turn, gain 3 Block.',
          effects: [{
            trigger: PowerTrigger.TURN_END,
            type: EffectType.BLOCK,
            value: 3,
            target: TargetType.SELF
          }]
        },
        {
          id: 'demon_form',
          name: 'Demon Form',
          description: 'At the start of each turn, gain 2 Strength.',
          effects: [{
            trigger: PowerTrigger.TURN_START,
            type: EffectType.APPLY_STATUS,
            value: 2,
            target: TargetType.SELF,
            statusType: StatusType.STRENGTH
          }]
        }
      ];

      // Test turn start (should only trigger Demon Form)
      const startResult = processPowerCardEffects(PowerTrigger.TURN_START, mockPlayer, mockEnemies);
      expect(startResult.player.block).toBe(0);
      expect(startResult.player.statusEffects).toHaveLength(1);
      expect(startResult.player.statusEffects[0].type).toBe(StatusType.STRENGTH);

      // Test turn end (should only trigger Metallicize)
      const endResult = processPowerCardEffects(PowerTrigger.TURN_END, startResult.player, mockEnemies);
      expect(endResult.player.block).toBe(3);
      expect(endResult.player.statusEffects).toHaveLength(1); // Strength should still be there
    });
  });
}); 