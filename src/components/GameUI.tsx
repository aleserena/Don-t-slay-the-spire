import React from 'react';
import { useGameStore } from '../store/gameStore';

export const GameUI: React.FC = () => {
  const { endTurn, drawPile, discardPile, currentTurn } = useGameStore();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      background: 'rgba(0, 0, 0, 0.8)',
      borderBottom: '2px solid #ffd700'
    }}>
      {/* Left side - Pile counts */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(0, 100, 0, 0.3)',
          padding: '5px 10px',
          borderRadius: '5px',
          border: '1px solid #00ff00'
        }}>
          <div style={{ fontSize: '12px', color: '#00ff00' }}>Draw</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{drawPile.length}</div>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(100, 0, 0, 0.3)',
          padding: '5px 10px',
          borderRadius: '5px',
          border: '1px solid #ff4444'
        }}>
          <div style={{ fontSize: '12px', color: '#ff4444' }}>Discard</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{discardPile.length}</div>
        </div>
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
  );
}; 