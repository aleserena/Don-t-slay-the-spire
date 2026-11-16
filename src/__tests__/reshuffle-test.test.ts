import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../store/gameStore";
import { GamePhase, TurnPhase, IntentType } from "../types/game";
import { getAllCards } from "../data/cards";

describe("Reshuffle Logic", () => {
  beforeEach(() => {
    useGameStore.setState({
      gamePhase: GamePhase.COMBAT,
      currentTurn: TurnPhase.PLAYER_TURN,
      player: {
        ...useGameStore.getState().player,
        energy: 3,
        maxEnergy: 3,
        health: 100,
        maxHealth: 100,
        block: 0,
        statusEffects: [],
        relics: [],
      },
      enemies: [
        {
          id: "test_enemy",
          name: "Test Enemy",
          health: 50,
          maxHealth: 50,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 10 },
          statusEffects: [],
          deck: [],
        },
      ],
      hand: [],
      drawPile: [],
      discardPile: [],
    });
  });

  it("should reshuffle discard pile when draw pile is empty", async () => {
    const { drawCards, endTurn } = useGameStore.getState();
    
    // Get 10 Strike cards for the deck
    const strikeCards = Array.from({ length: 10 }, (_, i) => {
      const baseCard = getAllCards().find(card => card.baseId === "strike")!;
      return { ...baseCard, id: `${baseCard.baseId}_${i}` };
    });

    // Set up initial state: 10 cards in deck
    useGameStore.setState({
      drawPile: [...strikeCards],
      discardPile: [],
      hand: [],
    });

    console.log("=== Initial state ===");
    console.log(`Draw pile: ${useGameStore.getState().drawPile.length}`);
    console.log(`Discard pile: ${useGameStore.getState().discardPile.length}`);
    console.log(`Hand: ${useGameStore.getState().hand.length}`);

    // Draw 5 cards (hand: 5, draw: 5, discard: 0)
    drawCards(5);
    expect(useGameStore.getState().hand.length).toBe(5);
    expect(useGameStore.getState().drawPile.length).toBe(5);
    expect(useGameStore.getState().discardPile.length).toBe(0);

    // End turn: the hand is discarded, the enemy acts, and the next player
    // turn draws the remaining 5 cards (hand: 5, draw: 0, discard: 5)
    await endTurn();
    expect(useGameStore.getState().hand.length).toBe(5);
    expect(useGameStore.getState().drawPile.length).toBe(0);
    expect(useGameStore.getState().discardPile.length).toBe(5);

    // End turn again: all 10 cards are now discarded, so drawing the next
    // hand reshuffles the discard pile (hand: 5, draw: 5, discard: 0)
    await endTurn();
    expect(useGameStore.getState().hand.length).toBe(5);
    expect(useGameStore.getState().drawPile.length).toBe(5);
    expect(useGameStore.getState().discardPile.length).toBe(0);

    // No card was lost or duplicated by the reshuffle
    const { hand, drawPile } = useGameStore.getState();
    const ids = [...hand, ...drawPile].map((card) => card.id).sort();
    expect(ids).toEqual(strikeCards.map((card) => card.id).sort());
  });
}); 