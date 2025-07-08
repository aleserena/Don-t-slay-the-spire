import { Enemy, IntentType } from "../types/game";
import { getEnemyDeck } from "./monsterCards";

export const createSlimeBoss = (): Enemy => ({
  id: "slime_boss",
  name: "Slime Boss",
  health: 140,
  maxHealth: 140,
  block: 0,
  intent: {
    type: IntentType.ATTACK,
    value: 35,
  },
  statusEffects: [],
  isBoss: true,
  deck: getEnemyDeck("slime_boss"),
});

export const createGuardian = (): Enemy => ({
  id: "guardian",
  name: "The Guardian",
  health: 250,
  maxHealth: 250,
  block: 0,
  intent: {
    type: IntentType.ATTACK,
    value: 32,
  },
  statusEffects: [],
  isBoss: true,
  deck: getEnemyDeck("guardian"),
});

export const createHexaghost = (): Enemy => ({
  id: "hexaghost",
  name: "Hexaghost",
  health: 250,
  maxHealth: 250,
  block: 0,
  intent: {
    type: IntentType.ATTACK,
    value: 45,
  },
  statusEffects: [],
  isBoss: true,
  deck: getEnemyDeck("hexaghost"),
});

export const createChamp = (): Enemy => ({
  id: "champ",
  name: "The Champ",
  health: 400,
  maxHealth: 400,
  block: 0,
  intent: {
    type: IntentType.ATTACK,
    value: 22,
  },
  statusEffects: [],
  isBoss: true,
  deck: getEnemyDeck("champ"),
});

export const createCollector = (): Enemy => ({
  id: "collector",
  name: "The Collector",
  health: 300,
  maxHealth: 300,
  block: 0,
  intent: {
    type: IntentType.DEBUFF,
  },
  statusEffects: [],
  isBoss: true,
  deck: getEnemyDeck("collector"),
});

export const createCityBoss = (): Enemy => ({
  id: "automaton",
  name: "Bronze Automaton",
  health: 300,
  maxHealth: 300,
  block: 0,
  intent: {
    type: IntentType.ATTACK,
    value: 50,
  },
  statusEffects: [],
  isBoss: true,
  deck: getEnemyDeck("automaton"),
});

export const getAllBosses = (): Enemy[] => [
  createSlimeBoss(),
  createGuardian(),
  createHexaghost(),
  createChamp(),
  createCollector(),
  createCityBoss(),
];

export const getRandomBoss = (): Enemy => {
  const bosses = getAllBosses();
  return bosses[Math.floor(Math.random() * bosses.length)];
};

export const getBossForFloor = (floor: number): Enemy => {
  if (floor < 5) {
    // Act 1 bosses
    const act1Bosses = [createSlimeBoss(), createGuardian(), createHexaghost()];
    return act1Bosses[Math.floor(Math.random() * act1Bosses.length)];
  } else if (floor < 10) {
    // Act 2 bosses
    const act2Bosses = [createChamp(), createCollector(), createCityBoss()];
    return act2Bosses[Math.floor(Math.random() * act2Bosses.length)];
  } else {
    // Act 3 bosses (for now, reuse act 2 bosses with higher stats)
    const boss = getRandomBoss();
    return {
      ...boss,
      id: `${boss.id}_act3_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      health: Math.floor(boss.health * 1.5),
      maxHealth: Math.floor(boss.maxHealth * 1.5),
      intent: {
        ...boss.intent,
        value: boss.intent.value
          ? Math.floor(boss.intent.value * 1.3)
          : undefined,
      },
    };
  }
};
