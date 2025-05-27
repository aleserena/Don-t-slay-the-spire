import React from 'react';
import { Enemy } from '../types/game';
import { getStatusEffectIcon, getStatusEffectColor } from '../utils/statusEffects';
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

  const getDamagePreview = () => {
    if (!selectedCard || !selectedCard.damage || selectedCard.damage <= 0) return null;
    
    const finalDamage = calculateDamage(selectedCard.damage, player, enemy);
    const damageAfterBlock = Math.max(0, finalDamage - enemy.block);
    const isVulnerable = enemy.statusEffects.some(effect => effect.type === 'vulnerable');
    
    return {
      totalDamage: finalDamage,
      actualDamage: damageAfterBlock,
      isVulnerable,
      wouldKill: damageAfterBlock >= enemy.health
    };
  };

  const damagePreview = getDamagePreview();
  const isTargetable = selectedCard && selectedCard.damage && selectedCard.damage > 0;

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
          zIndex: 10,
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
        marginBottom: '10px'
      }}>
        <span style={{ marginRight: '5px', fontSize: '20px' }}>
          {getIntentIcon()}
        </span>
        {enemy.intent.value && (
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {enemy.intent.value}
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
                border: '1px solid rgba(255,255,255,0.3)'
              }}
              title={`${effect.type}: ${effect.stacks}${effect.duration ? ` (${effect.duration} turns)` : ''}`}
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
    </div>
  );
}; 