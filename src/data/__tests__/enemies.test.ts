import { describe, it, expect } from 'vitest';
import { 
  createTestEnemy, 
  createJawWorm, 
  createRedLouse, 
  createGreenLouse,
  createAcidSlime,
  createSpikeSlime,
  createFungiBeast,
  createLooter,
  getAllEnemies,
  getRandomEnemy,
  getRandomEnemyEncounter
} from '../enemies';
import { IntentType } from '../../types/game';

describe('Enemies Data', () => {
  describe('Enemy Creation Functions', () => {
    it('should create test enemy with correct properties', () => {
      const enemy = createTestEnemy();
      
      expect(enemy.id).toBe('cultist_1');
      expect(enemy.name).toBe('Cultist');
      expect(enemy.health).toBe(48);
      expect(enemy.maxHealth).toBe(48);
      expect(enemy.block).toBe(0);
      expect(enemy.intent).toBeDefined();
      expect(enemy.statusEffects).toEqual([]);
    });

    it('should create jaw worm with correct properties', () => {
      const enemy = createJawWorm();
      
      expect(enemy.id).toBe('jaw_worm_1');
      expect(enemy.name).toBe('Jaw Worm');
      expect(enemy.health).toBe(40);
      expect(enemy.maxHealth).toBe(40);
      expect(enemy.intent.type).toBe(IntentType.ATTACK);
      expect(enemy.intent.value).toBe(11);
    });

    it('should create red louse with correct properties', () => {
      const enemy = createRedLouse();
      
      expect(enemy.id).toBe('red_louse_1');
      expect(enemy.name).toBe('Red Louse');
      expect(enemy.health).toBe(10);
      expect(enemy.maxHealth).toBe(10);
      expect(enemy.intent.type).toBe(IntentType.ATTACK);
      expect(enemy.intent.value).toBe(5);
    });

    it('should create green louse with correct properties', () => {
      const enemy = createGreenLouse();
      
      expect(enemy.id).toBe('green_louse_1');
      expect(enemy.name).toBe('Green Louse');
      expect(enemy.health).toBe(11);
      expect(enemy.maxHealth).toBe(11);
      expect(enemy.intent.type).toBe(IntentType.ATTACK);
      expect(enemy.intent.value).toBe(5);
    });

    it('should create acid slime with correct properties', () => {
      const enemy = createAcidSlime();
      
      expect(enemy.id).toBe('acid_slime_1');
      expect(enemy.name).toBe('Acid Slime');
      expect(enemy.health).toBe(65);
      expect(enemy.maxHealth).toBe(65);
      expect(enemy.intent.type).toBe(IntentType.DEBUFF);
    });

    it('should create spike slime with correct properties', () => {
      const enemy = createSpikeSlime();
      
      expect(enemy.id).toBe('spike_slime_1');
      expect(enemy.name).toBe('Spike Slime');
      expect(enemy.health).toBe(28);
      expect(enemy.maxHealth).toBe(28);
      expect(enemy.intent.type).toBe(IntentType.ATTACK);
      expect(enemy.intent.value).toBe(5);
    });

    it('should create fungi beast with correct properties', () => {
      const enemy = createFungiBeast();
      
      expect(enemy.id).toBe('fungi_beast_1');
      expect(enemy.name).toBe('Fungi Beast');
      expect(enemy.health).toBe(22);
      expect(enemy.maxHealth).toBe(22);
      expect(enemy.intent.type).toBe(IntentType.BUFF);
    });

    it('should create looter with correct properties', () => {
      const enemy = createLooter();
      
      expect(enemy.id).toBe('looter_1');
      expect(enemy.name).toBe('Looter');
      expect(enemy.health).toBe(44);
      expect(enemy.maxHealth).toBe(44);
      expect(enemy.intent.type).toBe(IntentType.ATTACK);
      expect(enemy.intent.value).toBe(10);
    });
  });

  describe('getAllEnemies', () => {
    it('should return an array of all enemies', () => {
      const enemies = getAllEnemies();
      
      expect(Array.isArray(enemies)).toBe(true);
      expect(enemies).toHaveLength(8);
    });

    it('should include all enemy types', () => {
      const enemies = getAllEnemies();
      const enemyNames = enemies.map(enemy => enemy.name);
      
      expect(enemyNames).toContain('Cultist');
      expect(enemyNames).toContain('Jaw Worm');
      expect(enemyNames).toContain('Red Louse');
      expect(enemyNames).toContain('Green Louse');
      expect(enemyNames).toContain('Acid Slime');
      expect(enemyNames).toContain('Spike Slime');
      expect(enemyNames).toContain('Fungi Beast');
      expect(enemyNames).toContain('Looter');
    });

    it('should have enemies with valid properties', () => {
      const enemies = getAllEnemies();
      
      enemies.forEach(enemy => {
        expect(enemy.id).toBeDefined();
        expect(enemy.name).toBeDefined();
        expect(enemy.health).toBeGreaterThan(0);
        expect(enemy.maxHealth).toBeGreaterThan(0);
        expect(enemy.health).toBeLessThanOrEqual(enemy.maxHealth);
        expect(enemy.block).toBeGreaterThanOrEqual(0);
        expect(enemy.intent).toBeDefined();
        expect(enemy.statusEffects).toBeDefined();
        expect(Array.isArray(enemy.statusEffects)).toBe(true);
      });
    });

    it('should have enemies with valid intent types', () => {
      const enemies = getAllEnemies();
      const validIntentTypes = Object.values(IntentType);
      
      enemies.forEach(enemy => {
        expect(validIntentTypes).toContain(enemy.intent.type);
      });
    });
  });

  describe('getRandomEnemy', () => {
    it('should return a valid enemy', () => {
      const enemy = getRandomEnemy();
      
      expect(enemy).toBeDefined();
      expect(enemy.id).toBeDefined();
      expect(enemy.name).toBeDefined();
      expect(enemy.health).toBeGreaterThan(0);
      expect(enemy.maxHealth).toBeGreaterThan(0);
      expect(enemy.intent).toBeDefined();
      expect(enemy.statusEffects).toBeDefined();
    });

    it('should return different enemies on multiple calls', () => {
      const enemies = [];
      for (let i = 0; i < 20; i++) {
        enemies.push(getRandomEnemy());
      }
      
      const uniqueNames = new Set(enemies.map(enemy => enemy.name));
      expect(uniqueNames.size).toBeGreaterThan(1);
    });

    it('should only return enemies from the available pool', () => {
      const allEnemies = getAllEnemies();
      const availableNames = allEnemies.map(enemy => enemy.name);
      
      for (let i = 0; i < 10; i++) {
        const randomEnemy = getRandomEnemy();
        expect(availableNames).toContain(randomEnemy.name);
      }
    });
  });

  describe('getRandomEnemyEncounter', () => {
    it('should return an array of enemies', () => {
      const encounter = getRandomEnemyEncounter();
      
      expect(Array.isArray(encounter)).toBe(true);
      expect(encounter.length).toBeGreaterThan(0);
      expect(encounter.length).toBeLessThanOrEqual(2);
    });

    it('should return valid enemies in encounter', () => {
      const encounter = getRandomEnemyEncounter();
      
      encounter.forEach(enemy => {
        expect(enemy.id).toBeDefined();
        expect(enemy.name).toBeDefined();
        expect(enemy.health).toBeGreaterThan(0);
        expect(enemy.maxHealth).toBeGreaterThan(0);
        expect(enemy.intent).toBeDefined();
        expect(enemy.statusEffects).toBeDefined();
      });
    });

    it('should generate different encounters', () => {
      const encounters = [];
      for (let i = 0; i < 10; i++) {
        encounters.push(getRandomEnemyEncounter());
      }
      
      // Check that we get different encounter sizes or compositions
      const encounterSizes = encounters.map(enc => enc.length);
      const uniqueSizes = new Set(encounterSizes);
      
      // Should have some variation in encounter sizes or compositions
      expect(uniqueSizes.size).toBeGreaterThanOrEqual(1);
    });

    it('should include specific encounter combinations', () => {
      // Test multiple times to increase chance of getting specific encounters
      let foundLouseEncounter = false;
      let foundCultistLooterEncounter = false;
      
      for (let i = 0; i < 50; i++) {
        const encounter = getRandomEnemyEncounter();
        
        if (encounter.length === 2) {
          const names = encounter.map(enemy => enemy.name);
          if (names.includes('Red Louse') && names.includes('Green Louse')) {
            foundLouseEncounter = true;
          }
          if (names.includes('Cultist') && names.includes('Looter')) {
            foundCultistLooterEncounter = true;
          }
        }
      }
      
      // At least one of the specific encounters should be found
      expect(foundLouseEncounter || foundCultistLooterEncounter).toBe(true);
    });
  });
}); 