/**
 * Pure combat rules: setting up and ending a combat, turn starts and the
 * enemy side of a turn. The store sequences these and holds the state.
 */

import {
  Card,
  EffectType,
  Enemy,
  GamePhase,
  IntentType,
  MonsterCard,
  MonsterCardType,
  Player,
  PowerTrigger,
  RelicTrigger,
  TurnPhase,
} from "../types/game";
import { NodeType } from "../types/map";
import { getBossForFloor } from "../data/bosses";
import { getRandomEnemyEncounter } from "../data/enemies";
import { selectEnemyCard } from "../data/monsterCards";
import { processMonsterCardEffects } from "../utils/monsterCardEffects";
import { processPowerCardEffects } from "../utils/powerCardEffects";
import { processRelicEffects, RelicContext } from "../utils/relicEffects";
import { tickPoison } from "../utils/statusEffects";
import { shuffle } from "../utils/random";
import { ELITE_HEALTH_MULTIPLIER } from "./constants";
import { withoutTemporaryCards } from "./deck";
import { createCombatReward } from "./rewards";

export const isCombatNode = (type: NodeType): boolean =>
  type === NodeType.COMBAT || type === NodeType.ELITE || type === NodeType.BOSS;

const toElite = (enemy: Enemy): Enemy => ({
  ...enemy,
  isElite: true,
  health: Math.floor(enemy.health * ELITE_HEALTH_MULTIPLIER),
  maxHealth: Math.floor(enemy.maxHealth * ELITE_HEALTH_MULTIPLIER),
});

/** Creates the enemies for a combat, elite or boss map node. */
export const createEncounter = (type: NodeType, floor: number): Enemy[] => {
  switch (type) {
    case NodeType.BOSS:
      return [getBossForFloor(floor)];
    case NodeType.ELITE:
      return getRandomEnemyEncounter().map(toElite);
    default:
      return getRandomEnemyEncounter();
  }
};

/**
 * State for the start of a combat, before the first player turn: the deck is
 * shuffled into the draw pile and combat-only counters are reset.
 */
export const createCombatState = (
  persistentDeck: Card[],
  player: Player,
  enemies: Enemy[],
) => ({
  gamePhase: GamePhase.COMBAT,
  currentTurn: TurnPhase.PLAYER_TURN,
  // Every enemy shows what it will do on its first turn
  enemies: enemies.map((enemy) =>
    enemy.currentCard ? enemy : chooseNextCard(enemy),
  ),
  hand: [] as Card[],
  drawPile: shuffle(withoutTemporaryCards(persistentDeck)),
  discardPile: [] as Card[],
  exhaustPile: [] as Card[],
  combatReward: undefined,
  selectedCard: null,
  firstAttackThisCombat: true,
  // Incremented to 1 when the first player turn starts
  playerTurnThisCombat: 0,
  player: {
    ...player,
    block: 0,
    energy: player.maxEnergy,
  },
});

/**
 * State for winning a combat: rewards (gold, cards, and a relic if an elite
 * was defeated), combat-only player state cleared, and the piles restored
 * from the persistent deck.
 */
export const createVictoryState = (
  persistentDeck: Card[],
  player: Player,
  defeatedEnemies: Enemy[],
) => {
  const combatReward = createCombatReward(player, defeatedEnemies);
  // Defeating a boss wins the run
  const isRunWon = defeatedEnemies.some((enemy) => enemy.isBoss);

  return {
    hand: [] as Card[],
    discardPile: [] as Card[],
    exhaustPile: [] as Card[],
    // Temporary copies created during combat do not persist
    drawPile: withoutTemporaryCards(persistentDeck),
    player: {
      ...player,
      gold: player.gold + combatReward.gold,
      block: 0,
      // Status effects and power cards only last for one combat
      statusEffects: [],
      powerCards: [],
    },
    enemies: [] as Enemy[],
    currentTurn: TurnPhase.COMBAT_END,
    gamePhase: isRunWon ? GamePhase.VICTORY : GamePhase.CARD_REWARD,
    combatReward,
    selectedCard: null,
    playerTurnThisCombat: 0,
    stepInProgress: false,
    stepType: undefined,
  };
};

/**
 * Block left at the start of a player turn. Block gained before the first
 * turn (combat-start effects) is kept; afterwards all block is lost, or at
 * most the smallest block-loss limit among the player's relics.
 */
const getBlockAtTurnStart = (player: Player, turn: number): number => {
  if (turn <= 1) return Math.max(0, player.block);

  const limits = player.relics
    .flatMap((relic) => relic.effects)
    .filter(
      (effect) =>
        effect.trigger === RelicTrigger.TURN_START &&
        effect.effect === EffectType.LIMIT_BLOCK_LOSS,
    )
    .map((effect) => effect.value ?? 0);
  if (limits.length === 0) return 0;

  return Math.max(0, player.block - Math.min(...limits));
};

/**
 * Start of a player turn: energy refills, block resets, then power card and
 * relic turn-start effects apply. `turn` is the 1-based turn of the combat.
 */
export const startPlayerTurn = (
  player: Player,
  enemies: Enemy[],
  turn: number,
): { player: Player; enemies: Enemy[]; cardsToDraw: number } => {
  const refreshed = {
    ...player,
    energy: player.maxEnergy,
    block: getBlockAtTurnStart(player, turn),
  };

  const powerResult = processPowerCardEffects(
    PowerTrigger.TURN_START,
    refreshed,
    enemies,
  );

  const context: RelicContext = { playerTurnThisCombat: turn };
  const relicResult = processRelicEffects(
    RelicTrigger.TURN_START,
    powerResult.player,
    powerResult.enemies,
    context,
  );

  return { ...relicResult, cardsToDraw: context.shouldDrawCards || 0 };
};

/** Converts a monster card type to the intent shown in the UI. */
export const cardTypeToIntentType = (cardType: MonsterCardType): IntentType => {
  switch (cardType) {
    case MonsterCardType.ATTACK:
      return IntentType.ATTACK;
    case MonsterCardType.DEFEND:
      return IntentType.DEFEND;
    case MonsterCardType.BUFF:
      return IntentType.BUFF;
    case MonsterCardType.DEBUFF:
      return IntentType.DEBUFF;
    default:
      return IntentType.UNKNOWN;
  }
};

/** Picks the card an enemy will play next turn and shows it as its intent. */
export const chooseNextCard = (enemy: Enemy): Enemy => {
  const card = selectEnemyCard(enemy.deck, enemy.health, enemy.maxHealth);
  return {
    ...enemy,
    currentCard: card,
    intent: {
      type: cardTypeToIntentType(card.type),
      value: card.damage || card.block,
      card,
    },
  };
};

/**
 * Start of the enemy turn: poison deals its damage, dead enemies are removed
 * and the survivors lose their block. Weak and Vulnerable tick later, after
 * each enemy has acted.
 */
export const tickEnemies = (enemies: Enemy[]): Enemy[] =>
  enemies
    .map((enemy) => tickPoison(enemy))
    .filter((enemy) => enemy.health > 0)
    .map((enemy) => ({ ...enemy, block: 0 }));

/**
 * An enemy plays a card against the player. Relics that react to the player
 * losing health apply afterwards and may hurt the enemy back or ask for
 * cards to be drawn.
 */
export const resolveEnemyCard = (
  card: MonsterCard,
  player: Player,
  enemy: Enemy,
): { player: Player; enemy: Enemy; cardsToDraw: number } => {
  const cardResult = processMonsterCardEffects(card, player, enemy);
  let newPlayer = cardResult.player;
  let newEnemy = cardResult.enemy;
  let cardsToDraw = 0;

  const healthLost = player.health - newPlayer.health;
  if (healthLost > 0) {
    const context: RelicContext = {};
    const relicResult = processRelicEffects(
      RelicTrigger.DAMAGE_TAKEN,
      newPlayer,
      [newEnemy],
      context,
    );
    newPlayer = relicResult.player;
    newEnemy = relicResult.enemies[0] || newEnemy;
    cardsToDraw = context.shouldDrawCards || 0;
  }

  return {
    player: newPlayer,
    enemy: { ...newEnemy, health: Math.max(0, newEnemy.health) },
    cardsToDraw,
  };
};
