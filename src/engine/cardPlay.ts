/**
 * Resolves the effects of the player playing a card. Pure: it returns the
 * new player, enemies and hand instead of touching the store.
 */

import {
  Card,
  CardEffect,
  CardType,
  CombatCounters,
  EffectType,
  Enemy,
  Player,
  PowerCard,
  TargetType,
} from "../types/game";
import { getAllCards } from "../data/cards";
import { upgradeCard } from "../utils/cardUpgrades";
import {
  applyStatusEffect,
  calculateBlock,
  calculateDamage,
} from "../utils/statusEffects";
import { pickRandom, Rng } from "../utils/random";
import { MAX_BONUS_ENERGY } from "./constants";
import { createTemporaryCopy } from "./deck";
import { getCardEffects, takeDamage } from "./effects";
import {
  Battle,
  createBattle,
  createCombatCounters,
  dispatch,
  gainBlock,
  loseHp,
} from "./triggers";

export interface CardPlayInput {
  card: Card;
  /** Enemy the card was aimed at, for single-target effects. */
  targetId?: string;
  /** Energy spent on the card (all remaining energy for X-cost cards). */
  energyCost: number;
  /** Player after paying for the card. */
  player: Player;
  enemies: Enemy[];
  /** Hand without the played card. */
  hand: Card[];
  /** Whether this is the first attack card played this combat. */
  isFirstAttack: boolean;
  /** Bookkeeping of the current combat. */
  counters?: CombatCounters;
  rng?: Rng;
}

/** Where a card goes once it has been played. */
export type CardDestination = "discard" | "exhaust" | "removed";

export interface CardPlayResult {
  player: Player;
  /** Enemies after the card resolved, including any reduced to 0 health. */
  enemies: Enemy[];
  hand: Card[];
  /** Cards the effects created, to be added to the discard pile. */
  createdCards: Card[];
  /** Cards to draw once the played card has left the hand. */
  cardsToDraw: number;
  counters: CombatCounters;
  /**
   * `exhaust` for cards that exhaust, `removed` for power cards (they stay
   * in play as a power), `discard` for everything else.
   */
  destination: CardDestination;
}

/** Effect types a player card can use. */
export const SUPPORTED_CARD_EFFECTS: EffectType[] = [
  EffectType.DAMAGE,
  EffectType.DAMAGE_MULTIPLIER_BLOCK,
  EffectType.DAMAGE_MULTIPLIER_ENERGY,
  EffectType.BLOCK,
  EffectType.APPLY_STATUS,
  EffectType.DRAW_CARDS,
  EffectType.HEAL,
  EffectType.GAIN_ENERGY,
  EffectType.LOSE_ENERGY,
  EffectType.LOSE_HP,
  EffectType.ADD_CARD_TO_DISCARD,
  EffectType.UPGRADE_CARD,
];

/** Energy a card costs to play right now. X-cost cards spend everything. */
export const getEnergyCost = (card: Card, player: Player): number =>
  card.cost === "X" ? player.energy : card.cost;

/** Applies attack damage to a target, removing block first. */
export const applyDamage = takeDamage;

/**
 * The effects of a card being played. A power card created without effects
 * of its own uses those of the card definition it is an instance of.
 */
const getPlayedEffects = (card: Card): CardEffect[] => {
  const effects = getCardEffects(card);
  if (effects.length > 0 || card.type !== CardType.POWER) return effects;

  const definition = getAllCards().find((c) => c.baseId === card.baseId);
  return definition ? getCardEffects(definition) : [];
};

/** The power a power card leaves in play: its effects that have a trigger. */
const toPowerCard = (card: Card, effects: CardEffect[]): PowerCard => ({
  id: card.baseId,
  name: card.name,
  description: card.description,
  effects: effects.flatMap((effect) =>
    effect.trigger
      ? [
          {
            trigger: effect.trigger,
            type: effect.type,
            value: effect.value,
            target: effect.target,
            statusType: effect.statusType,
          },
        ]
      : [],
  ),
});

export const resolveCardPlay = ({
  card,
  targetId,
  energyCost,
  player,
  enemies,
  hand,
  isFirstAttack,
  counters = createCombatCounters(),
  rng = Math.random,
}: CardPlayInput): CardPlayResult => {
  let battle: Battle = createBattle(player, [...enemies], counters);
  const newHand = [...hand];
  const createdCards: Card[] = [];

  // The first-attack bonus belongs to the first damage effect of the card
  let firstAttackPending = isFirstAttack;
  const takeFirstAttack = (): boolean => {
    const first = firstAttackPending;
    firstAttackPending = false;
    return first;
  };

  /** Ids of the enemies an effect with this target applies to. */
  const pickTargets = (target: TargetType): string[] => {
    switch (target) {
      case TargetType.ALL_ENEMIES:
        return battle.enemies.map((enemy) => enemy.id);
      case TargetType.ENEMY:
        return targetId ? [targetId] : [];
      case TargetType.RANDOM_ENEMY: {
        const enemy = pickRandom(
          battle.enemies.filter((e) => e.health > 0),
          rng,
        );
        return enemy ? [enemy.id] : [];
      }
      default:
        return [];
    }
  };

  const updateEnemies = (ids: string[], update: (enemy: Enemy) => Enemy) => {
    battle = {
      ...battle,
      enemies: battle.enemies.map((enemy) =>
        ids.includes(enemy.id) ? update(enemy) : enemy,
      ),
    };
  };

  const setPlayer = (update: (player: Player) => Player) => {
    battle = { ...battle, player: update(battle.player) };
  };

  /** One hit of attack damage against every enemy the target selects. */
  const hit = (
    target: TargetType,
    baseDamage: number,
    strengthMultiplier?: number,
  ) => {
    const firstAttack = takeFirstAttack();
    updateEnemies(pickTargets(target), (enemy) =>
      takeDamage(
        enemy,
        calculateDamage(
          baseDamage,
          battle.player,
          enemy,
          firstAttack,
          strengthMultiplier,
        ),
      ),
    );
  };

  const effects = getPlayedEffects(card);

  for (const effect of effects) {
    // Ongoing effects of a power card fire later, through its trigger
    if (effect.trigger) continue;

    const isSelf = effect.target === TargetType.SELF;

    switch (effect.type) {
      case EffectType.DAMAGE:
        hit(effect.target, effect.value, effect.strengthMultiplier);
        break;

      case EffectType.DAMAGE_MULTIPLIER_BLOCK:
        hit(effect.target, battle.player.block * (effect.multiplier || 1));
        break;

      case EffectType.DAMAGE_MULTIPLIER_ENERGY:
        // One hit per energy spent
        for (let i = 0; i < energyCost; i++) {
          hit(effect.target, effect.value);
        }
        break;

      case EffectType.BLOCK:
        if (isSelf) {
          battle = gainBlock(
            battle,
            calculateBlock(effect.value, battle.player),
            rng,
          );
        }
        break;

      case EffectType.APPLY_STATUS: {
        const statusType = effect.statusType;
        if (!statusType) break;

        if (isSelf) {
          setPlayer(
            (p) => applyStatusEffect(p, statusType, effect.value) as Player,
          );
          if (effect.untilEndOfTurn) {
            battle = {
              ...battle,
              counters: {
                ...battle.counters,
                expiringStatuses: [
                  ...battle.counters.expiringStatuses,
                  { type: statusType, stacks: effect.value },
                ],
              },
            };
          }
        } else {
          updateEnemies(
            pickTargets(effect.target),
            (enemy) =>
              applyStatusEffect(enemy, statusType, effect.value) as Enemy,
          );
        }
        break;
      }

      case EffectType.DRAW_CARDS:
        if (isSelf) {
          battle = {
            ...battle,
            cardsToDraw: battle.cardsToDraw + effect.value,
          };
        }
        break;

      case EffectType.HEAL:
        if (isSelf) {
          setPlayer((p) => ({
            ...p,
            health: Math.min(p.maxHealth, p.health + effect.value),
          }));
        }
        break;

      case EffectType.LOSE_HP:
        if (isSelf) battle = loseHp(battle, effect.value, undefined, rng);
        break;

      case EffectType.GAIN_ENERGY:
        if (isSelf) {
          setPlayer((p) => ({
            ...p,
            energy: Math.min(
              p.maxEnergy + MAX_BONUS_ENERGY,
              p.energy + effect.value,
            ),
          }));
        }
        break;

      case EffectType.LOSE_ENERGY:
        if (isSelf) {
          setPlayer((p) => ({
            ...p,
            energy: Math.max(0, p.energy - effect.value),
          }));
        }
        break;

      case EffectType.ADD_CARD_TO_DISCARD:
        if (isSelf) createdCards.push(createTemporaryCopy(card));
        break;

      case EffectType.UPGRADE_CARD:
        if (isSelf) {
          // Upgrade a random card in hand
          const cardToUpgrade = pickRandom(
            newHand.filter((c) => !c.upgraded),
            rng,
          );
          if (cardToUpgrade) {
            newHand[newHand.indexOf(cardToUpgrade)] =
              upgradeCard(cardToUpgrade);
          }
        }
        break;
    }
  }

  // Power cards stay attached to the player for the rest of the combat
  if (card.type === CardType.POWER) {
    setPlayer((p) => ({
      ...p,
      powerCards: [...p.powerCards, toPowerCard(card, effects)],
    }));
  }

  battle = dispatch(battle, { type: "card_played", card }, rng);

  let destination: CardDestination = "discard";
  if (card.type === CardType.POWER) {
    destination = "removed";
  } else if (card.exhaust) {
    destination = "exhaust";
    battle = dispatch(battle, { type: "card_exhausted", card }, rng);
  }

  // Enemies this card killed
  for (const enemy of enemies) {
    const after = battle.enemies.find((e) => e.id === enemy.id);
    if (enemy.health > 0 && after && after.health <= 0) {
      battle = dispatch(battle, { type: "enemy_died", enemyId: enemy.id }, rng);
    }
  }

  return {
    player: battle.player,
    enemies: battle.enemies,
    hand: newHand,
    createdCards,
    cardsToDraw: battle.cardsToDraw,
    counters: battle.counters,
    destination,
  };
};
