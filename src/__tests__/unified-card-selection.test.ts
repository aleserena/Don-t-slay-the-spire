import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { GamePhase, TurnPhase, IntentType, CardType, CardRarity, EffectType, TargetType } from '../types/game';
import { getAllCards } from '../data/cards';

describe('Unified Card Selection System', () => {
  beforeEach(() => {
    useGameStore.getState().startNewRun();
  });

  it('should handle targeting cards with targeting mode as confirmation', () => {
    // Set up combat scenario with a targeting card (Strike)
    useGameStore.setState({
      gamePhase: GamePhase.COMBAT,
      enemies: [
        {
          id: 'enemy1',
          name: 'Test Enemy',
          health: 20,
          maxHealth: 20,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 10 },
          statusEffects: []
        }
      ],
      currentTurn: TurnPhase.PLAYER_TURN,
      player: { 
        ...useGameStore.getState().player, 
        energy: 3,
        maxEnergy: 3
      },
      hand: [{
        id: 'strike',
        baseId: 'strike',
        name: 'Strike',
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: 'Deal 6 damage.',
        damage: 6,
        upgraded: false
      }],
      discardPile: [],
      selectedCard: null
    });
    
    const { setSelectedCard, playCard } = useGameStore.getState();
    
    // Targeting cards enter targeting mode immediately on first click
    // The targeting interface itself serves as the confirmation stage
    setSelectedCard(useGameStore.getState().hand[0]);
    
    // Verify card is selected for targeting
    expect(useGameStore.getState().selectedCard?.id).toBe('strike');
    
    // Now play the card with target (clicking enemy confirms and plays)
    playCard('strike', 'enemy1');
    
    const finalState = useGameStore.getState();
    
    // Should consume energy and deal damage
    expect(finalState.player.energy).toBe(2);
    expect(finalState.enemies[0].health).toBe(14); // 20 - 6 = 14
    expect(finalState.selectedCard).toBe(null); // Should clear selection
  });

  it('should handle multi-target cards with unified confirmation system', () => {
    // Set up combat scenario with a multi-target card (Cleave)
    useGameStore.setState({
      gamePhase: GamePhase.COMBAT,
      enemies: [
        {
          id: 'enemy1',
          name: 'Enemy 1',
          health: 20,
          maxHealth: 20,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 10 },
          statusEffects: []
        },
        {
          id: 'enemy2',
          name: 'Enemy 2',
          health: 15,
          maxHealth: 15,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 8 },
          statusEffects: []
        }
      ],
      currentTurn: TurnPhase.PLAYER_TURN,
      player: { 
        ...useGameStore.getState().player, 
        energy: 3,
        maxEnergy: 3
      },
      hand: [{
        id: 'cleave',
        baseId: 'cleave',
        name: 'Cleave',
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: 'Deal 8 damage to ALL enemies.',
        upgraded: false,
        effects: [{
          type: EffectType.DAMAGE,
          value: 8,
          target: TargetType.ALL_ENEMIES
        }]
      }],
      discardPile: []
    });
    
    const { playCard } = useGameStore.getState();
    
    // After confirmation (handled by HandArea), play the card directly
    playCard('cleave');
    
    const finalState = useGameStore.getState();
    
    // Should consume energy and deal damage to all enemies
    expect(finalState.player.energy).toBe(2);
    expect(finalState.enemies[0].health).toBe(12); // 20 - 8 = 12
    expect(finalState.enemies[1].health).toBe(7);  // 15 - 8 = 7
  });

  it('should handle non-damage cards with unified confirmation system', () => {
    // Set up combat scenario with a non-damage card (Defend)
    useGameStore.setState({
      gamePhase: GamePhase.COMBAT,
      enemies: [
        {
          id: 'enemy1',
          name: 'Test Enemy',
          health: 20,
          maxHealth: 20,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 10 },
          statusEffects: []
        }
      ],
      currentTurn: TurnPhase.PLAYER_TURN,
      player: { 
        ...useGameStore.getState().player, 
        energy: 3,
        maxEnergy: 3,
        block: 0
      },
      hand: [{
        id: 'defend',
        baseId: 'defend',
        name: 'Defend',
        cost: 1,
        type: CardType.SKILL,
        rarity: CardRarity.COMMON,
        description: 'Gain 5 Block.',
        block: 5,
        upgraded: false
      }],
      discardPile: []
    });
    
    const { playCard } = useGameStore.getState();
    
    // After confirmation (handled by HandArea), play the card directly
    playCard('defend');
    
    const finalState = useGameStore.getState();
    
    // Should consume energy and gain block
    expect(finalState.player.energy).toBe(2);
    expect(finalState.player.block).toBe(5);
  });

  it('should handle special X-cost cards with unified confirmation system', () => {
    const { playCard } = useGameStore.getState();
    
    // Get the actual Whirlwind card from data
    const whirlwindCard = getAllCards().find(card => card.baseId === 'whirlwind')!;
    
    // Set up combat scenario with whirlwind card
    useGameStore.setState({
      gamePhase: GamePhase.COMBAT,
      enemies: [{
        id: 'enemy1',
        name: 'Enemy 1',
        health: 20,
        maxHealth: 20,
        block: 0,
        intent: { type: IntentType.ATTACK, value: 10 },
        statusEffects: []
      }],
      currentTurn: TurnPhase.PLAYER_TURN,
      player: { 
        ...useGameStore.getState().player, 
        energy: 2, // 2 energy
        maxEnergy: 3
      },
      hand: [whirlwindCard],
      discardPile: []
    });
    
    // Play whirlwind (should consume all energy and deal damage)
    playCard('whirlwind');
    
    const finalState = useGameStore.getState();
    
    // Should consume all energy and deal damage 2 times (2 energy × 5 damage = 10 total)
    expect(finalState.player.energy).toBe(0);
    expect(finalState.enemies[0].health).toBe(10); // 20 - 10 = 10
  });
}); 