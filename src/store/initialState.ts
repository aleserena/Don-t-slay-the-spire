import { Card, GamePhase, GameState, Player, TurnPhase } from "../types/game";
import { createInitialDeck } from "../data/cards";
import { getStarterRelic } from "../data/relics";
import { generateMap } from "../utils/mapGeneration";
import { withoutTemporaryCards } from "../engine/deck";
import { createCombatCounters } from "../engine/triggers";
import { createRandomSeed, createSeededRng, Rng } from "../utils/random";
import { StoreState } from "./types";

/** A new player with starting stats and the starter relic. */
export const createInitialPlayer = (): Player => ({
  health: 80,
  maxHealth: 80,
  block: 0,
  energy: 3,
  maxEnergy: 3,
  statusEffects: [],
  gold: 99,
  relics: [getStarterRelic()],
  powerCards: [],
});

/** Core game state for a fresh run: starter deck, new map, no combat. */
export const createInitialGameState = (rng: Rng = Math.random): GameState => {
  const deck = createInitialDeck();
  return {
    player: createInitialPlayer(),
    enemies: [],
    hand: [],
    drawPile: [...deck],
    discardPile: [],
    exhaustPile: [],
    currentTurn: TurnPhase.PLAYER_TURN,
    gamePhase: GamePhase.TITLE,
    map: generateMap(rng),
    combatReward: undefined,
    currentEvent: undefined,
    currentShop: undefined,
    stepInProgress: false,
    stepType: undefined,
    persistentDeck: deck,
  };
};

/**
 * Everything a new run resets. Settings that outlive a run (debug mode) are
 * not included. The same seed always produces the same run.
 */
export const createNewRunState = (
  seed?: number,
): Omit<StoreState, "debugMode"> => {
  // Anything that is not a number (e.g. a click event passed by a button)
  // means "pick a seed"
  const runSeed = typeof seed === "number" ? seed >>> 0 : createRandomSeed();
  const rng = createSeededRng(runSeed);
  const gameState = createInitialGameState(rng);

  return {
    ...gameState,
    firstAttackThisCombat: true,
    selectedCard: null,
    showCardRemovalModal: false,
    showCardUpgradeModal: false,
    currentFloor: 1,
    hasSavedGame: false,
    playerTurnThisCombat: 0,
    combat: createCombatCounters(),
    seed: runSeed,
    rngState: rng.state,
  };
};

/**
 * Pile state outside of combat: the whole deck sits in the draw pile and the
 * other piles are empty. Temporary combat cards are dropped.
 */
export const createOutOfCombatPiles = (deck: Card[]) => {
  const persistentDeck = withoutTemporaryCards(deck);
  return {
    persistentDeck,
    drawPile: persistentDeck,
    discardPile: [] as Card[],
    exhaustPile: [] as Card[],
    hand: [] as Card[],
  };
};
