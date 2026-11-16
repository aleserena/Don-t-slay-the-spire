import { MapNode, NodeType, GameMap } from "../types/map";
import { v4 as uuidv4 } from "uuid";
import { pickRandom, pickWeighted, randomInt, Rng } from "./random";

/** Columns a node can sit in (`x` is 0 to MAP_WIDTH - 1). */
export const MAP_WIDTH = 7;
/** Floors in the map (`y` is 0 to MAP_HEIGHT - 1); the last one is the boss. */
export const MAP_HEIGHT = 15;

/** Routes drawn from the first floor to the floor before the boss. */
const PATH_COUNT = 6;

const BOSS_FLOOR = MAP_HEIGHT - 1;
/** The floor before the boss is always a rest site. */
const FINAL_REST_FLOOR = BOSS_FLOOR - 1;
/** A guaranteed treasure halfway up. */
const TREASURE_FLOOR = 7;
const BOSS_COLUMN = Math.floor(MAP_WIDTH / 2);

/** Relative chance of each node type on a floor without a fixed type. */
const NODE_TYPE_WEIGHTS: Partial<Record<NodeType, number>> = {
  [NodeType.COMBAT]: 45,
  [NodeType.EVENT]: 22,
  [NodeType.ELITE]: 12,
  [NodeType.SHOP]: 11,
  [NodeType.REST]: 10,
};

/** First floor each node type may appear on. */
const FIRST_FLOOR: Partial<Record<NodeType, number>> = {
  [NodeType.ELITE]: 4,
  [NodeType.REST]: 4,
  [NodeType.SHOP]: 2,
};

/** Types that may not directly follow a node of the same type. */
const NO_REPEAT_TYPES = [NodeType.ELITE, NodeType.REST, NodeType.SHOP];

/** Floors on which a combat node may be turned into a missing shop/elite. */
const GUARANTEE_FLOORS = { first: 4, last: 11 };

const cellKey = (floor: number, column: number) => `${floor}:${column}`;

/**
 * Draws the routes of the map as edges between grid cells. Each route steps
 * to the same or a neighbouring column on the next floor and never crosses
 * an edge another route already drew.
 *
 * @returns for each cell that is part of a route, the columns it leads to
 */
const drawPaths = (rng: Rng): Map<string, Set<number>> => {
  const edges = new Map<string, Set<number>>();
  const hasEdge = (floor: number, from: number, to: number) =>
    edges.get(cellKey(floor, from))?.has(to) ?? false;

  const startColumns: number[] = [];

  for (let path = 0; path < PATH_COUNT; path++) {
    let column = randomInt(0, MAP_WIDTH - 1, rng);
    // Two different starting points at least, so the first choice is real
    if (path === 1 && column === startColumns[0]) {
      column = (column + randomInt(1, MAP_WIDTH - 1, rng)) % MAP_WIDTH;
    }
    startColumns.push(column);

    for (let floor = 0; floor < FINAL_REST_FLOOR; floor++) {
      const from = column;
      const options = [from - 1, from, from + 1].filter(
        (to) =>
          to >= 0 &&
          to < MAP_WIDTH &&
          // A diagonal crosses the opposite diagonal between the same columns
          (to === from || !hasEdge(floor, to, from)),
      );
      column = pickRandom(options, rng)!;

      const key = cellKey(floor, from);
      if (!edges.has(key)) edges.set(key, new Set());
      edges.get(key)!.add(column);
    }

    // The last cell of the route exists even though it has no edge yet
    const lastKey = cellKey(FINAL_REST_FLOOR, column);
    if (!edges.has(lastKey)) edges.set(lastKey, new Set());
  }

  return edges;
};

const fixedTypeForFloor = (floor: number): NodeType | undefined => {
  if (floor === 0) return NodeType.COMBAT;
  if (floor === BOSS_FLOOR) return NodeType.BOSS;
  if (floor === FINAL_REST_FLOOR) return NodeType.REST;
  if (floor === TREASURE_FLOOR) return NodeType.TREASURE;
  return undefined;
};

const isAllowedOnFloor = (type: NodeType, floor: number): boolean => {
  if (floor < (FIRST_FLOOR[type] ?? 0)) return false;
  // The floor after it is always a rest site
  if (type === NodeType.REST && floor === FINAL_REST_FLOOR - 1) return false;
  return true;
};

/** Rolls a type for a node, given the types of the nodes that lead to it. */
const rollNodeType = (
  floor: number,
  parentTypes: NodeType[],
  rng: Rng,
): NodeType => {
  const candidates = (Object.keys(NODE_TYPE_WEIGHTS) as NodeType[]).filter(
    (type) =>
      isAllowedOnFloor(type, floor) &&
      !(NO_REPEAT_TYPES.includes(type) && parentTypes.includes(type)),
  );
  return (
    pickWeighted(candidates, (type) => NODE_TYPE_WEIGHTS[type] ?? 0, rng) ??
    NodeType.COMBAT
  );
};

/** Makes sure the map has at least one node of `type`. */
const guaranteeType = (nodes: MapNode[], type: NodeType, rng: Rng): void => {
  if (nodes.some((node) => node.type === type)) return;

  const candidates = nodes.filter(
    (node) =>
      node.type === NodeType.COMBAT &&
      node.y >= GUARANTEE_FLOORS.first &&
      node.y <= GUARANTEE_FLOORS.last,
  );
  const node = pickRandom(candidates, rng);
  if (node) node.type = type;
};

/**
 * Generates the map of a run.
 *
 * Routes are drawn first, so every node is on a way from the first floor to
 * the boss and the routes never cross. Node types then follow per-floor
 * rules: a combat to start, a treasure halfway, a rest site before the boss,
 * and no elite or rest site in the first floors. The same `rng` sequence
 * always produces the same map (node ids aside).
 */
export const generateMap = (rng: Rng = Math.random): GameMap => {
  const edges = drawPaths(rng);

  // One node per cell on a route, floor by floor, left to right
  const nodes: MapNode[] = [];
  const nodeAt = new Map<string, MapNode>();
  for (let floor = 0; floor <= FINAL_REST_FLOOR; floor++) {
    for (let column = 0; column < MAP_WIDTH; column++) {
      const key = cellKey(floor, column);
      if (!edges.has(key)) continue;

      const node: MapNode = {
        id: uuidv4(),
        type: NodeType.COMBAT,
        x: column,
        y: floor,
        connections: [],
        completed: false,
        // Only first floor nodes are initially available
        available: floor === 0,
      };
      nodes.push(node);
      nodeAt.set(key, node);
    }
  }

  const boss: MapNode = {
    id: uuidv4(),
    type: NodeType.BOSS,
    x: BOSS_COLUMN,
    y: BOSS_FLOOR,
    connections: [],
    completed: false,
    available: false,
  };

  // Connections, and the parents of each node for the type rules
  const parents = new Map<string, MapNode[]>();
  for (const node of nodes) {
    const targets =
      node.y === FINAL_REST_FLOOR
        ? [boss]
        : [...edges.get(cellKey(node.y, node.x))!]
            .sort((a, b) => a - b)
            .map((column) => nodeAt.get(cellKey(node.y + 1, column))!);

    for (const target of targets) {
      node.connections.push(target.id);
      parents.set(target.id, [...(parents.get(target.id) ?? []), node]);
    }
  }

  // Types, floor by floor so the parents' types are known
  for (const node of nodes) {
    node.type =
      fixedTypeForFloor(node.y) ??
      rollNodeType(
        node.y,
        (parents.get(node.id) ?? []).map((parent) => parent.type),
        rng,
      );
  }
  guaranteeType(nodes, NodeType.SHOP, rng);
  guaranteeType(nodes, NodeType.ELITE, rng);

  return {
    nodes: [...nodes, boss],
    currentNodeId: null,
    floor: 0,
    maxFloor: BOSS_FLOOR,
  };
};

export const getAvailableNodes = (map: GameMap): MapNode[] => {
  return map.nodes.filter((node) => node.available && !node.completed);
};

export const completeNode = (map: GameMap, nodeId: string): GameMap => {
  const nodeToComplete = map.nodes.find((n) => n.id === nodeId);

  // Don't modify if node doesn't exist, is already completed, or is not available
  if (
    !nodeToComplete ||
    nodeToComplete.completed ||
    !nodeToComplete.available
  ) {
    return map;
  }

  const updatedNodes = map.nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, completed: true };
    }
    // Disable all nodes from previous floors AND same floor (except the completed one)
    if (node.y <= nodeToComplete.y && !node.completed) {
      return { ...node, available: false };
    }
    return node;
  });

  // Make connected nodes available ONLY if they are on the immediate next floor
  nodeToComplete.connections.forEach((connectionId) => {
    const nodeIndex = updatedNodes.findIndex((n) => n.id === connectionId);
    if (nodeIndex !== -1) {
      const connectedNode = updatedNodes[nodeIndex];
      // Only make available if it's on the immediate next floor (y = current node's y + 1)
      if (connectedNode.y === nodeToComplete.y + 1) {
        updatedNodes[nodeIndex] = {
          ...updatedNodes[nodeIndex],
          available: true,
        };
      }
    }
  });

  // Update floor to the next floor
  const newFloor = nodeToComplete.y + 1;

  return {
    ...map,
    nodes: updatedNodes,
    currentNodeId: nodeId,
    floor: newFloor,
  };
};

export const getNodeById = (
  map: GameMap,
  nodeId: string,
): MapNode | undefined => {
  return map.nodes.find((node) => node.id === nodeId);
};
