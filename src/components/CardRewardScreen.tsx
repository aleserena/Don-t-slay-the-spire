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
        return '#45b7d1';
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
      {/* Cost */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        width: '30px',
        height: '30px',
        background: '#2c3e50',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        border: '2px solid white'
      }}>
        {card.cost}
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
        {card.damage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            <span style={{ marginRight: '5px' }}>⚔️</span>
            {card.damage}
          </div>
        )}
        {card.block && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            <span style={{ marginRight: '5px' }}>🛡️</span>
            {card.block}
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
        padding: '0 5px'
      }}>
        {card.description}
      </div>
    </div>
  );
}; 