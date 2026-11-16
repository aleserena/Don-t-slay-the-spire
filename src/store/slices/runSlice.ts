import { GamePhase } from "../../types/game";
import { createNewRunState } from "../initialState";
import { RunActions, SliceCreator, UiActions } from "../types";

export const createRunSlice: SliceCreator<RunActions> = (set, get) => ({
  startNewRun: () => set(createNewRunState()),

  startNewGame: () => set({ ...createNewRunState(), gamePhase: GamePhase.MAP }),

  returnToTitle: () => set({ gamePhase: GamePhase.TITLE, selectedCard: null }),

  loadSavedGame: () => {
    // Saving is not implemented yet; this only resumes the in-memory run
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
