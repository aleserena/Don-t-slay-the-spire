import {
  Card,
  CardType,
  CardRarity,
  EffectType,
  TargetType,
  StatusType,
} from "../types/game";
import { v4 as uuidv4 } from "uuid";

export const createInitialDeck = (): Card[] => {
  const cards: Card[] = [];

  // Strike cards (5 copies)
  for (let i = 0; i < 5; i++) {
    cards.push({
      id: uuidv4(),
      baseId: "strike",
      name: "Strike",
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.BASE,
      description: "Deal 6 damage.",
      damage: 6,
      upgraded: false,
    });
  }

  // Defend cards (4 copies)
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: uuidv4(),
      baseId: "defend",
      name: "Defend",
      cost: 1,
      type: CardType.SKILL,
      rarity: CardRarity.BASE,
      description: "Gain 5 Block.",
      block: 5,
      upgraded: false,
    });
  }

  // Bash (1 copy)
  cards.push({
    id: uuidv4(),
    baseId: "bash",
    name: "Bash",
    cost: 2,
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    description: "Deal 8 damage. Apply 2 Vulnerable.",
    upgraded: false,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: 8,
        target: TargetType.ENEMY,
      },
      {
        type: EffectType.APPLY_STATUS,
        value: 2,
        target: TargetType.ENEMY,
        statusType: StatusType.VULNERABLE,
      },
    ],
  });

  return cards;
};

export const getAllCards = (): Card[] => {
  return [
    // Basic Cards
    {
      id: "strike",
      baseId: "strike",
      name: "Strike",
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.BASE,
      description: "Deal 6 damage.",
      damage: 6,
      upgraded: false,
    },
    {
      id: "defend",
      baseId: "defend",
      name: "Defend",
      cost: 1,
      type: CardType.SKILL,
      rarity: CardRarity.BASE,
      description: "Gain 5 Block.",
      block: 5,
      upgraded: false,
    },
    {
      id: "bash",
      baseId: "bash",
      name: "Bash",
      cost: 2,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: "Deal 8 damage. Apply 2 Vulnerable.",
      upgraded: false,
      effects: [
        {
          type: EffectType.DAMAGE,
          value: 8,
          target: TargetType.ENEMY,
        },
        {
          type: EffectType.APPLY_STATUS,
          value: 2,
          target: TargetType.ENEMY,
          statusType: StatusType.VULNERABLE,
        },
      ],
    },

    // Advanced Attack Cards
    {
      id: "anger",
      baseId: "anger",
      name: "Anger",
      cost: 0,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description:
        "Deal 6 damage. Add a copy of this card into your discard pile.",
      upgraded: false,
      effects: [
        {
          type: EffectType.DAMAGE,
          value: 6,
          target: TargetType.ENEMY,
        },
        {
          type: EffectType.ADD_CARD_TO_DISCARD,
          value: 1,
          target: TargetType.SELF,
        },
      ],
    },
    {
      id: "cleave",
      baseId: "cleave",
      name: "Cleave",
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: "Deal 8 damage to ALL enemies.",
      upgraded: false,
      effects: [
        {
          type: EffectType.DAMAGE,
          value: 8,
          target: TargetType.ALL_ENEMIES,
        },
      ],
    },
    {
      id: "iron_wave",
      baseId: "iron_wave",
      name: "Iron Wave",
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: "Gain 5 Block. Deal 5 damage.",
      damage: 5,
      block: 5,
      upgraded: false,
    },
    {
      id: "pommel_strike",
      baseId: "pommel_strike",
      name: "Pommel Strike",
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: "Deal 9 damage. Draw 1 card.",
      damage: 9,
      upgraded: false,
      effects: [
        {
          type: EffectType.DRAW_CARDS,
          value: 1,
          target: TargetType.SELF,
        },
      ],
    },
    {
      id: "twin_strike",
      baseId: "twin_strike",
      name: "Twin Strike",
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: "Deal 5 damage twice.",
      upgraded: false,
      effects: [
        {
          type: EffectType.DAMAGE,
          value: 5,
          target: TargetType.ENEMY,
        },
        {
          type: EffectType.DAMAGE,
          value: 5,
          target: TargetType.ENEMY,
        },
      ],
    },

    // Status Effect Cards
    {
      id: "poison_stab",
      baseId: "poison_stab",
      name: "Poison Stab",
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: "Deal 6 damage. Apply 3 Poison.",
      damage: 6,
      upgraded: false,
      effects: [
        {
          type: EffectType.APPLY_STATUS,
          value: 3,
          target: TargetType.ENEMY,
          statusType: StatusType.POISON,
        },
      ],
    },
    {
      id: "shockwave",
      baseId: "shockwave",
      name: "Shockwave",
      cost: 2,
      type: CardType.SKILL,
      rarity: CardRarity.UNCOMMON,
      description: "Apply 3 Weak and 3 Vulnerable to ALL enemies.",
      upgraded: false,
      effects: [
        {
          type: EffectType.APPLY_STATUS,
          value: 3,
          target: TargetType.ALL_ENEMIES,
          statusType: StatusType.WEAK,
        },
        {
          type: EffectType.APPLY_STATUS,
          value: 3,
          target: TargetType.ALL_ENEMIES,
          statusType: StatusType.VULNERABLE,
        },
      ],
    },

    // Skill Cards
    {
      id: "armaments",
      baseId: "armaments",
      name: "Armaments",
      cost: 1,
      type: CardType.SKILL,
      rarity: CardRarity.COMMON,
      description: "Gain 5 Block. Upgrade a card in your hand.",
      block: 5,
      upgraded: false,
      effects: [
        {
          type: EffectType.UPGRADE_CARD,
          value: 1,
          target: TargetType.SELF,
        },
      ],
    },
    {
      id: "body_slam",
      baseId: "body_slam",
      name: "Body Slam",
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: "Deal damage equal to your current Block.",
      upgraded: false,
      effects: [
        {
          type: EffectType.DAMAGE_MULTIPLIER_BLOCK,
          value: 0, // Base damage (not used for this effect type)
          multiplier: 1, // 1x block damage
          target: TargetType.ENEMY,
        },
      ],
    },
    {
      id: "true_grit",
      baseId: "true_grit",
      name: "True Grit",
      cost: 1,
      type: CardType.SKILL,
      rarity: CardRarity.COMMON,
      description: "Gain 7 Block. Exhaust a random card from your hand.",
      block: 7,
      upgraded: false,
    },
    {
      id: "battle_trance",
      baseId: "battle_trance",
      name: "Battle Trance",
      cost: 0,
      type: CardType.SKILL,
      rarity: CardRarity.UNCOMMON,
      description: "Draw 3 cards. You cannot draw additional cards this turn.",
      upgraded: false,
      effects: [
        {
          type: EffectType.DRAW_CARDS,
          value: 3,
          target: TargetType.SELF,
        },
      ],
    },

    // Power Cards
    {
      id: "inflame",
      baseId: "inflame",
      name: "Inflame",
      cost: 1,
      type: CardType.POWER,
      rarity: CardRarity.UNCOMMON,
      description: "Gain 2 Strength.",
      upgraded: false,
      effects: [
        {
          type: EffectType.APPLY_STATUS,
          value: 2,
          target: TargetType.SELF,
          statusType: StatusType.STRENGTH,
        },
      ],
    },
    {
      id: "metallicize",
      baseId: "metallicize",
      name: "Metallicize",
      cost: 1,
      type: CardType.POWER,
      rarity: CardRarity.UNCOMMON,
      description: "At the end of your turn, gain 3 Block.",
      upgraded: false,
      effects: [
        {
          type: EffectType.BLOCK,
          value: 3,
          target: TargetType.SELF,
        },
      ],
    },

    // Rare Cards
    {
      id: "demon_form",
      baseId: "demon_form",
      name: "Demon Form",
      cost: 3,
      type: CardType.POWER,
      rarity: CardRarity.RARE,
      description: "At the start of each turn, gain 2 Strength.",
      upgraded: false,
      effects: [
        {
          type: EffectType.APPLY_STATUS,
          value: 2,
          target: TargetType.SELF,
          statusType: StatusType.STRENGTH,
        },
      ],
    },
    {
      id: "whirlwind",
      baseId: "whirlwind",
      name: "Whirlwind",
      cost: "X" as number | "X",
      type: CardType.ATTACK,
      rarity: CardRarity.RARE,
      description: "Deal 5 damage to ALL enemies X times. (X = Energy)",
      upgraded: false,
      effects: [
        {
          type: EffectType.DAMAGE_MULTIPLIER_ENERGY,
          value: 5, // Base damage per hit
          multiplier: 1, // 1x energy (number of hits)
          target: TargetType.ALL_ENEMIES,
        },
      ],
    },

    // New Attack Cards
    {
      id: "heavy_blade",
      baseId: "heavy_blade",
      name: "Heavy Blade",
      cost: 2,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: "Deal 14 damage. Strength affects this card 3 times.",
      damage: 14,
      upgraded: false,
    },
    {
      id: "sword_boomerang",
      baseId: "sword_boomerang",
      name: "Sword Boomerang",
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: "Deal 3 damage to a random enemy 3 times.",
      upgraded: false,
      effects: [
        {
          type: EffectType.DAMAGE,
          value: 3,
          target: TargetType.ENEMY,
        },
        {
          type: EffectType.DAMAGE,
          value: 3,
          target: TargetType.ENEMY,
        },
        {
          type: EffectType.DAMAGE,
          value: 3,
          target: TargetType.ENEMY,
        },
      ],
    },
    {
      id: "perfected_strike",
      baseId: "perfected_strike",
      name: "Perfected Strike",
      cost: 2,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description:
        "Deal 6 damage. Deals 2 additional damage for every Strike in your deck.",
      damage: 6,
      upgraded: false,
    },
    {
      id: "thunderclap",
      baseId: "thunderclap",
      name: "Thunderclap",
      cost: 1,
      type: CardType.ATTACK,
      rarity: CardRarity.COMMON,
      description: "Deal 4 damage and apply 1 Vulnerable to ALL enemies.",
      upgraded: false,
      effects: [
        {
          type: EffectType.DAMAGE,
          value: 4,
          target: TargetType.ALL_ENEMIES,
        },
        {
          type: EffectType.APPLY_STATUS,
          value: 1,
          target: TargetType.ALL_ENEMIES,
          statusType: StatusType.VULNERABLE,
        },
      ],
    },
    {
      id: "uppercut",
      baseId: "uppercut",
      name: "Uppercut",
      cost: 2,
      type: CardType.ATTACK,
      rarity: CardRarity.UNCOMMON,
      description: "Deal 13 damage. Apply 1 Weak and 1 Vulnerable.",
      damage: 13,
      upgraded: false,
      effects: [
        {
          type: EffectType.APPLY_STATUS,
          value: 1,
          target: TargetType.ENEMY,
          statusType: StatusType.WEAK,
        },
        {
          type: EffectType.APPLY_STATUS,
          value: 1,
          target: TargetType.ENEMY,
          statusType: StatusType.VULNERABLE,
        },
      ],
    },

    // New Skill Cards
    {
      id: "shrug_it_off",
      baseId: "shrug_it_off",
      name: "Shrug It Off",
      cost: 1,
      type: CardType.SKILL,
      rarity: CardRarity.COMMON,
      description: "Gain 8 Block. Draw 1 card.",
      block: 8,
      upgraded: false,
      effects: [
        {
          type: EffectType.DRAW_CARDS,
          value: 1,
          target: TargetType.SELF,
        },
      ],
    },
    {
      id: "seeing_red",
      baseId: "seeing_red",
      name: "Seeing Red",
      cost: 1,
      type: CardType.SKILL,
      rarity: CardRarity.UNCOMMON,
      description: "Gain 2 Energy. Exhaust.",
      upgraded: false,
      effects: [
        {
          type: EffectType.GAIN_ENERGY,
          value: 2,
          target: TargetType.SELF,
        },
      ],
    },
    {
      id: "intimidate",
      baseId: "intimidate",
      name: "Intimidate",
      cost: 0,
      type: CardType.SKILL,
      rarity: CardRarity.UNCOMMON,
      description: "Apply 1 Weak to ALL enemies. Exhaust.",
      upgraded: false,
      effects: [
        {
          type: EffectType.APPLY_STATUS,
          value: 1,
          target: TargetType.ALL_ENEMIES,
          statusType: StatusType.WEAK,
        },
      ],
    },
    {
      id: "flex",
      baseId: "flex",
      name: "Flex",
      cost: 0,
      type: CardType.SKILL,
      rarity: CardRarity.COMMON,
      description: "Gain 2 Strength. At the end of this turn, lose 2 Strength.",
      upgraded: false,
      effects: [
        {
          type: EffectType.APPLY_STATUS,
          value: 2,
          target: TargetType.SELF,
          statusType: StatusType.STRENGTH,
        },
      ],
    },
    {
      id: "entrench",
      baseId: "entrench",
      name: "Entrench",
      cost: 2,
      type: CardType.SKILL,
      rarity: CardRarity.UNCOMMON,
      description: "Double your Block.",
      upgraded: false,
      effects: [
        {
          type: EffectType.BLOCK,
          value: 0, // Special handling needed
          multiplier: 2,
          target: TargetType.SELF,
        },
      ],
    },

    // New Power Cards
    {
      id: "combust",
      baseId: "combust",
      name: "Combust",
      cost: 1,
      type: CardType.POWER,
      rarity: CardRarity.UNCOMMON,
      description:
        "At the end of your turn, lose 1 HP and deal 5 damage to ALL enemies.",
      upgraded: false,
      effects: [
        {
          type: EffectType.DAMAGE,
          value: 5,
          target: TargetType.ALL_ENEMIES,
        },
      ],
    },
    {
      id: "feel_no_pain",
      baseId: "feel_no_pain",
      name: "Feel No Pain",
      cost: 1,
      type: CardType.POWER,
      rarity: CardRarity.UNCOMMON,
      description: "Whenever a card is Exhausted, gain 3 Block.",
      upgraded: false,
      effects: [
        {
          type: EffectType.BLOCK,
          value: 3,
          target: TargetType.SELF,
        },
      ],
    },
    {
      id: "barricade",
      baseId: "barricade",
      name: "Barricade",
      cost: 3,
      type: CardType.POWER,
      rarity: CardRarity.RARE,
      description: "Block is not removed at the start of your turn.",
      upgraded: false,
      effects: [
        {
          type: EffectType.BLOCK,
          value: 0,
          target: TargetType.SELF,
        },
      ],
    },
    {
      id: "juggernaut",
      baseId: "juggernaut",
      name: "Juggernaut",
      cost: 2,
      type: CardType.POWER,
      rarity: CardRarity.RARE,
      description: "Whenever you gain Block, deal 5 damage to a random enemy.",
      upgraded: false,
      effects: [
        {
          type: EffectType.DAMAGE,
          value: 5,
          target: TargetType.ENEMY,
        },
      ],
    },

    // Rare Attack Cards
    {
      id: "bludgeon",
      baseId: "bludgeon",
      name: "Bludgeon",
      cost: 3,
      type: CardType.ATTACK,
      rarity: CardRarity.RARE,
      description: "Deal 32 damage.",
      damage: 32,
      upgraded: false,
    },
    {
      id: "immolate",
      baseId: "immolate",
      name: "Immolate",
      cost: 2,
      type: CardType.ATTACK,
      rarity: CardRarity.RARE,
      description:
        "Deal 21 damage to ALL enemies. Add a Burn into your discard pile.",
      upgraded: false,
      effects: [
        {
          type: EffectType.DAMAGE,
          value: 21,
          target: TargetType.ALL_ENEMIES,
        },
      ],
    },
    {
      id: "reaper",
      baseId: "reaper",
      name: "Reaper",
      cost: 2,
      type: CardType.ATTACK,
      rarity: CardRarity.RARE,
      description:
        "Deal 4 damage to ALL enemies. Heal HP equal to unblocked damage dealt.",
      upgraded: false,
      effects: [
        {
          type: EffectType.DAMAGE,
          value: 4,
          target: TargetType.ALL_ENEMIES,
        },
      ],
    },
  ];
};

/**
 * Gets cards that can appear as rewards, excluding base cards (strike, defend)
 * and applying rarity-based weighting for selection.
 *
 * @returns Array of cards that can be offered as rewards
 */
export const getRewardCards = (): Card[] => {
  return getAllCards().filter((card) => card.rarity !== CardRarity.BASE);
};

/**
 * Generates a random selection of cards for rewards with proper rarity weighting.
 *
 * @param count - Number of cards to select (default: 3)
 * @returns Array of randomly selected cards for rewards
 */
export const generateCardRewards = (count: number = 3): Card[] => {
  const rewardCards = getRewardCards();

  // Rarity weights for selection (higher = more likely)
  const rarityWeights: Record<CardRarity, number> = {
    [CardRarity.BASE]: 0, // Base cards never appear as rewards
    [CardRarity.COMMON]: 70, // 70% chance
    [CardRarity.UNCOMMON]: 25, // 25% chance
    [CardRarity.RARE]: 5, // 5% chance
  };

  const selectedCards: Card[] = [];
  const availableCards = [...rewardCards];

  for (let i = 0; i < count && availableCards.length > 0; i++) {
    // Calculate total weight for available cards
    const totalWeight = availableCards.reduce((sum, card) => {
      return sum + (rarityWeights[card.rarity] || 0);
    }, 0);

    // Generate random number
    const random = Math.random() * totalWeight;

    // Select card based on weighted random
    let currentWeight = 0;
    let selectedIndex = 0;

    for (let j = 0; j < availableCards.length; j++) {
      currentWeight += rarityWeights[availableCards[j].rarity] || 0;
      if (random <= currentWeight) {
        selectedIndex = j;
        break;
      }
    }

    // Add selected card and remove from available
    selectedCards.push(availableCards[selectedIndex]);
    availableCards.splice(selectedIndex, 1);
  }

  return selectedCards;
};
