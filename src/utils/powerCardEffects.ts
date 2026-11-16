import { Player, Enemy, PowerTrigger } from "../types/game";
import { createBattle, runPowerTrigger } from "../engine/triggers";

/**
 * Applies every effect of the player's power cards that matches `trigger`.
 *
 * Kept for callers that only have a player and enemies; combat itself raises
 * events through `dispatch` in `src/engine/triggers.ts`, which runs the same
 * code.
 */
export const processPowerCardEffects = (
  trigger: PowerTrigger,
  player: Player,
  enemies: Enemy[],
): { player: Player; enemies: Enemy[] } => {
  const battle = runPowerTrigger(createBattle(player, enemies), trigger);
  return { player: battle.player, enemies: battle.enemies };
};
