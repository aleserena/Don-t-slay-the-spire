/**
 * The game store (Zustand).
 *
 * The store only holds state and sequences actions. The rules themselves are
 * pure functions in `src/engine`, and the actions are grouped by area in
 * `./slices`:
 *
 * - `runSlice`    new run, title screen, UI state (modals, debug mode)
 * - `mapSlice`    map nodes, events, rest sites
 * - `combatSlice` turns, playing cards, the enemy turn
 * - `rewardSlice` card and relic rewards
 * - `shopSlice`   shop purchases and card removal
 *
 * @example
 * ```typescript
 * const { player, enemies, hand } = useGameStore();
 * const { playCard, endTurn } = useGameStore();
 * playCard(hand[0].id, enemies[0].id);
 * ```
 */

import { create } from "zustand";
import { setDebugMode } from "../utils/debugUtils";
import { createNewRunState } from "./initialState";
import { createCombatSlice } from "./slices/combatSlice";
import { createMapSlice } from "./slices/mapSlice";
import { createRewardSlice } from "./slices/rewardSlice";
import { createRunSlice, createUiSlice } from "./slices/runSlice";
import { createShopSlice } from "./slices/shopSlice";
import { GameStore } from "./types";

export type { GameStore } from "./types";

export const useGameStore = create<GameStore>((set, get) => ({
  ...createNewRunState(),
  debugMode: false,
  ...createRunSlice(set, get),
  ...createUiSlice(set, get),
  ...createMapSlice(set, get),
  ...createCombatSlice(set, get),
  ...createRewardSlice(set, get),
  ...createShopSlice(set, get),
}));

// Debug logging lives outside the store so the engine can log without
// importing it; keep its switch in sync with the store's debug mode.
setDebugMode(useGameStore.getState().debugMode);
useGameStore.subscribe((state) => setDebugMode(state.debugMode));
