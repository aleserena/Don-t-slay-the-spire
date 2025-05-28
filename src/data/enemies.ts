import { Enemy, IntentType } from '../types/game';

const getRandomIntent = (): { type: IntentType; value?: number } => {
  const intents = [
    { type: IntentType.ATTACK, value: 6 },
    { type: IntentType.ATTACK, value: 8 },
    { type: IntentType.DEFEND, value: 5 },
    { type: IntentType.BUFF },
    { type: IntentType.DEBUFF }
  ];
  
  return intents[Math.floor(Math.random() * intents.length)];
};

export const createTestEnemy = (): Enemy => ({
  id: 'cultist_1',
  name: 'Cultist',
  health: 48,
  maxHealth: 48,
  block: 0,
  intent: getRandomIntent(),
  statusEffects: []
});

export const createJawWorm = (): Enemy => ({
  id: 'jaw_worm_1',
  name: 'Jaw Worm',
  health: 40,
  maxHealth: 40,
  block: 0,
  intent: {
    type: IntentType.ATTACK,
    value: 11
  },
  statusEffects: []
});

export const createRedLouse = (): Enemy => ({
  id: 'red_louse_1',
  name: 'Red Louse',
  health: 10,
  maxHealth: 10,
  block: 0,
  intent: {
    type: IntentType.ATTACK,
    value: 5
  },
  statusEffects: []
});

export const createGreenLouse = (): Enemy => ({
  id: 'green_louse_1',
  name: 'Green Louse',
  health: 11,
  maxHealth: 11,
  block: 0,
  intent: {
    type: IntentType.ATTACK,
    value: 5
  },
  statusEffects: []
});

export const createAcidSlime = (): Enemy => ({
  id: 'acid_slime_1',
  name: 'Acid Slime',
  health: 65,
  maxHealth: 65,
  block: 0,
  intent: {
    type: IntentType.DEBUFF
  },
  statusEffects: []
});

export const createSpikeSlime = (): Enemy => ({
  id: 'spike_slime_1',
  name: 'Spike Slime',
  health: 28,
  maxHealth: 28,
  block: 0,
  intent: {
    type: IntentType.ATTACK,
    value: 5
  },
  statusEffects: []
});

export const createFungiBeast = (): Enemy => ({
  id: 'fungi_beast_1',
  name: 'Fungi Beast',
  health: 22,
  maxHealth: 22,
  block: 0,
  intent: {
    type: IntentType.BUFF
  },
  statusEffects: []
});

export const createLooter = (): Enemy => ({
  id: 'looter_1',
  name: 'Looter',
  health: 44,
  maxHealth: 44,
  block: 0,
  intent: {
    type: IntentType.ATTACK,
    value: 10
  },
  statusEffects: []
});

export const getAllEnemies = () => [
  createTestEnemy(),
  createJawWorm(),
  createRedLouse(),
  createGreenLouse(),
  createAcidSlime(),
  createSpikeSlime(),
  createFungiBeast(),
  createLooter()
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
    createLooter
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