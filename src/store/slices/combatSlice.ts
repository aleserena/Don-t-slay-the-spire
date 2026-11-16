import {
  CardType,
  GamePhase,
  Player,
  PowerTrigger,
  RelicTrigger,
  TurnPhase,
} from "../../types/game";
import { getEnergyCost, resolveCardPlay } from "../../engine/cardPlay";
import {
  chooseNextCard,
  createCombatState,
  createVictoryState,
  resolveEnemyCard,
  startPlayerTurn,
  tickEnemies,
} from "../../engine/combat";
import { HAND_SIZE } from "../../engine/constants";
import { drawCards } from "../../engine/deck";
import { processPowerCardEffects } from "../../utils/powerCardEffects";
import { processRelicEffects } from "../../utils/relicEffects";
import { processStatusEffects } from "../../utils/statusEffects";
import { shuffle } from "../../utils/random";
import { CombatActions, SliceCreator } from "../types";

/**
 * Pause between the steps of the enemy turn so the UI can show each one.
 * Disabled outside the browser and under test, where the enemy turn resolves
 * synchronously.
 */
const STEP_DELAY_MS =
  typeof window === "undefined" || import.meta.env.MODE === "test" ? 0 : 300;

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const NO_STEP = { stepInProgress: false, stepType: undefined } as const;

export const createCombatSlice: SliceCreator<CombatActions> = (set, get) => ({
  startCombat: (enemies = []) => {
    const { persistentDeck, player } = get();
    const combatState = createCombatState(persistentDeck, player, enemies);

    const relicResult = processRelicEffects(
      RelicTrigger.COMBAT_START,
      combatState.player,
      combatState.enemies,
    );

    set({
      ...combatState,
      ...NO_STEP,
      player: relicResult.player,
      enemies: relicResult.enemies,
    });
    get().startPlayerTurn();
  },

  startPlayerTurn: () => {
    const state = get();
    const turn = (state.playerTurnThisCombat || 0) + 1;
    const result = startPlayerTurn(state.player, state.enemies, turn);

    set({
      player: result.player,
      enemies: result.enemies,
      currentTurn: TurnPhase.PLAYER_TURN,
      playerTurnThisCombat: turn,
      selectedCard: null,
    });

    // Drawing reshuffles the discard pile if the draw pile runs out
    get().drawCards(HAND_SIZE + result.cardsToDraw);
  },

  playCard: (cardId, targetId) => {
    const state = get();
    const card = state.hand.find((c) => c.id === cardId);
    if (!card || state.currentTurn !== TurnPhase.PLAYER_TURN) return;

    const energyCost = getEnergyCost(card, state.player);
    if (state.player.energy < energyCost) return;

    const isFirstAttack =
      state.firstAttackThisCombat && card.type === CardType.ATTACK;

    const result = resolveCardPlay({
      card,
      targetId,
      energyCost,
      player: { ...state.player, energy: state.player.energy - energyCost },
      enemies: state.enemies,
      hand: state.hand.filter((c) => c.id !== cardId),
      isFirstAttack,
    });

    const survivors = result.enemies.filter((enemy) => enemy.health > 0);
    if (survivors.length === 0) {
      set(
        createVictoryState(state.persistentDeck, result.player, state.enemies),
      );
      return;
    }

    set({
      hand: result.hand,
      // Played cards (including power cards) go to the discard pile
      discardPile: [...state.discardPile, card, ...result.createdCards],
      player: result.player,
      enemies: survivors,
      firstAttackThisCombat: isFirstAttack
        ? false
        : state.firstAttackThisCombat,
      selectedCard: null,
    });

    // Draw once the played card has left the hand
    if (result.cardsToDraw > 0) {
      get().drawCards(result.cardsToDraw);
    }
  },

  endTurn: async () => {
    const state = get();
    if (state.currentTurn !== TurnPhase.PLAYER_TURN) return;

    const powerResult = processPowerCardEffects(
      PowerTrigger.TURN_END,
      state.player,
      state.enemies,
    );

    set({
      // The remaining hand is discarded. Block is kept: it resets at the
      // start of the next player turn.
      hand: [],
      discardPile: [...state.discardPile, ...state.hand],
      currentTurn: TurnPhase.ENEMY_TURN,
      player: powerResult.player,
      enemies: powerResult.enemies,
      selectedCard: null,
    });

    await get().processEnemyTurn();
  },

  /**
   * Runs step by step with a short pause before each step so the UI can show
   * it. When step delays are disabled the whole turn resolves synchronously.
   */
  processEnemyTurn: async () => {
    const enemiesAtTurnStart = get().enemies;
    let player = processStatusEffects(get().player) as Player;
    let enemies = tickEnemies(enemiesAtTurnStart);

    const isPlayerDead = () => {
      if (player.health > 0) return false;
      set({
        ...NO_STEP,
        player: { ...player, health: 0 },
        gamePhase: GamePhase.GAME_OVER,
        selectedCard: null,
      });
      return true;
    };

    /**
     * Waits for the step delay. Resolves to true if the combat went away in
     * the meantime (e.g. the player started a new run), in which case the
     * rest of the turn must not touch the store.
     */
    const combatEndedWhileWaiting = async () => {
      await delay(STEP_DELAY_MS);
      return get().gamePhase !== GamePhase.COMBAT;
    };

    // Only await when there is a delay, so the turn stays synchronous
    // without one.
    const showStep = (stepType: "before" | "attack" | "after") =>
      set({ stepInProgress: true, stepType });

    if (isPlayerDead()) return;

    for (const enemyId of enemies.map((enemy) => enemy.id)) {
      const enemy = enemies.find((e) => e.id === enemyId);
      if (!enemy) continue;

      if (STEP_DELAY_MS > 0 && (await combatEndedWhileWaiting())) return;
      showStep("before");

      if (enemy.currentCard) {
        if (STEP_DELAY_MS > 0 && (await combatEndedWhileWaiting())) return;
        showStep("attack");

        const result = resolveEnemyCard(enemy.currentCard, player, enemy);
        player = result.player;
        // The enemy may have died from retaliation damage
        enemies = enemies
          .map((e) => (e.id === enemyId ? result.enemy : e))
          .filter((e) => e.health > 0);

        set({ player, enemies });
        if (isPlayerDead()) return;
        if (result.cardsToDraw > 0) get().drawCards(result.cardsToDraw);
      }

      if (STEP_DELAY_MS > 0 && (await combatEndedWhileWaiting())) return;
      showStep("after");

      // Surviving enemies pick their card for next turn
      enemies = enemies.map((e) => (e.id === enemyId ? chooseNextCard(e) : e));
      set({ enemies });
    }

    if (enemies.length === 0) {
      set(createVictoryState(get().persistentDeck, player, enemiesAtTurnStart));
      return;
    }

    set({ ...NO_STEP, player, enemies, selectedCard: null });
    get().startPlayerTurn();
  },

  drawCards: (count) =>
    set((state) => ({ ...drawCards(state, count), selectedCard: null })),

  shuffleDiscardIntoDraw: () =>
    set((state) => ({
      drawPile: shuffle([...state.drawPile, ...state.discardPile]),
      discardPile: [],
      selectedCard: null,
    })),
});
