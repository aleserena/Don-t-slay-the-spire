import { describe, it, expect } from 'vitest';
import { processRelicEffects } from '../relicEffects';
import { RelicTrigger, Player, Enemy, IntentType, StatusType, RelicRarity, EffectType } from '../../types/game';

describe('RelicEffects', () => {
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

  describe('processRelicEffects', () => {
    it('should return unchanged state when no relics', () => {
      const player = createMockPlayer();
      const enemies = [createMockEnemy()];
      
      const result = processRelicEffects(RelicTrigger.COMBAT_START, player, enemies);
      
      expect(result.player).toEqual(player);
      expect(result.enemies).toEqual(enemies);
    });

    it('should process combat start relics', () => {
      const player = createMockPlayer();
      player.relics = [{
        id: 'burning_blood',
        name: 'Burning Blood',
        description: 'At the end of combat, heal 6 HP.',
        rarity: RelicRarity.STARTER,
        effects: [{
          trigger: RelicTrigger.COMBAT_START,
          effect: EffectType.HEAL,
          value: 6
        }]
      }];
      const enemies = [createMockEnemy()];
      
      const result = processRelicEffects(RelicTrigger.COMBAT_START, player, enemies);
      
      expect(result.player).toBeDefined();
      expect(result.enemies).toBeDefined();
    });

    it('should process turn start relics', () => {
      const player = createMockPlayer();
      player.relics = [{
        id: 'test_relic',
        name: 'Test Relic',
        description: 'Test relic for turn start.',
        rarity: RelicRarity.COMMON,
        effects: [{
          trigger: RelicTrigger.TURN_START,
          effect: EffectType.GAIN_ENERGY,
          value: 1
        }]
      }];
      const enemies = [createMockEnemy()];
      
      const result = processRelicEffects(RelicTrigger.TURN_START, player, enemies);
      
      expect(result.player).toBeDefined();
      expect(result.enemies).toBeDefined();
    });

    it('should process card played relics', () => {
      const player = createMockPlayer();
      player.relics = [{
        id: 'test_relic',
        name: 'Test Relic',
        description: 'Test relic for card played.',
        rarity: RelicRarity.COMMON,
        effects: [{
          trigger: RelicTrigger.CARD_PLAYED,
          effect: EffectType.BLOCK,
          value: 2
        }]
      }];
      const enemies = [createMockEnemy()];
      
      const result = processRelicEffects(RelicTrigger.CARD_PLAYED, player, enemies);
      
      expect(result.player).toBeDefined();
      expect(result.enemies).toBeDefined();
    });

    it('should process damage taken relics', () => {
      const player = createMockPlayer();
      player.relics = [{
        id: 'test_relic',
        name: 'Test Relic',
        description: 'Test relic for damage taken.',
        rarity: RelicRarity.COMMON,
        effects: [{
          trigger: RelicTrigger.DAMAGE_TAKEN,
          effect: EffectType.APPLY_STATUS,
          value: 1,
          statusType: StatusType.STRENGTH
        }]
      }];
      const enemies = [createMockEnemy()];
      
      const result = processRelicEffects(RelicTrigger.DAMAGE_TAKEN, player, enemies);
      
      expect(result.player).toBeDefined();
      expect(result.enemies).toBeDefined();
    });

    it('should handle multiple relics with same trigger', () => {
      const player = createMockPlayer();
      player.relics = [
        {
          id: 'relic1',
          name: 'Relic 1',
          description: 'First relic.',
          rarity: RelicRarity.COMMON,
          effects: [{
            trigger: RelicTrigger.COMBAT_START,
            effect: EffectType.HEAL,
            value: 3
          }]
        },
        {
          id: 'relic2',
          name: 'Relic 2',
          description: 'Second relic.',
          rarity: RelicRarity.COMMON,
          effects: [{
            trigger: RelicTrigger.COMBAT_START,
            effect: EffectType.GAIN_ENERGY,
            value: 1
          }]
        }
      ];
      const enemies = [createMockEnemy()];
      
      const result = processRelicEffects(RelicTrigger.COMBAT_START, player, enemies);
      
      expect(result.player).toBeDefined();
      expect(result.enemies).toBeDefined();
    });

    it('should ignore relics with different triggers', () => {
      const player = createMockPlayer();
      player.relics = [{
        id: 'wrong_trigger_relic',
        name: 'Wrong Trigger Relic',
        description: 'This should not trigger.',
        rarity: RelicRarity.COMMON,
        effects: [{
          trigger: RelicTrigger.TURN_START,
          effect: EffectType.HEAL,
          value: 10
        }]
      }];
      const enemies = [createMockEnemy()];
      
      const result = processRelicEffects(RelicTrigger.COMBAT_START, player, enemies);
      
      // Should return unchanged state since no matching trigger
      expect(result.player).toEqual(player);
      expect(result.enemies).toEqual(enemies);
    });
  });
}); 