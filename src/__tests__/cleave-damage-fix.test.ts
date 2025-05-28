import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { GamePhase, TurnPhase, IntentType, CardType, CardRarity, EffectType, TargetType } from '../types/game';

describe('Cleave Damage Fix', () => {
  beforeEach(() => {
    useGameStore.getState().startNewRun();
  });

  it('should deal exactly 8 damage to all enemies, not double damage', () => {
    const { playCard } = useGameStore.getState();
    
    // Set up combat scenario with cleave card and multiple enemies
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
    
    // Play cleave
    playCard('cleave');
    
    const finalState = useGameStore.getState();
    
    // Should consume 1 energy
    expect(finalState.player.energy).toBe(2);
    
    // Both enemies should take exactly 8 damage (not 16)
    expect(finalState.enemies[0].health).toBe(12); // 20 - 8 = 12
    expect(finalState.enemies[1].health).toBe(7);  // 15 - 8 = 7
    
    // Card should be in discard pile
    expect(finalState.hand.length).toBe(0);
    expect(finalState.discardPile.length).toBe(1);
    expect(finalState.discardPile[0].name).toBe('Cleave');
  });

  it('should deal exactly 8 damage even with vulnerable enemies', () => {
    const { playCard } = useGameStore.getState();
    
    // Set up combat scenario with vulnerable enemies
    useGameStore.setState({
      gamePhase: GamePhase.COMBAT,
      enemies: [
        {
          id: 'enemy1',
          name: 'Vulnerable Enemy',
          health: 20,
          maxHealth: 20,
          block: 0,
          intent: { type: IntentType.ATTACK, value: 10 },
          statusEffects: [{ type: 'vulnerable' as any, stacks: 2, duration: 2 }]
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
    
    // Play cleave
    playCard('cleave');
    
    const finalState = useGameStore.getState();
    
    // Vulnerable enemy should take 8 * 1.5 = 12 damage (not 24)
    expect(finalState.enemies[0].health).toBe(8); // 20 - 12 = 8
  });
}); 