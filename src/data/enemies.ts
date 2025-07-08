import { Enemy, IntentType, MonsterCardType } from '../types/game';
import { getEnemyDeck, selectEnemyCard } from './monsterCards';

const convertCardTypeToIntentType = (cardType: MonsterCardType): IntentType => {
  switch (cardType) {
    case MonsterCardType.ATTACK:
      return IntentType.ATTACK;
    case MonsterCardType.DEFEND:
      return IntentType.DEFEND;
    case MonsterCardType.BUFF:
      return IntentType.BUFF;
    case MonsterCardType.DEBUFF:
      return IntentType.DEBUFF;
    case MonsterCardType.SPECIAL:
      return IntentType.UNKNOWN;
    default:
      return IntentType.UNKNOWN;
  }
};

export const createTestEnemy = (): Enemy => {
  const deck = getEnemyDeck('Cultist');
  const selectedCard = selectEnemyCard(deck, 48, 48);
  
  return {
    id: 'cultist_1',
    name: 'Cultist',
    health: 48,
    maxHealth: 48,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard
  };
};

export const createJawWorm = (): Enemy => {
  const deck = getEnemyDeck('Jaw Worm');
  const selectedCard = selectEnemyCard(deck, 40, 40);
  
  return {
    id: 'jaw_worm_1',
    name: 'Jaw Worm',
    health: 40,
    maxHealth: 40,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard
  };
};

export const createRedLouse = (): Enemy => {
  const deck = getEnemyDeck('Red Louse');
  const selectedCard = selectEnemyCard(deck, 10, 10);
  
  return {
    id: 'red_louse_1',
    name: 'Red Louse',
    health: 10,
    maxHealth: 10,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard
  };
};

export const createGreenLouse = (): Enemy => {
  const deck = getEnemyDeck('Green Louse');
  const selectedCard = selectEnemyCard(deck, 11, 11);
  
  return {
    id: 'green_louse_1',
    name: 'Green Louse',
    health: 11,
    maxHealth: 11,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard
  };
};

export const createAcidSlime = (): Enemy => {
  const deck = getEnemyDeck('Acid Slime');
  const selectedCard = selectEnemyCard(deck, 65, 65);
  
  return {
    id: 'acid_slime_1',
    name: 'Acid Slime',
    health: 65,
    maxHealth: 65,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard
  };
};

export const createSpikeSlime = (): Enemy => {
  const deck = getEnemyDeck('Spike Slime');
  const selectedCard = selectEnemyCard(deck, 28, 28);
  
  return {
    id: 'spike_slime_1',
    name: 'Spike Slime',
    health: 28,
    maxHealth: 28,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard
  };
};

export const createFungiBeast = (): Enemy => {
  const deck = getEnemyDeck('Fungi Beast');
  const selectedCard = selectEnemyCard(deck, 22, 22);
  
  return {
    id: 'fungi_beast_1',
    name: 'Fungi Beast',
    health: 22,
    maxHealth: 22,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard
  };
};

export const createLooter = (): Enemy => {
  const deck = getEnemyDeck('Looter');
  const selectedCard = selectEnemyCard(deck, 44, 44);
  
  return {
    id: 'looter_1',
    name: 'Looter',
    health: 44,
    maxHealth: 44,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard
  };
};

// New Enemy Types
export const createGremlinNob = (): Enemy => {
  const deck = getEnemyDeck('Gremlin Nob');
  const selectedCard = selectEnemyCard(deck, 82, 82);
  
  return {
    id: 'gremlin_nob_1',
    name: 'Gremlin Nob',
    health: 82,
    maxHealth: 82,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard,
    isElite: true
  };
};

export const createLagavulin = (): Enemy => {
  const deck = getEnemyDeck('Lagavulin');
  const selectedCard = selectEnemyCard(deck, 109, 109);
  
  return {
    id: 'lagavulin_1',
    name: 'Lagavulin',
    health: 109,
    maxHealth: 109,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard,
    isElite: true
  };
};

export const createSentryBot = (): Enemy => {
  const deck = getEnemyDeck('Sentry');
  const selectedCard = selectEnemyCard(deck, 38, 38);
  
  return {
    id: 'sentry_1',
    name: 'Sentry',
    health: 38,
    maxHealth: 38,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard
  };
};

export const createFatGremlin = (): Enemy => {
  const deck = getEnemyDeck('Fat Gremlin');
  const selectedCard = selectEnemyCard(deck, 13, 13);
  
  return {
    id: 'fat_gremlin_1',
    name: 'Fat Gremlin',
    health: 13,
    maxHealth: 13,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard
  };
};

export const createMadGremlin = (): Enemy => {
  const deck = getEnemyDeck('Mad Gremlin');
  const selectedCard = selectEnemyCard(deck, 20, 20);
  
  return {
    id: 'mad_gremlin_1',
    name: 'Mad Gremlin',
    health: 20,
    maxHealth: 20,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard
  };
};

export const createSneakyGremlin = (): Enemy => {
  const deck = getEnemyDeck('Sneaky Gremlin');
  const selectedCard = selectEnemyCard(deck, 10, 10);
  
  return {
    id: 'sneaky_gremlin_1',
    name: 'Sneaky Gremlin',
    health: 10,
    maxHealth: 10,
    block: 0,
    intent: {
      type: convertCardTypeToIntentType(selectedCard.type),
      value: selectedCard.damage || selectedCard.block,
      card: selectedCard
    },
    statusEffects: [],
    deck,
    currentCard: selectedCard
  };
};

export const getAllEnemies = () => [
  createTestEnemy(),
  createJawWorm(),
  createRedLouse(),
  createGreenLouse(),
  createAcidSlime(),
  createSpikeSlime(),
  createFungiBeast(),
  createLooter(),
  createGremlinNob(),
  createSentryBot(),
  createFatGremlin(),
  createMadGremlin(),
  createSneakyGremlin()
];

export const getRandomEnemy = (): Enemy => {
  const enemies = [
    createTestEnemy,
    createJawWorm,
    createRedLouse,
    createGreenLouse,
    createAcidSlime,
    createSpikeSlime,
    createFungiBeast,
    createLooter,
    createGremlinNob,
    createSentryBot,
    createFatGremlin,
    createMadGremlin,
    createSneakyGremlin
  ];
  
  const randomEnemyCreator = enemies[Math.floor(Math.random() * enemies.length)];
  return randomEnemyCreator();
};

export const getRandomEnemyEncounter = (): Enemy[] => {
  const encounterTypes = [
    // Single enemy encounters
    () => [getRandomEnemy()],
    // Two enemy encounters
    () => [getRandomEnemy(), getRandomEnemy()],
    // Specific encounters
    () => [createRedLouse(), createGreenLouse()],
    () => [createTestEnemy(), createLooter()],
    () => [createFatGremlin(), createMadGremlin(), createSneakyGremlin()], // Gremlin gang
    () => [createSentryBot(), createSentryBot()], // Twin sentries
  ];
  
  const randomEncounter = encounterTypes[Math.floor(Math.random() * encounterTypes.length)];
  const enemies = randomEncounter();
  
  // Ensure unique IDs by adding timestamp, random number, and index
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);
  
  return enemies.map((enemy, index) => ({
    ...enemy,
    id: `${enemy.id.split('_')[0]}_${enemy.id.split('_')[1]}_${timestamp}_${randomSuffix}_${index}`
  }));
}; 