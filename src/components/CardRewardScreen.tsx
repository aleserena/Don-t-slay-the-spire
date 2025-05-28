import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Card, CardType } from '../types/game';

export const CardRewardScreen: React.FC = () => {
  const { combatReward, selectCardReward, skipCardReward } = useGameStore();

  if (!combatReward) return null;

  const getCardTypeColor = (type: CardType): string => {
    switch (type) {
      case CardType.ATTACK:
        return '#ff6b6b';
      case CardType.SKILL:
        return '#4ecdc4';
      case CardType.POWER:
        return '#ffe66d';
      default:
        return '#95a5a6';
    }
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
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

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '40px',
        borderRadius: '20px',
        border: '3px solid #ffd700',
        textAlign: 'center',
        maxWidth: '900px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '36px', 
          color: '#ffd700', 
          marginBottom: '10px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}>
          Victory!
        </h1>
        
        <p style={{ 
          fontSize: '18px', 
          marginBottom: '20px',
          color: '#4ecdc4'
        }}>
          You earned {combatReward.gold} gold!
        </p>

        <h2 style={{ 
          fontSize: '24px', 
          marginBottom: '30px',
          color: '#ffd700'
        }}>
          Choose a Card Reward
        </h2>

        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '30px'
        }}>
          {combatReward.cardRewards.map((card) => (
            <CardRewardCard 
              key={card.id} 
              card={card} 
              onSelect={() => selectCardReward(card.id)}
              getCardTypeColor={getCardTypeColor}
              getRarityColor={getRarityColor}
            />
          ))}
        </div>

        <button
          onClick={skipCardReward}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#7f8c8d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#95a5a6';
          }}
        >
          Skip Reward
        </button>
      </div>
    </div>
  );
};

interface CardRewardCardProps {
  card: Card;
  onSelect: () => void;
  getCardTypeColor: (type: CardType) => string;
  getRarityColor: (rarity: string) => string;
}

const CardRewardCard: React.FC<CardRewardCardProps> = ({ 
  card, 
  onSelect, 
  getCardTypeColor, 
  getRarityColor 
}) => {
  return (
    <div
      onClick={onSelect}
      style={{
        width: '200px',
        height: '280px',
        background: `linear-gradient(135deg, ${getCardTypeColor(card.type)}, ${getCardTypeColor(card.type)}dd)`,
        border: `3px solid ${getRarityColor(card.rarity)}`,
        borderRadius: '15px',
        padding: '15px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      }}
    >
      {/* Cost Circle - Top Left */}
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

      {/* Rarity indicator */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        padding: '4px 8px',
        background: getRarityColor(card.rarity),
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        {card.rarity}
      </div>

      {/* Card name */}
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: '40px',
        marginBottom: '10px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
      }}>
        {card.name}
      </div>

      {/* Card type */}
      <div style={{
        fontSize: '12px',
        textAlign: 'center',
        marginBottom: '15px',
        textTransform: 'uppercase',
        opacity: 0.8
      }}>
        {card.type}
      </div>

      {/* Card stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '15px'
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

      {/* Description */}
      <div style={{
        fontSize: '12px',
        textAlign: 'center',
        lineHeight: '1.4',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
      }}>
        {card.description}
      </div>
    </div>
  );
}; 