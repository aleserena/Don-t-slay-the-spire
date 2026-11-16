/**
 * Rules of the generated map (plans/2026-11-16-run-structure.md), checked
 * over many seeds.
 */
import { describe, expect, it } from "vitest";
import { GameMap, MapNode, NodeType } from "../../types/map";
import { generateMap, MAP_HEIGHT, MAP_WIDTH } from "../mapGeneration";
import { createSeededRng } from "../random";

const SEEDS = Array.from({ length: 50 }, (_, index) => index * 7919 + 1);

const forEachMap = (check: (map: GameMap, seed: number) => void) => {
  for (const seed of SEEDS) {
    check(generateMap(createSeededRng(seed)), seed);
  }
};

const byId = (map: GameMap) =>
  new Map(map.nodes.map((node) => [node.id, node]));

const children = (map: GameMap, node: MapNode): MapNode[] => {
  const nodes = byId(map);
  return node.connections.map((id) => nodes.get(id)!);
};

/** Everything about a map that the rules use (ids are random). */
const shape = (map: GameMap) => {
  const index = new Map(map.nodes.map((node, i) => [node.id, i]));
  return map.nodes.map((node) => ({
    x: node.x,
    y: node.y,
    type: node.type,
    connections: node.connections.map((id) => index.get(id)),
  }));
};

describe("map rules", () => {
  it("keeps nodes on the grid, at most one per cell", () => {
    forEachMap((map) => {
      const cells = new Set<string>();
      for (const node of map.nodes) {
        expect(node.x).toBeGreaterThanOrEqual(0);
        expect(node.x).toBeLessThan(MAP_WIDTH);
        expect(node.y).toBeGreaterThanOrEqual(0);
        expect(node.y).toBeLessThan(MAP_HEIGHT);
        cells.add(`${node.y}:${node.x}`);
      }
      expect(cells.size).toBe(map.nodes.length);
    });
  });

  it("gives the fixed floors their types", () => {
    forEachMap((map) => {
      const typesOn = (floor: number) => [
        ...new Set(map.nodes.filter((n) => n.y === floor).map((n) => n.type)),
      ];

      expect(typesOn(0)).toEqual([NodeType.COMBAT]);
      expect(typesOn(7)).toEqual([NodeType.TREASURE]);
      expect(typesOn(13)).toEqual([NodeType.REST]);
      expect(typesOn(14)).toEqual([NodeType.BOSS]);
      expect(map.nodes.filter((n) => n.type === NodeType.BOSS)).toHaveLength(1);
    });
  });

  it("offers a choice at the start", () => {
    forEachMap((map) => {
      const starts = map.nodes.filter((n) => n.y === 0);
      expect(starts.length).toBeGreaterThanOrEqual(2);
      expect(starts.every((n) => n.available)).toBe(true);
    });
  });

  it("makes every node reachable and able to reach the boss", () => {
    forEachMap((map) => {
      const boss = map.nodes.find((n) => n.type === NodeType.BOSS)!;

      const reachable = new Set<string>();
      const visit = (node: MapNode) => {
        if (reachable.has(node.id)) return;
        reachable.add(node.id);
        children(map, node).forEach(visit);
      };
      map.nodes.filter((n) => n.y === 0).forEach(visit);
      expect(reachable.size).toBe(map.nodes.length);

      for (const node of map.nodes) {
        if (node === boss) continue;
        expect(node.connections.length).toBeGreaterThan(0);
        expect(children(map, node).every((c) => c.y === node.y + 1)).toBe(true);
      }
    });
  });

  it("never crosses two edges", () => {
    forEachMap((map, seed) => {
      for (let floor = 0; floor < MAP_HEIGHT - 2; floor++) {
        const edges = map.nodes
          .filter((n) => n.y === floor)
          .flatMap((n) => children(map, n).map((c) => [n.x, c.x] as const));

        for (const [fromA, toA] of edges) {
          for (const [fromB, toB] of edges) {
            const crosses = fromA < fromB && toA > toB;
            expect(crosses, `seed ${seed}, floor ${floor}`).toBe(false);
          }
        }
      }
    });
  });

  it("only steps to the same or a neighbouring column", () => {
    forEachMap((map) => {
      for (const node of map.nodes.filter((n) => n.y < MAP_HEIGHT - 2)) {
        for (const child of children(map, node)) {
          expect(Math.abs(child.x - node.x)).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  it("keeps elites, rest sites and shops off the floors they may not be on", () => {
    forEachMap((map) => {
      for (const node of map.nodes) {
        if (node.type === NodeType.ELITE) {
          expect(node.y).toBeGreaterThanOrEqual(4);
        }
        if (node.type === NodeType.REST) {
          expect(node.y).toBeGreaterThanOrEqual(4);
          expect(node.y).not.toBe(12);
        }
        if (node.type === NodeType.SHOP) {
          expect(node.y).toBeGreaterThanOrEqual(2);
        }
      }
    });
  });

  it("never puts the same special node type twice in a row", () => {
    forEachMap((map, seed) => {
      for (const node of map.nodes) {
        if (
          ![NodeType.ELITE, NodeType.REST, NodeType.SHOP].includes(node.type)
        ) {
          continue;
        }
        for (const child of children(map, node)) {
          expect(child.type, `seed ${seed}, floor ${node.y}`).not.toBe(
            node.type,
          );
        }
      }
    });
  });

  it("always has a shop and an elite", () => {
    forEachMap((map) => {
      const types = map.nodes.map((n) => n.type);
      expect(types).toContain(NodeType.SHOP);
      expect(types).toContain(NodeType.ELITE);
    });
  });

  it("generates the same map from the same seed", () => {
    for (const seed of SEEDS.slice(0, 10)) {
      expect(shape(generateMap(createSeededRng(seed)))).toEqual(
        shape(generateMap(createSeededRng(seed))),
      );
    }
    expect(shape(generateMap(createSeededRng(1)))).not.toEqual(
      shape(generateMap(createSeededRng(2))),
    );
  });
});
