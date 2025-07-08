import { describe, it, expect } from "vitest";
import { MonsterCardType } from "../types/game";
import { cultistCards, jawWormCards, louseCards } from "../data/monsterCards";

describe("Monster Card Preview System", () => {
  describe("Monster Card Data Structure", () => {
    it("should have valid cultist cards with required properties", () => {
      cultistCards.forEach((card) => {
        expect(card.id).toBeDefined();
        expect(card.baseId).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.type).toBeDefined();
        expect(card.description).toBeDefined();
        expect(card.priority).toBeDefined();
        expect(typeof card.priority).toBe("number");
        expect(card.priority).toBeGreaterThan(0);
      });
    });

    it("should have valid jaw worm cards with required properties", () => {
      jawWormCards.forEach((card) => {
        expect(card.id).toBeDefined();
        expect(card.baseId).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.type).toBeDefined();
        expect(card.description).toBeDefined();
        expect(card.priority).toBeDefined();
        expect(typeof card.priority).toBe("number");
        expect(card.priority).toBeGreaterThan(0);
      });
    });

    it("should have valid louse cards with required properties", () => {
      louseCards.forEach((card) => {
        expect(card.id).toBeDefined();
        expect(card.baseId).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.type).toBeDefined();
        expect(card.description).toBeDefined();
        expect(card.priority).toBeDefined();
        expect(typeof card.priority).toBe("number");
        expect(card.priority).toBeGreaterThan(0);
      });
    });
  });

  describe("Monster Card Types", () => {
    it("should have valid monster card types", () => {
      const validTypes = Object.values(MonsterCardType);

      [...cultistCards, ...jawWormCards, ...louseCards].forEach((card) => {
        expect(validTypes).toContain(card.type);
      });
    });

    it("should have attack cards with damage values", () => {
      const attackCards = [
        ...cultistCards,
        ...jawWormCards,
        ...louseCards,
      ].filter((card) => card.type === MonsterCardType.ATTACK);

      attackCards.forEach((card) => {
        expect(card.damage).toBeDefined();
        expect(typeof card.damage).toBe("number");
        expect(card.damage).toBeGreaterThan(0);
      });
    });

    it("should have defend cards with block values", () => {
      const defendCards = [
        ...cultistCards,
        ...jawWormCards,
        ...louseCards,
      ].filter((card) => card.type === MonsterCardType.DEFEND);

      defendCards.forEach((card) => {
        expect(card.block).toBeDefined();
        expect(typeof card.block).toBe("number");
        expect(card.block).toBeGreaterThan(0);
      });
    });
  });

  describe("Monster Card Effects", () => {
    it("should have valid effects for cards that have them", () => {
      const cardsWithEffects = [
        ...cultistCards,
        ...jawWormCards,
        ...louseCards,
      ].filter((card) => card.effects && card.effects.length > 0);

      cardsWithEffects.forEach((card) => {
        card.effects!.forEach((effect) => {
          expect(effect.type).toBeDefined();
          expect(effect.value).toBeDefined();
          expect(typeof effect.value).toBe("number");
          expect(effect.target).toBeDefined();
        });
      });
    });

    it("should have consistent effect targets", () => {
      const validTargets = ["self", "enemy", "all_enemies"];
      const cardsWithEffects = [
        ...cultistCards,
        ...jawWormCards,
        ...louseCards,
      ].filter((card) => card.effects && card.effects.length > 0);

      cardsWithEffects.forEach((card) => {
        card.effects!.forEach((effect) => {
          expect(validTargets).toContain(effect.target);
        });
      });
    });
  });

  describe("Card Priority System", () => {
    it("should have reasonable priority values", () => {
      [...cultistCards, ...jawWormCards, ...louseCards].forEach((card) => {
        expect(card.priority).toBeGreaterThanOrEqual(1);
        expect(card.priority).toBeLessThanOrEqual(10);
      });
    });

    it("should have higher priority for more powerful cards", () => {
      const attackCards = [
        ...cultistCards,
        ...jawWormCards,
        ...louseCards,
      ].filter((card) => card.type === MonsterCardType.ATTACK && card.damage);

      if (attackCards.length >= 2) {
        // Sort by damage and check that higher damage generally has higher priority
        const sortedByDamage = attackCards.sort(
          (a, b) => (a.damage || 0) - (b.damage || 0),
        );
        const highestDamageCard = sortedByDamage[sortedByDamage.length - 1];
        const lowestDamageCard = sortedByDamage[0];

        // High damage cards should generally have higher or equal priority
        expect(highestDamageCard.priority).toBeGreaterThanOrEqual(
          lowestDamageCard.priority,
        );
      }
    });
  });

  describe("Card Descriptions", () => {
    it("should have meaningful descriptions", () => {
      [...cultistCards, ...jawWormCards, ...louseCards].forEach((card) => {
        expect(card.description.length).toBeGreaterThan(5);
        expect(card.description).not.toBe("");
        expect(card.description).not.toBe(" ");
      });
    });

    it("should mention damage values in attack card descriptions", () => {
      const attackCards = [
        ...cultistCards,
        ...jawWormCards,
        ...louseCards,
      ].filter((card) => card.type === MonsterCardType.ATTACK && card.damage);

      attackCards.forEach((card) => {
        expect(card.description.toLowerCase()).toContain("damage");
        expect(card.description).toContain(card.damage!.toString());
      });
    });

    it("should mention block values in defend card descriptions", () => {
      const defendCards = [
        ...cultistCards,
        ...jawWormCards,
        ...louseCards,
      ].filter((card) => card.type === MonsterCardType.DEFEND && card.block);

      defendCards.forEach((card) => {
        expect(card.description.toLowerCase()).toContain("block");
        expect(card.description).toContain(card.block!.toString());
      });
    });
  });
});
