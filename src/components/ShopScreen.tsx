import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CardType } from '../types/game';

export const ShopScreen: React.FC = () => {
  const { currentShop, player, returnToMap, purchaseShopCard, purchaseShopRelic, removeCardFromDeck } = useGameStore();

  if (!currentShop) return null;

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

  const getRelicColor = (rarity: string): string => {
    switch (rarity) {
      case 'common':
        return '#3498db';
      case 'uncommon':
        return '#9b59b6';
      case 'rare':
        return '#e74c3c';
      case 'boss':
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
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ 
            fontSize: '36px', 
            color: '#45b7d1',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            🏪 The Shop
          </h1>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ffd700'
            }}>
              💰 {player.gold}
            </div>
            
            <button
              onClick={returnToMap}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
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
              Leave Shop
            </button>
          </div>
        </div>

        {/* Cards Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            marginBottom: '20px',
            color: '#4ecdc4'
          }}>
            Cards for Sale
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {currentShop.cards.map((shopCard, index) => (
              <ShopCardComponent
                key={index}
                shopCard={shopCard}
                canAfford={player.gold >= shopCard.cost}
                onPurchase={() => purchaseShopCard(index)}
                getCardTypeColor={getCardTypeColor}
                getRarityColor={getRarityColor}
              />
            ))}
          </div>
        </div>

        {/* Relics Section */}
        {currentShop.relics.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              fontSize: '24px', 
              marginBottom: '20px',
              color: '#4ecdc4'
            }}>
              Relics for Sale
            </h2>
            
            <div style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {currentShop.relics.map((shopRelic, index) => (
                <ShopRelicComponent
                  key={index}
                  shopRelic={shopRelic}
                  canAfford={player.gold >= shopRelic.cost}
                  onPurchase={() => purchaseShopRelic(index)}
                  getRelicColor={getRelicColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Card Removal Service */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '30px',
          borderRadius: '15px',
          border: '2px solid #e74c3c',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            marginBottom: '15px',
            color: '#e74c3c'
          }}>
            Card Removal Service
          </h2>
          
          <p style={{ 
            fontSize: '16px', 
            marginBottom: '20px',
            opacity: 0.8
          }}>
            Remove a card from your deck permanently
          </p>
          
          <button
            onClick={() => removeCardFromDeck()}
            disabled={player.gold < currentShop.removeCardCost}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: player.gold >= currentShop.removeCardCost ? '#e74c3c' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: player.gold >= currentShop.removeCardCost ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
              opacity: player.gold >= currentShop.removeCardCost ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (player.gold >= currentShop.removeCardCost) {
                e.currentTarget.style.background = '#c0392b';
              }
            }}
            onMouseLeave={(e) => {
              if (player.gold >= currentShop.removeCardCost) {
                e.currentTarget.style.background = '#e74c3c';
              }
            }}
          >
            Remove Card ({currentShop.removeCardCost} Gold)
          </button>
        </div>
      </div>
    </div>
  );
};

interface ShopCardComponentProps {
  shopCard: any;
  canAfford: boolean;
  onPurchase: () => void;
  getCardTypeColor: (type: CardType) => string;
  getRarityColor: (rarity: string) => string;
}

const ShopCardComponent: React.FC<ShopCardComponentProps> = ({ 
  shopCard, 
  canAfford, 
  onPurchase, 
  getCardTypeColor, 
  getRarityColor 
}) => {
  const { card, cost, purchased } = shopCard;

  return (
    <div style={{
      position: 'relative',
      opacity: purchased ? 0.5 : 1,
      pointerEvents: purchased ? 'none' : 'auto'
    }}>
      <div
        onClick={canAfford && !purchased ? onPurchase : undefined}
        style={{
          width: '200px',
          height: '280px',
          background: `linear-gradient(135deg, ${getCardTypeColor(card.type)}, ${getCardTypeColor(card.type)}dd)`,
          border: `3px solid ${getRarityColor(card.rarity)}`,
          borderRadius: '15px',
          padding: '15px',
          cursor: canAfford && !purchased ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          opacity: canAfford && !purchased ? 1 : 0.7
        }}
        onMouseEnter={(e) => {
          if (canAfford && !purchased) {
            e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (canAfford && !purchased) {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
          }
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

        {/* Price */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 8px',
          background: '#ffd700',
          color: '#000',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {cost}💰
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

        {/* Card stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          marginBottom: '15px'
        }}>
          {card.damage && card.damage > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '16px',
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
              fontSize: '16px',
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
              fontSize: '16px',
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
              Block
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

      {purchased && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#e74c3c',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '10px 20px',
          borderRadius: '10px',
          border: '2px solid #e74c3c'
        }}>
          SOLD
        </div>
      )}
    </div>
  );
};

interface ShopRelicComponentProps {
  shopRelic: any;
  canAfford: boolean;
  onPurchase: () => void;
  getRelicColor: (rarity: string) => string;
}

const ShopRelicComponent: React.FC<ShopRelicComponentProps> = ({ 
  shopRelic, 
  canAfford, 
  onPurchase, 
  getRelicColor 
}) => {
  const { relic, cost, purchased } = shopRelic;

  return (
    <div style={{
      position: 'relative',
      opacity: purchased ? 0.5 : 1,
      pointerEvents: purchased ? 'none' : 'auto'
    }}>
      <div
        onClick={canAfford && !purchased ? onPurchase : undefined}
        style={{
          width: '200px',
          height: '150px',
          background: `linear-gradient(135deg, ${getRelicColor(relic.rarity)}, ${getRelicColor(relic.rarity)}dd)`,
          border: `3px solid ${getRelicColor(relic.rarity)}`,
          borderRadius: '15px',
          padding: '15px',
          cursor: canAfford && !purchased ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          opacity: canAfford && !purchased ? 1 : 0.7
        }}
        onMouseEnter={(e) => {
          if (canAfford && !purchased) {
            e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (canAfford && !purchased) {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
          }
        }}
      >
        {/* Price */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 8px',
          background: '#ffd700',
          color: '#000',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {cost}💰
        </div>

        {/* Relic name */}
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '10px',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
        }}>
          {relic.name}
        </div>

        {/* Description */}
        <div style={{
          fontSize: '12px',
          textAlign: 'center',
          lineHeight: '1.4',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {relic.description}
        </div>
      </div>

      {purchased && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#e74c3c',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '2px solid #e74c3c'
        }}>
          SOLD
        </div>
      )}
    </div>
  );
}; 