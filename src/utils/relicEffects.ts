import {
  Player,
  Enemy,
  Relic,
  RelicTrigger,
  EffectType,
  StatusType,
  RelicEffect,
} from "../types/game";
import { applyStatusEffect } from "./statusEffects";

interface RelicContext {
  shouldDrawCards?: number;
  playerTurnThisCombat?: number;
}

export const processRelicEffects = (
  trigger: RelicTrigger,
  player: Player,
  enemies: Enemy[],
  _context?: RelicContext,
): { player: Player; enemies: Enemy[] } => {
  console.log(`[DEBUG] processRelicEffects called - trigger: ${trigger}, context:`, _context);
  console.log(`[DEBUG] Player has ${player.relics.length} relics:`, player.relics.map(r => r.name));
  console.log(`[DEBUG] Player state - Health: ${player.health}, Block: ${player.block}, Energy: ${player.energy}`);
  console.log(`[DEBUG] Enemies: ${enemies.length}`, enemies.map(e => `${e.name}(${e.health}/${e.maxHealth})`));
  
  let newPlayer = { ...player };
  let newEnemies = [...enemies];

  // Process each relic's effects
  for (const relic of player.relics) {
    console.log(`[DEBUG] Checking relic: ${relic.name} (${relic.id})`);
    for (const effect of relic.effects) {
      console.log(`[DEBUG] Relic effect: ${effect.trigger} === ${trigger}? ${effect.trigger === trigger}`);
      if (effect.trigger === trigger) {
        console.log(`[DEBUG] Relic effect triggered: ${relic.name} - ${effect.effect} (${effect.value})`);
        
        // Special handling for specific relics
        if (
          relic.id === "bronze_scales" &&
          trigger === RelicTrigger.DAMAGE_TAKEN
        ) {
          // Bronze Scales: Deal 3 damage back to all enemies
          console.log('[DEBUG] Bronze Scales triggered - dealing 3 damage to all enemies');
          newEnemies = newEnemies.map((enemy) => ({
            ...enemy,
            health: Math.max(0, enemy.health - 3),
          }));
        } else if (
          relic.id === "centennial_puzzle" &&
          trigger === RelicTrigger.DAMAGE_TAKEN
        ) {
          // Centennial Puzzle: Draw 3 cards on first damage taken
          // This would need to be handled in the game store to actually draw cards
          // For now, we'll mark that cards should be drawn
          console.log('[DEBUG] Centennial Puzzle triggered - should draw 3 cards');
          if (_context) {
            _context.shouldDrawCards = 3;
          }
        } else if (
          relic.id === "horn_cleat" &&
          trigger === RelicTrigger.TURN_START
        ) {
          // Horn Cleat: Only trigger on the 2nd player turn
          console.log(`[DEBUG] Horn Cleat check - playerTurnThisCombat: ${_context?.playerTurnThisCombat}, should trigger: ${_context?.playerTurnThisCombat === 2}`);
          if (_context?.playerTurnThisCombat === 2) {
            console.log("[DEBUG] Horn Cleat triggered on playerTurnThisCombat=2");
            const result = applyRelicEffect(
              effect,
              newPlayer,
              newEnemies,
              _context,
            );
            newPlayer = result.player;
            newEnemies = result.enemies;
            console.log(`[DEBUG] Horn Cleat applied - new block: ${newPlayer.block}`);
          } else {
            console.log(`[DEBUG] Horn Cleat NOT triggered, playerTurnThisCombat=${_context?.playerTurnThisCombat}`);
          }
        } else {
          // Apply standard relic effect
          console.log(`[DEBUG] Applying standard relic effect: ${relic.name} - ${effect.effect}`);
          const result = applyRelicEffect(
            effect,
            newPlayer,
            newEnemies,
            _context,
          );
          newPlayer = result.player;
          newEnemies = result.enemies;
          console.log(`[DEBUG] Standard relic effect applied - new player state:`, {
            health: newPlayer.health,
            block: newPlayer.block,
            energy: newPlayer.energy
          });
        }
      }
    }
  }

  console.log(`[DEBUG] processRelicEffects complete - final player state:`, {
    health: newPlayer.health,
    block: newPlayer.block,
    energy: newPlayer.energy
  });
  
  return { player: newPlayer, enemies: newEnemies };
};

const applyRelicEffect = (
  effect: RelicEffect,
  player: Player,
  enemies: Enemy[],
  _context?: RelicContext,
): { player: Player; enemies: Enemy[] } => {
  console.log(`[DEBUG] applyRelicEffect called - effect: ${effect.effect}, value: ${effect.value}, target: ${effect.target}`);
  console.log(`[DEBUG] Player state before:`, { health: player.health, block: player.block, energy: player.energy });
  
  let newPlayer = { ...player };
  let newEnemies = [...enemies];

  const amount = effect.value || 0;

  switch (effect.effect) {
    case EffectType.HEAL:
      newPlayer.health = Math.min(
        newPlayer.maxHealth,
        newPlayer.health + amount,
      );
      console.log(`[DEBUG] HEAL effect - healed ${amount}, new health: ${newPlayer.health}`);
      break;

    case EffectType.BLOCK:
      newPlayer.block += amount;
      console.log(`[DEBUG] BLOCK effect - added ${amount} block, new block: ${newPlayer.block}`);
      break;

    case EffectType.GAIN_ENERGY:
      newPlayer.energy = Math.min(
        newPlayer.maxEnergy + 3,
        newPlayer.energy + amount,
      );
      console.log(`[DEBUG] GAIN_ENERGY effect - gained ${amount} energy, new energy: ${newPlayer.energy}`);
      break;

    case EffectType.DRAW_CARDS:
      // This would trigger the draw cards function in the game store
      // For now, we'll just note that cards should be drawn
      console.log(`[DEBUG] DRAW_CARDS effect - should draw ${effect.value || 0} cards`);
      break;

    case EffectType.APPLY_STATUS:
      if (effect.statusType) {
        console.log(`[DEBUG] APPLY_STATUS effect - status: ${effect.statusType}, value: ${effect.value}, target: ${effect.target}`);
        // Check if the effect has a target specified
        if (effect.target === "self") {
          newPlayer = applyStatusEffect(
            newPlayer,
            effect.statusType,
            effect.value || 1,
          ) as Player;
          console.log(`[DEBUG] Applied status to self - new status effects:`, newPlayer.statusEffects);
        } else if (
          effect.target === "all_enemies" ||
          effect.target === "ALL_ENEMIES" ||
          !effect.target
        ) {
          // Default to all enemies if no target specified for status effects
          newEnemies = newEnemies.map(
            (enemy) =>
              applyStatusEffect(
                enemy,
                effect.statusType!,
                effect.value || 1,
              ) as Enemy,
          );
          console.log(`[DEBUG] Applied status to all enemies - enemy status effects:`, newEnemies.map(e => ({ name: e.name, effects: e.statusEffects })));
        }
      }
      break;

    case EffectType.DAMAGE:
      console.log(`[DEBUG] DAMAGE effect - dealing ${amount} damage to ${effect.target}`);
      if (effect.target === "all_enemies" || effect.target === "ALL_ENEMIES") {
        newEnemies = newEnemies.map((enemy) => ({
          ...enemy,
          health: enemy.health - amount,
        }));
        console.log(`[DEBUG] Damaged all enemies - new health:`, newEnemies.map(e => ({ name: e.name, health: e.health })));
      }
      break;
  }

  console.log(`[DEBUG] applyRelicEffect complete - final player state:`, {
    health: newPlayer.health,
    block: newPlayer.block,
    energy: newPlayer.energy
  });
  
  return { player: newPlayer, enemies: newEnemies };
};

export const getRelicDescription = (relic: Relic): string => {
  return relic.description;
};

export const shouldTriggerRelic = (
  relic: Relic,
  trigger: RelicTrigger,
  _context?: RelicContext,
): boolean => {
  // Check if any of the relic's effects should trigger
  return relic.effects.some((effect) => effect.trigger === trigger);
};

// Specific relic implementations
export const processAkabekoEffect = (
  player: Player,
  cardType: string,
): number => {
  // Akabeko: First attack each combat deals 8 additional damage
  const hasAkabeko = player.relics.some((r) => r.id === "akabeko");
  if (hasAkabeko && cardType === "attack") {
    // In a real implementation, we'd track if this is the first attack
    return 8;
  }
  return 0;
};

export const processBagOfMarblesEffect = (enemies: Enemy[]): Enemy[] => {
  // Bag of Marbles: Apply 1 Vulnerable to ALL enemies at combat start
  return enemies.map(
    (enemy) => applyStatusEffect(enemy, StatusType.VULNERABLE, 1) as Enemy,
  );
};

export const processBloodVialEffect = (player: Player): Player => {
  // Blood Vial: Heal 2 HP at combat start
  return {
    ...player,
    health: Math.min(player.maxHealth, player.health + 2),
  };
};
