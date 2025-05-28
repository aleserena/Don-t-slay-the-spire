import { Relic, RelicRarity, RelicTrigger, EffectType, StatusType } from '../types/game';

export const getAllRelics = (): Relic[] => {
  return [
    // Starter Relics
    {
      id: 'burning_blood',
      name: 'Burning Blood',
      description: 'At the start of combat, heal 6 HP.',
      rarity: RelicRarity.STARTER,
      effects: [{
        trigger: RelicTrigger.COMBAT_START,
        effect: EffectType.HEAL,
        value: 6
      }]
    },

    // Common Relics
    {
      id: 'akabeko',
      name: 'Akabeko',
      description: 'Your first Attack each combat deals 8 additional damage.',
      rarity: RelicRarity.COMMON,
      effects: [{
        trigger: RelicTrigger.CARD_PLAYED,
        effect: EffectType.DAMAGE,
        value: 8
      }]
    },
    {
      id: 'anchor',
      name: 'Anchor',
      description: 'Start each combat with 10 Block.',
      rarity: RelicRarity.COMMON,
      effects: [{
        trigger: RelicTrigger.COMBAT_START,
        effect: EffectType.BLOCK,
        value: 10
      }]
    },
    {
      id: 'art_of_war',
      name: 'Art of War',
      description: 'If you do not play any Attacks during your turn, gain 1 Energy next turn.',
      rarity: RelicRarity.COMMON,
      effects: [{
        trigger: RelicTrigger.TURN_END,
        effect: EffectType.GAIN_ENERGY,
        value: 1
      }]
    },
    {
      id: 'bag_of_marbles',
      name: 'Bag of Marbles',
      description: 'At the start of each combat, apply 1 Vulnerable to ALL enemies.',
      rarity: RelicRarity.COMMON,
      effects: [{
        trigger: RelicTrigger.COMBAT_START,
        effect: EffectType.APPLY_STATUS,
        value: 1,
        statusType: StatusType.VULNERABLE,
        target: 'ALL_ENEMIES'
      }]
    },
    {
      id: 'blood_vial',
      name: 'Blood Vial',
      description: 'At the start of each combat, heal 2 HP.',
      rarity: RelicRarity.COMMON,
      effects: [{
        trigger: RelicTrigger.COMBAT_START,
        effect: EffectType.HEAL,
        value: 2
      }]
    },

    // Uncommon Relics
    {
      id: 'blue_candle',
      name: 'Blue Candle',
      description: 'Whenever you take damage, gain 1 Energy next turn.',
      rarity: RelicRarity.UNCOMMON,
      effects: [{
        trigger: RelicTrigger.DAMAGE_TAKEN,
        effect: EffectType.GAIN_ENERGY,
        value: 1
      }]
    },
    {
      id: 'bronze_scales',
      name: 'Bronze Scales',
      description: 'Whenever you take damage, deal 3 damage back.',
      rarity: RelicRarity.UNCOMMON,
      effects: [{
        trigger: RelicTrigger.DAMAGE_TAKEN,
        effect: EffectType.DAMAGE,
        value: 3
      }]
    },
    {
      id: 'centennial_puzzle',
      name: 'Centennial Puzzle',
      description: 'The first time you lose HP each combat, draw 3 cards.',
      rarity: RelicRarity.UNCOMMON,
      effects: [{
        trigger: RelicTrigger.DAMAGE_TAKEN,
        effect: EffectType.DRAW_CARDS,
        value: 3
      }]
    },
    {
      id: 'horn_cleat',
      name: 'Horn Cleat',
      description: 'At the start of your 2nd turn, gain 14 Block.',
      rarity: RelicRarity.UNCOMMON,
      effects: [{
        trigger: RelicTrigger.TURN_START,
        effect: EffectType.BLOCK,
        value: 14
      }]
    },

    // Rare Relics
    {
      id: 'bird_faced_urn',
      name: 'Bird-Faced Urn',
      description: 'Whenever you play a Power card, heal 2 HP.',
      rarity: RelicRarity.RARE,
      effects: [{
        trigger: RelicTrigger.CARD_PLAYED,
        effect: EffectType.HEAL,
        value: 2
      }]
    },
    {
      id: 'calipers',
      name: 'Calipers',
      description: 'At the start of your turn, lose 15 Block instead of all Block.',
      rarity: RelicRarity.RARE,
      effects: [{
        trigger: RelicTrigger.TURN_START,
        effect: EffectType.BLOCK,
        value: -15
      }]
    },
    {
      id: 'dead_branch',
      name: 'Dead Branch',
      description: 'Whenever you Exhaust a card, add a random card to your hand.',
      rarity: RelicRarity.RARE,
      effects: [{
        trigger: RelicTrigger.CARD_PLAYED,
        effect: EffectType.DRAW_CARDS,
        value: 1
      }]
    },

    // Boss Relics
    {
      id: 'energy_core',
      name: 'Energy Core',
      description: 'Gain 1 Energy at the start of each turn.',
      rarity: RelicRarity.BOSS,
      effects: [{
        trigger: RelicTrigger.TURN_START,
        effect: EffectType.GAIN_ENERGY,
        value: 1
      }]
    },
    {
      id: 'philosophers_stone',
      name: "Philosopher's Stone",
      description: 'Gain 1 Energy at the start of each turn. ALL enemies start combat with 1 Strength.',
      rarity: RelicRarity.BOSS,
      effects: [
        {
          trigger: RelicTrigger.TURN_START,
          effect: EffectType.GAIN_ENERGY,
          value: 1
        },
        {
          trigger: RelicTrigger.COMBAT_START,
          effect: EffectType.APPLY_STATUS,
          value: 1,
          statusType: StatusType.STRENGTH
        }
      ]
    }
  ];
};

export const getRandomRelic = (rarity?: RelicRarity): Relic => {
  const relics = getAllRelics();
  const filteredRelics = rarity ? relics.filter(r => r.rarity === rarity) : relics;
  return filteredRelics[Math.floor(Math.random() * filteredRelics.length)];
};

export const getStarterRelic = (): Relic => {
  return getAllRelics().find(r => r.id === 'burning_blood')!;
}; 