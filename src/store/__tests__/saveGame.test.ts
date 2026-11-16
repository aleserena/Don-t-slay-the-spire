import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "../gameStore";
import { installAutosave } from "../autosave";
import {
  SAVE_KEY,
  SAVE_VERSION,
  clearSave,
  hasSave,
  readSave,
  toSavedRun,
  writeSave,
} from "../saveGame";
import { GamePhase, StatusType } from "../../types/game";
import { createTestCard } from "../../test/setup";

const store = () => useGameStore.getState();

let stopAutosave: (() => void) | undefined;

beforeEach(() => {
  localStorage.clear();
  store().startNewRun(1);
});

afterEach(() => {
  stopAutosave?.();
  stopAutosave = undefined;
  localStorage.clear();
});

describe("saveGame", () => {
  it("round-trips a run through storage", () => {
    store().startNewGame(123);
    const run = toSavedRun(store())!;

    writeSave(run);

    expect(readSave()).toEqual(JSON.parse(JSON.stringify(run)));
    expect(hasSave()).toBe(true);
  });

  it("does not save combat-only player state", () => {
    store().startNewGame(123);
    useGameStore.setState({
      player: {
        ...store().player,
        block: 12,
        energy: 0,
        statusEffects: [{ type: StatusType.WEAK, stacks: 2 }],
      },
    });

    expect(toSavedRun(store())!.player).toMatchObject({
      block: 0,
      energy: 3,
      statusEffects: [],
      powerCards: [],
    });
  });

  it("has nothing to save without a map", () => {
    expect(toSavedRun({ ...store(), map: undefined })).toBeNull();
  });

  it("treats a save from another version as no save", () => {
    store().startNewGame(123);
    writeSave({ ...toSavedRun(store())!, version: SAVE_VERSION + 1 });

    expect(readSave()).toBeNull();
    expect(hasSave()).toBe(false);
  });

  it("treats corrupt or incomplete data as no save", () => {
    localStorage.setItem(SAVE_KEY, "{not json");
    expect(readSave()).toBeNull();

    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION }));
    expect(readSave()).toBeNull();

    localStorage.setItem(SAVE_KEY, "null");
    expect(readSave()).toBeNull();
  });

  it("clears the save", () => {
    store().startNewGame(123);
    writeSave(toSavedRun(store())!);

    clearSave();

    expect(hasSave()).toBe(false);
  });
});

describe("autosave and continue", () => {
  it("reports an existing save when installed", () => {
    store().startNewGame(5);
    writeSave(toSavedRun(store())!);
    store().startNewRun(6);
    expect(store().hasSavedGame).toBe(false);

    stopAutosave = installAutosave(useGameStore);

    expect(store().hasSavedGame).toBe(true);
  });

  it("saves when the run reaches the map and when it changes there", () => {
    stopAutosave = installAutosave(useGameStore);
    expect(hasSave()).toBe(false);

    store().startNewGame(77);
    expect(readSave()).toMatchObject({ seed: 77, currentFloor: 1 });

    useGameStore.setState({ player: { ...store().player, gold: 5 } });
    expect(readSave()!.player.gold).toBe(5);
  });

  it("does not save during a combat", () => {
    stopAutosave = installAutosave(useGameStore);
    store().startNewGame(77);
    const node = store().map!.nodes.find(
      (n) => n.available && n.type === "combat",
    )!;

    store().selectNode(node.id);
    expect(store().gamePhase).toBe(GamePhase.COMBAT);
    useGameStore.setState({ player: { ...store().player, gold: 1 } });

    // Still the snapshot from the map, before the node was entered
    expect(readSave()!.player.gold).toBe(99);
    expect(readSave()!.map.currentNodeId).toBeNull();
  });

  it("removes the save when the run ends", () => {
    stopAutosave = installAutosave(useGameStore);
    store().startNewGame(77);
    expect(hasSave()).toBe(true);

    useGameStore.setState({ gamePhase: GamePhase.GAME_OVER });
    expect(hasSave()).toBe(false);

    store().startNewGame(78);
    useGameStore.setState({ gamePhase: GamePhase.VICTORY });
    expect(hasSave()).toBe(false);

    store().returnToTitle();
    expect(store().hasSavedGame).toBe(false);
  });

  it("continues a saved run from the title screen", () => {
    stopAutosave = installAutosave(useGameStore);
    store().startNewGame(77);
    const extraCard = createTestCard({ id: "kept_card" });
    useGameStore.setState({
      player: { ...store().player, health: 33, gold: 250 },
      persistentDeck: [...store().persistentDeck, extraCard],
      currentFloor: 4,
    });
    const saved = readSave()!;

    // The browser is closed: the next session starts with a fresh store
    store().startNewRun(999);
    expect(store().gamePhase).toBe(GamePhase.TITLE);
    store().returnToTitle();
    expect(store().hasSavedGame).toBe(true);

    store().loadSavedGame();

    const state = store();
    expect(state.gamePhase).toBe(GamePhase.MAP);
    expect(state.seed).toBe(77);
    expect(state.rngState).toBe(saved.rngState);
    expect(state.currentFloor).toBe(4);
    expect(state.player).toMatchObject({ health: 33, gold: 250 });
    expect(state.persistentDeck.map((c) => c.id)).toContain("kept_card");
    expect(state.drawPile).toEqual(state.persistentDeck);
    expect(state.map!.nodes.map((n) => n.id)).toEqual(
      saved.map.nodes.map((n) => n.id),
    );
  });

  it("a continued run plays out like the original", () => {
    stopAutosave = installAutosave(useGameStore);
    store().startNewGame(4242);
    const enterFirstNode = () => {
      const node = store().map!.nodes.find((n) => n.available)!;
      store().selectNode(node.id);
      return {
        enemies: store().enemies.map((e) => `${e.name}/${e.health}`),
        hand: store().hand.map((c) => c.baseId),
      };
    };

    const original = enterFirstNode();
    store().startNewRun(1);
    store().loadSavedGame();

    expect(enterFirstNode()).toEqual(original);
  });

  it("does nothing without a save or a run in memory", () => {
    store().loadSavedGame();
    expect(store().gamePhase).toBe(GamePhase.TITLE);
  });
});
