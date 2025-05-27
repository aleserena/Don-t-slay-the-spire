import { Card, CardType } from '../types/game';

export const upgradeCard = (card: Card): Card => {
  if (card.upgraded) return card; // Already upgraded

  const upgradedCard: Card = {
    ...card,
    upgraded: true,
    name: `${card.name}+`
  };

  // Apply upgrades based on card type and specific cards
  switch (card.id) {
    case 'strike':
      upgradedCard.damage = (card.damage || 0) + 3;
      upgradedCard.description = 'Deal 9 damage.';
      break;
    
    case 'defend':
      upgradedCard.block = (card.block || 0) + 3;
      upgradedCard.description = 'Gain 8 Block.';
      break;
    
    case 'bash':
      upgradedCard.damage = (card.damage || 0) + 2;
      upgradedCard.description = 'Deal 10 damage. Apply 2 Vulnerable.';
      break;
    
    case 'iron_wave':
      upgradedCard.damage = (card.damage || 0) + 2;
      upgradedCard.block = (card.block || 0) + 2;
      upgradedCard.description = 'Gain 7 Block. Deal 7 damage.';
      break;
    
    case 'pommel_strike':
      upgradedCard.damage = (card.damage || 0) + 1;
      upgradedCard.description = 'Deal 10 damage. Draw 1 card.';
      break;
    
    case 'cleave':
      upgradedCard.damage = (card.damage || 0) + 3;
      upgradedCard.description = 'Deal 11 damage to ALL enemies.';
      break;
    
    default:
      // Generic upgrades based on card type
      if (card.type === CardType.ATTACK) {
        if (card.damage) {
          upgradedCard.damage = card.damage + 3;
        }
        if (card.cost > 0) {
          upgradedCard.cost = Math.max(0, card.cost - 1);
        }
      } else if (card.type === CardType.SKILL) {
        if (card.block) {
          upgradedCard.block = card.block + 3;
        }
        if (card.cost > 0) {
          upgradedCard.cost = Math.max(0, card.cost - 1);
        }
      } else if (card.type === CardType.POWER) {
        if (card.cost > 0) {
          upgradedCard.cost = Math.max(0, card.cost - 1);
        }
      }
      
      // Enhance effects
      if (card.effects) {
        upgradedCard.effects = card.effects.map(effect => ({
          ...effect,
          value: effect.value + 1
        }));
      }
      
      upgradedCard.description = `${card.description} (Upgraded)`;
      break;
  }

  return upgradedCard;
};

export const canUpgradeCard = (card: Card): boolean => {
  return !card.upgraded;
};

export const getUpgradePreview = (card: Card): string => {
  if (card.upgraded) return 'Already upgraded';
  
  const upgraded = upgradeCard(card);
  const changes: string[] = [];
  
  if (upgraded.damage !== card.damage) {
    changes.push(`Damage: ${card.damage} → ${upgraded.damage}`);
  }
  
  if (upgraded.block !== card.block) {
    changes.push(`Block: ${card.block} → ${upgraded.block}`);
  }
  
  if (upgraded.cost !== card.cost) {
    changes.push(`Cost: ${card.cost} → ${upgraded.cost}`);
  }
  
  if (changes.length === 0) {
    changes.push('Enhanced effects');
  }
  
  return changes.join(', ');
}; 