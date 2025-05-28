import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { GamePhase, TurnPhase, IntentType } from '../types/game';
import { getAllCards } from '../data/cards';

describe('Whirlwind Zero Energy', () => {
  beforeEach(() => {
    useGameStore.getState().startNewRun();
  });

  it('should deal 0 damage when played with 0 energy', () => {
    const { playCard } = useGameStore.getState();
    
    // Get the actual Whirlwind card from data
    const whirlwindCard = getAllCards().find(card => card.baseId === 'whirlwind')!;
    
    // Set up combat scenario with whirlwind card and 0 energy
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
        energy: 0, // 0 energy
        maxEnergy: 3
      },
      hand: [whirlwindCard],
      discardPile: []
    });
    
    // Play whirlwind with 0 energy
    playCard('whirlwind');
    
    const finalState = useGameStore.getState();
    
    // Should still consume 0 energy (no change)
    expect(finalState.player.energy).toBe(0);
    
    // Both enemies should take 0 damage (0 hits × 5 damage = 0)
    expect(finalState.enemies[0].health).toBe(20); // No damage
    expect(finalState.enemies[1].health).toBe(15); // No damage
    
    // Card should be in discard pile
    expect(finalState.hand.length).toBe(0);
    expect(finalState.discardPile.length).toBe(1);
    expect(finalState.discardPile[0].name).toBe('Whirlwind');
  });

  it('should deal correct damage when played with 1 energy', () => {
    const { playCard } = useGameStore.getState();
    
    // Get the actual Whirlwind card from data
    const whirlwindCard = getAllCards().find(card => card.baseId === 'whirlwind')!;
    
    // Set up combat scenario with whirlwind card and 1 energy
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
        }
      ],
      currentTurn: TurnPhase.PLAYER_TURN,
      player: { 
        ...useGameStore.getState().player, 
        energy: 1, // 1 energy
        maxEnergy: 3
      },
      hand: [whirlwindCard],
      discardPile: []
    });
    
    // Play whirlwind with 1 energy
    playCard('whirlwind');
    
    const finalState = useGameStore.getState();
    
    // Should consume all energy (1)
    expect(finalState.player.energy).toBe(0);
    
    // Enemy should take 5 damage (1 hit × 5 damage = 5)
    expect(finalState.enemies[0].health).toBe(15); // 20 - 5 = 15
    
    // Card should be in discard pile
    expect(finalState.hand.length).toBe(0);
    expect(finalState.discardPile.length).toBe(1);
    expect(finalState.discardPile[0].name).toBe('Whirlwind');
  });

  it('should deal correct damage when played with 2 energy', () => {
    const { playCard } = useGameStore.getState();
    
    // Get the actual Whirlwind card from data
    const whirlwindCard = getAllCards().find(card => card.baseId === 'whirlwind')!;
    
    // Set up combat scenario with whirlwind card and 2 energy
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
        }
      ],
      currentTurn: TurnPhase.PLAYER_TURN,
      player: { 
        ...useGameStore.getState().player, 
        energy: 2, // 2 energy
        maxEnergy: 3
      },
      hand: [whirlwindCard],
      discardPile: []
    });
    
    // Play whirlwind with 2 energy
    playCard('whirlwind');
    
    const finalState = useGameStore.getState();
    
    // Should consume all energy (2)
    expect(finalState.player.energy).toBe(0);
    
    // Enemy should take 10 damage (2 hits × 5 damage = 10)
    expect(finalState.enemies[0].health).toBe(10); // 20 - 10 = 10
    
    // Card should be in discard pile
    expect(finalState.hand.length).toBe(0);
    expect(finalState.discardPile.length).toBe(1);
    expect(finalState.discardPile[0].name).toBe('Whirlwind');
  });
}); 