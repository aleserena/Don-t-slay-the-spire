import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { cardNeedsTarget, isMultiTargetCard, getCardDamagePreview } from '../utils/cardUtils';
import { calculateDamage } from '../utils/statusEffects';

interface EnemyAreaProps {
  selectedCard: any;
  confirmingCard?: any;
  onEnemyTarget: (enemyId: string) => void;
}

export const EnemyArea: React.FC<EnemyAreaProps> = ({ selectedCard, confirmingCard, onEnemyTarget }) => {
  const { enemies, player } = useGameStore();
  const [hoveredStatusEffect, setHoveredStatusEffect] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleStatusEffectMouseEnter = (effect: any, event: React.MouseEvent) => {
    setHoveredStatusEffect(effect);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleStatusEffectMouseLeave = () => {
    setHoveredStatusEffect(null);
  };

  const handleStatusEffectMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const getStatusEffectIcon = (type: string): string => {
    switch (type) {
      case 'poison': return '☠️';
      case 'vulnerable': return '💔';
      case 'weak': return '😵';
      case 'strength': return '💪';
      default: return '❓';
    }
  };

  const getStatusEffectName = (type: string): string => {
    switch (type) {
      case 'poison': return 'Poison';
      case 'vulnerable': return 'Vulnerable';
      case 'weak': return 'Weak';
      case 'strength': return 'Strength';
      default: return 'Unknown';
    }
  };

  const getStatusEffectDescription = (type: string): string => {
    switch (type) {
      case 'poison': return 'Takes damage at the end of turn equal to poison stacks.';
      case 'vulnerable': return 'Takes 50% more damage from attacks.';
      case 'weak': return 'Deals 25% less damage with attacks.';
      case 'strength': return 'Deals additional damage with attacks equal to strength stacks.';
      default: return 'Unknown effect.';
    }
  };

  const getStatusEffectColor = (type: string): string => {
    switch (type) {
      case 'poison': return 'rgba(155, 89, 182, 0.8)';
      case 'vulnerable': return 'rgba(231, 76, 60, 0.8)';
      case 'weak': return 'rgba(241, 196, 15, 0.8)';
      case 'strength': return 'rgba(46, 204, 113, 0.8)';
      default: return 'rgba(149, 165, 166, 0.8)';
    }
  };

  const needsTarget = selectedCard && cardNeedsTarget(selectedCard);

  const getDamagePreview = (enemy: any) => {
    // Show damage preview for selected card (targeting) or confirming card (confirmation phase)
    const cardToPreview = selectedCard || confirmingCard;
    if (!cardToPreview) return null;
    
    // Show damage preview for cards that need targeting or multi-target cards
    const showPreview = cardNeedsTarget(cardToPreview) || isMultiTargetCard(cardToPreview);
    if (!showPreview) return null;
    
    // For Whirlwind, calculate damage correctly using energy multiplier
    if (cardToPreview.id === 'whirlwind') {
      const energyEffect = cardToPreview.effects?.find((effect: any) => effect.type === 'damage_multiplier_energy');
      if (energyEffect) {
        const hitsCount = player.energy;
        const damagePerHit = calculateDamage(energyEffect.value, player, enemy, false);
        const totalDamage = damagePerHit * hitsCount;
        const actualDamage = Math.max(0, totalDamage - enemy.block);
        const isVulnerable = enemy.statusEffects.some((effect: any) => effect.type === 'vulnerable');
        const wouldKill = actualDamage >= enemy.health;
        
        return {
          totalDamage,
          actualDamage,
          isVulnerable,
          wouldKill,
          hitsCount
        };
      }
    }
    
    const cardPreview = getCardDamagePreview(cardToPreview, player, [enemy]);
    if (!cardPreview || cardPreview.previews.length === 0) return null;
    
    const preview = cardPreview.previews[0];
    
    if (preview.totalDamage <= 0) return null;
    
    return {
      totalDamage: preview.totalDamage,
      actualDamage: preview.actualDamage,
      isVulnerable: preview.isVulnerable,
      wouldKill: preview.wouldKill,
      hitsCount: preview.hitsCount
    };
  };

  return (
    <div style={{
      display: 'flex',
      gap: '20px',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      minHeight: '200px'
    }}>
      {enemies.map((enemy) => {
        const damagePreview = getDamagePreview(enemy);
        
        return (
          <div
            key={enemy.id}
            className="enemy-card"
            style={{
              width: '180px',
              minHeight: '220px',
              background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
              border: needsTarget ? '3px solid #ffd700' : '2px solid #ffffff',
              borderRadius: '15px',
              padding: '15px',
              color: 'white',
              textAlign: 'center',
              cursor: needsTarget ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              boxShadow: needsTarget 
                ? '0 8px 16px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3)' 
                : '0 6px 12px rgba(0,0,0,0.3)',
              transform: needsTarget ? 'scale(1.05)' : 'scale(1)',
              position: 'relative'
            }}
            onClick={() => needsTarget && onEnemyTarget(enemy.id)}
            onMouseEnter={(e) => {
              if (needsTarget) {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (needsTarget) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3)';
              }
            }}
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
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '10px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}>
              {enemy.name}
            </div>

            {/* Health Bar */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '10px',
              padding: '8px',
              marginBottom: '10px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '5px'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>❤️ Health</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {enemy.health}/{enemy.maxHealth}
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
                  width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                  height: '100%',
                  background: enemy.health > enemy.maxHealth * 0.5 
                    ? 'linear-gradient(90deg, #27ae60, #2ecc71)' 
                    : enemy.health > enemy.maxHealth * 0.25 
                      ? 'linear-gradient(90deg, #f39c12, #e67e22)'
                      : 'linear-gradient(90deg, #e74c3c, #c0392b)',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Block */}
            {enemy.block > 0 && (
              <div style={{
                background: 'rgba(52, 152, 219, 0.8)',
                padding: '6px 12px',
                borderRadius: '8px',
                marginBottom: '10px',
                border: '2px solid rgba(255,255,255,0.3)'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  🛡️ Block: {enemy.block}
                </span>
              </div>
            )}

            {/* Intent */}
            {enemy.intent && (
              <div style={{
                background: 'rgba(231, 76, 60, 0.8)',
                padding: '8px',
                borderRadius: '8px',
                marginBottom: '10px',
                border: '2px solid rgba(255,255,255,0.3)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Next Turn:
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {enemy.intent.type === 'attack' && '⚔️'}
                  {enemy.intent.type === 'defend' && '🛡️'}
                  {enemy.intent.type === 'buff' && '💪'}
                  {enemy.intent.type === 'debuff' && '💀'}
                  {enemy.intent.type === 'unknown' && '❓'}
                  {' '}
                  {enemy.intent.value && enemy.intent.type === 'attack' && `${calculateDamage(enemy.intent.value, enemy, player)} damage`}
                  {enemy.intent.value && enemy.intent.type === 'defend' && `${enemy.intent.value} block`}
                  {enemy.intent.type === 'buff' && 'Buff'}
                  {enemy.intent.type === 'debuff' && 'Debuff'}
                  {enemy.intent.type === 'unknown' && 'Unknown'}
                </div>
              </div>
            )}

            {/* Status Effects */}
            {enemy.statusEffects && enemy.statusEffects.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                justifyContent: 'center'
              }}>
                {enemy.statusEffects.map((effect, index) => (
                  <div
                    key={index}
                    style={{
                      background: getStatusEffectColor(effect.type),
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                    onMouseEnter={(e) => handleStatusEffectMouseEnter(effect, e)}
                    onMouseLeave={handleStatusEffectMouseLeave}
                    onMouseMove={handleStatusEffectMouseMove}
                  >
                    {getStatusEffectIcon(effect.type)}
                    {' '}
                    {effect.stacks}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}
      </style>

      {/* Floating Status Effect Tooltip */}
      {hoveredStatusEffect && (
        <div style={{
          position: 'fixed',
          left: mousePosition.x,
          top: mousePosition.y,
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
            <span style={{ color: '#fff' }}>({hoveredStatusEffect.type})</span>
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
    </div>
  );
}; 