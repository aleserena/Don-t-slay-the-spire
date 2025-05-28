import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { PlayerArea } from './PlayerArea';
import { EnemyArea } from './EnemyArea';
import { HandArea } from './HandArea';
import { GameUI } from './GameUI';
import { TurnPhase } from '../types/game';

export const GameBoard: React.FC = () => {
  const { currentTurn, enemies, hand, playCard } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<any>(null);

  const handleCardSelect = (cardId: string | null) => {
    if (cardId) {
      const card = hand.find(c => c.id === cardId);
      setSelectedCard(card || null);
    } else {
      setSelectedCard(null);
    }
  };

  const handleEnemyClick = (enemyId: string) => {
    if (selectedCard) {
      playCard(selectedCard.id, enemyId);
      setSelectedCard(null);
    }
  };

  // Victory Screen
  if (currentTurn === TurnPhase.COMBAT_END) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        color: 'white'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '40px',
          borderRadius: '20px',
          border: '3px solid #ffd700',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h1 style={{ 
            fontSize: '48px', 
            color: '#ffd700', 
            marginBottom: '20px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            Victory!
          </h1>
          <p style={{ fontSize: '18px', marginBottom: '30px', lineHeight: '1.5' }}>
            You have defeated all enemies in this encounter!
          </p>
          <p style={{ fontSize: '14px', marginBottom: '20px', opacity: 0.8 }}>
            Choose your reward and continue your journey.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Game UI - Top bar */}
      <GameUI />
      
      {/* Main Combat Area - Player on left, Enemies on right */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 80px',
        gap: '80px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Player Area - Left side */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 auto'
        }}>
          <PlayerArea />
        </div>
        
        {/* VS Indicator - Centered */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '64px',
          fontWeight: 'bold',
          color: '#ffd700',
          textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
          zIndex: 5,
          pointerEvents: 'none',
          flex: '0 0 auto'
        }}>
          VS
        </div>
        
        {/* Enemy Area - Right side */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 auto'
        }}>
          <EnemyArea 
            enemies={enemies} 
            selectedCard={selectedCard}
            onEnemyClick={handleEnemyClick}
          />
        </div>
      </div>
      
      {/* Hand Area - Bottom */}
      <div style={{
        height: '200px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '20px 40px',
        background: 'rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'visible'
      }}>
        <HandArea 
          selectedCardId={selectedCard?.id || null}
          onCardSelect={handleCardSelect}
        />
      </div>
      
      {/* Turn indicator */}
      <div style={{
        position: 'absolute',
        top: '80px',
        right: '20px',
        background: currentTurn === TurnPhase.PLAYER_TURN ? 'rgba(0, 100, 0, 0.8)' : 'rgba(100, 0, 0, 0.8)',
        padding: '10px 20px',
        borderRadius: '10px',
        border: `2px solid ${currentTurn === TurnPhase.PLAYER_TURN ? '#00ff00' : '#ff4444'}`,
        transition: 'all 0.3s ease',
        zIndex: 10
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          {currentTurn === TurnPhase.PLAYER_TURN ? 'Your Turn' : 'Enemy Turn'}
        </div>
        {currentTurn === TurnPhase.ENEMY_TURN && (
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
            Processing...
          </div>
        )}
      </div>


    </div>
  );
}; 