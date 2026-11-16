import { describe, it, expect } from "vitest";
import { CardType, EffectType, TargetType } from "../../types/game";
import { getAllCards } from "../../data/cards";
import { createTestCard } from "../../test/setup";
import {
  getCardCostLabel,
  getCardStatBadges,
  getCardTypeColor,
  getCardTypeGradient,
  getRarityColor,
} from "../cardDisplay";

const damage = (value: number, target = TargetType.ENEMY) => ({
  type: EffectType.DAMAGE,
  value,
  target,
});

describe("cardDisplay", () => {
  describe("getCardStatBadges", () => {
    it("should show a single hit as its damage", () => {
      expect(
        getCardStatBadges(createTestCard({ effects: [damage(6)] })),
      ).toEqual([{ kind: "damage", label: "6" }]);
    });

    it("should combine repeated identical hits", () => {
      const card = createTestCard({ effects: [damage(5), damage(5)] });

      expect(getCardStatBadges(card)).toEqual([
        { kind: "damage", label: "5 × 2" },
      ]);
    });

    it("should mark hits on every enemy", () => {
      const card = createTestCard({
        effects: [damage(8, TargetType.ALL_ENEMIES)],
      });

      expect(getCardStatBadges(card)).toEqual([
        { kind: "damage", label: "8 to ALL" },
      ]);
    });

    it("should show damage per energy spent", () => {
      const card = createTestCard({
        cost: "X",
        effects: [
          {
            type: EffectType.DAMAGE_MULTIPLIER_ENERGY,
            value: 5,
            target: TargetType.ALL_ENEMIES,
          },
        ],
      });

      expect(getCardStatBadges(card)).toEqual([
        { kind: "damage", label: "5×X to ALL" },
      ]);
    });

    it("should show damage based on block", () => {
      const card = createTestCard({
        effects: [
          {
            type: EffectType.DAMAGE_MULTIPLIER_BLOCK,
            value: 0,
            multiplier: 2,
            target: TargetType.ENEMY,
          },
        ],
      });

      expect(getCardStatBadges(card)).toEqual([
        { kind: "damage", label: "2x Block" },
      ]);
    });

    it("should fall back to the direct damage number without damage effects", () => {
      const card = createTestCard({ damage: 7, effects: [] });

      expect(getCardStatBadges(card)).toEqual([{ kind: "damage", label: "7" }]);
    });

    it("should not show the direct damage number twice", () => {
      const card = createTestCard({ damage: 6, effects: [damage(6)] });

      expect(getCardStatBadges(card)).toHaveLength(1);
    });

    it("should show block after damage", () => {
      const card = createTestCard({ block: 5, effects: [damage(5)] });

      expect(getCardStatBadges(card)).toEqual([
        { kind: "damage", label: "5" },
        { kind: "block", label: "5" },
      ]);
    });

    it("should show nothing for a card with no damage or block", () => {
      const card = createTestCard({ type: CardType.SKILL, effects: [] });

      expect(getCardStatBadges(card)).toEqual([]);
    });

    it("should give every attack card in the game a damage badge", () => {
      const attacks = getAllCards().filter(
        (card) => card.type === CardType.ATTACK,
      );

      for (const card of attacks) {
        expect(
          getCardStatBadges(card).some((badge) => badge.kind === "damage"),
          card.baseId,
        ).toBe(true);
      }
    });
  });

  describe("getCardCostLabel", () => {
    it("should show numeric and X costs", () => {
      expect(getCardCostLabel(createTestCard({ cost: 2 }))).toBe("2");
      expect(getCardCostLabel(createTestCard({ cost: 0 }))).toBe("0");
      expect(getCardCostLabel(createTestCard({ cost: "X" }))).toBe("X");
    });
  });

  describe("colors", () => {
    it("should give each card type its own color", () => {
      const colors = [CardType.ATTACK, CardType.SKILL, CardType.POWER].map(
        getCardTypeColor,
      );

      expect(new Set(colors).size).toBe(3);
    });

    it("should build a gradient that starts with the type color", () => {
      expect(getCardTypeGradient(CardType.ATTACK)).toContain(
        getCardTypeColor(CardType.ATTACK),
      );
      expect(getCardTypeGradient(CardType.ATTACK)).toMatch(/^linear-gradient/);
    });

    it("should fall back to defaults for unknown values", () => {
      expect(getCardTypeColor("unknown")).toBe("#95a5a6");
      expect(getRarityColor("unknown")).toBe(getRarityColor("common"));
    });
  });
});
