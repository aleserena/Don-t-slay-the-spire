/**
 * Resolves the effects of the player playing a card. Pure: it returns the
 * new player, enemies and hand instead of touching the store.
 */

import {
  Card,
  CardType,
  EffectType,
  Enemy,
  Player,
  PowerTrigger,
  TargetType,
} from "../types/game";
import { getPowerCardDefinition } from "../data/powerCards";
import { upgradeCard } from "../utils/cardUpgrades";
import { processPowerCardEffects } from "../utils/powerCardEffects";
import {
  applyStatusEffect,
  calculateBlock,
  calculateDamage,
} from "../utils/statusEffects";
import { pickRandom } from "../utils/random";
import { MAX_BONUS_ENERGY } from "./constants";
import { createTemporaryCopy } from "./deck";

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
}

export interface CardPlayResult {
  player: Player;
  /** Enemies after the card resolved, including any reduced to 0 health. */
  enemies: Enemy[];
  hand: Card[];
  /** Cards the effects created, to be added to the discard pile. */
  createdCards: Card[];
  /** Cards to draw once the played card has left the hand. */
  cardsToDraw: number;
}

/** Energy a card costs to play right now. X-cost cards spend everything. */
export const getEnergyCost = (card: Card, player: Player): number =>
  card.cost === "X" ? player.energy : card.cost;

/** Applies attack damage to a target, removing block first. */
export const applyDamage = <T extends Player | Enemy>(
  target: T,
  damage: number,
): T => ({
  ...target,
  health: target.health - Math.max(0, damage - target.block),
  block: Math.max(0, target.block - damage),
});

const isDamageEffect = (type: EffectType): boolean =>
  type === EffectType.DAMAGE ||
  type === EffectType.DAMAGE_MULTIPLIER_BLOCK ||
  type === EffectType.DAMAGE_MULTIPLIER_ENERGY;

export const resolveCardPlay = ({
  card,
  targetId,
  energyCost,
  player,
  enemies,
  hand,
  isFirstAttack,
}: CardPlayInput): CardPlayResult => {
  let newPlayer = player;
  let newEnemies = [...enemies];
  const newHand = [...hand];
  const createdCards: Card[] = [];
  let cardsToDraw = 0;

  const hitEnemy = (
    enemy: Enemy,
    baseDamage: number,
    firstAttack: boolean,
    strengthMultiplier: number = 1,
  ): Enemy =>
    applyDamage(
      enemy,
      calculateDamage(
        baseDamage,
        newPlayer,
        enemy,
        firstAttack,
        strengthMultiplier,
      ),
    );

  const hitAll = (
    baseDamage: number,
    firstAttack: boolean,
    strengthMultiplier?: number,
  ) => {
    newEnemies = newEnemies.map((enemy) =>
      hitEnemy(enemy, baseDamage, firstAttack, strengthMultiplier),
    );
  };

  const hitTarget = (
    baseDamage: number,
    firstAttack: boolean,
    strengthMultiplier?: number,
  ) => {
    if (!targetId) return;
    newEnemies = newEnemies.map((enemy) =>
      enemy.id === targetId
        ? hitEnemy(enemy, baseDamage, firstAttack, strengthMultiplier)
        : enemy,
    );
  };

  for (const effect of card.effects ?? []) {
    switch (effect.type) {
      case EffectType.DAMAGE:
        if (effect.target === TargetType.ALL_ENEMIES) {
          hitAll(effect.value, isFirstAttack, effect.strengthMultiplier);
        } else if (effect.target === TargetType.ENEMY) {
          hitTarget(effect.value, isFirstAttack, effect.strengthMultiplier);
        }
        break;

      case EffectType.DAMAGE_MULTIPLIER_BLOCK:
        if (effect.target === TargetType.ENEMY) {
          hitTarget(newPlayer.block * (effect.multiplier || 1), isFirstAttack);
        }
        break;

      case EffectType.DAMAGE_MULTIPLIER_ENERGY:
        if (effect.target === TargetType.ALL_ENEMIES) {
          // One hit per energy spent
          for (let hit = 0; hit < energyCost; hit++) {
            hitAll(effect.value, isFirstAttack && hit === 0);
          }
        }
        break;

      case EffectType.BLOCK:
        if (effect.target === TargetType.SELF) {
          newPlayer = {
            ...newPlayer,
            block: newPlayer.block + calculateBlock(effect.value, newPlayer),
          };
        }
        break;

      case EffectType.APPLY_STATUS: {
        const statusType = effect.statusType;
        if (!statusType) break;

        if (effect.target === TargetType.SELF) {
          newPlayer = applyStatusEffect(
            newPlayer,
            statusType,
            effect.value,
          ) as Player;
        } else if (effect.target === TargetType.ENEMY && targetId) {
          newEnemies = newEnemies.map((enemy) =>
            enemy.id === targetId
              ? (applyStatusEffect(enemy, statusType, effect.value) as Enemy)
              : enemy,
          );
        } else if (effect.target === TargetType.ALL_ENEMIES) {
          newEnemies = newEnemies.map(
            (enemy) =>
              applyStatusEffect(enemy, statusType, effect.value) as Enemy,
          );
        }
        break;
      }

      case EffectType.DRAW_CARDS:
        if (effect.target === TargetType.SELF) {
          cardsToDraw += effect.value;
        }
        break;

      case EffectType.HEAL:
        if (effect.target === TargetType.SELF) {
          newPlayer = {
            ...newPlayer,
            health: Math.min(
              newPlayer.maxHealth,
              newPlayer.health + effect.value,
            ),
          };
        }
        break;

      case EffectType.GAIN_ENERGY:
        if (effect.target === TargetType.SELF) {
          newPlayer = {
            ...newPlayer,
            energy: Math.min(
              newPlayer.maxEnergy + MAX_BONUS_ENERGY,
              newPlayer.energy + effect.value,
            ),
          };
        }
        break;

      case EffectType.LOSE_ENERGY:
        if (effect.target === TargetType.SELF) {
          newPlayer = {
            ...newPlayer,
            energy: Math.max(0, newPlayer.energy - effect.value),
          };
        }
        break;

      case EffectType.ADD_CARD_TO_DISCARD:
        if (effect.target === TargetType.SELF) {
          createdCards.push(createTemporaryCopy(card));
        }
        break;

      case EffectType.UPGRADE_CARD:
        if (effect.target === TargetType.SELF) {
          // Upgrade a random card in hand
          const cardToUpgrade = pickRandom(newHand.filter((c) => !c.upgraded));
          if (cardToUpgrade) {
            newHand[newHand.indexOf(cardToUpgrade)] =
              upgradeCard(cardToUpgrade);
          }
        }
        break;
    }
  }

  // Legacy support: cards with a direct damage property and no damage effects
  if (
    card.damage &&
    card.damage > 0 &&
    !card.effects?.some((effect) => isDamageEffect(effect.type))
  ) {
    hitTarget(card.damage, isFirstAttack);
  }

  // Legacy support: cards with a direct block property and no block effects
  if (
    card.block &&
    card.block > 0 &&
    !card.effects?.some((effect) => effect.type === EffectType.BLOCK)
  ) {
    newPlayer = {
      ...newPlayer,
      block: newPlayer.block + calculateBlock(card.block, newPlayer),
    };
  }

  // Power cards stay attached to the player for the rest of the combat
  if (card.type === CardType.POWER) {
    const powerCardDef = getPowerCardDefinition(card.baseId);
    if (powerCardDef) {
      const powerCards = [...newPlayer.powerCards, powerCardDef];
      newPlayer = { ...newPlayer, powerCards };

      // Only apply the definition's immediate effects when the card has no
      // effects of its own, so they are not applied twice
      if (!card.effects || card.effects.length === 0) {
        const powerResult = processPowerCardEffects(
          PowerTrigger.COMBAT_START,
          { ...newPlayer, powerCards: [powerCardDef] },
          newEnemies,
        );
        newPlayer = { ...powerResult.player, powerCards };
        newEnemies = powerResult.enemies;
      }
    }
  }

  return {
    player: newPlayer,
    enemies: newEnemies,
    hand: newHand,
    createdCards,
    cardsToDraw,
  };
};
