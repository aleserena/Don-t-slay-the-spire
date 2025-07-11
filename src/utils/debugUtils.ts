import { useGameStore } from "../store/gameStore";

// Debug console wrapper that respects debug mode
export const debugConsole = {
  log: (...args: unknown[]) => {
    const { debugMode } = useGameStore.getState();
    if (debugMode) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    const { debugMode } = useGameStore.getState();
    if (debugMode) {
      console.error(...args);
    }
  },

  warn: (...args: unknown[]) => {
    const { debugMode } = useGameStore.getState();
    if (debugMode) {
      console.warn(...args);
    }
  },

  info: (...args: unknown[]) => {
    const { debugMode } = useGameStore.getState();
    if (debugMode) {
      console.info(...args);
    }
  },
};

// Alternative approach for cases where we need to check debug mode inline
export const isDebugMode = (): boolean => {
  return useGameStore.getState().debugMode;
};
