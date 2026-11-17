/**
 * A run must be reproducible from its seed
 * (plans/2026-11-16-seeded-runs-and-saves.md).
 */
import { describe, expect, it } from "vitest";
import { useGameStore } from "../store/gameStore";
import { GamePhase, TurnPhase } from "../types/game";
import { cardNeedsTarget } from "../utils/cardUtils";
import { createSeededRng } from "../utils/random";

const store = () => useGameStore.getState();

/** Everything about the map that the rules use (ids are random UUIDs). */
const describeMap = () => {
  const { nodes } = store().map!;
  const indexOf = new Map(nodes.map((node, index) => [node.id, index]));
  return nodes.map(
    (node) =>
      `${node.y}:${node.x}:${node.type}>${node.connections
        .map((id) => indexOf.get(id))
        .join(",")}`,
  );
};

/** Plays a fight with a fixed policy: first playable card, else end turn. */
const fight = async (trace: string[]) => {
  trace.push(
    `enemies ${store()
      .enemies.map((e) => `${e.name}/${e.health}/${e.currentCard?.baseId}`)
      .join(" ")}`,
  );

  for (let step = 0; step < 400; step++) {
    const state = store();
    if (state.gamePhase !== GamePhase.COMBAT) break;
    if (state.currentTurn !== TurnPhase.PLAYER_TURN) break;

    if (step === 0 || state.hand.length === 5) {
      trace.push(`hand ${state.hand.map((c) => c.baseId).join(",")}`);
    }

    const playable = state.hand.find(
      (card) =>
        typeof card.cost === "number" && card.cost <= state.player.energy,
    );
    if (playable) {
      state.playCard(
        playable.id,
        cardNeedsTarget(playable) ? state.enemies[0].id : undefined,
      );
    } else {
      await state.endTurn();
    }
  }

  trace.push(`after fight hp ${store().player.health} ${store().gamePhase}`);
};

/** Plays the first `nodes` map nodes of a run and records what happened. */
const playRun = async (seed: number, nodes: number): Promise<string[]> => {
  store().startNewGame(seed);
  const trace: string[] = [...describeMap()];

  for (let visited = 0; visited < nodes; visited++) {
    const node = store().map!.nodes.find((n) => n.available && !n.completed);
    if (!node || store().gamePhase !== GamePhase.MAP) break;

    store().selectNode(node.id);
    trace.push(`node ${node.type}`);

    switch (store().gamePhase) {
      case GamePhase.COMBAT:
        await fight(trace);
        break;
      case GamePhase.EVENT: {
        const event = store().currentEvent!;
        trace.push(`event ${event.id}`);
        store().selectEventChoice(event.choices[0].id);
        break;
      }
      case GamePhase.SHOP:
        trace.push(
          `shop ${store()
            .currentShop!.cards.map((c) => c.card.baseId)
            .join(",")} | ${store()
            .currentShop!.relics.map((r) => r.relic.id)
            .join(",")}`,
        );
        store().returnToMap();
        break;
      case GamePhase.REST:
        store().restAndHeal();
        break;
      default:
        break;
    }

    if (store().gamePhase === GamePhase.CARD_REWARD) {
      const reward = store().combatReward!;
      trace.push(
        `reward ${reward.cardRewards.map((c) => c.baseId).join(",")} relic ${
          reward.relicReward?.id
        } gold ${store().player.gold}`,
      );
      store().selectCardReward(reward.cardRewards[0].id);
    }
    if (store().gamePhase === GamePhase.RELIC_REWARD) {
      trace.push(`relic ${store().combatReward?.relicReward?.id}`);
      store().selectRelicReward();
    }

    trace.push(
      `state hp ${store().player.health} gold ${store().player.gold} deck ${store()
        .persistentDeck.map((c) => c.baseId)
        .join(",")}`,
    );
  }

  return trace;
};

describe("seeded runs", () => {
  it("continues a random sequence from its stored state", () => {
    const rng = createSeededRng(42);
    rng();
    rng();

    const resumed = createSeededRng(rng.state);

    expect([resumed(), resumed(), resumed()]).toEqual([rng(), rng(), rng()]);
  });

  it("the same seed and choices give the same run", async () => {
    const first = await playRun(20261116, 6);
    const second = await playRun(20261116, 6);

    expect(second).toEqual(first);
    // The trace covers real play, not just the map
    expect(first.some((line) => line.startsWith("enemies"))).toBe(true);
    expect(first.some((line) => line.startsWith("hand"))).toBe(true);
  });

  it("different seeds give different runs", async () => {
    const first = await playRun(1, 3);
    const second = await playRun(2, 3);

    expect(second).not.toEqual(first);
  });

  it("works with seed 0 and records the seed", async () => {
    const first = await playRun(0, 3);
    expect(store().seed).toBe(0);

    expect(await playRun(0, 3)).toEqual(first);
  });

  it("picks a seed when none is given, and ignores non-numbers", () => {
    store().startNewGame();
    expect(Number.isInteger(store().seed)).toBe(true);

    // A button passes its click event as the first argument
    store().startNewGame({} as unknown as number);
    expect(Number.isInteger(store().seed)).toBe(true);
  });

  it("advances the random state as the run uses randomness", () => {
    store().startNewGame(7);
    const afterMap = store().rngState;

    const node = store().map!.nodes.find((n) => n.available)!;
    store().selectNode(node.id);

    expect(store().rngState).not.toBe(afterMap);
  });
});
