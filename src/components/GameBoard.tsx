import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { PlayerArea } from './PlayerArea';
import { EnemyArea } from './EnemyArea';
import { HandArea } from './HandArea';
import { UnifiedHeader } from './UnifiedHeader';
import { DebugPanel } from './DebugPanel';
import { Card } from '../types/game';
import { cardNeedsTarget, isMultiTargetCard } from '../utils/cardUtils';

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

export const GameBoard: React.FC = () => {
  const { selectedCard, setSelectedCard, playCard, drawPile, discardPile, hand, currentTurn, endTurn } = useGameStore();
  const [previousHandSize, setPreviousHandSize] = useState(hand.length);
  const [previousDiscardSize, setPreviousDiscardSize] = useState(discardPile.length);
  const [previousDrawSize, setPreviousDrawSize] = useState(drawPile.length);
  const [showDiscardPile, setShowDiscardPile] = useState(false);
  const [confirmingCard, setConfirmingCard] = useState<Card | null>(null);

  // Watch for card draws and discards
  useEffect(() => {
    // No animations - just track state changes
    setPreviousHandSize(hand.length);
    setPreviousDiscardSize(discardPile.length);
    setPreviousDrawSize(drawPile.length);
  }, [hand.length, discardPile.length, drawPile.length, previousHandSize, previousDiscardSize, previousDrawSize]);

  const handleCardSelect = (card: Card) => {
    const needsTarget = cardNeedsTarget(card);
    const isMultiTarget = isMultiTargetCard(card);
    
    if (needsTarget) {
      // If the same card is already selected, deselect it
      if (selectedCard && selectedCard.id === card.id) {
        setSelectedCard(null);
        return;
      }
      
      // For targeting cards, just select them
      setSelectedCard(card);
    } else if (isMultiTarget) {
      // For multi-target cards, play them immediately and clear selection
      playCard(card.id);
      setSelectedCard(null);
    } else {
      // For all other cards, play them immediately and clear selection
      playCard(card.id);
      setSelectedCard(null);
    }
  };

  const handleEnemyTarget = (enemyId: string) => {
    if (selectedCard) {
      playCard(selectedCard.id, enemyId);
      setSelectedCard(null);
    }
  };

  const handleCardConfirming = (card: Card | null) => {
    setConfirmingCard(card);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Game UI - Top */}
      <UnifiedHeader />

      {/* End Turn Button - Outside header */}
      {currentTurn === 'player_turn' && (
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '20px',
          zIndex: 200
        }}>
          <button
            onClick={endTurn}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#45a049';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4CAF50';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            End Turn
          </button>
        </div>
      )}

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
          flex: '0 0 auto'
        }}>
          VS
        </div>
        
        {/* Enemy Area - Right side */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '1'
        }}>
          <EnemyArea 
            selectedCard={selectedCard}
            confirmingCard={confirmingCard}
            onEnemyTarget={handleEnemyTarget}
          />
        </div>
      </div>

      {/* Bottom Area - Deck, Hand, and Discard */}
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
        {/* Deck Pile - Left */}
        <div style={{
          position: 'absolute',
          left: '40px',
          bottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '80px',
            height: '110px',
            background: 'linear-gradient(135deg, #2c3e50, #34495e)',
            border: '2px solid #3498db',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            📚 {drawPile.length}
          </div>
          <div style={{
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}>
            Deck
          </div>
        </div>

        {/* Hand Area - Center */}
        <HandArea 
          selectedCardId={selectedCard?.id || null}
          onCardSelect={handleCardSelect}
          onCardConfirming={handleCardConfirming}
        />

        {/* Discard Pile - Right */}
        <div style={{
          position: 'absolute',
          right: '40px',
          bottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div 
            onClick={() => setShowDiscardPile(true)}
            style={{
              width: '80px',
              height: '110px',
              background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
              border: '2px solid #e74c3c',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🗂️ {discardPile.length}
          </div>
          <div style={{
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}>
            Discard
          </div>
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
                  transition: 'transform 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                >
                  {/* Cost Circle */}
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ffd700, #ffcc02)',
                    border: '2px solid #fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#000',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    zIndex: 20
                  }}>
                    {card.baseId === 'whirlwind' ? 'X' : card.cost}
                  </div>

                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', marginTop: '8px' }}>
                    {card.name}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '6px'
                  }}>
                    {/* Generic damage - only for cards without special displays */}
                    {card.damage && card.damage > 0 && 
                     card.baseId !== 'body_slam' && 
                     card.baseId !== 'bash' && 
                     card.baseId !== 'cleave' && 
                     card.baseId !== 'whirlwind' && 
                     card.baseId !== 'twin_strike' && 
                     card.baseId !== 'anger' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: 'rgba(255, 107, 107, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        <span style={{ marginRight: '4px' }}>⚔️</span>
                        {card.damage}
                      </div>
                    )}
                    
                    {/* Special handling for effect-based damage cards */}
                    {card.baseId === 'bash' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: 'rgba(255, 107, 107, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        <span style={{ marginRight: '4px' }}>⚔️</span>
                        {card.upgraded ? '10' : '8'}
                      </div>
                    )}
                    
                    {card.baseId === 'cleave' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: 'rgba(255, 107, 107, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        <span style={{ marginRight: '4px' }}>⚔️</span>
                        {card.upgraded ? '11' : '8'} to ALL
                      </div>
                    )}
                    
                    {card.baseId === 'whirlwind' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: 'rgba(255, 107, 107, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        <span style={{ marginRight: '4px' }}>⚔️</span>
                        {card.upgraded ? '8' : '5'}×X to ALL
                      </div>
                    )}
                    
                    {card.baseId === 'twin_strike' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: 'rgba(255, 107, 107, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        <span style={{ marginRight: '4px' }}>⚔️</span>
                        {card.upgraded ? '6' : '5'} × 2
                      </div>
                    )}
                    
                    {card.baseId === 'anger' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: 'rgba(255, 107, 107, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        <span style={{ marginRight: '4px' }}>⚔️</span>
                        {card.upgraded ? '8' : '6'}
                      </div>
                    )}
                    
                    {/* Block display */}
                    {card.block && card.block > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: 'rgba(68, 68, 255, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        <span style={{ marginRight: '4px' }}>🛡️</span>
                        {card.block}
                      </div>
                    )}
                    
                    {/* Body Slam special display */}
                    {card.baseId === 'body_slam' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: 'rgba(255, 107, 107, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        <span style={{ marginRight: '4px' }}>⚔️</span>
                        {card.upgraded ? '2x' : '1x'} Block
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '10px', 
                    opacity: 0.8, 
                    lineHeight: '1.2',
                    marginTop: '4px'
                  }}>
                    {card.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
}; 