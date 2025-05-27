import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Card } from '../types/game';
import { calculateDamage } from '../utils/statusEffects';

interface HandAreaProps {
  selectedCardId?: string | null;
  onCardSelect?: (cardId: string | null) => void;
}

export const HandArea: React.FC<HandAreaProps> = ({ selectedCardId, onCardSelect }) => {
  const { hand } = useGameStore();

  const handleCardSelect = (cardId: string) => {
    if (onCardSelect) {
      onCardSelect(selectedCardId === cardId ? null : cardId);
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      maxWidth: '100%',
      overflow: 'auto'
    }}>
      {hand.map((card, index) => (
        <CardComponent 
          key={card.id} 
          card={card} 
          index={index} 
          isSelected={selectedCardId === card.id}
          onSelect={() => handleCardSelect(card.id)}
        />
      ))}
    </div>
  );
};

interface CardComponentProps {
  card: Card;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

const CardComponent: React.FC<CardComponentProps> = ({ card, isSelected, onSelect }) => {
  const { playCard, player, enemies } = useGameStore();
  const [isHovered, setIsHovered] = useState(false);

  const canPlay = player.energy >= card.cost;
  const needsTarget = card.damage !== undefined && card.damage > 0;

  const handleCardClick = () => {
    if (!canPlay) return;

    if (needsTarget && enemies.length > 0) {
      onSelect(); // Select the card for targeting
    } else {
      playCard(card.id);
    }
  };

  const handleEnemyClick = (enemyId: string) => {
    if (isSelected && canPlay) {
      playCard(card.id, enemyId);
      onSelect(); // Deselect after playing
    }
  };

  const getCardTypeColor = () => {
    switch (card.type) {
      case 'attack':
        return '#ff6b6b';
      case 'skill':
        return '#4ecdc4';
      case 'power':
        return '#ffe66d';
      default:
        return '#95a5a6';
    }
  };

  const getRarityBorder = () => {
    switch (card.rarity) {
      case 'common':
        return '#95a5a6';
      case 'uncommon':
        return '#3498db';
      case 'rare':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  const getDamagePreview = (enemy: any) => {
    if (!card.damage || card.damage <= 0) return null;
    
    const finalDamage = calculateDamage(card.damage, player, enemy);
    const damageAfterBlock = Math.max(0, finalDamage - enemy.block);
    
    return {
      totalDamage: finalDamage,
      actualDamage: damageAfterBlock,
      isVulnerable: enemy.statusEffects.some((effect: any) => effect.type === 'vulnerable')
    };
  };

  return (
    <>
      <div
        style={{
          width: '120px',
          height: '160px',
          background: `linear-gradient(135deg, ${getCardTypeColor()}, ${getCardTypeColor()}dd)`,
          border: `3px solid ${isSelected ? '#ffd700' : getRarityBorder()}`,
          borderRadius: '10px',
          padding: '8px',
          cursor: canPlay ? 'pointer' : 'not-allowed',
          opacity: canPlay ? 1 : 0.5,
          transform: (isHovered && canPlay) || isSelected ? 'translateY(-10px) scale(1.05)' : 'translateY(0) scale(1)',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          boxShadow: (isHovered && canPlay) || isSelected ? '0 8px 16px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: isSelected ? 10 : 1
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Cost */}
        <div style={{
          position: 'absolute',
          top: '-5px',
          left: '-5px',
          width: '25px',
          height: '25px',
          background: '#2c3e50',
          border: '2px solid #ecf0f1',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          color: 'white'
        }}>
          {card.cost}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            width: '20px',
            height: '20px',
            background: '#ffd700',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#000',
            fontWeight: 'bold'
          }}>
            🎯
          </div>
        )}

        {/* Card Name */}
        <div style={{
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginTop: '15px',
          marginBottom: '5px',
          color: 'white',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
        }}>
          {card.name}
        </div>

        {/* Card Effects */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '5px'
        }}>
          {card.damage && card.damage > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#ff6b6b'
            }}>
              <span style={{ marginRight: '3px' }}>⚔️</span>
              {card.damage}
            </div>
          )}
          {card.block && card.block > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#4444ff'
            }}>
              <span style={{ marginRight: '3px' }}>🛡️</span>
              {card.block}
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{
          fontSize: '10px',
          textAlign: 'center',
          color: 'white',
          opacity: 0.9,
          lineHeight: '1.2',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {card.description}
        </div>
      </div>

      {/* Enemy targeting indicators */}
      {isSelected && needsTarget && (
        <style>
          {`
            .enemy-card {
              cursor: pointer !important;
              position: relative;
            }
            .enemy-card:hover::after {
              content: '';
              position: absolute;
              top: -5px;
              left: -5px;
              right: -5px;
              bottom: -5px;
              border: 3px solid #ffd700;
              border-radius: 20px;
              pointer-events: none;
              z-index: 10;
            }
          `}
        </style>
      )}
    </>
  );
}; 