/**
 * Randomness helpers shared by the engine and the data generators.
 *
 * Every helper takes an optional `rng` so callers (and tests) can pass a
 * deterministic source instead of `Math.random`.
 */

export type Rng = () => number;

/**
 * A deterministic random source whose position in its sequence can be read
 * and stored: `createSeededRng(rng.state)` continues where `rng` is.
 */
export interface SeededRng {
  (): number;
  readonly state: number;
}

/**
 * Creates a deterministic random source (mulberry32). The same seed always
 * produces the same sequence, which makes random behavior reproducible.
 */
export const createSeededRng = (seed: number): SeededRng => {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Object.defineProperty(next, "state", { get: () => state, enumerable: true });
  return next as SeededRng;
};

/** A new seed for a run: an unsigned 32-bit integer. */
export const createRandomSeed = (): number =>
  Math.floor(Math.random() * 4294967296) >>> 0;

/** Random integer in `[min, max]`, both inclusive. */
export const randomInt = (
  min: number,
  max: number,
  rng: Rng = Math.random,
): number => Math.floor(rng() * (max - min + 1)) + min;

/** Picks one item uniformly at random. Returns `undefined` for an empty list. */
export const pickRandom = <T>(
  items: readonly T[],
  rng: Rng = Math.random,
): T | undefined =>
  items.length === 0 ? undefined : items[Math.floor(rng() * items.length)];

/**
 * Picks one item with probability proportional to its weight. Items with a
 * weight of zero or less are never picked unless every weight is zero, in
 * which case the pick is uniform. Returns `undefined` for an empty list.
 */
export const pickWeighted = <T>(
  items: readonly T[],
  getWeight: (item: T) => number,
  rng: Rng = Math.random,
): T | undefined => {
  if (items.length === 0) return undefined;

  const weights = items.map((item) => Math.max(0, getWeight(item)));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) return pickRandom(items, rng);

  let roll = rng() * totalWeight;
  let lastWeighted = items[0];
  for (let i = 0; i < items.length; i++) {
    if (weights[i] <= 0) continue;
    lastWeighted = items[i];
    roll -= weights[i];
    if (roll < 0) return items[i];
  }
  // Floating point rounding can leave a sliver past the last weighted item
  return lastWeighted;
};

/** Returns a shuffled copy (unbiased Fisher-Yates). The input is not modified. */
export const shuffle = <T>(
  items: readonly T[],
  rng: Rng = Math.random,
): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
