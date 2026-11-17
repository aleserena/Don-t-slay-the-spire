/**
 * Pure combat rules: setting up and ending a combat, turn starts and the
 * enemy side of a turn. The store sequences these and holds the state.
 */

import {
  Card,
  CombatCounters,
  EffectType,
  Enemy,
  GamePhase,
  IntentType,
  MonsterCard,
  MonsterCardType,
  Player,
  TurnPhase,
} from "../types/game";
import { NodeType } from "../types/map";
import { getBossForFloor } from "../data/bosses";
import { selectEnemyCard } from "../data/monsterCards";
import { processMonsterCardEffects } from "../utils/monsterCardEffects";
import { tickPoison } from "../utils/statusEffects";
import { shuffle, Rng } from "../utils/random";
import { MAX_BONUS_ENERGY } from "./constants";
import { withoutTemporaryCards } from "./deck";
import { createCombatEncounter, createEliteEncounter } from "./encounters";
import { createCombatReward } from "./rewards";
import { createBattle, createCombatCounters, dispatch } from "./triggers";

export const isCombatNode = (type: NodeType): boolean =>
  type === NodeType.COMBAT || type === NodeType.ELITE || type === NodeType.BOSS;

/** Creates the enemies for a combat, elite or boss map node. */
export const createEncounter = (
  type: NodeType,
  floor: number,
  rng: Rng = Math.random,
): Enemy[] => {
  // The opening card is picked here with the run's random source, so the
  // same seed gives the same first intents
  const withOpeningCard = (enemy: Enemy) => chooseNextCard(enemy, rng);

  switch (type) {
    case NodeType.BOSS:
      return [getBossForFloor(floor, rng)].map(withOpeningCard);
    case NodeType.ELITE:
      return createEliteEncounter(floor, rng).map(withOpeningCard);
    default:
      return createCombatEncounter(floor, rng).map(withOpeningCard);
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
  rng: Rng = Math.random,
) => ({
  gamePhase: GamePhase.COMBAT,
  currentTurn: TurnPhase.PLAYER_TURN,
  // Every enemy shows what it will do on its first turn
  enemies: enemies.map((enemy) =>
    enemy.currentCard ? enemy : chooseNextCard(enemy, rng),
  ),
  hand: [] as Card[],
  drawPile: shuffle(withoutTemporaryCards(persistentDeck), rng),
  discardPile: [] as Card[],
  exhaustPile: [] as Card[],
  combatReward: undefined,
  selectedCard: null,
  firstAttackThisCombat: true,
  // Incremented to 1 when the first player turn starts
  playerTurnThisCombat: 0,
  combat: createCombatCounters(),
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
  rng: Rng = Math.random,
) => {
  const combatReward = createCombatReward(player, defeatedEnemies, rng);
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
    combat: createCombatCounters(),
    stepInProgress: false,
    stepType: undefined,
  };
};

/**
 * Block left at the start of a player turn. Block gained before the first
 * turn (combat-start effects) is kept; afterwards all block is lost, or at
 * most the smallest block-loss limit among the player's relics and powers.
 */
const getBlockAtTurnStart = (player: Player, turn: number): number => {
  if (turn <= 1) return Math.max(0, player.block);

  const limits = [
    ...player.relics
      .flatMap((relic) => relic.effects)
      .filter((effect) => effect.effect === EffectType.LIMIT_BLOCK_LOSS)
      .map((effect) => effect.value ?? 0),
    ...player.powerCards
      .flatMap((power) => power.effects)
      .filter((effect) => effect.type === EffectType.LIMIT_BLOCK_LOSS)
      .map((effect) => effect.value),
  ];
  if (limits.length === 0) return 0;

  return Math.max(0, player.block - Math.min(...limits));
};

/**
 * Start of a player turn: energy refills (plus any energy promised for this
 * turn), block resets, then power card and relic turn-start effects apply.
 * `turn` is the 1-based turn of the combat.
 */
export const startPlayerTurn = (
  player: Player,
  enemies: Enemy[],
  turn: number,
  counters: CombatCounters = createCombatCounters(),
  rng: Rng = Math.random,
): {
  player: Player;
  enemies: Enemy[];
  cardsToDraw: number;
  counters: CombatCounters;
} => {
  const refreshed = {
    ...player,
    energy: Math.min(
      player.maxEnergy + MAX_BONUS_ENERGY,
      player.maxEnergy + counters.energyNextTurn,
    ),
    block: getBlockAtTurnStart(player, turn),
  };

  return dispatch(
    createBattle(refreshed, enemies, { ...counters, energyNextTurn: 0 }),
    { type: "turn_start", turn },
    rng,
  );
};

/**
 * End of the player's turn: power card and relic turn-end effects apply,
 * then statuses that only last for the turn are removed.
 */
export const endPlayerTurn = (
  player: Player,
  enemies: Enemy[],
  counters: CombatCounters = createCombatCounters(),
  rng: Rng = Math.random,
): {
  player: Player;
  enemies: Enemy[];
  cardsToDraw: number;
  counters: CombatCounters;
} => {
  const battle = dispatch(
    createBattle(player, enemies, counters),
    { type: "turn_end" },
    rng,
  );

  const expiring = battle.counters.expiringStatuses;
  const statusEffects = battle.player.statusEffects
    .map((effect) => {
      const lost = expiring
        .filter((status) => status.type === effect.type)
        .reduce((total, status) => total + status.stacks, 0);
      return lost > 0 ? { ...effect, stacks: effect.stacks - lost } : effect;
    })
    .filter((effect) => effect.stacks > 0);

  return {
    ...battle,
    player: { ...battle.player, statusEffects },
    counters: { ...battle.counters, expiringStatuses: [] },
  };
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
export const chooseNextCard = (enemy: Enemy, rng: Rng = Math.random): Enemy => {
  const card = selectEnemyCard(enemy.deck, enemy.health, enemy.maxHealth, rng);
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
 * An enemy plays a card against the player. Effects that react to the player
 * losing health apply afterwards and may hurt the enemy back or ask for
 * cards to be drawn.
 */
export const resolveEnemyCard = (
  card: MonsterCard,
  player: Player,
  enemy: Enemy,
  counters: CombatCounters = createCombatCounters(),
  rng: Rng = Math.random,
): {
  player: Player;
  enemy: Enemy;
  cardsToDraw: number;
  counters: CombatCounters;
} => {
  const cardResult = processMonsterCardEffects(card, player, enemy);
  let battle = createBattle(cardResult.player, [cardResult.enemy], counters);

  const healthLost = player.health - cardResult.player.health;
  if (healthLost > 0) {
    battle = dispatch(
      battle,
      { type: "hp_lost", amount: healthLost, attackerId: enemy.id },
      rng,
    );
  }

  const newEnemy = battle.enemies[0] ?? cardResult.enemy;
  return {
    player: battle.player,
    enemy: { ...newEnemy, health: Math.max(0, newEnemy.health) },
    cardsToDraw: battle.cardsToDraw,
    counters: battle.counters,
  };
};
