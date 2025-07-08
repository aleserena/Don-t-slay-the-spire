import { MonsterCard, MonsterCardType, EffectType, TargetType, StatusType } from '../types/game';

// Cultist Cards
export const cultistCards: MonsterCard[] = [
  {
    id: 'dark_strike',
    baseId: 'dark_strike',
    name: 'Dark Strike',
    type: MonsterCardType.ATTACK,
    description: 'Deal 6 damage.',
    damage: 6,
    priority: 3,
    effects: [{
      type: EffectType.DAMAGE,
      value: 6,
      target: TargetType.ENEMY // Target is the player from monster perspective
    }]
  },
  {
    id: 'incantation',
    baseId: 'incantation',
    name: 'Incantation',
    type: MonsterCardType.BUFF,
    description: 'Gain 2 Strength.',
    priority: 2,
    effects: [{
      type: EffectType.APPLY_STATUS,
      value: 2,
      target: TargetType.SELF,
      statusType: StatusType.STRENGTH
    }]
  },
  {
    id: 'ritual_dagger',
    baseId: 'ritual_dagger',
    name: 'Ritual Dagger',
    type: MonsterCardType.ATTACK,
    description: 'Deal 8 damage.',
    damage: 8,
    priority: 4,
    effects: [{
      type: EffectType.DAMAGE,
      value: 8,
      target: TargetType.ENEMY
    }]
  }
];

// Jaw Worm Cards
export const jawWormCards: MonsterCard[] = [
  {
    id: 'chomp',
    baseId: 'chomp',
    name: 'Chomp',
    type: MonsterCardType.ATTACK,
    description: 'Deal 11 damage.',
    damage: 11,
    priority: 4,
    effects: [{
      type: EffectType.DAMAGE,
      value: 11,
      target: TargetType.ENEMY
    }]
  },
  {
    id: 'thrash',
    baseId: 'thrash',
    name: 'Thrash',
    type: MonsterCardType.ATTACK,
    description: 'Deal 7 damage. Gain 5 Block.',
    damage: 7,
    block: 5,
    priority: 3,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: 7,
        target: TargetType.ENEMY
      },
      {
        type: EffectType.BLOCK,
        value: 5,
        target: TargetType.SELF
      }
    ]
  },
  {
    id: 'bellow',
    baseId: 'bellow',
    name: 'Bellow',
    type: MonsterCardType.BUFF,
    description: 'Gain 3 Strength and 6 Block.',
    priority: 2,
    effects: [
      {
        type: EffectType.APPLY_STATUS,
        value: 3,
        target: TargetType.SELF,
        statusType: StatusType.STRENGTH
      },
      {
        type: EffectType.BLOCK,
        value: 6,
        target: TargetType.SELF
      }
    ]
  }
];

// Louse Cards (shared between Red and Green)
export const louseCards: MonsterCard[] = [
  {
    id: 'bite',
    baseId: 'bite',
    name: 'Bite',
    type: MonsterCardType.ATTACK,
    description: 'Deal 5 damage.',
    damage: 5,
    priority: 3,
    effects: [{
      type: EffectType.DAMAGE,
      value: 5,
      target: TargetType.ENEMY
    }]
  },
  {
    id: 'grow',
    baseId: 'grow',
    name: 'Grow',
    type: MonsterCardType.BUFF,
    description: 'Gain 3 Strength.',
    priority: 2,
    effects: [{
      type: EffectType.APPLY_STATUS,
      value: 3,
      target: TargetType.SELF,
      statusType: StatusType.STRENGTH
    }]
  }
];

// Acid Slime Cards
export const acidSlimeCards: MonsterCard[] = [
  {
    id: 'corrosive_spit',
    baseId: 'corrosive_spit',
    name: 'Corrosive Spit',
    type: MonsterCardType.DEBUFF,
    description: 'Apply 2 Weak.',
    priority: 3,
    effects: [{
      type: EffectType.APPLY_STATUS,
      value: 2,
      target: TargetType.ENEMY,
      statusType: StatusType.WEAK
    }]
  },
  {
    id: 'tackle',
    baseId: 'tackle',
    name: 'Tackle',
    type: MonsterCardType.ATTACK,
    description: 'Deal 10 damage.',
    damage: 10,
    priority: 4,
    effects: [{
      type: EffectType.DAMAGE,
      value: 10,
      target: TargetType.ENEMY
    }]
  },
  {
    id: 'lick',
    baseId: 'lick',
    name: 'Lick',
    type: MonsterCardType.DEBUFF,
    description: 'Apply 1 Weak and 1 Vulnerable.',
    priority: 2,
    effects: [
      {
        type: EffectType.APPLY_STATUS,
        value: 1,
        target: TargetType.ENEMY,
        statusType: StatusType.WEAK
      },
      {
        type: EffectType.APPLY_STATUS,
        value: 1,
        target: TargetType.ENEMY,
        statusType: StatusType.VULNERABLE
      }
    ]
  }
];

// Spike Slime Cards
export const spikeSlimeCards: MonsterCard[] = [
  {
    id: 'flame_tackle',
    baseId: 'flame_tackle',
    name: 'Flame Tackle',
    type: MonsterCardType.ATTACK,
    description: 'Deal 8 damage.',
    damage: 8,
    priority: 4,
    effects: [{
      type: EffectType.DAMAGE,
      value: 8,
      target: TargetType.ENEMY
    }]
  },
  {
    id: 'lick',
    baseId: 'lick',
    name: 'Lick',
    type: MonsterCardType.DEBUFF,
    description: 'Apply 1 Weak.',
    priority: 2,
    effects: [{
      type: EffectType.APPLY_STATUS,
      value: 1,
      target: TargetType.ENEMY,
      statusType: StatusType.WEAK
    }]
  }
];

// Fungi Beast Cards
export const fungiBeastCards: MonsterCard[] = [
  {
    id: 'bite',
    baseId: 'bite',
    name: 'Bite',
    type: MonsterCardType.ATTACK,
    description: 'Deal 6 damage.',
    damage: 6,
    priority: 3,
    effects: [{
      type: EffectType.DAMAGE,
      value: 6,
      target: TargetType.ENEMY
    }]
  },
  {
    id: 'grow',
    baseId: 'grow',
    name: 'Grow',
    type: MonsterCardType.BUFF,
    description: 'Gain 3 Strength.',
    priority: 2,
    effects: [{
      type: EffectType.APPLY_STATUS,
      value: 3,
      target: TargetType.SELF,
      statusType: StatusType.STRENGTH
    }]
  },
  {
    id: 'spore_cloud',
    baseId: 'spore_cloud',
    name: 'Spore Cloud',
    type: MonsterCardType.DEBUFF,
    description: 'Apply 2 Vulnerable.',
    priority: 2,
    effects: [{
      type: EffectType.APPLY_STATUS,
      value: 2,
      target: TargetType.ENEMY,
      statusType: StatusType.VULNERABLE
    }]
  }
];

// Looter Cards
export const looterCards: MonsterCard[] = [
  {
    id: 'mug',
    baseId: 'mug',
    name: 'Mug',
    type: MonsterCardType.ATTACK,
    description: 'Deal 10 damage.',
    damage: 10,
    priority: 4,
    effects: [{
      type: EffectType.DAMAGE,
      value: 10,
      target: TargetType.ENEMY
    }]
  },
  {
    id: 'smoke_bomb',
    baseId: 'smoke_bomb',
    name: 'Smoke Bomb',
    type: MonsterCardType.DEFEND,
    description: 'Gain 6 Block.',
    block: 6,
    priority: 2,
    effects: [{
      type: EffectType.BLOCK,
      value: 6,
      target: TargetType.SELF
    }]
  },
  {
    id: 'lunge',
    baseId: 'lunge',
    name: 'Lunge',
    type: MonsterCardType.ATTACK,
    description: 'Deal 12 damage.',
    damage: 12,
    priority: 3,
    effects: [{
      type: EffectType.DAMAGE,
      value: 12,
      target: TargetType.ENEMY
    }]
  }
];

// Gremlin Nob Cards
export const gremlinNobCards: MonsterCard[] = [
  {
    id: 'bellow',
    baseId: 'bellow',
    name: 'Bellow',
    type: MonsterCardType.BUFF,
    description: 'Gain 2 Strength and 6 Block.',
    priority: 3,
    effects: [
      {
        type: EffectType.APPLY_STATUS,
        value: 2,
        target: TargetType.SELF,
        statusType: StatusType.STRENGTH
      },
      {
        type: EffectType.BLOCK,
        value: 6,
        target: TargetType.SELF
      }
    ]
  },
  {
    id: 'skull_bash',
    baseId: 'skull_bash',
    name: 'Skull Bash',
    type: MonsterCardType.ATTACK,
    description: 'Deal 6 damage. Apply 2 Vulnerable.',
    damage: 6,
    priority: 4,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: 6,
        target: TargetType.ENEMY
      },
      {
        type: EffectType.APPLY_STATUS,
        value: 2,
        target: TargetType.ENEMY,
        statusType: StatusType.VULNERABLE
      }
    ]
  },
  {
    id: 'rush',
    baseId: 'rush',
    name: 'Rush',
    type: MonsterCardType.ATTACK,
    description: 'Deal 14 damage.',
    damage: 14,
    priority: 5,
    effects: [{
      type: EffectType.DAMAGE,
      value: 14,
      target: TargetType.ENEMY
    }]
  }
];

// Sentry Cards
export const sentryCards: MonsterCard[] = [
  {
    id: 'beam',
    baseId: 'beam',
    name: 'Beam',
    type: MonsterCardType.ATTACK,
    description: 'Deal 9 damage.',
    damage: 9,
    priority: 4,
    effects: [{
      type: EffectType.DAMAGE,
      value: 9,
      target: TargetType.ENEMY
    }]
  },
  {
    id: 'bolt',
    baseId: 'bolt',
    name: 'Bolt',
    type: MonsterCardType.ATTACK,
    description: 'Deal 5 damage. Add a Dazed to the player\'s discard pile.',
    damage: 5,
    priority: 3,
    effects: [{
      type: EffectType.DAMAGE,
      value: 5,
      target: TargetType.ENEMY
    }]
  }
];

// Fat Gremlin Cards
export const fatGremlinCards: MonsterCard[] = [
  {
    id: 'smash',
    baseId: 'smash',
    name: 'Smash',
    type: MonsterCardType.ATTACK,
    description: 'Deal 4 damage. Apply 1 Weak.',
    damage: 4,
    priority: 3,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: 4,
        target: TargetType.ENEMY
      },
      {
        type: EffectType.APPLY_STATUS,
        value: 1,
        target: TargetType.ENEMY,
        statusType: StatusType.WEAK
      }
    ]
  }
];

// Mad Gremlin Cards
export const madGremlinCards: MonsterCard[] = [
  {
    id: 'scratch',
    baseId: 'scratch',
    name: 'Scratch',
    type: MonsterCardType.ATTACK,
    description: 'Deal 4 damage.',
    damage: 4,
    priority: 3,
    effects: [{
      type: EffectType.DAMAGE,
      value: 4,
      target: TargetType.ENEMY
    }]
  },
  {
    id: 'anger',
    baseId: 'anger',
    name: 'Anger',
    type: MonsterCardType.BUFF,
    description: 'Gain 1 Strength.',
    priority: 2,
    effects: [{
      type: EffectType.APPLY_STATUS,
      value: 1,
      target: TargetType.SELF,
      statusType: StatusType.STRENGTH
    }]
  }
];

// Sneaky Gremlin Cards
export const sneakyGremlinCards: MonsterCard[] = [
  {
    id: 'puncture',
    baseId: 'puncture',
    name: 'Puncture',
    type: MonsterCardType.ATTACK,
    description: 'Deal 9 damage.',
    damage: 9,
    priority: 4,
    effects: [{
      type: EffectType.DAMAGE,
      value: 9,
      target: TargetType.ENEMY
    }]
  }
];

// Function to get deck for specific enemy type
export const getEnemyDeck = (enemyName: string): MonsterCard[] => {
  switch (enemyName.toLowerCase()) {
    case 'cultist':
      return [...cultistCards];
    case 'jaw worm':
      return [...jawWormCards];
    case 'red louse':
    case 'green louse':
      return [...louseCards];
    case 'acid slime':
      return [...acidSlimeCards];
    case 'spike slime':
      return [...spikeSlimeCards];
    case 'fungi beast':
      return [...fungiBeastCards];
    case 'looter':
      return [...looterCards];
    case 'gremlin nob':
      return [...gremlinNobCards];
    case 'sentry':
      return [...sentryCards];
    case 'fat gremlin':
      return [...fatGremlinCards];
    case 'mad gremlin':
      return [...madGremlinCards];
    case 'sneaky gremlin':
      return [...sneakyGremlinCards];
    default:
      return [...cultistCards]; // Default fallback
  }
};

// Function to select a card from enemy deck based on priority and strategy
export const selectEnemyCard = (deck: MonsterCard[], enemyHealth: number, maxHealth: number): MonsterCard => {
  if (!deck || deck.length === 0) {
    // Fallback to cultist cards if deck is undefined or empty
    const fallbackDeck = [...cultistCards];
    if (fallbackDeck.length === 0) {
      throw new Error('No monster cards available');
    }
    deck = fallbackDeck;
  }

  // Simple AI: prefer defensive cards when low on health, otherwise prefer attacks
  const healthPercentage = enemyHealth / maxHealth;
  
  let preferredTypes: MonsterCardType[] = [];
  if (healthPercentage < 0.3) {
    preferredTypes = [MonsterCardType.DEFEND, MonsterCardType.BUFF];
  } else if (healthPercentage < 0.6) {
    preferredTypes = [MonsterCardType.ATTACK, MonsterCardType.BUFF];
  } else {
    preferredTypes = [MonsterCardType.ATTACK, MonsterCardType.DEBUFF];
  }

  // Filter cards by preferred types
  const preferredCards = deck.filter(card => preferredTypes.includes(card.type));
  const cardsToChooseFrom = preferredCards.length > 0 ? preferredCards : deck;

  // Weight selection by priority
  const totalPriority = cardsToChooseFrom.reduce((sum, card) => sum + card.priority, 0);
  let random = Math.random() * totalPriority;

  for (const card of cardsToChooseFrom) {
    random -= card.priority;
    if (random <= 0) {
      return { ...card, id: `${card.baseId}_${Date.now()}_${Math.floor(Math.random() * 1000)}` };
    }
  }

  // Fallback to first card
  const fallbackCard = cardsToChooseFrom[0];
  return { ...fallbackCard, id: `${fallbackCard.baseId}_${Date.now()}_${Math.floor(Math.random() * 1000)}` };
}; 