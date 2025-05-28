import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { PlayerArea } from './PlayerArea';
import { EnemyArea } from './EnemyArea';
import { HandArea } from './HandArea';
import { UnifiedHeader } from './UnifiedHeader';
import { DebugPanel } from './DebugPanel';
import { Card } from '../types/game';
import { cardNeedsTarget, isMultiTargetCard } from '../utils/cardUtils';
import { CardGrid } from './CardGrid';

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
  const { selectedCard, setSelectedCard, playCard, drawPile, discardPile, hand, currentTurn, endTurn, toggleDebugMode } = useGameStore();
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

  // Add keyboard event listener for debug mode toggle
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'd') {
        toggleDebugMode();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [toggleDebugMode]);

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
      // For all other cards (non-targeting), play them immediately and clear selection
      // This handles both confirmation cards and direct-play cards
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
    // If we're setting a confirming card and there's a selected targeting card,
    // clear the targeting selection to prevent conflicts
    if (card && selectedCard) {
      setSelectedCard(null);
    }
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

      {/* Discard Pile Modal - Using CardGrid */}
      {showDiscardPile && (
        <CardGrid
          cards={discardPile}
          title="Discard Pile"
          onClose={() => setShowDiscardPile(false)}
          borderColor="#f39c12"
        />
      )}

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
}; 