import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Card } from '../types/game';

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
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      maxWidth: '100%',
      overflow: 'visible',
      position: 'relative',
      zIndex: 100
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
  const needsTarget = (card.damage !== undefined && card.damage > 0) || card.id === 'body_slam';

  const handleCardClick = () => {
    if (!canPlay) return;

    if (needsTarget && enemies.length > 0) {
      onSelect(); // Select the card for targeting
    } else {
      playCard(card.id);
    }
  };

  // const handleEnemyClick = (enemyId: string) => {
  //   if (isSelected && canPlay) {
  //     playCard(card.id, enemyId);
  //     onSelect(); // Deselect after playing
  //   }
  // };

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

  // const getDamagePreview = (enemy: any) => {
  //   if (!card.damage || card.damage <= 0) return null;
  //   
  //   let totalDamage = calculateDamage(card.damage, player, enemy);
  //   
  //   // Handle special cases for cards that deal damage multiple times
  //   if (card.id === 'twin_strike') {
  //     // Twin Strike deals damage twice
  //     totalDamage = totalDamage * 2;
  //   }
  //   
  //   // Add damage from effects that target the same enemy
  //   if (card.effects) {
  //     for (const effect of card.effects) {
  //       if (effect.type === 'damage' && effect.target === 'enemy') {
  //         totalDamage += calculateDamage(effect.value, player, enemy);
  //       }
  //     }
  //   }
  //   
  //   const damageAfterBlock = Math.max(0, totalDamage - enemy.block);
  //   
  //   return {
  //     totalDamage,
  //     actualDamage: damageAfterBlock,
  //     isVulnerable: enemy.statusEffects.some((effect: any) => effect.type === 'vulnerable')
  //   };
  // };

  return (
    <>
      <div
        style={{
          width: '140px',
          height: '180px',
          background: `linear-gradient(135deg, ${getCardTypeColor()}, ${getCardTypeColor()}dd)`,
          border: `3px solid ${isSelected ? '#ffd700' : getRarityBorder()}`,
          borderRadius: '12px',
          padding: '10px',
          cursor: canPlay ? 'pointer' : 'not-allowed',
          opacity: canPlay ? 1 : 0.6,
          transform: (isHovered && canPlay) || isSelected ? 'translateY(-15px) scale(1.08)' : 'translateY(0) scale(1)',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          boxShadow: (isHovered && canPlay) || isSelected ? '0 10px 20px rgba(0,0,0,0.4)' : '0 4px 8px rgba(0,0,0,0.3)',
          zIndex: isSelected ? 10 : 1,
          backdropFilter: 'blur(1px)'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Cost */}
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '-8px',
          width: '30px',
          height: '30px',
          background: canPlay ? '#2c3e50' : '#7f8c8d',
          border: '3px solid #ecf0f1',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          {card.cost}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '24px',
            height: '24px',
            background: '#ffd700',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: '#000',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            🎯
          </div>
        )}

        {/* Card Name */}
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginTop: '20px',
          marginBottom: '8px',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          lineHeight: '1.2'
        }}>
          {card.name}
        </div>

        {/* Card Effects */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          {card.damage && card.damage > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#fff',
              background: 'rgba(255, 107, 107, 0.9)',
              padding: '4px 8px',
              borderRadius: '12px',
              border: '2px solid #fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              <span style={{ marginRight: '4px' }}>⚔️</span>
              {card.damage}
            </div>
          )}
          {card.block && card.block > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#fff',
              background: 'rgba(68, 68, 255, 0.9)',
              padding: '4px 8px',
              borderRadius: '12px',
              border: '2px solid #fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              <span style={{ marginRight: '4px' }}>🛡️</span>
              {card.block}
            </div>
          )}
          {card.id === 'body_slam' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#fff',
              background: 'rgba(255, 107, 107, 0.9)',
              padding: '4px 8px',
              borderRadius: '12px',
              border: '2px solid #fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              <span style={{ marginRight: '4px' }}>⚔️</span>
              {player.block}
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{
          fontSize: '11px',
          textAlign: 'center',
          color: 'white',
          opacity: 0.95,
          lineHeight: '1.3',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '6px',
          padding: '4px',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
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
              z-index: 15;
            }
          `}
        </style>
      )}
    </>
  );
}; 