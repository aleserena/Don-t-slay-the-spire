import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getStatusEffectIcon, getStatusEffectColor } from '../utils/statusEffects';

export const PlayerArea: React.FC = () => {
  const { player } = useGameStore();
  const [hoveredRelic, setHoveredRelic] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleRelicMouseEnter = (relic: any, event: React.MouseEvent) => {
    setHoveredRelic(relic);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleRelicMouseLeave = () => {
    setHoveredRelic(null);
  };

  const handleRelicMouseMove = (event: React.MouseEvent) => {
    if (hoveredRelic) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  return (
    <>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(0, 100, 0, 0.2)',
        border: '3px solid #00ff00',
        borderRadius: '15px',
        padding: '20px',
        minWidth: '200px'
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
          Player
        </div>
        
        {/* Health */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '10px',
          fontSize: '18px'
        }}>
          <span style={{ color: '#ff4444', marginRight: '5px' }}>❤️</span>
          <span>{player.health}/{player.maxHealth}</span>
        </div>
        
        {/* Block */}
        {player.block > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
            fontSize: '18px'
          }}>
            <span style={{ color: '#4444ff', marginRight: '5px' }}>🛡️</span>
            <span>{player.block}</span>
          </div>
        )}
        
        {/* Energy */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '18px',
          marginBottom: '10px'
        }}>
          <span style={{ color: '#ffff44', marginRight: '5px' }}>⚡</span>
          <span>{player.energy}/{player.maxEnergy}</span>
        </div>

        {/* Gold */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '18px',
          marginBottom: player.statusEffects.length > 0 || player.relics.length > 0 ? '10px' : '0'
        }}>
          <span style={{ color: '#ffd700', marginRight: '5px' }}>💰</span>
          <span>{player.gold}</span>
        </div>
        
        {/* Status Effects */}
        {player.statusEffects.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '5px',
            justifyContent: 'center',
            marginBottom: player.relics.length > 0 ? '10px' : '0'
          }}>
            {player.statusEffects.map((effect, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  background: getStatusEffectColor(effect.type),
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
                title={`${effect.type}: ${effect.stacks}${effect.duration ? ` (${effect.duration} turns)` : ''}`}
              >
                <span style={{ marginRight: '3px' }}>
                  {getStatusEffectIcon(effect.type)}
                </span>
                <span>{effect.stacks}</span>
                {effect.duration && (
                  <span style={{ fontSize: '10px', marginLeft: '2px' }}>
                    ({effect.duration})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Relics */}
        {player.relics.length > 0 && (
          <div style={{
            marginTop: '10px',
            width: '100%'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px',
              textAlign: 'center',
              color: '#ffd700'
            }}>
              Relics
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '5px',
              justifyContent: 'center'
            }}>
              {player.relics.map((relic, index) => (
                <div 
                  key={index} 
                  style={{ 
                    padding: '5px 8px',
                    background: getRelicColor(relic.rarity),
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    maxWidth: '80px',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    transform: hoveredRelic?.id === relic.id ? 'scale(1.1)' : 'scale(1)'
                  }}
                  onMouseEnter={(e) => handleRelicMouseEnter(relic, e)}
                  onMouseLeave={handleRelicMouseLeave}
                  onMouseMove={handleRelicMouseMove}
                >
                  {relic.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Relic Tooltip */}
      {hoveredRelic && (
        <div style={{
          position: 'fixed',
          left: mousePosition.x + 15,
          top: mousePosition.y - 10,
          background: 'rgba(0, 0, 0, 0.95)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          border: `2px solid ${getRelicColor(hoveredRelic.rarity)}`,
          fontSize: '14px',
          maxWidth: '300px',
          zIndex: 1000,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: getRelicColor(hoveredRelic.rarity),
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            {hoveredRelic.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#ccc',
            textAlign: 'center',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {hoveredRelic.rarity} Relic
          </div>
          <div style={{
            lineHeight: '1.4',
            textAlign: 'center'
          }}>
            {hoveredRelic.description}
          </div>
          {hoveredRelic.effects && hoveredRelic.effects.length > 0 && (
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#aaa',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              Triggers: {hoveredRelic.effects.map((effect: any) => effect.trigger).join(', ')}
            </div>
          )}
        </div>
      )}
    </>
  );
};

const getRelicColor = (rarity: string): string => {
  switch (rarity) {
    case 'starter':
      return '#95a5a6';
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