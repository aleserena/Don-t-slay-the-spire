import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { StatusType } from '../types/game';
import { getAllCards } from '../data/cards';
import { getAllRelics } from '../data/relics';
import { Card } from '../types/game';

export const DebugPanel: React.FC = () => {
  const { 
    player, 
    enemies, 
    hand, 
    drawPile, 
    discardPile,
    drawCards,
    endTurn,
    debugMode
  } = useGameStore();
  
  const [isOpen, setIsOpen] = useState(false);

  // Don't render anything if debug mode is off
  if (!debugMode) {
    return null;
  }

  const handleHealPlayer = () => {
    useGameStore.setState({
      player: {
        ...player,
        health: player.maxHealth
      }
    });
  };

  const handleAddEnergy = () => {
    useGameStore.setState({
      player: {
        ...player,
        energy: Math.min(player.maxEnergy + 3, player.energy + 1)
      }
    });
  };

  const handleAddGold = () => {
    useGameStore.setState({
      player: {
        ...player,
        gold: player.gold + 100
      }
    });
  };

  const handleAddBlock = () => {
    useGameStore.setState({
      player: {
        ...player,
        block: player.block + 10
      }
    });
  };

  const handleKillAllEnemies = () => {
    useGameStore.setState({
      enemies: enemies.map(enemy => ({
        ...enemy,
        health: 0
      }))
    });
  };

  const handleAddVulnerable = () => {
    if (enemies.length > 0) {
      useGameStore.setState({
        enemies: enemies.map(enemy => ({
          ...enemy,
          statusEffects: [
            ...enemy.statusEffects,
            {
              type: StatusType.VULNERABLE,
              stacks: 3,
              duration: undefined
            }
          ]
        }))
      });
    }
  };

  const handleAddRandomCard = () => {
    const allCards = getAllCards();
    const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
    const cardWithId = { ...randomCard, id: `${randomCard.baseId}_debug_${Date.now()}` };
    
    useGameStore.setState({
      hand: [...hand, cardWithId]
    });
  };

  const handleAddRandomRelic = () => {
    const allRelics = getAllRelics();
    const availableRelics = allRelics.filter(relic => 
      !player.relics.some(playerRelic => playerRelic.id === relic.id)
    );
    
    if (availableRelics.length > 0) {
      const randomRelic = availableRelics[Math.floor(Math.random() * availableRelics.length)];
      useGameStore.setState({
        player: {
          ...player,
          relics: [...player.relics, randomRelic]
        }
      });
    }
  };

  const handleAddPowerCard = () => {
    const powerCardIds = ['inflame', 'metallicize', 'demon_form'];
    const randomPowerCardId = powerCardIds[Math.floor(Math.random() * powerCardIds.length)];
    
    const powerCard: Card = {
      id: `${randomPowerCardId}_debug_${Date.now()}`,
      baseId: randomPowerCardId,
      name: randomPowerCardId === 'metallicize' ? 'Metallicize' :
            randomPowerCardId === 'demon_form' ? 'Demon Form' :
            'Inflame',
      cost: randomPowerCardId === 'demon_form' ? 3 : 1,
      type: 'power' as any,
      rarity: 'uncommon' as any,
      description: randomPowerCardId === 'metallicize' ? 'At the end of your turn, gain 3 Block.' :
                   randomPowerCardId === 'demon_form' ? 'At the start of each turn, gain 2 Strength.' :
                   'Gain 2 Strength.',
      upgraded: false
    };
    
    useGameStore.setState({
      hand: [...hand, powerCard]
    });
  };

  const handleAddEnergyCore = () => {
    const energyCore = getAllRelics().find(r => r.id === 'energy_core');
    if (energyCore && !player.relics.some(r => r.id === 'energy_core')) {
      useGameStore.setState({
        player: {
          ...player,
          relics: [...player.relics, energyCore]
        }
      });
    }
  };

  const handleClearHand = () => {
    useGameStore.setState({
      discardPile: [...discardPile, ...hand],
      hand: []
    });
  };

  const handleDrawCards = () => {
    drawCards(3);
  };

  const handleResetCombat = () => {
    useGameStore.setState({
      player: {
        ...player,
        energy: player.maxEnergy,
        block: 0,
        statusEffects: []
      },
      enemies: enemies.map(enemy => ({
        ...enemy,
        health: enemy.maxHealth,
        block: 0,
        statusEffects: []
      })),
      hand: [],
      drawPile: [...drawPile, ...discardPile, ...hand],
      discardPile: [],
      currentTurn: 'player_turn' as any
    });
    
    setTimeout(() => drawCards(5), 100);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 1000,
          fontWeight: 'bold'
        }}
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '70px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      border: '2px solid #e74c3c',
      borderRadius: '8px',
      padding: '15px',
      zIndex: 1000,
      minWidth: '250px',
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: 0, color: '#e74c3c' }}>🐛 Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ borderBottom: '1px solid #666', paddingBottom: '8px', marginBottom: '8px' }}>
          <strong>Player Actions</strong>
        </div>
        
        <button onClick={handleHealPlayer} style={buttonStyle}>
          ❤️ Heal to Full
        </button>
        
        <button onClick={handleAddEnergy} style={buttonStyle}>
          ⚡ +1 Energy
        </button>
        
        <button onClick={handleAddGold} style={buttonStyle}>
          💰 +100 Gold
        </button>
        
        <button onClick={handleAddBlock} style={buttonStyle}>
          🛡️ +10 Block
        </button>

        <div style={{ borderBottom: '1px solid #666', paddingBottom: '8px', marginBottom: '8px', marginTop: '15px' }}>
          <strong>Enemy Actions</strong>
        </div>
        
        <button onClick={handleKillAllEnemies} style={buttonStyle}>
          💀 Kill All Enemies
        </button>
        
        <button onClick={handleAddVulnerable} style={buttonStyle}>
          🔥 Add Vulnerable to Enemies
        </button>

        <div style={{ borderBottom: '1px solid #666', paddingBottom: '8px', marginBottom: '8px', marginTop: '15px' }}>
          <strong>Card Actions</strong>
        </div>
        
        <button onClick={handleAddRandomCard} style={buttonStyle}>
          🃏 Add Random Card
        </button>
        
        <button onClick={handleDrawCards} style={buttonStyle}>
          📚 Draw 3 Cards
        </button>
        
        <button onClick={handleClearHand} style={buttonStyle}>
          🗑️ Clear Hand
        </button>

        <div style={{ borderBottom: '1px solid #666', paddingBottom: '8px', marginBottom: '8px', marginTop: '15px' }}>
          <strong>Other Actions</strong>
        </div>
        
        <button onClick={handleAddRandomRelic} style={buttonStyle}>
          🏺 Add Random Relic
        </button>
        
        <button onClick={handleAddPowerCard} style={buttonStyle}>
          🎲 Add Random Power Card
        </button>
        
        <button onClick={handleAddEnergyCore} style={buttonStyle}>
          🔋 Add Energy Core
        </button>
        
        <button onClick={handleResetCombat} style={buttonStyle}>
          🔄 Reset Combat
        </button>
        
        <button onClick={endTurn} style={buttonStyle}>
          ⏭️ Force End Turn
        </button>

        <div style={{ borderTop: '1px solid #666', paddingTop: '8px', marginTop: '15px', fontSize: '11px', opacity: 0.7 }}>
          <div>Hand: {hand.length} | Draw: {drawPile.length} | Discard: {discardPile.length}</div>
          <div>Health: {player.health}/{player.maxHealth} | Energy: {player.energy}/{player.maxEnergy}</div>
          <div>Gold: {player.gold} | Relics: {player.relics.length}</div>
          {enemies.length > 0 && (
            <div>Enemies: {enemies.map(e => `${e.name}(${e.health})`).join(', ')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  background: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  padding: '6px 10px',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  textAlign: 'left'
}; 