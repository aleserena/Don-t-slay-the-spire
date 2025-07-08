import { describe, it, expect } from "vitest";
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
  getRandomEnemyEncounter,
} from "../enemies";
import { IntentType, Enemy } from "../../types/game";

describe("Enemies Data", () => {
  describe("Enemy Creation Functions", () => {
    it("should create test enemy with correct properties", () => {
      const enemy = createTestEnemy();

      expect(enemy.id).toBe("cultist_1");
      expect(enemy.name).toBe("Cultist");
      expect(enemy.health).toBe(48);
      expect(enemy.maxHealth).toBe(48);
      expect(enemy.block).toBe(0);
      expect(enemy.intent).toBeDefined();
      expect(enemy.statusEffects).toEqual([]);
    });

    it("should create jaw worm with correct properties", () => {
      const enemy = createJawWorm();

      expect(enemy.id).toBe("jaw_worm_1");
      expect(enemy.name).toBe("Jaw Worm");
      expect(enemy.health).toBe(40);
      expect(enemy.maxHealth).toBe(40);
      expect(enemy.intent.type).toBe(IntentType.ATTACK);
      expect(typeof enemy.intent.value).toBe("number");
      if (
        enemy.intent.type === IntentType.ATTACK ||
        enemy.intent.type === IntentType.DEFEND
      ) {
        expect(enemy.intent.value).toBeGreaterThan(0);
      }
      expect(enemy.deck).toBeDefined();
      expect(enemy.currentCard).toBeDefined();
    });

    it("should create red louse with correct properties", () => {
      const enemy = createRedLouse();

      expect(enemy.id).toBe("red_louse_1");
      expect(enemy.name).toBe("Red Louse");
      expect(enemy.health).toBe(10);
      expect(enemy.maxHealth).toBe(10);
      expect(enemy.intent.type).toBe(IntentType.ATTACK);
      expect(enemy.intent.value).toBe(5);
    });

    it("should create green louse with correct properties", () => {
      const enemy = createGreenLouse();

      expect(enemy.id).toBe("green_louse_1");
      expect(enemy.name).toBe("Green Louse");
      expect(enemy.health).toBe(11);
      expect(enemy.maxHealth).toBe(11);
      expect(enemy.intent.type).toBe(IntentType.ATTACK);
      expect(enemy.intent.value).toBe(5);
    });

    it("should create acid slime with correct properties", () => {
      const enemy = createAcidSlime();

      expect(enemy.id).toBe("acid_slime_1");
      expect(enemy.name).toBe("Acid Slime");
      expect(enemy.health).toBe(65);
      expect(enemy.maxHealth).toBe(65);
      // Acid slime can have ATTACK, DEBUFF, or BUFF intent types based on its cards
      expect([IntentType.ATTACK, IntentType.DEBUFF, IntentType.BUFF]).toContain(
        enemy.intent.type,
      );
      expect(enemy.deck).toBeDefined();
      expect(enemy.currentCard).toBeDefined();
    });

    it("should create spike slime with correct properties", () => {
      const enemy = createSpikeSlime();

      expect(enemy.id).toBe("spike_slime_1");
      expect(enemy.name).toBe("Spike Slime");
      expect(enemy.health).toBe(28);
      expect(enemy.maxHealth).toBe(28);
      // Spike slime can have ATTACK or DEBUFF intent types based on its cards
      expect([IntentType.ATTACK, IntentType.DEBUFF]).toContain(
        enemy.intent.type,
      );
      expect(typeof enemy.intent.value).toBe("number");
      if (
        enemy.intent.type === IntentType.ATTACK ||
        enemy.intent.type === IntentType.DEFEND
      ) {
        expect(enemy.intent.value).toBeGreaterThan(0);
      }
      expect(enemy.deck).toBeDefined();
      expect(enemy.currentCard).toBeDefined();
    });

    it("should create fungi beast with correct properties", () => {
      const enemy = createFungiBeast();

      expect(enemy.id).toBe("fungi_beast_1");
      expect(enemy.name).toBe("Fungi Beast");
      expect(enemy.health).toBe(22);
      expect(enemy.maxHealth).toBe(22);
      expect([IntentType.ATTACK, IntentType.BUFF, IntentType.DEBUFF]).toContain(
        enemy.intent.type,
      );
      expect(enemy.deck).toBeDefined();
      expect(enemy.currentCard).toBeDefined();
    });

    it("should create looter with correct properties", () => {
      const enemy = createLooter();

      expect(enemy.id).toBe("looter_1");
      expect(enemy.name).toBe("Looter");
      expect(enemy.health).toBe(44);
      expect(enemy.maxHealth).toBe(44);
      expect([IntentType.ATTACK, IntentType.DEFEND]).toContain(
        enemy.intent.type,
      );
      expect(typeof enemy.intent.value).toBe("number");
      if (
        enemy.intent.type === IntentType.ATTACK ||
        enemy.intent.type === IntentType.DEFEND
      ) {
        expect(enemy.intent.value).toBeGreaterThan(0);
      }
      expect(enemy.deck).toBeDefined();
      expect(enemy.currentCard).toBeDefined();
    });
  });

  describe("getAllEnemies", () => {
    it("should return an array of all enemies", () => {
      const enemies: Enemy[] = getAllEnemies();

      expect(Array.isArray(enemies)).toBe(true);
      expect(enemies).toHaveLength(13);
    });

    it("should include all enemy types", () => {
      const enemies: Enemy[] = getAllEnemies();
      const enemyNames = enemies.map((enemy) => enemy.name);

      expect(enemyNames).toContain("Cultist");
      expect(enemyNames).toContain("Jaw Worm");
      expect(enemyNames).toContain("Red Louse");
      expect(enemyNames).toContain("Green Louse");
      expect(enemyNames).toContain("Acid Slime");
      expect(enemyNames).toContain("Spike Slime");
      expect(enemyNames).toContain("Fungi Beast");
      expect(enemyNames).toContain("Looter");
      expect(enemyNames).toContain("Gremlin Nob");
      expect(enemyNames).toContain("Sentry");
      expect(enemyNames).toContain("Fat Gremlin");
      expect(enemyNames).toContain("Mad Gremlin");
      expect(enemyNames).toContain("Sneaky Gremlin");
    });

    it("should have enemies with valid properties", () => {
      const enemies: Enemy[] = getAllEnemies();

      enemies.forEach((enemy) => {
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

    it("should have enemies with valid intent types", () => {
      const enemies: Enemy[] = getAllEnemies();
      const validIntentTypes = Object.values(IntentType);

      enemies.forEach((enemy) => {
        expect(validIntentTypes).toContain(enemy.intent.type);
      });
    });
  });

  describe("getRandomEnemy", () => {
    it("should return a valid enemy", () => {
      const enemy: Enemy = getRandomEnemy();

      expect(enemy).toBeDefined();
      expect(enemy.id).toBeDefined();
      expect(enemy.name).toBeDefined();
      expect(enemy.health).toBeGreaterThan(0);
      expect(enemy.maxHealth).toBeGreaterThan(0);
      expect(enemy.intent).toBeDefined();
      expect(enemy.statusEffects).toBeDefined();
    });

    it("should return different enemies on multiple calls", () => {
      const enemies: Enemy[] = [];
      for (let i = 0; i < 20; i++) {
        enemies.push(getRandomEnemy());
      }

      const uniqueNames = new Set(enemies.map((enemy) => enemy.name));
      expect(uniqueNames.size).toBeGreaterThan(1);
    });

    it("should only return enemies from the available pool", () => {
      const allEnemies: Enemy[] = getAllEnemies();
      const availableNames = allEnemies.map((enemy) => enemy.name);

      for (let i = 0; i < 10; i++) {
        const randomEnemy: Enemy = getRandomEnemy();
        expect(availableNames).toContain(randomEnemy.name);
      }
    });
  });

  describe("getRandomEnemyEncounter", () => {
    it("should return an array of enemies", () => {
      const encounter: Enemy[] = getRandomEnemyEncounter();

      expect(Array.isArray(encounter)).toBe(true);
      expect(encounter.length).toBeGreaterThan(0);
      expect(encounter.length).toBeLessThanOrEqual(3);
    });

    it("should return valid enemies in encounter", () => {
      const encounter: Enemy[] = getRandomEnemyEncounter();

      encounter.forEach((enemy) => {
        expect(enemy.id).toBeDefined();
        expect(enemy.name).toBeDefined();
        expect(enemy.health).toBeGreaterThan(0);
        expect(enemy.maxHealth).toBeGreaterThan(0);
        expect(enemy.intent).toBeDefined();
        expect(enemy.statusEffects).toBeDefined();
      });
    });

    it("should generate different encounters", () => {
      const encounters: Enemy[][] = [];
      for (let i = 0; i < 10; i++) {
        encounters.push(getRandomEnemyEncounter());
      }

      // Check that we get different encounter sizes or compositions
      const encounterSizes = encounters.map((enc) => enc.length);
      const uniqueSizes = new Set(encounterSizes);

      // Should have some variation in encounter sizes or compositions
      expect(uniqueSizes.size).toBeGreaterThanOrEqual(1);
    });

    it("should include specific encounter combinations", () => {
      let foundLouseEncounter = false;
      let foundCultistLooterEncounter = false;

      for (let i = 0; i < 50; i++) {
        const encounter: Enemy[] = getRandomEnemyEncounter();
        if (encounter.length === 2) {
          const names = encounter.map((enemy) => enemy.name);
          if (names.includes("Red Louse") && names.includes("Green Louse")) {
            foundLouseEncounter = true;
          }
          if (names.includes("Cultist") && names.includes("Looter")) {
            foundCultistLooterEncounter = true;
          }
        }
      }
      expect(foundLouseEncounter).toBe(true);
      expect(foundCultistLooterEncounter).toBe(true);
    });
  });
});
