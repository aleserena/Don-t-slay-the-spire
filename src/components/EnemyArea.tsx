import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Enemy } from '../types/game';
import { getStatusEffectIcon, getStatusEffectColor, getStatusEffectDescription, getStatusEffectName } from '../utils/statusEffects';
import { calculateDamage } from '../utils/statusEffects';
import { useGameStore } from '../store/gameStore';

interface EnemyAreaProps {
  enemies: Enemy[];
  selectedCard?: any;
  onEnemyClick?: (enemyId: string) => void;
}

export const EnemyArea: React.FC<EnemyAreaProps> = ({ enemies, selectedCard, onEnemyClick }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '20px',
      flexWrap: 'wrap',
      justifyContent: 'center'
    }}>
      {enemies.map((enemy) => (
        <EnemyCard 
          key={enemy.id} 
          enemy={enemy} 
          selectedCard={selectedCard}
          onEnemyClick={onEnemyClick}
        />
      ))}
    </div>
  );
};

interface EnemyCardProps {
  enemy: Enemy;
  selectedCard?: any;
  onEnemyClick?: (enemyId: string) => void;
}

const EnemyCard: React.FC<EnemyCardProps> = ({ enemy, selectedCard, onEnemyClick }) => {
  const { player } = useGameStore();
  const [hoveredIntent, setHoveredIntent] = useState<boolean>(false);
  const [hoveredStatusEffect, setHoveredStatusEffect] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleIntentMouseEnter = (event: React.MouseEvent) => {
    setHoveredIntent(true);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleIntentMouseLeave = () => {
    setHoveredIntent(false);
  };

  const handleIntentMouseMove = (event: React.MouseEvent) => {
    if (hoveredIntent) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleStatusEffectMouseEnter = (effect: any, event: React.MouseEvent) => {
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

  const getIntentIcon = () => {
    switch (enemy.intent.type) {
      case 'attack':
        return '⚔️';
      case 'defend':
        return '🛡️';
      case 'buff':
        return '💪';
      case 'debuff':
        return '💀';
      default:
        return '❓';
    }
  };

  const getIntentDescription = () => {
    switch (enemy.intent.type) {
      case 'attack':
        if (enemy.intent.value) {
          const finalDamage = calculateDamage(enemy.intent.value, enemy, player);
          return `Will attack for ${finalDamage} damage (base: ${enemy.intent.value}).`;
        }
        return 'Will attack for unknown damage.';
      case 'defend':
        return `Will gain ${enemy.intent.value || 'some'} block.`;
      case 'buff':
        return 'Will apply a beneficial effect to itself.';
      case 'debuff':
        return 'Will apply a harmful effect to you.';
      default:
        return 'Unknown intent.';
    }
  };

  const getIntentName = () => {
    switch (enemy.intent.type) {
      case 'attack':
        return 'Attack';
      case 'defend':
        return 'Defend';
      case 'buff':
        return 'Buff';
      case 'debuff':
        return 'Debuff';
      default:
        return 'Unknown';
    }
  };

  const getDamagePreview = () => {
    if (!selectedCard) return null;
    
    let totalDamage = 0;
    
    // Special handling for Body Slam
    if (selectedCard.id === 'body_slam') {
      totalDamage = calculateDamage(player.block, player, enemy);
    } else if (selectedCard.damage && selectedCard.damage > 0) {
      totalDamage = calculateDamage(selectedCard.damage, player, enemy);
      
      // Handle special cases for cards that deal damage multiple times
      if (selectedCard.id === 'twin_strike') {
        // Twin Strike deals damage twice
        totalDamage = totalDamage * 2;
      }
    }
    
    // Add damage from effects that target the same enemy
    if (selectedCard.effects) {
      for (const effect of selectedCard.effects) {
        if (effect.type === 'damage' && effect.target === 'enemy') {
          totalDamage += calculateDamage(effect.value, player, enemy);
        }
      }
    }
    
    if (totalDamage <= 0) return null;
    
    const damageAfterBlock = Math.max(0, totalDamage - enemy.block);
    const isVulnerable = enemy.statusEffects.some(effect => effect.type === 'vulnerable');
    
    return {
      totalDamage,
      actualDamage: damageAfterBlock,
      isVulnerable,
      wouldKill: damageAfterBlock >= enemy.health
    };
  };

  const damagePreview = getDamagePreview();
  const isTargetable = selectedCard && (
    (selectedCard.damage && selectedCard.damage > 0) || 
    selectedCard.id === 'body_slam'
  );

  const handleClick = () => {
    if (isTargetable && onEnemyClick) {
      onEnemyClick(enemy.id);
    }
  };

  return (
    <div 
      className={isTargetable ? 'enemy-card' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(100, 0, 0, 0.2)',
        border: `3px solid ${isTargetable ? '#ffd700' : '#ff4444'}`,
        borderRadius: '15px',
        padding: '20px',
        minWidth: '150px',
        cursor: isTargetable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        boxShadow: isTargetable ? '0 0 15px rgba(255, 215, 0, 0.5)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (isTargetable) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
        } else {
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        if (isTargetable) {
          e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)';
        }
      }}
      onClick={handleClick}
    >
      {/* Damage Preview */}
      {damagePreview && (
        <div style={{
          position: 'absolute',
          top: '-15px',
          right: '-15px',
          background: damagePreview.wouldKill ? '#e74c3c' : '#f39c12',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '15px',
          fontSize: '14px',
          fontWeight: 'bold',
          border: '2px solid white',
          zIndex: 20,
          minWidth: '60px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {damagePreview.isVulnerable && '🔥'} {damagePreview.totalDamage}
          </div>
          <div style={{ fontSize: '10px', opacity: 0.8 }}>
            -{damagePreview.actualDamage} HP
          </div>
          {damagePreview.wouldKill && (
            <div style={{ fontSize: '10px', color: '#fff' }}>
              💀 KILL
            </div>
          )}
        </div>
      )}

      {/* Enemy Name */}
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
        {enemy.name}
        {enemy.isElite && (
          <span style={{ 
            fontSize: '12px', 
            color: '#ffd700', 
            marginLeft: '5px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}>
            ⭐ ELITE
          </span>
        )}
      </div>
      
      {/* Health */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px',
        fontSize: '16px'
      }}>
        <span style={{ color: '#ff4444', marginRight: '5px' }}>❤️</span>
        <span>{enemy.health}/{enemy.maxHealth}</span>
      </div>
      
      {/* Block */}
      {enemy.block > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '10px',
          fontSize: '16px'
        }}>
          <span style={{ color: '#4444ff', marginRight: '5px' }}>🛡️</span>
          <span>{enemy.block}</span>
        </div>
      )}
      
      {/* Intent */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '5px 10px',
        borderRadius: '10px',
        marginBottom: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hoveredIntent ? 'scale(1.05)' : 'scale(1)'
      }}
      onMouseEnter={handleIntentMouseEnter}
      onMouseLeave={handleIntentMouseLeave}
      onMouseMove={handleIntentMouseMove}
      >
        <span style={{ marginRight: '5px', fontSize: '20px' }}>
          {getIntentIcon()}
        </span>
        {enemy.intent.value && (
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {enemy.intent.type === 'attack' ? calculateDamage(enemy.intent.value, enemy, player) : enemy.intent.value}
          </span>
        )}
      </div>
      
      {/* Status Effects */}
      {enemy.statusEffects.length > 0 && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '3px',
          justifyContent: 'center',
          marginTop: '5px'
        }}>
          {enemy.statusEffects.map((effect, index) => (
            <div 
              key={index} 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                background: getStatusEffectColor(effect.type),
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '10px',
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
              <span style={{ marginRight: '2px' }}>
                {getStatusEffectIcon(effect.type)}
              </span>
              <span>{effect.stacks}</span>
              {effect.duration && (
                <span style={{ fontSize: '8px', marginLeft: '1px' }}>
                  ({effect.duration})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Intent Tooltip */}
      {hoveredIntent && createPortal(
        <div style={{
          position: 'fixed',
          left: mousePosition.x + 15,
          top: mousePosition.y - 10,
          background: 'rgba(0, 0, 0, 0.95)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '2px solid #ff6b6b',
          fontSize: '14px',
          maxWidth: '250px',
          zIndex: 99999,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#ff6b6b',
            marginBottom: '8px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}>
            <span>{getIntentIcon()}</span>
            <span>{getIntentName()}</span>
            {enemy.intent.value && (
              <span style={{ color: '#fff' }}>
                ({enemy.intent.type === 'attack' ? calculateDamage(enemy.intent.value, enemy, player) : enemy.intent.value})
              </span>
            )}
          </div>
          <div style={{
            lineHeight: '1.4',
            textAlign: 'center'
          }}>
            {getIntentDescription()}
          </div>
        </div>,
        document.body
      )}

      {/* Status Effect Tooltip */}
      {hoveredStatusEffect && createPortal(
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
          zIndex: 99999,
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
        </div>,
        document.body
      )}
    </div>
  );
}; 