/**
 * Every piece of text that names or describes the game, in one place.
 *
 * The screens read these instead of spelling the name out, so giving the
 * game its own identity later is a change to this file (and to the page
 * title in `index.html`).
 */

declare const __APP_VERSION__: string | undefined;

export const BRANDING = {
  /** Name shown on the title screen and in the header. */
  title: "Deckbuilder",
  /** Short line under the title. */
  subtitle: "A roguelike card game",
  /** One or two sentences on the title screen. */
  tagline:
    "Build a deck as you climb, pick your route, and defeat what waits at the top.",
  /** Name of the place the map shows, used as "<mapName> - Floor 3". */
  mapName: "The Climb",
  /** Line on the victory screen. */
  victoryMessage: "You reached the top and defeated the boss.",
  /** Line on the defeat screen. */
  defeatMessage: "Your journey ends here...",
} as const;

/** Version shown on the title screen, when the build provides one. */
export const APP_VERSION: string | undefined =
  typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : undefined;
