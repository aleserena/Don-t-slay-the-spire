import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CardType } from '../types/game';
import { UnifiedHeader } from './UnifiedHeader';
import { CardGrid } from './CardGrid';

export const ShopScreen: React.FC = () => {
  const { 
    currentShop, 
    player, 
    drawPile, 
    discardPile, 
    showCardRemovalModal,
    returnToMap, 
    purchaseShopCard, 
    purchaseShopRelic, 
    removeCardFromDeck,
    openCardRemovalModal,
    closeCardRemovalModal
  } = useGameStore();

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
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Unified Header */}
      <UnifiedHeader />
      
      {/* Shop Content */}
      <div style={{
        flex: 1,
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
              onClick={() => openCardRemovalModal()}
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

      {/* Card Removal Modal - Using CardGrid */}
      {showCardRemovalModal && (
        <CardGrid
          cards={[...drawPile, ...discardPile]}
          title={`Select Card to Remove (${currentShop.removeCardCost} Gold)`}
          onCardClick={(card) => removeCardFromDeck(card.id)}
          onClose={closeCardRemovalModal}
          borderColor="#e74c3c"
          clickable={true}
          hoverBorderColor="#c0392b"
        />
      )}
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
        {/* Cost Circle - Top Left */}
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '-8px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ffd700, #ffcc02)',
          border: '2px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#000',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          zIndex: 20
        }}>
          {card.baseId === 'whirlwind' ? 'X' : card.cost}
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
          textAlign: 'center',
          padding: '4px 8px',
          background: '#ffd700',
          color: '#000',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 'bold',
          marginBottom: '10px'
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
          justifyContent: 'center',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
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