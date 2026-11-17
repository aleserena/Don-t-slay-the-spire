import { StoreApi } from "zustand";
import { GamePhase } from "../types/game";
import { clearSave, hasSave, toSavedRun, writeSave } from "./saveGame";
import { GameStore } from "./types";

/**
 * Keeps the saved run in step with the store: the run is saved whenever it
 * is on the map, and the save is removed when the run ends. Also tells the
 * store whether a save exists, for the title screen.
 *
 * Installed by the app on start-up rather than by the store itself, so code
 * that only uses the store (tests, tools) does not touch storage.
 *
 * @returns a function that stops autosaving
 */
export const installAutosave = (store: StoreApi<GameStore>): (() => void) => {
  store.setState({ hasSavedGame: hasSave() });

  return store.subscribe((state, previous) => {
    if (state.gamePhase === GamePhase.MAP) {
      // Only the saved fields matter; skip changes to anything else
      const changed =
        previous.gamePhase !== GamePhase.MAP ||
        state.player !== previous.player ||
        state.persistentDeck !== previous.persistentDeck ||
        state.map !== previous.map ||
        state.rngState !== previous.rngState;
      const run = changed ? toSavedRun(state) : null;
      if (run) writeSave(run);
    } else if (
      state.gamePhase === GamePhase.GAME_OVER ||
      state.gamePhase === GamePhase.VICTORY
    ) {
      if (previous.gamePhase !== state.gamePhase) clearSave();
    }
  });
};
