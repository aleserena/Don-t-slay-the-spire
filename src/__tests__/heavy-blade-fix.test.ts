import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../store/gameStore";
import {
  GamePhase,
  TurnPhase,
  IntentType,
  CardType,
  CardRarity,
  StatusType,
  EffectType,
  TargetType,
} from "../types/game";

describe("Heavy Blade Fix", () => {
  beforeEach(() => {
    useGameStore.getState().startNewRun();
  });

  describe("Heavy Blade Strength Multiplier", () => {
    it("should apply strength 3 times for Heavy Blade", () => {
      const { playCard } = useGameStore.getState();

      // Create Heavy Blade card
      const heavyBladeCard = {
        id: "heavy_blade_test",
        baseId: "heavy_blade",
        name: "Heavy Blade",
        cost: 2,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: "Deal 14 damage. Strength affects this card 3 times.",
        damage: 14,
        upgraded: false,
        effects: [
          {
            type: EffectType.DAMAGE,
            value: 14,
            target: TargetType.ENEMY,
            strengthMultiplier: 3,
          },
        ],
      };

      // Set up combat scenario with Heavy Blade and 2 strength
      useGameStore.setState({
        gamePhase: GamePhase.COMBAT,
        enemies: [
          {
            id: "enemy1",
            name: "Test Enemy",
            health: 50,
            maxHealth: 50,
            block: 0,
            intent: { type: IntentType.ATTACK, value: 10 },
            statusEffects: [],
            deck: [],
          },
        ],
        currentTurn: TurnPhase.PLAYER_TURN,
        player: {
          ...useGameStore.getState().player,
          energy: 3,
          maxEnergy: 3,
          statusEffects: [
            {
              type: StatusType.STRENGTH,
              stacks: 2,
              duration: undefined,
            },
          ],
        },
        hand: [heavyBladeCard],
        discardPile: [],
      });

      const initialEnemyHealth = useGameStore.getState().enemies[0].health;

      // Play Heavy Blade
      playCard("heavy_blade_test", "enemy1");

      const finalState = useGameStore.getState();
      const finalEnemyHealth = finalState.enemies[0].health;

      // Calculate expected damage: 14 base + (2 strength × 3) = 14 + 6 = 20
      const expectedDamage = 14 + 2 * 3;
      const actualDamage = initialEnemyHealth - finalEnemyHealth;

      expect(actualDamage).toBe(expectedDamage);
      expect(finalState.player.energy).toBe(1); // Should consume 2 energy
    });

    it("should work with 0 strength", () => {
      const { playCard } = useGameStore.getState();

      // Create Heavy Blade card
      const heavyBladeCard = {
        id: "heavy_blade_test",
        baseId: "heavy_blade",
        name: "Heavy Blade",
        cost: 2,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: "Deal 14 damage. Strength affects this card 3 times.",
        damage: 14,
        upgraded: false,
        effects: [
          {
            type: EffectType.DAMAGE,
            value: 14,
            target: TargetType.ENEMY,
            strengthMultiplier: 3,
          },
        ],
      };

      // Set up combat scenario with Heavy Blade and no strength
      useGameStore.setState({
        gamePhase: GamePhase.COMBAT,
        enemies: [
          {
            id: "enemy1",
            name: "Test Enemy",
            health: 50,
            maxHealth: 50,
            block: 0,
            intent: { type: IntentType.ATTACK, value: 10 },
            statusEffects: [],
            deck: [],
          },
        ],
        currentTurn: TurnPhase.PLAYER_TURN,
        player: {
          ...useGameStore.getState().player,
          energy: 3,
          maxEnergy: 3,
          statusEffects: [], // No strength
        },
        hand: [heavyBladeCard],
        discardPile: [],
      });

      const initialEnemyHealth = useGameStore.getState().enemies[0].health;

      // Play Heavy Blade
      playCard("heavy_blade_test", "enemy1");

      const finalState = useGameStore.getState();
      const finalEnemyHealth = finalState.enemies[0].health;

      // Should deal base damage only: 14
      const expectedDamage = 14;
      const actualDamage = initialEnemyHealth - finalEnemyHealth;

      expect(actualDamage).toBe(expectedDamage);
    });
  });

  describe("Heavy Blade Targeting", () => {
    it("should require targeting", async () => {
      const { cardNeedsTarget } = await import("../utils/cardUtils");

      // Create Heavy Blade card
      const heavyBladeCard = {
        id: "heavy_blade_test",
        baseId: "heavy_blade",
        name: "Heavy Blade",
        cost: 2,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: "Deal 14 damage. Strength affects this card 3 times.",
        damage: 14,
        upgraded: false,
      };

      // Should require targeting
      expect(cardNeedsTarget(heavyBladeCard)).toBe(true);
    });
  });
});
