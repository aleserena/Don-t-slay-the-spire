import {
  CardType,
  Enemy,
  GamePhase,
  Player,
  TurnPhase,
} from "../../types/game";
import { getEnergyCost, resolveCardPlay } from "../../engine/cardPlay";
import {
  chooseNextCard,
  createCombatState,
  createVictoryState,
  endPlayerTurn,
  resolveEnemyCard,
  startPlayerTurn,
  tickEnemies,
} from "../../engine/combat";
import { HAND_SIZE } from "../../engine/constants";
import { drawCards } from "../../engine/deck";
import {
  createBattle,
  createCombatCounters,
  dispatch,
} from "../../engine/triggers";
import { cardNeedsTarget } from "../../utils/cardUtils";
import { tickDebuffs, tickPoison } from "../../utils/statusEffects";
import { createSeededRng, SeededRng, shuffle } from "../../utils/random";
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

export const createCombatSlice: SliceCreator<CombatActions> = (set, get) => {
  /**
   * Runs `fn` with the run's random source and stores how far it advanced,
   * so the next random pick continues the same sequence. `fn` must not call
   * other store actions: they read the stored position themselves.
   */
  const withRng = <T>(fn: (rng: SeededRng) => T): T => {
    const rng = createSeededRng(get().rngState);
    const result = fn(rng);
    set({ rngState: rng.state });
    return result;
  };

  /** Ends the combat as a win and rolls its rewards. */
  const winCombat = (player: Player, defeatedEnemies: Enemy[]) =>
    set({
      ...withRng((rng) =>
        createVictoryState(get().persistentDeck, player, defeatedEnemies, rng),
      ),
      combatsWon: get().combatsWon + 1,
    });

  return {
    startCombat: (enemies = []) => {
      const { persistentDeck, player } = get();
      const { combatState, battle } = withRng((rng) => {
        const combatState = createCombatState(
          persistentDeck,
          player,
          enemies,
          rng,
        );
        const battle = dispatch(
          createBattle(
            combatState.player,
            combatState.enemies,
            combatState.combat,
          ),
          { type: "combat_start" },
          rng,
        );
        return { combatState, battle };
      });

      set({
        ...combatState,
        ...NO_STEP,
        player: battle.player,
        enemies: battle.enemies,
        combat: battle.counters,
      });
      if (battle.cardsToDraw > 0) get().drawCards(battle.cardsToDraw);
      get().startPlayerTurn();
    },

    startPlayerTurn: () => {
      const state = get();
      const turn = (state.playerTurnThisCombat || 0) + 1;
      const result = withRng((rng) =>
        startPlayerTurn(
          state.player,
          state.enemies,
          turn,
          state.combat ?? createCombatCounters(),
          rng,
        ),
      );

      set({
        player: result.player,
        enemies: result.enemies,
        combat: result.counters,
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

      // A card aimed at a single enemy needs a living target. With only one
      // enemy there is no choice to make, so it is targeted automatically.
      let target = targetId;
      if (cardNeedsTarget(card)) {
        if (!target && state.enemies.length === 1) target = state.enemies[0].id;
        if (!state.enemies.some((enemy) => enemy.id === target)) return;
      }

      const isFirstAttack =
        state.firstAttackThisCombat && card.type === CardType.ATTACK;

      const result = withRng((rng) =>
        resolveCardPlay({
          card,
          targetId: target,
          energyCost,
          player: { ...state.player, energy: state.player.energy - energyCost },
          enemies: state.enemies,
          hand: state.hand.filter((c) => c.id !== cardId),
          isFirstAttack,
          counters: state.combat ?? createCombatCounters(),
          rng,
        }),
      );

      const survivors = result.enemies.filter((enemy) => enemy.health > 0);
      if (survivors.length === 0) {
        winCombat(result.player, state.enemies);
        return;
      }

      set({
        hand: result.hand,
        // A played card is discarded, exhausted, or (power cards) leaves play
        discardPile: [
          ...state.discardPile,
          ...(result.destination === "discard" ? [card] : []),
          ...result.createdCards,
        ],
        exhaustPile:
          result.destination === "exhaust"
            ? [...state.exhaustPile, card]
            : state.exhaustPile,
        combat: result.counters,
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

      const result = withRng((rng) =>
        endPlayerTurn(
          state.player,
          state.enemies,
          state.combat ?? createCombatCounters(),
          rng,
        ),
      );

      const survivors = result.enemies.filter((enemy) => enemy.health > 0);
      if (survivors.length === 0) {
        winCombat(result.player, state.enemies);
        return;
      }

      set({
        // The remaining hand is discarded. Block is kept: it resets at the
        // start of the next player turn.
        hand: [],
        discardPile: [...state.discardPile, ...state.hand],
        currentTurn: TurnPhase.ENEMY_TURN,
        player: result.player,
        enemies: survivors,
        combat: result.counters,
        selectedCard: null,
      });
      if (result.cardsToDraw > 0) get().drawCards(result.cardsToDraw);
      if (result.player.health <= 0) {
        set({
          ...NO_STEP,
          player: { ...result.player, health: 0 },
          gamePhase: GamePhase.GAME_OVER,
        });
        return;
      }

      await get().processEnemyTurn();
    },

    /**
     * Runs step by step with a short pause before each step so the UI can show
     * it. When step delays are disabled the whole turn resolves synchronously.
     */
    processEnemyTurn: async () => {
      const enemiesAtTurnStart = get().enemies;
      let player = tickPoison(get().player);
      let enemies = tickEnemies(enemiesAtTurnStart);
      let counters = get().combat ?? createCombatCounters();
      // Debuffs the player receives during this enemy turn must last until
      // the next one, so only the ones they already have tick at its end
      const debuffsAtTurnStart = new Set(
        player.statusEffects.map((effect) => effect.type),
      );

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

          const card = enemy.currentCard;
          const result = withRng((rng) =>
            resolveEnemyCard(card, player, enemy, counters, rng),
          );
          player = result.player;
          counters = result.counters;
          // The enemy may have died from retaliation damage
          enemies = enemies
            .map((e) => (e.id === enemyId ? result.enemy : e))
            .filter((e) => e.health > 0);

          set({ player, enemies, combat: counters });
          if (isPlayerDead()) return;
          if (result.cardsToDraw > 0) get().drawCards(result.cardsToDraw);
        }

        if (STEP_DELAY_MS > 0 && (await combatEndedWhileWaiting())) return;
        showStep("after");

        // Surviving enemies lose a stack of their timed debuffs now that they
        // have acted, and pick their card for next turn
        const current = enemies;
        enemies = withRng((rng) =>
          current.map((e) =>
            e.id === enemyId ? chooseNextCard(tickDebuffs(e), rng) : e,
          ),
        );
        set({ enemies });
      }

      if (enemies.length === 0) {
        winCombat(player, enemiesAtTurnStart);
        return;
      }

      player = tickDebuffs(player, (type) => debuffsAtTurnStart.has(type));
      set({ ...NO_STEP, player, enemies, selectedCard: null });
      get().startPlayerTurn();
    },

    drawCards: (count) =>
      withRng((rng) =>
        set((state) => ({
          ...drawCards(state, count, rng),
          selectedCard: null,
        })),
      ),

    shuffleDiscardIntoDraw: () =>
      withRng((rng) =>
        set((state) => ({
          drawPile: shuffle([...state.drawPile, ...state.discardPile], rng),
          discardPile: [],
          selectedCard: null,
        })),
      ),
  };
};
