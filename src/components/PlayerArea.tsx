import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getStatusEffectIcon, getStatusEffectColor, getStatusEffectDescription, getStatusEffectName } from '../utils/statusEffects';
import { StatusEffect } from '../types/game';

export const PlayerArea: React.FC = () => {
  const { player } = useGameStore();
  const [hoveredStatusEffect, setHoveredStatusEffect] = useState<StatusEffect | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleStatusEffectMouseEnter = (effect: StatusEffect, event: React.MouseEvent) => {
    setHoveredStatusEffect(effect);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleStatusEffectMouseLeave = () => {
    setHoveredStatusEffect(null);
  };

  const handleStatusEffectMouseMove = (event: React.MouseEvent) => {
    if (hoveredStatusEffect) {
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
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '10px',
          padding: '8px',
          marginBottom: '10px',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '5px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>❤️ Health</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {player.health}/{player.maxHealth}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(player.health / player.maxHealth) * 100}%`,
              height: '100%',
              background: player.health > player.maxHealth * 0.5 
                ? 'linear-gradient(90deg, #27ae60, #2ecc71)' 
                : player.health > player.maxHealth * 0.25 
                  ? 'linear-gradient(90deg, #f39c12, #e67e22)'
                  : 'linear-gradient(90deg, #e74c3c, #c0392b)',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
        
        {/* Block */}
        {player.block > 0 && (
          <div style={{
            background: 'rgba(52, 152, 219, 0.8)',
            padding: '6px 12px',
            borderRadius: '8px',
            marginBottom: '10px',
            border: '2px solid rgba(255,255,255,0.3)',
            width: '100%',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
              🛡️ Block: {player.block}
            </span>
          </div>
        )}
        
        {/* Energy */}
        <div style={{
          background: 'rgba(255, 215, 0, 0.8)',
          padding: '6px 12px',
          borderRadius: '8px',
          marginBottom: '10px',
          border: '2px solid rgba(255,255,255,0.3)',
          width: '100%',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000' }}>
            ⚡ Energy: {player.energy}/{player.maxEnergy}
          </span>
        </div>

        {/* Status Effects */}
        {player.statusEffects.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '5px',
            justifyContent: 'center'
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
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: hoveredStatusEffect === effect ? 'scale(1.1)' : 'scale(1)'
                }}
                onMouseEnter={(e) => handleStatusEffectMouseEnter(effect, e)}
                onMouseLeave={handleStatusEffectMouseLeave}
                onMouseMove={handleStatusEffectMouseMove}
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

        {/* Active Power Cards */}
        {player.powerCards && player.powerCards.length > 0 && (
          <div style={{ 
            marginTop: '10px',
            width: '100%'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '5px',
              textAlign: 'center',
              color: '#ffe66d'
            }}>
              ⚡ Active Powers
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '5px',
              justifyContent: 'center'
            }}>
              {player.powerCards.map((powerCard, index) => (
                <div 
                  key={index} 
                  style={{ 
                    background: 'linear-gradient(135deg, #ffe66d, #ffcc02)',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#000',
                    border: '2px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    minWidth: '60px'
                  }}
                  title={powerCard.description}
                >
                  {powerCard.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Status Effect Tooltip */}
      {hoveredStatusEffect && (
        <div style={{
          position: 'fixed',
          left: mousePosition.x + 15,
          top: mousePosition.y - 10,
          background: 'rgba(0, 0, 0, 0.95)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          border: `2px solid ${getStatusEffectColor(hoveredStatusEffect.type)}`,
          fontSize: '14px',
          maxWidth: '250px',
          zIndex: 1000,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: getStatusEffectColor(hoveredStatusEffect.type),
            marginBottom: '8px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}>
            <span>{getStatusEffectIcon(hoveredStatusEffect.type)}</span>
            <span>{getStatusEffectName(hoveredStatusEffect.type)}</span>
            <span style={{ color: '#fff' }}>({hoveredStatusEffect.stacks})</span>
          </div>
          <div style={{
            lineHeight: '1.4',
            textAlign: 'center',
            marginBottom: hoveredStatusEffect.duration ? '8px' : '0'
          }}>
            {getStatusEffectDescription(hoveredStatusEffect.type)}
          </div>
          {hoveredStatusEffect.duration && (
            <div style={{
              fontSize: '12px',
              color: '#ccc',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              Duration: {hoveredStatusEffect.duration} turns
            </div>
          )}
        </div>
      )}
    </>
  );
}; 