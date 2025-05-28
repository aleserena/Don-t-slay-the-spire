import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const getCardTypeColor = (cardType: string) => {
  switch (cardType) {
    case 'attack':
      return 'linear-gradient(135deg, #ff6b6b, #ee5a52)'; // Red
    case 'skill':
      return 'linear-gradient(135deg, #4ecdc4, #44a08d)'; // Blue/Teal
    case 'power':
      return 'linear-gradient(135deg, #ffe66d, #ffcc02)'; // Yellow
    default:
      return 'linear-gradient(135deg, #95a5a6, #7f8c8d)'; // Gray
  }
};

export const GameUI: React.FC = () => {
  const { endTurn, drawPile, discardPile, currentTurn } = useGameStore();
  const [showDiscardPile, setShowDiscardPile] = useState(false);

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
          
          <div 
            onClick={() => setShowDiscardPile(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(100, 0, 0, 0.3)',
              padding: '5px 10px',
              borderRadius: '5px',
              border: '1px solid #ff4444',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = 'rgba(100, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'rgba(100, 0, 0, 0.3)';
            }}
          >
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

      {/* Discard Pile Modal */}
      {showDiscardPile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '80%',
            maxHeight: '80%',
            overflow: 'auto',
            border: '3px solid #f39c12'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: 'white', margin: 0 }}>
                Discard Pile ({discardPile.length} cards)
              </h2>
              <button
                onClick={() => setShowDiscardPile(false)}
                style={{
                  background: '#e74c3c',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '15px',
              maxHeight: '500px',
              overflow: 'auto',
              padding: '10px'
            }}>
              {discardPile.map((card, index) => (
                <div key={`discard-${index}`} style={{
                  background: getCardTypeColor(card.type),
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  textAlign: 'center',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                    {card.name}
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    Cost: {card.cost} energy
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '6px'
                  }}>
                    {card.damage && card.damage > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: 'rgba(255, 107, 107, 0.9)',
                        padding: '3px 6px',
                        borderRadius: '10px',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}>
                        <span style={{ marginRight: '3px' }}>⚔️</span>
                        {card.damage}
                      </div>
                    )}
                    {card.block && card.block > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: 'rgba(68, 68, 255, 0.9)',
                        padding: '3px 6px',
                        borderRadius: '10px',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}>
                        <span style={{ marginRight: '3px' }}>🛡️</span>
                        {card.block}
                      </div>
                    )}
                    {card.id === 'body_slam' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: 'rgba(255, 107, 107, 0.9)',
                        padding: '3px 6px',
                        borderRadius: '10px',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}>
                        <span style={{ marginRight: '3px' }}>⚔️</span>
                        Block
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '10px', 
                    opacity: 0.9, 
                    lineHeight: '1.2',
                    marginTop: '6px'
                  }}>
                    {card.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 