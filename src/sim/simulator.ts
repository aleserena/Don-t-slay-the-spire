/**
 * Headless simulator: a bot plays whole runs through the real store, so the
 * numbers it reports come from the same rules the game uses.
 *
 * Runs are seeded, so a result can be reproduced by playing its seed again.
 * Besides balance numbers, the simulator is a fuzz test: after every action
 * it checks that the state is one a player may be in, and a run that neither
 * ends nor can continue is reported as `stuck`.
 */

import { canChooseEventOption } from "../engine/events";
import { useGameStore } from "../store/gameStore";
import { GameStore } from "../store/types";
import { GamePhase, TurnPhase } from "../types/game";
import { NodeType } from "../types/map";
import { checkInvariants } from "./invariants";
import { lookaheadPolicy } from "./policies";
import { FightRecord, Policy, RunOutcome, RunResult } from "./types";

export type { FightRecord, Policy, RunOutcome, RunResult } from "./types";

export interface SimulationOptions {
  /** Check the state after every action (default: true). */
  checkInvariants?: boolean;
  /** Actions a run may take before it is declared stuck (default: 20000). */
  maxSteps?: number;
  /** Changes the fresh run before it is played (for experiments). */
  setup?: () => void;
}

/** Invariant violations kept per run; one broken rule tends to repeat. */
const MAX_VIOLATIONS = 5;

/** Actions a bot may take in one shop before it has to leave. */
const MAX_SHOP_ACTIONS = 12;

const encounterName = (state: GameStore): string =>
  state.enemies
    .map((enemy) => enemy.name)
    .sort()
    .join(" + ");

/**
 * Plays one run from start to finish with the given policy.
 *
 * Uses the shared game store, so do not run two simulations at once.
 */
export const simulateRun = async (
  seed: number,
  policy: Policy = lookaheadPolicy,
  options: SimulationOptions = {},
): Promise<RunResult> => {
  const { checkInvariants: shouldCheck = true, maxSteps = 20000 } = options;
  const store = () => useGameStore.getState();
  store().startNewGame(seed);
  options.setup?.();

  let turns = 0;
  let lastNodeType: NodeType | undefined;
  let shopActions = 0;
  const cardsPicked: string[] = [];
  const cardsBought: string[] = [];
  const cardsOffered: string[] = [];
  const cardsPlayed: Record<string, number> = {};
  const nodesVisited: Partial<Record<NodeType, number>> = {};
  const fights: FightRecord[] = [];
  const violations: string[] = [];

  /** The fight in progress, if any. */
  let fight:
    | {
        record: Omit<FightRecord, "won" | "healthLost" | "turns">;
        healthBefore: number;
        turnsBefore: number;
      }
    | undefined;

  const closeFight = () => {
    if (!fight || store().gamePhase === GamePhase.COMBAT) return;
    fights.push({
      ...fight.record,
      turns: turns - fight.turnsBefore,
      healthLost: fight.healthBefore - store().player.health,
      won: store().gamePhase !== GamePhase.GAME_OVER,
    });
    fight = undefined;
  };

  const result = (outcome: RunOutcome): RunResult => {
    closeFight();
    const state = store();
    return {
      seed,
      policy: policy.name,
      outcome,
      floor: state.currentFloor,
      combatsWon: state.combatsWon,
      turns,
      health: state.player.health,
      maxHealth: state.player.maxHealth,
      gold: state.player.gold,
      deckSize: state.persistentDeck.length,
      cardsPicked,
      cardsBought,
      cardsOffered,
      cardsPlayed,
      relics: state.player.relics.map((relic) => relic.id),
      fights,
      nodesVisited,
      lastNodeType,
      violations,
    };
  };

  for (let step = 0; step < maxSteps; step++) {
    const state = store();

    if (shouldCheck && violations.length < MAX_VIOLATIONS) {
      for (const problem of checkInvariants(state)) {
        if (violations.length >= MAX_VIOLATIONS) break;
        violations.push(`step ${step} (${state.gamePhase}): ${problem}`);
      }
    }

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
        const healthBefore = state.player.health;
        lastNodeType = node.type;
        nodesVisited[node.type] = (nodesVisited[node.type] ?? 0) + 1;
        shopActions = 0;
        state.selectNode(node.id);

        if (store().gamePhase === GamePhase.COMBAT) {
          fight = {
            record: {
              floor: node.y + 1,
              nodeType: node.type,
              encounter: encounterName(store()),
            },
            healthBefore,
            turnsBefore: turns,
          };
        } else if (store().gamePhase === GamePhase.MAP) {
          // The node was refused: the same choice would repeat forever
          return result("stuck");
        }
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
          if (!refused) {
            cardsPlayed[play.card.baseId] =
              (cardsPlayed[play.card.baseId] ?? 0) + 1;
            closeFight();
            break;
          }
        }

        turns++;
        await state.endTurn();
        closeFight();
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
        const choices = (state.currentEvent?.choices ?? []).filter((option) =>
          canChooseEventOption(option, state.player),
        );
        if (choices.length === 0) return result("stuck");
        state.selectEventChoice(policy.chooseEventChoice(state, choices).id);
        break;
      }

      case GamePhase.REST: {
        const action = policy.chooseRestAction(state);
        if (action.type === "upgrade") {
          state.upgradeCardAtRest(action.cardId);
        }
        // Healing is also the fallback when the upgrade was refused
        if (store().gamePhase === GamePhase.REST) state.restAndHeal();
        break;
      }

      case GamePhase.SHOP: {
        const action =
          shopActions++ < MAX_SHOP_ACTIONS
            ? policy.chooseShopAction(state)
            : null;
        const before = store();

        if (action?.type === "buyCard") {
          const item = state.currentShop?.cards[action.index];
          state.purchaseShopCard(action.index);
          if (item && store() !== before) cardsBought.push(item.card.baseId);
        } else if (action?.type === "buyRelic") {
          state.purchaseShopRelic(action.index);
        } else if (action?.type === "removeCard") {
          state.removeCardFromDeck(action.cardId);
        }

        // Leaving is also the fallback when the shop refused the action
        if (!action || store() === before) state.returnToMap();
        break;
      }

      default:
        return result("stuck");
    }
  }

  return result("stuck");
};

/** Plays one run per seed, one after another. */
export const simulateRuns = async (
  seeds: number[],
  policy: Policy = lookaheadPolicy,
  options: SimulationOptions = {},
): Promise<RunResult[]> => {
  const results: RunResult[] = [];
  for (const seed of seeds) {
    results.push(await simulateRun(seed, policy, options));
  }
  return results;
};
