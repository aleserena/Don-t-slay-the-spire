import { describe, it, expect, beforeEach } from 'vitest';
import { processRelicEffects } from '../relicEffects';
import { RelicTrigger, EffectType, StatusType, Player, Enemy, Relic, RelicRarity, IntentType } from '../../types/game';

describe('Relic Effects', () => {
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
        intent: { type: IntentType.ATTACK, value: 10 },
        statusEffects: [],
        deck: []
      }
    ];
  });

  describe('Energy Core', () => {
    it('should gain 1 energy at start of turn', () => {
      const energyCore: Relic = {
        id: 'energy_core',
        name: 'Energy Core',
        description: 'Gain 1 Energy at the start of each turn.',
        rarity: RelicRarity.BOSS,
        effects: [{
          trigger: RelicTrigger.TURN_START,
          effect: EffectType.GAIN_ENERGY,
          value: 1
        }]
      };

      mockPlayer.relics = [energyCore];
      mockPlayer.energy = 2; // Start with less than max

      const result = processRelicEffects(RelicTrigger.TURN_START, mockPlayer, mockEnemies);
      
      expect(result.player.energy).toBe(3); // 2 + 1
      expect(result.enemies).toEqual(mockEnemies);
    });

    it('should not exceed max energy + 3', () => {
      const energyCore: Relic = {
        id: 'energy_core',
        name: 'Energy Core',
        description: 'Gain 1 Energy at the start of each turn.',
        rarity: RelicRarity.BOSS,
        effects: [{
          trigger: RelicTrigger.TURN_START,
          effect: EffectType.GAIN_ENERGY,
          value: 1
        }]
      };

      mockPlayer.relics = [energyCore];
      mockPlayer.energy = 6; // Already at max + 3
      mockPlayer.maxEnergy = 3;

      const result = processRelicEffects(RelicTrigger.TURN_START, mockPlayer, mockEnemies);
      
      expect(result.player.energy).toBe(6); // Should not exceed maxEnergy + 3
    });
  });

  describe('Philosopher\'s Stone', () => {
    it('should gain 1 energy at start of turn and give enemies strength at combat start', () => {
      const philosophersStone: Relic = {
        id: 'philosophers_stone',
        name: "Philosopher's Stone",
        description: 'Gain 1 Energy at the start of each turn. ALL enemies start combat with 1 Strength.',
        rarity: RelicRarity.BOSS,
        effects: [
          {
            trigger: RelicTrigger.TURN_START,
            effect: EffectType.GAIN_ENERGY,
            value: 1
          },
          {
            trigger: RelicTrigger.COMBAT_START,
            effect: EffectType.APPLY_STATUS,
            value: 1,
            statusType: StatusType.STRENGTH
          }
        ]
      };

      mockPlayer.relics = [philosophersStone];
      mockPlayer.energy = 2;

      // Test turn start effect
      const turnResult = processRelicEffects(RelicTrigger.TURN_START, mockPlayer, mockEnemies);
      expect(turnResult.player.energy).toBe(3);

      // Test combat start effect
      const combatResult = processRelicEffects(RelicTrigger.COMBAT_START, mockPlayer, mockEnemies);
      expect(combatResult.enemies[0].statusEffects).toHaveLength(1);
      expect(combatResult.enemies[0].statusEffects[0].type).toBe(StatusType.STRENGTH);
      expect(combatResult.enemies[0].statusEffects[0].stacks).toBe(1);
    });
  });

  describe('Bronze Scales', () => {
    it('should deal 3 damage to all enemies when player takes damage', () => {
      const bronzeScales: Relic = {
        id: 'bronze_scales',
        name: 'Bronze Scales',
        description: 'Whenever you take damage, deal 3 damage back.',
        rarity: RelicRarity.UNCOMMON,
        effects: [{
          trigger: RelicTrigger.DAMAGE_TAKEN,
          effect: EffectType.DAMAGE,
          value: 3
        }]
      };

      mockPlayer.relics = [bronzeScales];
      mockEnemies[0].health = 50;

      const result = processRelicEffects(RelicTrigger.DAMAGE_TAKEN, mockPlayer, mockEnemies);
      
      expect(result.enemies[0].health).toBe(47); // 50 - 3
    });

    it('should not reduce enemy health below 0', () => {
      const bronzeScales: Relic = {
        id: 'bronze_scales',
        name: 'Bronze Scales',
        description: 'Whenever you take damage, deal 3 damage back.',
        rarity: RelicRarity.UNCOMMON,
        effects: [{
          trigger: RelicTrigger.DAMAGE_TAKEN,
          effect: EffectType.DAMAGE,
          value: 3
        }]
      };

      mockPlayer.relics = [bronzeScales];
      mockEnemies[0].health = 1; // Low health

      const result = processRelicEffects(RelicTrigger.DAMAGE_TAKEN, mockPlayer, mockEnemies);
      
      expect(result.enemies[0].health).toBe(0); // Should not go below 0
    });
  });

  describe('Centennial Puzzle', () => {
    it('should mark that cards should be drawn when player takes damage', () => {
      const centennialPuzzle: Relic = {
        id: 'centennial_puzzle',
        name: 'Centennial Puzzle',
        description: 'The first time you lose HP each combat, draw 3 cards.',
        rarity: RelicRarity.UNCOMMON,
        effects: [{
          trigger: RelicTrigger.DAMAGE_TAKEN,
          effect: EffectType.DRAW_CARDS,
          value: 3
        }]
      };

      mockPlayer.relics = [centennialPuzzle];
      const context: Record<string, unknown> = {};

      const result = processRelicEffects(RelicTrigger.DAMAGE_TAKEN, mockPlayer, mockEnemies, context);
      
      expect(context.shouldDrawCards).toBe(3);
      expect(result.player).toEqual(mockPlayer);
      expect(result.enemies).toEqual(mockEnemies);
    });
  });

  describe('Bag of Marbles', () => {
    it('should apply vulnerable to all enemies at combat start', () => {
      const bagOfMarbles: Relic = {
        id: 'bag_of_marbles',
        name: 'Bag of Marbles',
        description: 'At the start of each combat, apply 1 Vulnerable to ALL enemies.',
        rarity: RelicRarity.COMMON,
        effects: [{
          trigger: RelicTrigger.COMBAT_START,
          effect: EffectType.APPLY_STATUS,
          value: 1,
          statusType: StatusType.VULNERABLE,
          target: 'ALL_ENEMIES'
        }]
      };

      mockPlayer.relics = [bagOfMarbles];
      mockEnemies.push({
        id: 'enemy2',
        name: 'Test Enemy 2',
        health: 30,
        maxHealth: 30,
        block: 0,
        intent: { type: IntentType.ATTACK, value: 5 },
        statusEffects: [],
        deck: []
      });

      const result = processRelicEffects(RelicTrigger.COMBAT_START, mockPlayer, mockEnemies);
      
      expect(result.enemies[0].statusEffects).toHaveLength(1);
      expect(result.enemies[0].statusEffects[0].type).toBe(StatusType.VULNERABLE);
      expect(result.enemies[0].statusEffects[0].stacks).toBe(1);
      
      expect(result.enemies[1].statusEffects).toHaveLength(1);
      expect(result.enemies[1].statusEffects[0].type).toBe(StatusType.VULNERABLE);
      expect(result.enemies[1].statusEffects[0].stacks).toBe(1);
    });
  });

  describe('Multiple Relics', () => {
    it('should process multiple relics with same trigger', () => {
      const energyCore: Relic = {
        id: 'energy_core',
        name: 'Energy Core',
        description: 'Gain 1 Energy at the start of each turn.',
        rarity: RelicRarity.BOSS,
        effects: [{
          trigger: RelicTrigger.TURN_START,
          effect: EffectType.GAIN_ENERGY,
          value: 1
        }]
      };

      const hornCleat: Relic = {
        id: 'horn_cleat',
        name: 'Horn Cleat',
        description: 'At the start of your 2nd turn, gain 14 Block.',
        rarity: RelicRarity.UNCOMMON,
        effects: [{
          trigger: RelicTrigger.TURN_START,
          effect: EffectType.BLOCK,
          value: 14
        }]
      };

      mockPlayer.relics = [energyCore, hornCleat];
      mockPlayer.energy = 2;
      mockPlayer.block = 0;

      const result = processRelicEffects(RelicTrigger.TURN_START, mockPlayer, mockEnemies);
      
      expect(result.player.energy).toBe(3); // +1 from Energy Core
      expect(result.player.block).toBe(14); // +14 from Horn Cleat
    });
  });
}); 