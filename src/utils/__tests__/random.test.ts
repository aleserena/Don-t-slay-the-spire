import { describe, it, expect } from "vitest";
import {
  createSeededRng,
  pickRandom,
  pickWeighted,
  randomInt,
  shuffle,
} from "../random";
import { createInstanceId } from "../ids";

describe("random helpers", () => {
  describe("createSeededRng", () => {
    it("should produce the same sequence for the same seed", () => {
      const a = createSeededRng(42);
      const b = createSeededRng(42);

      expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    });

    it("should stay within [0, 1)", () => {
      const rng = createSeededRng(7);

      for (let i = 0; i < 1000; i++) {
        const value = rng();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe("randomInt", () => {
    it("should include both bounds and nothing outside them", () => {
      const rng = createSeededRng(1);
      const seen = new Set<number>();

      for (let i = 0; i < 500; i++) seen.add(randomInt(10, 12, rng));

      expect([...seen].sort()).toEqual([10, 11, 12]);
    });
  });

  describe("pickRandom", () => {
    it("should return undefined for an empty list", () => {
      expect(pickRandom([])).toBeUndefined();
    });

    it("should only return items from the list", () => {
      const items = ["a", "b", "c"];
      const rng = createSeededRng(3);

      for (let i = 0; i < 50; i++) {
        expect(items).toContain(pickRandom(items, rng));
      }
    });
  });

  describe("pickWeighted", () => {
    it("should return undefined for an empty list", () => {
      expect(pickWeighted([], () => 1)).toBeUndefined();
    });

    it("should never pick an item with zero weight", () => {
      const items = [
        { name: "never", weight: 0 },
        { name: "always", weight: 5 },
      ];
      const rng = createSeededRng(9);

      for (let i = 0; i < 200; i++) {
        expect(pickWeighted(items, (item) => item.weight, rng)?.name).toBe(
          "always",
        );
      }
    });

    it("should pick the last weighted item when the roll is at the top", () => {
      const items = [
        { name: "first", weight: 1 },
        { name: "last", weight: 1 },
        { name: "unweighted", weight: 0 },
      ];

      expect(
        pickWeighted(
          items,
          (item) => item.weight,
          () => 0.999999,
        )?.name,
      ).toBe("last");
    });

    it("should pick more heavily weighted items more often", () => {
      const items = [
        { name: "heavy", weight: 90 },
        { name: "light", weight: 10 },
      ];
      const rng = createSeededRng(11);
      let heavy = 0;

      for (let i = 0; i < 1000; i++) {
        if (pickWeighted(items, (item) => item.weight, rng)?.name === "heavy") {
          heavy++;
        }
      }

      expect(heavy).toBeGreaterThan(800);
      expect(heavy).toBeLessThan(1000);
    });

    it("should fall back to a uniform pick when every weight is zero", () => {
      const items = ["a", "b"];

      expect(items).toContain(pickWeighted(items, () => 0));
    });
  });

  describe("shuffle", () => {
    it("should keep every item and not modify the input", () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8];
      const copy = [...items];

      const shuffled = shuffle(items, createSeededRng(5));

      expect(items).toEqual(copy);
      expect([...shuffled].sort((a, b) => a - b)).toEqual(copy);
    });

    it("should put each item in each position about equally often", () => {
      const rng = createSeededRng(123);
      const runs = 6000;
      // counts[item][position]
      const counts = [0, 1, 2].map(() => [0, 0, 0]);

      for (let i = 0; i < runs; i++) {
        shuffle([0, 1, 2], rng).forEach((item, position) => {
          counts[item][position]++;
        });
      }

      for (const positions of counts) {
        for (const count of positions) {
          expect(count).toBeGreaterThan(runs / 3 - 200);
          expect(count).toBeLessThan(runs / 3 + 200);
        }
      }
    });
  });

  describe("createInstanceId", () => {
    it("should create distinct ids for the same base id", () => {
      const ids = new Set(
        Array.from({ length: 100 }, () => createInstanceId("strike")),
      );

      expect(ids.size).toBe(100);
    });

    it("should keep the base id and tag as a prefix", () => {
      expect(createInstanceId("strike")).toMatch(/^strike_/);
      expect(createInstanceId("strike", "copy")).toMatch(/^strike_copy_/);
    });
  });
});
