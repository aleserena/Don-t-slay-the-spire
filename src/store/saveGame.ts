/**
 * Saving a run to the browser's local storage.
 *
 * A run is saved while it is on the map. Together with the run's random
 * state that is enough to continue it exactly: nothing from inside a combat
 * needs to be stored. Storage problems never reach the game: a save that
 * cannot be read counts as no save.
 */

import { Card, Player } from "../types/game";
import { GameMap } from "../types/map";
import { StoreState } from "./types";

export const SAVE_KEY = "dsts.save";

/** Bumped whenever the shape of a saved run changes. */
export const SAVE_VERSION = 1;

export interface SavedRun {
  version: number;
  seed: number;
  rngState: number;
  player: Player;
  persistentDeck: Card[];
  map: GameMap;
  currentFloor: number;
}

const getStorage = (): Storage | null => {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    // Access to storage can be denied (e.g. privacy settings)
    return null;
  }
};

/** The part of the store that a save keeps. */
export const toSavedRun = (
  state: Pick<
    StoreState,
    "seed" | "rngState" | "player" | "persistentDeck" | "map" | "currentFloor"
  >,
): SavedRun | null =>
  state.map
    ? {
        version: SAVE_VERSION,
        seed: state.seed,
        rngState: state.rngState,
        // Block, energy, statuses and powers belong to a combat
        player: {
          ...state.player,
          block: 0,
          energy: state.player.maxEnergy,
          statusEffects: [],
          powerCards: [],
        },
        persistentDeck: state.persistentDeck,
        map: state.map,
        currentFloor: state.currentFloor,
      }
    : null;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Whether a parsed value has the shape of a save this version can load. */
const isSavedRun = (value: unknown): value is SavedRun => {
  if (!isObject(value) || value.version !== SAVE_VERSION) return false;

  const { seed, rngState, player, persistentDeck, map, currentFloor } = value;
  return (
    typeof seed === "number" &&
    typeof rngState === "number" &&
    typeof currentFloor === "number" &&
    Array.isArray(persistentDeck) &&
    isObject(player) &&
    typeof player.health === "number" &&
    typeof player.maxHealth === "number" &&
    typeof player.gold === "number" &&
    Array.isArray(player.relics) &&
    isObject(map) &&
    Array.isArray(map.nodes)
  );
};

export const writeSave = (run: SavedRun): void => {
  try {
    getStorage()?.setItem(SAVE_KEY, JSON.stringify(run));
  } catch {
    // Storage full or unavailable: the run simply is not saved
  }
};

/** The saved run, or `null` if there is none or it cannot be used. */
export const readSave = (): SavedRun | null => {
  try {
    const raw = getStorage()?.getItem(SAVE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return isSavedRun(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const clearSave = (): void => {
  try {
    getStorage()?.removeItem(SAVE_KEY);
  } catch {
    // Nothing to do
  }
};

export const hasSave = (): boolean => readSave() !== null;
