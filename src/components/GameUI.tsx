import React from 'react';
import { useGameStore } from '../store/gameStore';
import { DamageDebugPanel } from './DamageDebugPanel';

export const GameUI: React.FC = () => {
  const { endTurn, currentTurn } = useGameStore();

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderBottom: '2px solid #ffd700'
      }}>
        {/* Left side - Empty for now */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* Removed draw/discard counters - now on bottom deck/discard piles */}
        </div>

        {/* Center - Game title */}
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#ffd700',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}>
          Slay the Spire Clone
        </div>

        {/* Right side - Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={endTurn}
            disabled={currentTurn !== 'player_turn'}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: currentTurn === 'player_turn' ? '#4CAF50' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: currentTurn === 'player_turn' ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s'
            }}
          >
            End Turn
          </button>
        </div>
      </div>
      
      {/* Damage Debug Panel */}
      <DamageDebugPanel />
    </>
  );
}; 