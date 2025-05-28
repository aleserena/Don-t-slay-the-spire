import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { CardGrid } from './CardGrid';

export const UnifiedHeader: React.FC = () => {
  const { player, drawPile, discardPile, exhaustPile, hand } = useGameStore();
  const [showDeck, setShowDeck] = useState(false);
  const [showRelics, setShowRelics] = useState(false);

  // Combine all deck cards to show complete deck ownership, including hand and filtering out combat-created cards
  const fullDeck = [...drawPile, ...discardPile, ...exhaustPile, ...hand]
    .filter(card => !card.id.includes('_copy_')); // Remove cards created during combat

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderBottom: '2px solid #ffd700',
        position: 'relative',
        zIndex: 100
      }}>
        {/* Left side - Health and Relics */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* Player Health */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(231, 76, 60, 0.2)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '2px solid #e74c3c'
          }}>
            <span style={{ color: '#e74c3c', marginRight: '8px', fontSize: '16px' }}>❤️</span>
            <span style={{ color: '#e74c3c', fontSize: '16px', fontWeight: 'bold' }}>
              {player.health}/{player.maxHealth}
            </span>
          </div>

          {/* View Relics Button */}
          <button
            onClick={() => setShowRelics(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(155, 89, 182, 0.2)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '2px solid #9b59b6',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#9b59b6',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(155, 89, 182, 0.4)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(155, 89, 182, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ marginRight: '8px' }}>🏺</span>
            View Relics ({player.relics.length})
          </button>
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

        {/* Right side - Deck View and Gold */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* Deck View Button */}
          <button
            onClick={() => setShowDeck(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(52, 152, 219, 0.2)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '2px solid #3498db',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#3498db',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(52, 152, 219, 0.4)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(52, 152, 219, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ marginRight: '8px' }}>📚</span>
            View Deck ({fullDeck.length})
          </button>

          {/* Gold */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 215, 0, 0.2)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '2px solid #ffd700'
          }}>
            <span style={{ color: '#ffd700', marginRight: '8px', fontSize: '16px' }}>💰</span>
            <span style={{ color: '#ffd700', fontSize: '16px', fontWeight: 'bold' }}>
              {player.gold}
            </span>
          </div>
        </div>
      </div>

      {/* Relics View Modal */}
      {showRelics && (
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
            border: '3px solid #9b59b6'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: 'white', margin: 0 }}>
                Relics ({player.relics.length})
              </h2>
              <button
                onClick={() => setShowRelics(false)}
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '15px',
              maxHeight: '500px',
              overflow: 'auto',
              padding: '10px'
            }}>
              {player.relics.map((relic, index) => (
                <div key={`relic-${index}`} style={{
                  background: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
                  padding: '15px',
                  borderRadius: '10px',
                  fontSize: '14px',
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
                  <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>
                    {relic.name}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8, lineHeight: '1.3' }}>
                    {relic.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deck View Modal - Using CardGrid */}
      {showDeck && (
        <CardGrid
          cards={fullDeck}
          title="Complete Deck"
          onClose={() => setShowDeck(false)}
          borderColor="#3498db"
        />
      )}
    </>
  );
};