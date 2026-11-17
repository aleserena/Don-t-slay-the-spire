/**
 * What playing a card would do, worked out by actually resolving the card
 * on a copy of the combat. Views use this instead of re-deriving damage
 * from card data, so any card the engine can play can also be previewed.
 */

import { Card, CardType, CombatCounters, Enemy, Player } from "../types/game";
import { createSeededRng } from "../utils/random";
import { getEnergyCost, resolveCardPlay } from "./cardPlay";

export interface EnemyPreview {
  /** Damage dealt to the enemy, before its block. */
  totalDamage: number;
  /** Health the enemy would lose. */
  healthLost: number;
  wouldKill: boolean;
}

export interface CardPreviewInput {
  card: Card;
  player: Player;
  enemies: Enemy[];
  /** Enemy the card would be aimed at, for single-target effects. */
  targetId?: string;
  isFirstAttack?: boolean;
  counters?: CombatCounters;
}

/**
 * The effect of a card on each enemy, by enemy id. Enemies the card would
 * not touch are left out. Effects that pick a random enemy are resolved with
 * a fixed sequence, so for those the preview shows one possible outcome.
 */
export const previewCardPlay = ({
  card,
  player,
  enemies,
  targetId,
  isFirstAttack = false,
  counters,
}: CardPreviewInput): Record<string, EnemyPreview> => {
  const energyCost = getEnergyCost(card, player);
  const result = resolveCardPlay({
    card,
    targetId,
    energyCost,
    player: { ...player, energy: Math.max(0, player.energy - energyCost) },
    enemies,
    hand: [],
    isFirstAttack: isFirstAttack && card.type === CardType.ATTACK,
    counters,
    rng: createSeededRng(1),
  });

  const previews: Record<string, EnemyPreview> = {};
  for (const before of enemies) {
    const after = result.enemies.find((enemy) => enemy.id === before.id);
    if (!after) continue;

    const healthLost = before.health - Math.max(0, after.health);
    // Overkill counts as damage too, so the number matches what was dealt
    const overkill = Math.max(0, -after.health);
    const totalDamage =
      healthLost + overkill + Math.max(0, before.block - after.block);
    if (totalDamage <= 0) continue;

    previews[before.id] = {
      totalDamage,
      healthLost,
      wouldKill: after.health <= 0,
    };
  }
  return previews;
};
