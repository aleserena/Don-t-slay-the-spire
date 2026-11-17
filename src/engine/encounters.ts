/**
 * Which enemies the player meets, by how far up the map they are.
 */

import { Enemy } from "../types/game";
import {
  createAcidSlime,
  createFatGremlin,
  createFungiBeast,
  createGreenLouse,
  createGremlinNob,
  createJawWorm,
  createLooter,
  createMadGremlin,
  createRedLouse,
  createSentryBot,
  createSneakyGremlin,
  createSpikeSlime,
  createTestEnemy as createCultist,
} from "../data/enemies";
import { createInstanceId } from "../utils/ids";
import { pickRandom, Rng } from "../utils/random";
import {
  EASY_FLOORS_END,
  HARD_FLOORS_START,
  HARD_HEALTH_MULTIPLIER,
} from "./constants";

export type EncounterTier = "easy" | "normal" | "hard";

type Encounter = () => Enemy[];

/** The first fights: one enemy, or two small ones. */
const EASY_ENCOUNTERS: Encounter[] = [
  () => [createCultist()],
  () => [createJawWorm()],
  () => [createLooter()],
  () => [createSpikeSlime()],
  () => [createRedLouse(), createGreenLouse()],
  () => [createFungiBeast(), createFungiBeast()],
];

/** The middle of the map: groups. */
const NORMAL_ENCOUNTERS: Encounter[] = [
  () => [createCultist(), createLooter()],
  () => [createAcidSlime(), createSpikeSlime()],
  () => [createJawWorm(), createFungiBeast()],
  () => [createLooter(), createRedLouse(), createGreenLouse()],
  () => [createFatGremlin(), createMadGremlin(), createSneakyGremlin()],
  () => [createAcidSlime(), createFungiBeast()],
];

/** Elite nodes: one strong enemy, or a group of guards. */
const ELITE_ENCOUNTERS: Encounter[] = [
  () => [createGremlinNob()],
  () => [createSentryBot(), createSentryBot(), createSentryBot()],
];

export const getEncounterTier = (floor: number): EncounterTier => {
  if (floor <= EASY_FLOORS_END) return "easy";
  return floor >= HARD_FLOORS_START ? "hard" : "normal";
};

const scaleHealth = (enemy: Enemy, multiplier: number): Enemy => ({
  ...enemy,
  health: Math.floor(enemy.health * multiplier),
  maxHealth: Math.floor(enemy.maxHealth * multiplier),
});

/** Two enemies of the same kind must not share an id. */
const withUniqueId = (enemy: Enemy): Enemy => ({
  ...enemy,
  id: createInstanceId(enemy.id.split("_").slice(0, 2).join("_")),
});

const build = (pool: Encounter[], floor: number, rng: Rng): Enemy[] => {
  const multiplier =
    getEncounterTier(floor) === "hard" ? HARD_HEALTH_MULTIPLIER : 1;

  return pickRandom(pool, rng)!()
    .map((enemy) => (multiplier === 1 ? enemy : scaleHealth(enemy, multiplier)))
    .map(withUniqueId);
};

/** The enemies of a normal combat node on the given (0-based) floor. */
export const createCombatEncounter = (
  floor: number,
  rng: Rng = Math.random,
): Enemy[] =>
  build(
    getEncounterTier(floor) === "easy" ? EASY_ENCOUNTERS : NORMAL_ENCOUNTERS,
    floor,
    rng,
  ).map((enemy) => ({ ...enemy, isElite: false }));

/** The enemies of an elite node on the given (0-based) floor. */
export const createEliteEncounter = (
  floor: number,
  rng: Rng = Math.random,
): Enemy[] =>
  build(ELITE_ENCOUNTERS, floor, rng).map((enemy) => ({
    ...enemy,
    isElite: true,
  }));
