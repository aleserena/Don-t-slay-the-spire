/**
 * Headless simulator: a bot plays whole runs through the real store, so the
 * numbers it reports come from the same rules the game uses.
 *
 * Runs are seeded, so a result can be reproduced by playing its seed again.
 * Besides balance numbers, the simulator is a fuzz test: a run that neither
 * ends nor can continue is reported as `stuck`.
 */

import { useGameStore } from "../store/gameStore";
import { GameStore } from "../store/types";
import { getCardEffects, isDamageEffect } from "../engine/effects";
import { canChooseEventOption } from "../engine/events";
import {
  Card,
  CardRarity,
  EffectType,
  Enemy,
  GamePhase,
  TurnPhase,
} from "../types/game";
import { MapNode, NodeType } from "../types/map";
import { cardNeedsTarget } from "../utils/cardUtils";

export type RunOutcome = "victory" | "defeat" | "stuck";

export interface RunResult {
  seed: number;
  outcome: RunOutcome;
  /** 1-based floor the run ended on. */
  floor: number;
  combatsWon: number;
  /** Player turns taken over the whole run. */
  turns: number;
  health: number;
  deckSize: number;
  /** Base ids of the cards taken as rewards. */
  cardsPicked: string[];
  /** Base ids of the cards that were offered as rewards. */
  cardsOffered: string[];
  /** Type of the node the run ended in. */
  lastNodeType?: NodeType;
}

/** The decisions a bot makes. Every method only reads the state. */
export interface Policy {
  chooseNode(state: GameStore, nodes: MapNode[]): MapNode;
  /** The card to play next and its target, or `null` to end the turn. */
  chooseCard(state: GameStore): { card: Card; targetId?: string } | null;
  /** The reward card to take, or `null` to skip. */
  chooseReward(state: GameStore, cards: Card[]): Card | null;
  /** Whether to heal at a rest site (otherwise upgrade a card). */
  shouldRest(state: GameStore): boolean;
}

/** Actions a single run may take before it is declared stuck. */
const MAX_STEPS = 20000;

const getEnergy = (card: Card, state: GameStore): number =>
  card.cost === "X" ? state.player.energy : card.cost;

const isPlayable = (card: Card, state: GameStore): boolean =>
  card.cost === "X"
    ? state.player.energy > 0
    : card.cost <= state.player.energy;

const dealsDamage = (card: Card): boolean =>
  getCardEffects(card).some(
    (effect) => !effect.trigger && isDamageEffect(effect.type),
  );

const givesBlock = (card: Card): boolean =>
  getCardEffects(card).some(
    (effect) => !effect.trigger && effect.type === EffectType.BLOCK,
  );

/** Damage the enemies have announced for their next turn. */
const incomingDamage = (enemies: Enemy[]): number =>
  enemies.reduce(
    (total, enemy) =>
      total +
      getCardEffects(enemy.currentCard ?? {})
        .filter((effect) => effect.type === EffectType.DAMAGE)
        .reduce((sum, effect) => sum + effect.value, 0),
    0,
  );

const NODE_PREFERENCE: NodeType[] = [
  NodeType.BOSS,
  NodeType.TREASURE,
  NodeType.EVENT,
  NodeType.COMBAT,
  NodeType.SHOP,
  NodeType.ELITE,
];

const RARITY_VALUE: Record<CardRarity, number> = {
  [CardRarity.BASE]: 0,
  [CardRarity.COMMON]: 1,
  [CardRarity.UNCOMMON]: 2,
  [CardRarity.RARE]: 3,
};

/**
 * A simple, sensible player: blocks when the enemies are about to hit for
 * more than its block, otherwise attacks the weakest enemy; rests when hurt;
 * avoids elites; takes the rarest card offered.
 */
export const defaultPolicy: Policy = {
  chooseNode: (state, nodes) => {
    const hurt = state.player.health < state.player.maxHealth * 0.6;
    const rank = (node: MapNode) => {
      if (node.type === NodeType.REST) return hurt ? -1 : 3.5;
      return NODE_PREFERENCE.indexOf(node.type);
    };
    return [...nodes].sort((a, b) => rank(a) - rank(b) || a.x - b.x)[0];
  },

  chooseCard: (state) => {
    const playable = state.hand.filter((card) => isPlayable(card, state));
    if (playable.length === 0) return null;

    const needsBlock = incomingDamage(state.enemies) > state.player.block;
    const byCost = (a: Card, b: Card) =>
      getEnergy(a, state) - getEnergy(b, state);

    const card =
      (needsBlock && playable.filter(givesBlock).sort(byCost)[0]) ||
      playable.filter(dealsDamage).sort(byCost)[0] ||
      playable.sort(byCost)[0];

    const weakest = [...state.enemies].sort((a, b) => a.health - b.health)[0];
    return {
      card,
      targetId: cardNeedsTarget(card) ? weakest?.id : undefined,
    };
  },

  chooseReward: (_state, cards) =>
    [...cards].sort(
      (a, b) => RARITY_VALUE[b.rarity] - RARITY_VALUE[a.rarity],
    )[0] ?? null,

  shouldRest: (state) => state.player.health < state.player.maxHealth * 0.7,
};

/**
 * Plays one run from start to finish with the given policy.
 *
 * Uses the shared game store, so do not run two simulations at once.
 */
export const simulateRun = async (
  seed: number,
  policy: Policy = defaultPolicy,
): Promise<RunResult> => {
  const store = () => useGameStore.getState();
  store().startNewGame(seed);

  let turns = 0;
  let lastNodeType: NodeType | undefined;
  const cardsPicked: string[] = [];
  const cardsOffered: string[] = [];

  const result = (outcome: RunOutcome): RunResult => ({
    seed,
    outcome,
    floor: store().currentFloor,
    combatsWon: store().combatsWon,
    turns,
    health: store().player.health,
    deckSize: store().persistentDeck.length,
    cardsPicked,
    cardsOffered,
    lastNodeType,
  });

  for (let step = 0; step < MAX_STEPS; step++) {
    const state = store();

    switch (state.gamePhase) {
      case GamePhase.VICTORY:
        return result("victory");

      case GamePhase.GAME_OVER:
        return result("defeat");

      case GamePhase.MAP: {
        const nodes = (state.map?.nodes ?? []).filter(
          (node) => node.available && !node.completed,
        );
        if (nodes.length === 0) return result("stuck");

        const node = policy.chooseNode(state, nodes);
        lastNodeType = node.type;
        state.selectNode(node.id);
        break;
      }

      case GamePhase.COMBAT: {
        if (state.currentTurn !== TurnPhase.PLAYER_TURN) {
          return result("stuck");
        }

        const play = policy.chooseCard(state);
        if (play) {
          const handBefore = state.hand.length;
          state.playCard(play.card.id, play.targetId);

          // A card the engine refused would be chosen again forever
          const refused =
            store().gamePhase === GamePhase.COMBAT &&
            store().hand.length === handBefore &&
            store().hand.some((card) => card.id === play.card.id);
          if (!refused) break;
        }

        turns++;
        await state.endTurn();
        break;
      }

      case GamePhase.CARD_REWARD: {
        const cards = state.combatReward?.cardRewards ?? [];
        cardsOffered.push(...cards.map((card) => card.baseId));

        const card = policy.chooseReward(state, cards);
        if (card) {
          cardsPicked.push(card.baseId);
          state.selectCardReward(card.id);
        } else {
          state.skipCardReward();
        }
        break;
      }

      case GamePhase.RELIC_REWARD:
        if (state.combatReward?.relicReward) {
          state.selectRelicReward();
        } else {
          state.skipRelicReward();
        }
        break;

      case GamePhase.EVENT: {
        const choice = state.currentEvent?.choices.find((option) =>
          canChooseEventOption(option, state.player),
        );
        if (!choice) return result("stuck");
        state.selectEventChoice(choice.id);
        break;
      }

      case GamePhase.REST: {
        const upgradable = state.persistentDeck.find((card) => !card.upgraded);
        if (policy.shouldRest(state) || !upgradable) {
          state.restAndHeal();
        } else {
          state.upgradeCardAtRest(upgradable.id);
        }
        break;
      }

      case GamePhase.SHOP:
        state.returnToMap();
        break;

      default:
        return result("stuck");
    }
  }

  return result("stuck");
};

export interface CardStats {
  offered: number;
  picked: number;
  /** Runs won with at least one copy picked. */
  wins: number;
  /** Runs with at least one copy picked. */
  runs: number;
}

export interface SimulationReport {
  runs: number;
  wins: number;
  winRate: number;
  averageFloor: number;
  averageTurns: number;
  /** Seeds of runs that could neither end nor continue. */
  stuckSeeds: number[];
  /** Runs lost on each 1-based floor. */
  deathsByFloor: Record<number, number>;
  /** Runs lost in each type of node. */
  deathsByNodeType: Partial<Record<NodeType, number>>;
  cards: Record<string, CardStats>;
}

/** Summarises the results of many runs. */
export const summarize = (results: RunResult[]): SimulationReport => {
  const wins = results.filter((run) => run.outcome === "victory");
  const average = (pick: (run: RunResult) => number) =>
    results.length === 0
      ? 0
      : results.reduce((total, run) => total + pick(run), 0) / results.length;

  const deathsByFloor: Record<number, number> = {};
  const deathsByNodeType: Partial<Record<NodeType, number>> = {};
  const cards: Record<string, CardStats> = {};
  const statsFor = (baseId: string) =>
    (cards[baseId] ??= { offered: 0, picked: 0, wins: 0, runs: 0 });

  for (const run of results) {
    if (run.outcome === "defeat") {
      deathsByFloor[run.floor] = (deathsByFloor[run.floor] ?? 0) + 1;
      if (run.lastNodeType) {
        deathsByNodeType[run.lastNodeType] =
          (deathsByNodeType[run.lastNodeType] ?? 0) + 1;
      }
    }

    for (const baseId of run.cardsOffered) statsFor(baseId).offered++;
    for (const baseId of run.cardsPicked) statsFor(baseId).picked++;
    for (const baseId of new Set(run.cardsPicked)) {
      const stats = statsFor(baseId);
      stats.runs++;
      if (run.outcome === "victory") stats.wins++;
    }
  }

  return {
    runs: results.length,
    wins: wins.length,
    winRate: results.length === 0 ? 0 : wins.length / results.length,
    averageFloor: average((run) => run.floor),
    averageTurns: average((run) => run.turns),
    stuckSeeds: results
      .filter((run) => run.outcome === "stuck")
      .map((run) => run.seed),
    deathsByFloor,
    deathsByNodeType,
    cards,
  };
};

/** Plays one run per seed, one after another, and summarises them. */
export const simulateRuns = async (
  seeds: number[],
  policy: Policy = defaultPolicy,
): Promise<{ results: RunResult[]; report: SimulationReport }> => {
  const results: RunResult[] = [];
  for (const seed of seeds) {
    results.push(await simulateRun(seed, policy));
  }
  return { results, report: summarize(results) };
};

const percent = (value: number): string => `${(value * 100).toFixed(1)}%`;

/** A plain-text version of a report, for the terminal. */
export const formatReport = (report: SimulationReport): string => {
  const lines = [
    `Runs: ${report.runs}   Wins: ${report.wins} (${percent(report.winRate)})`,
    `Average floor reached: ${report.averageFloor.toFixed(1)}   Average turns: ${report.averageTurns.toFixed(1)}`,
    `Stuck runs: ${report.stuckSeeds.length}${
      report.stuckSeeds.length ? ` (seeds ${report.stuckSeeds.join(", ")})` : ""
    }`,
    "",
    "Deaths by floor:",
    ...Object.entries(report.deathsByFloor)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([floor, count]) => `  floor ${floor.padStart(2)}: ${count}`),
    "",
    "Deaths by node type:",
    ...Object.entries(report.deathsByNodeType).map(
      ([type, count]) => `  ${type}: ${count}`,
    ),
    "",
    "Cards (offered / picked / win rate of runs that picked it):",
    ...Object.entries(report.cards)
      .sort(([, a], [, b]) => b.picked - a.picked)
      .map(
        ([baseId, stats]) =>
          `  ${baseId.padEnd(18)} ${String(stats.offered).padStart(5)} ${String(
            stats.picked,
          ).padStart(
            5,
          )}   ${stats.runs ? percent(stats.wins / stats.runs) : "-"}`,
      ),
  ];
  return lines.join("\n");
};
