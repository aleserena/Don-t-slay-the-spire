/**
 * Looks ahead through one player turn: tries the orders in which the cards
 * in hand can be played, using the engine's own pure functions, and scores
 * where each order leaves the fight.
 *
 * It does not know what will be drawn, and random effects are resolved with
 * a fixed sequence, so it is a good guess rather than an exact answer.
 */

import { getEnergyCost, resolveCardPlay } from "../engine/cardPlay";
import { endPlayerTurn } from "../engine/combat";
import { getCardEffects } from "../engine/effects";
import { createCombatCounters } from "../engine/triggers";
import {
  Card,
  CardType,
  CombatCounters,
  EffectType,
  Enemy,
  Player,
  StatusType,
  TargetType,
} from "../types/game";
import { cardNeedsTarget } from "../utils/cardUtils";
import { createSeededRng } from "../utils/random";
import { calculateDamage } from "../utils/statusEffects";

/** The part of a combat the search needs. */
export interface TurnState {
  player: Player;
  enemies: Enemy[];
  hand: Card[];
  counters: CombatCounters;
  firstAttackThisCombat: boolean;
}

export interface Play {
  card: Card;
  targetId?: string;
}

/** States the search may look at before it settles for what it has. */
const NODE_BUDGET = 4000;

const WIN_SCORE = 100000;
const LOSS_SCORE = -100000;

const stacks = (entity: Player | Enemy, type: StatusType): number =>
  entity.statusEffects.find((effect) => effect.type === type)?.stacks ?? 0;

/** Damage the enemies will deal with the cards they have announced. */
export const getIncomingDamage = (player: Player, enemies: Enemy[]): number =>
  enemies.reduce(
    (total, enemy) =>
      total +
      getCardEffects(enemy.currentCard ?? {})
        .filter(
          (effect) =>
            effect.type === EffectType.DAMAGE &&
            effect.target === TargetType.ENEMY,
        )
        .reduce(
          (sum, effect) => sum + calculateDamage(effect.value, enemy, player),
          0,
        ),
    0,
  );

/**
 * How good a position is once the player stops playing cards: the turn ends,
 * the enemies hit with what they announced, and what is left is weighed.
 */
export const evaluateTurnEnd = (state: TurnState, cardsDrawn = 0): number => {
  const rng = createSeededRng(1);
  const end = endPlayerTurn(state.player, state.enemies, state.counters, rng);
  const enemies = end.enemies.filter((enemy) => enemy.health > 0);
  if (end.player.health <= 0) return LOSS_SCORE;
  if (enemies.length === 0) return WIN_SCORE + end.player.health;

  const incoming = getIncomingDamage(end.player, enemies);
  const healthLost = Math.max(0, incoming - end.player.block);
  const health = end.player.health - healthLost;
  if (health <= 0) return LOSS_SCORE + state.player.health - healthLost;

  // Losing health matters more the less of it is left
  const lowHealth = health < end.player.maxHealth * 0.4;
  let score = -healthLost * (lowHealth ? 2.5 : 1.3);

  for (const enemy of enemies) {
    // Every enemy alive is a cost, plus what is left of it
    score -= 6 + enemy.health + enemy.block * 0.5;
    score += stacks(enemy, StatusType.VULNERABLE) * 1.5;
    score += stacks(enemy, StatusType.WEAK) * 1.5;
    score += stacks(enemy, StatusType.POISON) * 1.5;
    score -= stacks(enemy, StatusType.STRENGTH) * 2;
  }

  score += stacks(end.player, StatusType.STRENGTH) * 3;
  score += stacks(end.player, StatusType.DEXTERITY) * 3;
  score += end.player.powerCards.length * 4;
  score += end.counters.energyNextTurn * 3;
  score += (cardsDrawn + end.cardsToDraw) * 1.5;

  return score;
};

/** The different plays available now: one per distinct card and target. */
const getPlays = (state: TurnState): Play[] => {
  const seen = new Set<string>();
  const plays: Play[] = [];

  for (const card of state.hand) {
    if (card.cost !== "X" && card.cost > state.player.energy) continue;
    if (card.cost === "X" && state.player.energy === 0) continue;

    const targets = cardNeedsTarget(card)
      ? state.enemies.map((enemy) => enemy.id)
      : [undefined];
    for (const targetId of targets) {
      const key = `${card.baseId}:${card.upgraded ?? false}:${targetId ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      plays.push({ card, targetId });
    }
  }
  return plays;
};

/** The state after a play, with dead enemies removed. */
const applyPlay = (
  state: TurnState,
  { card, targetId }: Play,
): { state: TurnState; cardsDrawn: number } => {
  const energyCost = getEnergyCost(card, state.player);
  const isFirstAttack =
    state.firstAttackThisCombat && card.type === CardType.ATTACK;

  const result = resolveCardPlay({
    card,
    targetId,
    energyCost,
    player: { ...state.player, energy: state.player.energy - energyCost },
    enemies: state.enemies,
    hand: state.hand.filter((c) => c.id !== card.id),
    isFirstAttack,
    counters: state.counters,
    rng: createSeededRng(1),
  });

  return {
    state: {
      player: result.player,
      enemies: result.enemies.filter((enemy) => enemy.health > 0),
      hand: result.hand,
      counters: result.counters,
      firstAttackThisCombat: isFirstAttack
        ? false
        : state.firstAttackThisCombat,
    },
    cardsDrawn: result.cardsToDraw,
  };
};

/**
 * The best next card to play this turn, or `null` when ending the turn now
 * is at least as good as anything the hand can still do.
 */
export const findBestPlay = (start: {
  player: Player;
  enemies: Enemy[];
  hand: Card[];
  combat?: CombatCounters;
  firstAttackThisCombat?: boolean;
}): Play | null => {
  let budget = NODE_BUDGET;

  const search = (state: TurnState, cardsDrawn: number): number => {
    let best = evaluateTurnEnd(state, cardsDrawn);
    if (state.enemies.length === 0 || state.player.health <= 0) return best;

    for (const play of getPlays(state)) {
      if (budget-- <= 0) break;
      const next = applyPlay(state, play);
      best = Math.max(best, search(next.state, cardsDrawn + next.cardsDrawn));
    }
    return best;
  };

  const root: TurnState = {
    player: start.player,
    enemies: start.enemies,
    hand: start.hand,
    counters: start.combat ?? createCombatCounters(),
    firstAttackThisCombat: start.firstAttackThisCombat ?? false,
  };

  let bestPlay: Play | null = null;
  let bestScore = evaluateTurnEnd(root);
  for (const play of getPlays(root)) {
    const next = applyPlay(root, play);
    const score = search(next.state, next.cardsDrawn);
    if (score > bestScore) {
      bestScore = score;
      bestPlay = play;
    }
  }
  return bestPlay;
};
