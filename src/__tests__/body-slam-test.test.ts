import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../store/gameStore";
import { GamePhase, TurnPhase, IntentType } from "../types/game";
import { getAllCards } from "../data/cards";

describe("Body Slam Test", () => {
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
      exhaustPile: [],
    });
  });

  it("should deal damage equal to player's block", () => {
    const { playCard } = useGameStore.getState();

    // Get the actual Body Slam card from data
    const bodySlamCard = getAllCards().find(
      (card) => card.baseId === "body_slam",
    )!;

    // Set up player with 10 block
    useGameStore.setState({
      player: {
        ...useGameStore.getState().player,
        block: 10,
      },
      hand: [bodySlamCard],
    });

    // Play Body Slam
    playCard(bodySlamCard.id, "test_enemy");

    const finalState = useGameStore.getState();
    
    // Enemy should have taken 10 damage (equal to player's block)
    expect(finalState.enemies[0].health).toBe(40); // 50 - 10 = 40
  });

  it("should deal 0 damage when player has 0 block", () => {
    const { playCard } = useGameStore.getState();

    // Get the actual Body Slam card from data
    const bodySlamCard = getAllCards().find(
      (card) => card.baseId === "body_slam",
    )!;

    // Set up player with 0 block
    useGameStore.setState({
      player: {
        ...useGameStore.getState().player,
        block: 0,
      },
      hand: [bodySlamCard],
    });

    // Play Body Slam
    playCard(bodySlamCard.id, "test_enemy");

    const finalState = useGameStore.getState();
    
    // Enemy should have taken 0 damage
    expect(finalState.enemies[0].health).toBe(50); // No damage dealt
  });
}); 