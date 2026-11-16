import { GamePhase } from "../../types/game";
import { createNewRunState, createOutOfCombatPiles } from "../initialState";
import { hasSave, readSave } from "../saveGame";
import { RunActions, SliceCreator, UiActions } from "../types";

export const createRunSlice: SliceCreator<RunActions> = (set, get) => ({
  startNewRun: (seed) => set(createNewRunState(seed)),

  startNewGame: (seed) =>
    set({ ...createNewRunState(seed), gamePhase: GamePhase.MAP }),

  returnToTitle: () =>
    set({
      gamePhase: GamePhase.TITLE,
      selectedCard: null,
      // The title screen offers "Continue" when a run is stored
      hasSavedGame: hasSave(),
    }),

  loadSavedGame: () => {
    const saved = readSave();
    if (saved) {
      set({
        ...createNewRunState(saved.seed),
        ...createOutOfCombatPiles(saved.persistentDeck),
        player: saved.player,
        map: saved.map,
        currentFloor: saved.currentFloor,
        rngState: saved.rngState,
        gamePhase: GamePhase.MAP,
        hasSavedGame: true,
      });
      return;
    }

    // No stored run: resume the one still in memory, if there is one
    if (get().hasSavedGame) {
      set({ gamePhase: GamePhase.MAP });
    }
  },
});

export const createUiSlice: SliceCreator<UiActions> = (set) => ({
  setSelectedCard: (card) => set({ selectedCard: card }),

  openCardRemovalModal: () =>
    set({ showCardRemovalModal: true, selectedCard: null }),

  closeCardRemovalModal: () =>
    set({ showCardRemovalModal: false, selectedCard: null }),

  openCardUpgradeModal: () =>
    set({ showCardUpgradeModal: true, selectedCard: null }),

  closeCardUpgradeModal: () =>
    set({ showCardUpgradeModal: false, selectedCard: null }),

  toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
});
