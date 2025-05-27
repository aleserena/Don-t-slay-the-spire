import { Card, CardType, CardRarity, EffectType, TargetType, StatusType } from '../types/game';
import { v4 as uuidv4 } from 'uuid';

export const createInitialDeck = (): Card[] => {
  const cards: Card[] = [];

  // Strike cards (5 copies)
  for (let i = 0; i < 5; i++) {
    cards.push({
      id: uuidv4(),
      name: 'Strike',
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: 'Deal 6 damage.',
      damage: 6,
      upgraded: false
    });
  }

  // Defend cards (4 copies)
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: uuidv4(),
      name: 'Defend',
      cost: 1,
      type: CardType.SKILL,
      rarity: CardRarity.COMMON,
      description: 'Gain 5 Block.',
      block: 5,
      upgraded: false
    });
  }

  // Bash (1 copy)
  cards.push({
    id: uuidv4(),
    name: 'Bash',
    cost: 2,
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    description: 'Deal 8 damage. Apply 2 Vulnerable.',
    damage: 8,
    upgraded: false,
    effects: [{
      type: EffectType.APPLY_STATUS,
      value: 2,
      target: TargetType.ENEMY,
      statusType: StatusType.VULNERABLE
    }]
  });

  return cards;
};

export const getAllCards = (): Card[] => {
  return [
    // Basic Cards
    {
      id: 'strike',
      name: 'Strike',
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: 'Deal 6 damage.',
      damage: 6,
      upgraded: false
    },
    {
      id: 'defend',
      name: 'Defend',
      cost: 1,
      type: CardType.SKILL,
      rarity: CardRarity.COMMON,
      description: 'Gain 5 Block.',
      block: 5,
      upgraded: false
    },
    {
      id: 'bash',
      name: 'Bash',
      cost: 2,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: 'Deal 8 damage. Apply 2 Vulnerable.',
      damage: 8,
      upgraded: false,
      effects: [{
        type: EffectType.APPLY_STATUS,
        value: 2,
        target: TargetType.ENEMY,
        statusType: StatusType.VULNERABLE
      }]
    },

    // Advanced Attack Cards
    {
      id: 'anger',
      name: 'Anger',
      cost: 0,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: 'Deal 6 damage. Add a copy of this card into your discard pile.',
      damage: 6,
      upgraded: false,
      effects: [{
        type: EffectType.ADD_CARD_TO_DISCARD,
        value: 1,
        target: TargetType.SELF
      }]
    },
    {
      id: 'cleave',
      name: 'Cleave',
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: 'Deal 8 damage to ALL enemies.',
      damage: 8,
      upgraded: false,
      effects: [{
        type: EffectType.DAMAGE,
        value: 8,
        target: TargetType.ALL_ENEMIES
      }]
    },
    {
      id: 'iron_wave',
      name: 'Iron Wave',
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: 'Gain 5 Block. Deal 5 damage.',
      damage: 5,
      block: 5,
      upgraded: false
    },
    {
      id: 'pommel_strike',
      name: 'Pommel Strike',
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: 'Deal 9 damage. Draw 1 card.',
      damage: 9,
      upgraded: false,
      effects: [{
        type: EffectType.DRAW_CARDS,
        value: 1,
        target: TargetType.SELF
      }]
    },
    {
      id: 'twin_strike',
      name: 'Twin Strike',
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: 'Deal 5 damage twice.',
      damage: 5,
      upgraded: false,
      effects: [{
        type: EffectType.DAMAGE,
        value: 5,
        target: TargetType.ENEMY
      }]
    },

    // Status Effect Cards
    {
      id: 'poison_stab',
      name: 'Poison Stab',
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: 'Deal 6 damage. Apply 3 Poison.',
      damage: 6,
      upgraded: false,
      effects: [{
        type: EffectType.APPLY_STATUS,
        value: 3,
        target: TargetType.ENEMY,
        statusType: StatusType.POISON
      }]
    },
    {
      id: 'shockwave',
      name: 'Shockwave',
      cost: 2,
      type: CardType.SKILL,
      rarity: CardRarity.UNCOMMON,
      description: 'Apply 3 Weak and 3 Vulnerable to ALL enemies.',
      upgraded: false,
      effects: [
        {
          type: EffectType.APPLY_STATUS,
          value: 3,
          target: TargetType.ALL_ENEMIES,
          statusType: StatusType.WEAK
        },
        {
          type: EffectType.APPLY_STATUS,
          value: 3,
          target: TargetType.ALL_ENEMIES,
          statusType: StatusType.VULNERABLE
        }
      ]
    },

    // Skill Cards
    {
      id: 'armaments',
      name: 'Armaments',
      cost: 1,
      type: CardType.SKILL,
      rarity: CardRarity.COMMON,
      description: 'Gain 5 Block. Upgrade a card in your hand.',
      block: 5,
      upgraded: false
    },
    {
      id: 'body_slam',
      name: 'Body Slam',
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: 'Deal damage equal to your current Block.',
      damage: 0,
      upgraded: false
    },
    {
      id: 'true_grit',
      name: 'True Grit',
      cost: 1,
      type: CardType.SKILL,
      rarity: CardRarity.COMMON,
      description: 'Gain 7 Block. Exhaust a random card from your hand.',
      block: 7,
      upgraded: false
    },
    {
      id: 'battle_trance',
      name: 'Battle Trance',
      cost: 0,
      type: CardType.SKILL,
      rarity: CardRarity.UNCOMMON,
      description: 'Draw 3 cards. You cannot draw additional cards this turn.',
      upgraded: false,
      effects: [{
        type: EffectType.DRAW_CARDS,
        value: 3,
        target: TargetType.SELF
      }]
    },

    // Power Cards
    {
      id: 'inflame',
      name: 'Inflame',
      cost: 1,
      type: CardType.POWER,
      rarity: CardRarity.UNCOMMON,
      description: 'Gain 2 Strength.',
      upgraded: false,
      effects: [{
        type: EffectType.APPLY_STATUS,
        value: 2,
        target: TargetType.SELF,
        statusType: StatusType.STRENGTH
      }]
    },
    {
      id: 'metallicize',
      name: 'Metallicize',
      cost: 1,
      type: CardType.POWER,
      rarity: CardRarity.UNCOMMON,
      description: 'At the end of your turn, gain 3 Block.',
      upgraded: false,
      effects: [{
        type: EffectType.BLOCK,
        value: 3,
        target: TargetType.SELF
      }]
    },

    // Rare Cards
    {
      id: 'demon_form',
      name: 'Demon Form',
      cost: 3,
      type: CardType.POWER,
      rarity: CardRarity.RARE,
      description: 'At the start of each turn, gain 2 Strength.',
      upgraded: false,
      effects: [{
        type: EffectType.APPLY_STATUS,
        value: 2,
        target: TargetType.SELF,
        statusType: StatusType.STRENGTH
      }]
    },
    {
      id: 'whirlwind',
      name: 'Whirlwind',
      cost: 0,
      type: CardType.ATTACK,
      rarity: CardRarity.RARE,
      description: 'Deal 5 damage to ALL enemies X times. (X = Energy)',
      damage: 5,
      upgraded: false,
      effects: [{
        type: EffectType.DAMAGE,
        value: 5,
        target: TargetType.ALL_ENEMIES
      }]
    }
  ];
}; 