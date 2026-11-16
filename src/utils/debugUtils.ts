/**
 * Debug logging that is silent unless debug mode is on.
 *
 * The flag lives here rather than being read from the game store so that
 * engine and utility modules can log without importing the store (which
 * imports them). The store keeps the flag in sync via `setDebugMode`.
 */

let debugEnabled = false;

/** Turns debug logging on or off. Called by the game store. */
export const setDebugMode = (enabled: boolean): void => {
  debugEnabled = enabled;
};

export const isDebugMode = (): boolean => debugEnabled;

type ConsoleMethod = "log" | "error" | "warn" | "info";

const createLogger =
  (method: ConsoleMethod) =>
  (...args: unknown[]): void => {
    if (debugEnabled) {
      console[method](...args);
    }
  };

/** Console wrapper that only prints while debug mode is on. */
export const debugConsole = {
  log: createLogger("log"),
  error: createLogger("error"),
  warn: createLogger("warn"),
  info: createLogger("info"),
};
