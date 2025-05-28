import { create } from 'zustand';
import { GameState, Player, Enemy, TurnPhase, EffectType, TargetType, StatusType, IntentType, GamePhase, Relic, RelicTrigger, Card, CardType, PowerTrigger } from '../types/game';
import { createInitialDeck, getAllCards } from '../data/cards';
import { getBossForFloor } from '../data/bosses';
import { getStarterRelic, getAllRelics } from '../data/relics';
import { generateMap, completeNode } from '../utils/mapGeneration';
import { getRandomEvent, processEventConsequence } from '../data/events';
import { processRelicEffects } from '../utils/relicEffects';
import { processPowerCardEffects } from '../utils/powerCardEffects';
import { getPowerCardDefinition } from '../data/powerCards';
import { 
  applyStatusEffect, 
  processStatusEffects, 
  calculateDamage, 
  calculateBlock 
} from '../utils/statusEffects';
import { upgradeCard } from '../utils/cardUpgrades';
import { getRandomEnemyEncounter } from '../data/enemies';
import { damageDebugger } from '../utils/damageDebugger';
import { debugConsole } from '../utils/debugUtils';

interface GameStore extends GameState {
  // Additional state
  firstAttackThisCombat: boolean;
  selectedCard: Card | null;
  showCardRemovalModal: boolean;
  showCardUpgradeModal: boolean;
  debugMode: boolean;
  currentFloor: number;
  hasSavedGame: boolean;
  
  // Actions
  playCard: (cardId: string, targetId?: string) => void;
  endTurn: () => void;
  startCombat: () => void;
  drawCards: (count: number) => void;
  shuffleDiscardIntoDraw: () => void;
  processEnemyTurn: () => void;
  
  // Progression actions
  startNewRun: () => void;
  startNewGame: () => void;
  returnToTitle: () => void;
  loadSavedGame: () => void;
  selectNode: (nodeId: string) => void;
  selectCardReward: (cardId: string) => void;
  skipCardReward: () => void;
  selectEventChoice: (choiceId: string) => void;
  returnToMap: () => void;
  
  // Shop actions
  purchaseShopCard: (index: number) => void;
  purchaseShopRelic: (index: number) => void;
  removeCardFromDeck: (cardId?: string) => void;
  openCardRemovalModal: () => void;
  closeCardRemovalModal: () => void;
  
  // Rest site actions
  restAndHeal: () => void;
  upgradeCardAtRest: (cardId?: string) => void;
  openCardUpgradeModal: () => void;
  closeCardUpgradeModal: () => void;
  
  // Card selection
  setSelectedCard: (card: Card | null) => void;
  
  // Debug actions
  toggleDebugMode: () => void;
}

const createInitialPlayer = (): Player => ({
  health: 80,
  maxHealth: 80,
  block: 0,
  energy: 3,
  maxEnergy: 3,
  statusEffects: [],
  gold: 99,
  relics: [getStarterRelic()],
  powerCards: []
});

const createInitialGameState = (): GameState => {
  const deck = createInitialDeck();
  return {
    player: createInitialPlayer(),
    enemies: [],
    hand: [],
    drawPile: [...deck],
    discardPile: [],
    exhaustPile: [],
    currentTurn: TurnPhase.PLAYER_TURN,
    gamePhase: GamePhase.TITLE,
    map: generateMap()
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialGameState(),
  firstAttackThisCombat: true,
  selectedCard: null,
  showCardRemovalModal: false,
  showCardUpgradeModal: false,
  debugMode: false,
  currentFloor: 1,
  hasSavedGame: false,

  startNewRun: () => {
    set((state) => ({
      ...createInitialGameState(),
      firstAttackThisCombat: true,
      selectedCard: null,
      showCardRemovalModal: false,
      showCardUpgradeModal: false,
      debugMode: state.debugMode // Preserve debug mode
    }));
  },

  selectNode: (nodeId: string) => {
    const state = get();
    if (!state.map) return;

    const node = state.map.nodes.find(n => n.id === nodeId);
    if (!node || !node.available || node.completed) return;

    set((state) => {
      const updatedMap = completeNode(state.map!, nodeId);
      
      switch (node.type) {
        case 'combat':
          return {
            ...state,
            gamePhase: GamePhase.COMBAT,
            enemies: getRandomEnemyEncounter(),
            map: updatedMap,
            hand: [],
            drawPile: [...state.drawPile],
            discardPile: [],
            exhaustPile: [],
            currentTurn: TurnPhase.PLAYER_TURN,
            firstAttackThisCombat: true,
            player: {
              ...state.player,
              energy: state.player.maxEnergy,
              block: 0
            }
          };
          
        case 'boss':
          const bossEnemy = getBossForFloor(node.y);
          return {
            ...state,
            gamePhase: GamePhase.COMBAT,
            enemies: [bossEnemy],
            map: updatedMap,
            hand: [],
            drawPile: [...state.drawPile],
            discardPile: [],
            exhaustPile: [],
            currentTurn: TurnPhase.PLAYER_TURN,
            firstAttackThisCombat: true,
            player: {
              ...state.player,
              energy: state.player.maxEnergy,
              block: 0
            }
          };
          
        case 'elite':
          const eliteEnemies = getRandomEnemyEncounter().map((e: Enemy) => ({ 
            ...e, 
            isElite: true, 
            health: Math.floor(e.health * 1.5), 
            maxHealth: Math.floor(e.maxHealth * 1.5) 
          }));
          return {
            ...state,
            gamePhase: GamePhase.COMBAT,
            enemies: eliteEnemies,
            map: updatedMap,
            hand: [],
            drawPile: [...state.drawPile],
            discardPile: [],
            exhaustPile: [],
            currentTurn: TurnPhase.PLAYER_TURN,
            firstAttackThisCombat: true,
            player: {
              ...state.player,
              energy: state.player.maxEnergy,
              block: 0
            }
          };
          
        case 'event':
          return {
            ...state,
            gamePhase: GamePhase.EVENT,
            currentEvent: getRandomEvent(),
            map: updatedMap
          };
          
        case 'rest':
          return {
            ...state,
            gamePhase: GamePhase.REST,
            map: updatedMap
          };
          
        case 'treasure':
          // Give player a random relic
          const treasureRelic = getAllRelics()
            .filter((r: Relic) => r.rarity === 'common' || r.rarity === 'uncommon')
            [Math.floor(Math.random() * getAllRelics().filter((r: Relic) => r.rarity === 'common' || r.rarity === 'uncommon').length)];
          
          return {
            ...state,
            gamePhase: GamePhase.MAP,
            map: updatedMap,
            player: {
              ...state.player,
              relics: [...state.player.relics, treasureRelic]
            }
          };
          
        case 'shop':
          const shopCards = getAllCards()
            .filter(() => Math.random() < 0.3)
            .slice(0, 5)
            .map(card => ({
              card,
              cost: 50 + (card.rarity === 'uncommon' ? 25 : card.rarity === 'rare' ? 50 : 0),
              purchased: false
            }));

          const shopRelics = getAllRelics()
            .filter((r: Relic) => r.rarity !== 'starter' && Math.random() < 0.2)
            .slice(0, 2)
            .map((relic: Relic) => ({
              relic,
              cost: 150 + (relic.rarity === 'uncommon' ? 50 : relic.rarity === 'rare' ? 100 : relic.rarity === 'boss' ? 200 : 0),
              purchased: false
            }));
            
          return {
            ...state,
            gamePhase: GamePhase.SHOP,
            currentShop: {
              cards: shopCards,
              relics: shopRelics,
              removeCardCost: 75
            },
            map: updatedMap
          };
          
        default:
          return {
            ...state,
            map: updatedMap
          };
      }
    });

    // Start combat if it's a combat node
    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
      setTimeout(() => {
        // Apply combat start relic effects
        const state = get();
        const relicResult = processRelicEffects(RelicTrigger.COMBAT_START, state.player, state.enemies);
        
        set((currentState) => ({
          ...currentState,
          player: relicResult.player,
          enemies: relicResult.enemies
        }));
        
        get().drawCards(5);
      }, 100);
    }
  },

  selectCardReward: (cardId: string) => {
    set((state) => {
      const card = state.combatReward?.cardRewards.find(c => c.id === cardId);
      if (!card) return state;

      // Combine ALL cards back into the draw pile, but filter out cards created during combat
      const allCards = [...state.drawPile, ...state.discardPile, ...state.exhaustPile, ...state.hand]
        .filter(c => !c.id.includes('_copy_')); // Remove cards created during combat
      
      return {
        ...state,
        drawPile: [...allCards, { ...card, id: `${card.baseId}_${Date.now()}` }],
        discardPile: [],
        exhaustPile: [],
        hand: [],
        gamePhase: GamePhase.MAP,
        combatReward: undefined,
        currentTurn: TurnPhase.PLAYER_TURN,
        selectedCard: null
      };
    });
  },

  skipCardReward: () => {
    set((state) => {
      // Combine ALL cards back into the draw pile, but filter out cards created during combat
      const allCards = [...state.drawPile, ...state.discardPile, ...state.exhaustPile, ...state.hand]
        .filter(c => !c.id.includes('_copy_')); // Remove cards created during combat
      
      return {
        ...state,
        drawPile: allCards,
        discardPile: [],
        exhaustPile: [],
        hand: [],
        gamePhase: GamePhase.MAP,
        combatReward: undefined,
        currentTurn: TurnPhase.PLAYER_TURN,
        selectedCard: null
      };
    });
  },

  selectEventChoice: (choiceId: string) => {
    const state = get();
    if (!state.currentEvent) return;

    const choice = state.currentEvent.choices.find(c => c.id === choiceId);
    if (!choice) return;

    set((currentState) => {
      let newState = { ...currentState };
      
      // Apply all consequences
      choice.consequences.forEach(consequence => {
        newState = processEventConsequence(consequence, newState);
      });

      return {
        ...newState,
        gamePhase: GamePhase.MAP,
        currentEvent: undefined,
        selectedCard: null
      };
    });
  },

  returnToMap: () => {
    set((state) => {
      // Combine ALL cards back into the draw pile, but filter out cards created during combat
      const allCards = [...state.drawPile, ...state.discardPile, ...state.exhaustPile, ...state.hand]
        .filter(c => !c.id.includes('_copy_')); // Remove cards created during combat
      
      return {
        ...state,
        gamePhase: GamePhase.MAP,
        currentEvent: undefined,
        currentShop: undefined,
        combatReward: undefined,
        drawPile: allCards,
        discardPile: [],
        exhaustPile: [],
        hand: [],
        currentTurn: TurnPhase.PLAYER_TURN,
        enemies: [],
        selectedCard: null
      };
    });
  },

  playCard: (cardId: string, targetId?: string) => {
    const state = get();
    const card = state.hand.find(c => c.id === cardId);
    
    if (!card || state.currentTurn !== TurnPhase.PLAYER_TURN) return;
    
    // Calculate energy cost
    let energyCost = typeof card.cost === 'number' ? card.cost : 0;
    
    // For X-cost cards like whirlwind, consume ALL energy
    if (card.cost === 'X') {
      energyCost = state.player.energy; // Consume all available energy
    }
    
    // Check if player has enough energy (X-cost cards can be played with 0 energy)
    if (card.cost !== 'X' && state.player.energy < energyCost) return;

    set((state) => {
      const newHand = state.hand.filter(c => c.id !== cardId);
      const newDiscardPile = [...state.discardPile, card];
      
      // Store original energy for X-cost cards before any effects are applied
      const originalEnergy = state.player.energy;
      
      // Calculate whirlwind hits BEFORE consuming energy
      let whirlwindHits = 1;
      if (card.baseId === 'whirlwind') {
        whirlwindHits = originalEnergy; // Number of hits equals original energy
      }
      
      // Consume energy (for X-cost cards, this will be ALL energy)
      let newPlayer = { ...state.player, energy: state.player.energy - energyCost };
      let newEnemies = [...state.enemies];

      // Check if this is an attack card for Akabeko effect
      const isAttackCard = card.type === 'attack';
      const isFirstAttack = state.firstAttackThisCombat && isAttackCard;
      
      // Apply card effects using the modular system
      if (card.effects) {
        for (const effect of card.effects) {
          switch (effect.type) {
            case EffectType.DAMAGE:
              if (effect.target === TargetType.ALL_ENEMIES) {
                newEnemies = newEnemies.map(enemy => {
                  const finalDamage = calculateDamage(effect.value, newPlayer, enemy, isFirstAttack);
                  const damageAfterBlock = Math.max(0, finalDamage - enemy.block);
                  const actualDamageDealt = Math.min(damageAfterBlock, enemy.health);
                  
                  // Debug logging
                  damageDebugger.logDamageCalculation(
                    card,
                    newPlayer,
                    enemy,
                    effect.value,
                    finalDamage,
                    actualDamageDealt,
                    isFirstAttack,
                    'DAMAGE_ALL_ENEMIES'
                  );
                  
                  return {
                    ...enemy,
                    health: enemy.health - damageAfterBlock,
                    block: Math.max(0, enemy.block - finalDamage)
                  };
                });
              } else if (effect.target === TargetType.ENEMY && targetId) {
                const enemyIndex = newEnemies.findIndex(e => e.id === targetId);
                if (enemyIndex !== -1) {
                  const finalDamage = calculateDamage(effect.value, newPlayer, newEnemies[enemyIndex], isFirstAttack);
                  const damageAfterBlock = Math.max(0, finalDamage - newEnemies[enemyIndex].block);
                  const actualDamageDealt = Math.min(damageAfterBlock, newEnemies[enemyIndex].health);
                  
                  // Debug logging
                  damageDebugger.logDamageCalculation(
                    card,
                    newPlayer,
                    newEnemies[enemyIndex],
                    effect.value,
                    finalDamage,
                    actualDamageDealt,
                    isFirstAttack,
                    'DAMAGE_SINGLE_ENEMY'
                  );
                  
                  newEnemies[enemyIndex] = {
                    ...newEnemies[enemyIndex],
                    health: newEnemies[enemyIndex].health - damageAfterBlock,
                    block: Math.max(0, newEnemies[enemyIndex].block - finalDamage)
                  };
                }
              }
              break;

            case EffectType.DAMAGE_MULTIPLIER_BLOCK:
              if (effect.target === TargetType.ENEMY && targetId) {
                const enemyIndex = newEnemies.findIndex(e => e.id === targetId);
                if (enemyIndex !== -1) {
                  const blockDamage = newPlayer.block * (effect.multiplier || 1);
                  const finalDamage = calculateDamage(blockDamage, newPlayer, newEnemies[enemyIndex], isFirstAttack);
                  const damageAfterBlock = Math.max(0, finalDamage - newEnemies[enemyIndex].block);
                  const actualDamageDealt = Math.min(damageAfterBlock, newEnemies[enemyIndex].health);
                  
                  // Debug logging
                  damageDebugger.logDamageCalculation(
                    card,
                    newPlayer,
                    newEnemies[enemyIndex],
                    blockDamage,
                    finalDamage,
                    actualDamageDealt,
                    isFirstAttack,
                    'DAMAGE_MULTIPLIER_BLOCK'
                  );
                  
                  newEnemies[enemyIndex] = {
                    ...newEnemies[enemyIndex],
                    health: newEnemies[enemyIndex].health - damageAfterBlock,
                    block: Math.max(0, newEnemies[enemyIndex].block - finalDamage)
                  };
                }
              }
              break;

            case EffectType.DAMAGE_MULTIPLIER_ENERGY:
              if (effect.target === TargetType.ALL_ENEMIES) {
                // Apply damage X times where X = energy spent (use original energy before consumption)
                // Only deal damage if energy was actually spent
                if (whirlwindHits > 0) {
                  const damageResults: { target: Enemy; damageDealt: number }[] = [];
                  
                  for (let i = 0; i < whirlwindHits; i++) {
                    newEnemies = newEnemies.map(enemy => {
                      const finalDamage = calculateDamage(effect.value, state.player, enemy, isFirstAttack && i === 0);
                      const damageAfterBlock = Math.max(0, finalDamage - enemy.block);
                      const actualDamageDealt = Math.min(damageAfterBlock, enemy.health);
                      
                      // Track damage for debugging
                      const existingResult = damageResults.find(r => r.target.id === enemy.id);
                      if (existingResult) {
                        existingResult.damageDealt += actualDamageDealt;
                      } else {
                        damageResults.push({ target: enemy, damageDealt: actualDamageDealt });
                      }
                      
                      return {
                        ...enemy,
                        health: enemy.health - damageAfterBlock,
                        block: Math.max(0, enemy.block - finalDamage)
                      };
                    });
                  }
                  
                  // Debug logging for energy-based damage
                  damageDebugger.logEnergyBasedDamage(
                    card,
                    originalEnergy,
                    whirlwindHits,
                    effect.value,
                    whirlwindHits,
                    damageResults
                  );
                }
              }
              break;

            case EffectType.BLOCK:
              if (effect.target === TargetType.SELF) {
                const finalBlock = calculateBlock(effect.value, newPlayer);
                newPlayer.block += finalBlock;
              }
              break;

            case EffectType.APPLY_STATUS:
              if (effect.statusType) {
                if (effect.target === TargetType.SELF) {
                  newPlayer = applyStatusEffect(newPlayer, effect.statusType, effect.value) as Player;
                } else if (effect.target === TargetType.ENEMY && targetId) {
                  const enemyIndex = newEnemies.findIndex(e => e.id === targetId);
                  if (enemyIndex !== -1) {
                    newEnemies[enemyIndex] = applyStatusEffect(
                      newEnemies[enemyIndex], 
                      effect.statusType, 
                      effect.value
                    ) as Enemy;
                  }
                } else if (effect.target === TargetType.ALL_ENEMIES) {
                  newEnemies = newEnemies.map(enemy => 
                    applyStatusEffect(enemy, effect.statusType!, effect.value) as Enemy
                  );
                }
              }
              break;

            case EffectType.DRAW_CARDS:
              if (effect.target === TargetType.SELF) {
                setTimeout(() => get().drawCards(effect.value), 0);
              }
              break;

            case EffectType.HEAL:
              if (effect.target === TargetType.SELF) {
                newPlayer.health = Math.min(newPlayer.maxHealth, newPlayer.health + effect.value);
              }
              break;

            case EffectType.GAIN_ENERGY:
              if (effect.target === TargetType.SELF) {
                newPlayer.energy = Math.min(newPlayer.maxEnergy + 3, newPlayer.energy + effect.value);
              }
              break;

            case EffectType.LOSE_ENERGY:
              if (effect.target === TargetType.SELF) {
                newPlayer.energy = Math.max(0, newPlayer.energy - effect.value);
              }
              break;

            case EffectType.ADD_CARD_TO_DISCARD:
              if (effect.target === TargetType.SELF) {
                // Add a copy of the current card to the discard pile
                const cardCopy = { ...card, id: `${card.baseId}_copy_${Date.now()}` };
                newDiscardPile.push(cardCopy);
              }
              break;

            case EffectType.UPGRADE_CARD:
              if (effect.target === TargetType.SELF) {
                // Upgrade a random card in hand (in a real implementation, player would choose)
                const upgradableCards = newHand.filter(c => !c.upgraded);
                if (upgradableCards.length > 0) {
                  const randomIndex = Math.floor(Math.random() * upgradableCards.length);
                  const cardToUpgrade = upgradableCards[randomIndex];
                  const handIndex = newHand.findIndex(c => c.id === cardToUpgrade.id);
                  
                  if (handIndex !== -1) {
                    newHand[handIndex] = upgradeCard(cardToUpgrade);
                  }
                }
              }
              break;
          }
        }
      }

      // Legacy support: Handle cards with direct damage property (only if no damage effects)
      if (card.damage && card.damage > 0 && (!card.effects || !card.effects.some(effect => 
        effect.type === EffectType.DAMAGE || 
        effect.type === EffectType.DAMAGE_MULTIPLIER_BLOCK || 
        effect.type === EffectType.DAMAGE_MULTIPLIER_ENERGY
      ))) {
        if (targetId) {
          const enemyIndex = newEnemies.findIndex(e => e.id === targetId);
          if (enemyIndex !== -1) {
            const finalDamage = calculateDamage(card.damage, newPlayer, newEnemies[enemyIndex], isFirstAttack);
            const damageAfterBlock = Math.max(0, finalDamage - newEnemies[enemyIndex].block);
            const actualDamageDealt = Math.min(damageAfterBlock, newEnemies[enemyIndex].health);
            
            // Debug logging for legacy damage
            damageDebugger.logDamageCalculation(
              card,
              newPlayer,
              newEnemies[enemyIndex],
              card.damage,
              finalDamage,
              actualDamageDealt,
              isFirstAttack,
              'LEGACY_DAMAGE'
            );
            
            newEnemies[enemyIndex] = {
              ...newEnemies[enemyIndex],
              health: newEnemies[enemyIndex].health - damageAfterBlock,
              block: Math.max(0, newEnemies[enemyIndex].block - finalDamage)
            };
          }
        }
      }

      // Legacy support: Handle cards with direct block property (only if no block effects)
      if (card.block && card.block > 0 && (!card.effects || !card.effects.some(effect => 
        effect.type === EffectType.BLOCK
      ))) {
        const finalBlock = calculateBlock(card.block, newPlayer);
        newPlayer.block += finalBlock;
      }

      // Handle power cards
      if (card.type === CardType.POWER) {
        const powerCardDef = getPowerCardDefinition(card.id);
        if (powerCardDef) {
          // Check if this power card is already active
          const existingPowerCard = newPlayer.powerCards.find(pc => pc.id === powerCardDef.id);
          if (!existingPowerCard) {
            // Add the power card to active power cards
            newPlayer.powerCards = [...newPlayer.powerCards, powerCardDef];
          }
          
          // Apply immediate effects (like Inflame's immediate strength gain)
          const powerResult = processPowerCardEffects(PowerTrigger.COMBAT_START, newPlayer, newEnemies);
          newPlayer = powerResult.player;
          newEnemies = powerResult.enemies;
        }
      }

      // Remove dead enemies
      newEnemies = newEnemies.filter(e => e.health > 0);

      // Check for combat end
      if (newEnemies.length === 0) {
        const rewardGold = 10 + Math.floor(Math.random() * 20);
        const rewardCards = getAllCards()
          .filter(() => Math.random() < 0.4)
          .slice(0, 3);

        // Clear temporary status effects at end of combat
        const clearedPlayer = {
          ...newPlayer,
          gold: newPlayer.gold + rewardGold,
          statusEffects: newPlayer.statusEffects.filter(effect => 
            effect.type !== StatusType.WEAK && 
            effect.type !== StatusType.VULNERABLE && 
            effect.type !== StatusType.STRENGTH
          )
        };

        return {
          ...state,
          hand: newHand,
          discardPile: newDiscardPile,
          player: clearedPlayer,
          enemies: newEnemies,
          currentTurn: TurnPhase.COMBAT_END,
          gamePhase: GamePhase.CARD_REWARD,
          combatReward: {
            gold: rewardGold,
            cardRewards: rewardCards
          },
          selectedCard: null
        };
      }

      return {
        ...state,
        hand: newHand,
        discardPile: newDiscardPile,
        player: newPlayer,
        enemies: newEnemies,
        firstAttackThisCombat: isFirstAttack ? false : state.firstAttackThisCombat,
        selectedCard: null
      };
    });
  },

  processEnemyTurn: () => {
    set((state) => {
      let newPlayer = { ...state.player };
      let newEnemies = [...state.enemies];

      // Process status effects on enemies
      newEnemies = newEnemies.map(enemy => processStatusEffects(enemy) as Enemy);
      
      // Remove dead enemies (health <= 0)
      newEnemies = newEnemies.filter(enemy => enemy.health > 0);
      
      // Process status effects on player
      newPlayer = processStatusEffects(newPlayer) as Player;

      // Reset enemy block at start of their turn
      newEnemies = newEnemies.map(enemy => ({
        ...enemy,
        block: 0
      }));

      // Reset player block at start of player turn
      newPlayer = {
        ...newPlayer,
        energy: newPlayer.maxEnergy,
        block: 0
      };
      
      // Process power card turn start effects (like Demon Form)
      const powerResult = processPowerCardEffects(PowerTrigger.TURN_START, newPlayer, newEnemies);
      newPlayer = powerResult.player;
      newEnemies = powerResult.enemies;
      
      // Process relic turn start effects (like Energy Core)
      const relicResult = processRelicEffects(RelicTrigger.TURN_START, newPlayer, newEnemies);
      newPlayer = relicResult.player;
      newEnemies = relicResult.enemies;
      
      // Enemy block is NOT reset here - it persists until start of their next turn

      // Each enemy performs their intended action
      for (let i = 0; i < newEnemies.length; i++) {
        const enemy = newEnemies[i];
        
        switch (enemy.intent.type) {
          case 'attack':
            if (enemy.intent.value) {
              const damage = calculateDamage(enemy.intent.value, enemy, newPlayer);
              const damageAfterBlock = Math.max(0, damage - newPlayer.block);
              const actualDamageDealt = Math.min(damageAfterBlock, newPlayer.health);
              
              // Debug logging for enemy damage
              debugConsole.log('🔥 Enemy Attack Debug:', {
                enemy: enemy.name,
                baseDamage: enemy.intent.value,
                calculatedDamage: damage,
                playerBlock: newPlayer.block,
                damageAfterBlock,
                actualDamageDealt,
                playerHealthBefore: newPlayer.health,
                playerHealthAfter: newPlayer.health - damageAfterBlock
              });
              
              // Apply damage to player
              newPlayer = {
                ...newPlayer,
                health: newPlayer.health - damageAfterBlock,
                block: Math.max(0, newPlayer.block - damage)
              };
              
              // Check for game over
              if (newPlayer.health <= 0) {
                return {
                  ...state,
                  player: { ...newPlayer, health: 0 },
                  gamePhase: GamePhase.GAME_OVER,
                  selectedCard: null
                };
              }
              
              // Process damage taken relic effects if player took damage
              if (damageAfterBlock > 0) {
                const context: any = { damage: damageAfterBlock };
                const relicResult = processRelicEffects(RelicTrigger.DAMAGE_TAKEN, newPlayer, newEnemies, context);
                newPlayer = relicResult.player;
                newEnemies = relicResult.enemies;
                
                // Remove dead enemies after relic effects (e.g., Bronze Scales)
                newEnemies = newEnemies.filter(enemy => enemy.health > 0);
                
                // Handle Centennial Puzzle card drawing
                if (context.shouldDrawCards) {
                  setTimeout(() => get().drawCards(context.shouldDrawCards), 100);
                }
              }
            }
            break;
          
          case 'defend':
            newEnemies[i] = {
              ...enemy,
              block: enemy.block + (enemy.intent.value || 5)
            };
            break;
          
          case 'buff':
            newEnemies[i] = applyStatusEffect(enemy, StatusType.STRENGTH, 1) as Enemy;
            break;
          
          case 'debuff':
            newPlayer = applyStatusEffect(newPlayer, StatusType.WEAK, 2) as Player;
            break;
        }

        // Generate new intent for next turn
        const intents = [
          { type: IntentType.ATTACK, value: Math.floor(Math.random() * 8) + 5 },
          { type: IntentType.ATTACK, value: Math.floor(Math.random() * 6) + 8 },
          { type: IntentType.DEFEND, value: Math.floor(Math.random() * 5) + 5 },
          { type: IntentType.BUFF },
          { type: IntentType.DEBUFF }
        ];
        
        const newIntent = intents[Math.floor(Math.random() * intents.length)];
        newEnemies[i] = {
          ...newEnemies[i],
          intent: newIntent
        };
      }

      // Check if combat should end (all enemies dead)
      const combatEnded = newEnemies.length === 0;

      return {
        ...state,
        player: newPlayer,
        enemies: newEnemies,
        currentTurn: combatEnded ? TurnPhase.COMBAT_END : TurnPhase.PLAYER_TURN,
        selectedCard: null
      };
    });

    // Draw new hand for player turn
    get().drawCards(5);
  },

  endTurn: () => {
    const state = get();
    
    if (state.currentTurn === TurnPhase.PLAYER_TURN) {
      set((currentState) => {
        let newPlayer = { ...currentState.player };
        let newEnemies = [...currentState.enemies];
        
        // Process power card turn end effects (like Metallicize)
        const powerResult = processPowerCardEffects(PowerTrigger.TURN_END, newPlayer, newEnemies);
        newPlayer = powerResult.player;
        newEnemies = powerResult.enemies;
        
        // Discard remaining hand
        const newDiscardPile = [...currentState.discardPile, ...currentState.hand];
        
        return {
          ...currentState,
          hand: [],
          discardPile: newDiscardPile,
          currentTurn: TurnPhase.ENEMY_TURN,
          player: newPlayer,
          enemies: newEnemies,
          selectedCard: null
          // Block is NOT reset here - it resets at start of next player turn
        };
      });

      // Process enemy turn
      setTimeout(() => {
        get().processEnemyTurn();
      }, 1000); // Add delay for better UX
    }
  },

  startCombat: () => {
    // Preserve current player state and deck, but reset combat-specific state
    set((state) => ({
      ...state,
      enemies: [],
      hand: [],
      // Keep the current deck composition (drawPile + discardPile + exhaustPile)
      drawPile: [...state.drawPile, ...state.discardPile, ...state.exhaustPile],
      discardPile: [],
      exhaustPile: [],
      currentTurn: TurnPhase.PLAYER_TURN,
      gamePhase: GamePhase.COMBAT,
      combatReward: undefined,
      // Reset player's combat state but keep progression
      player: {
        ...state.player,
        block: 0,
        energy: state.player.maxEnergy
      }
    }));
    
    get().drawCards(5);
  },

  drawCards: (count: number) => {
    set((state) => {
      let newDrawPile = [...state.drawPile];
      let newDiscardPile = [...state.discardPile];
      let newHand = [...state.hand];

      for (let i = 0; i < count; i++) {
        if (newDrawPile.length === 0 && newDiscardPile.length > 0) {
          // Shuffle discard pile into draw pile
          newDrawPile = [...newDiscardPile].sort(() => Math.random() - 0.5);
          newDiscardPile = [];
        }

        if (newDrawPile.length > 0) {
          const drawnCard = newDrawPile.pop()!;
          newHand.push(drawnCard);
        }
      }

      return {
        ...state,
        hand: newHand,
        drawPile: newDrawPile,
        discardPile: newDiscardPile,
        selectedCard: null
      };
    });
  },

  shuffleDiscardIntoDraw: () => {
    set((state) => ({
      ...state,
      drawPile: [...state.drawPile, ...state.discardPile].sort(() => Math.random() - 0.5),
      discardPile: [],
      selectedCard: null
    }));
  },

  purchaseShopCard: (index: number) => {
    set((state) => {
      if (!state.currentShop || index >= state.currentShop.cards.length) return state;
      
      const shopCard = state.currentShop.cards[index];
      if (shopCard.purchased || state.player.gold < shopCard.cost) return state;

      const newShop = { ...state.currentShop };
      newShop.cards = [...newShop.cards];
      newShop.cards[index] = { ...shopCard, purchased: true };

      return {
        ...state,
        player: {
          ...state.player,
          gold: state.player.gold - shopCard.cost
        },
        drawPile: [...state.drawPile, { ...shopCard.card, id: `${shopCard.card.baseId}_${Date.now()}` }],
        currentShop: newShop,
        selectedCard: null
      };
    });
  },

  purchaseShopRelic: (index: number) => {
    set((state) => {
      if (!state.currentShop || index >= state.currentShop.relics.length) return state;
      
      const shopRelic = state.currentShop.relics[index];
      if (shopRelic.purchased || state.player.gold < shopRelic.cost) return state;

      const newShop = { ...state.currentShop };
      newShop.relics = [...newShop.relics];
      newShop.relics[index] = { ...shopRelic, purchased: true };

      return {
        ...state,
        player: {
          ...state.player,
          gold: state.player.gold - shopRelic.cost,
          relics: [...state.player.relics, shopRelic.relic]
        },
        currentShop: newShop,
        selectedCard: null
      };
    });
  },

  removeCardFromDeck: (cardId?: string) => {
    set((state) => {
      if (!state.currentShop || state.player.gold < state.currentShop.removeCardCost) return state;
      
      if (!cardId) {
        // If no cardId provided, open the card removal modal
        return {
          ...state,
          showCardRemovalModal: true,
          selectedCard: null
        };
      }
      
      // Remove the specific card
      const allCards = [...state.drawPile, ...state.discardPile];
      const cardToRemove = allCards.find(c => c.id === cardId);
      
      if (!cardToRemove) return state;

      let newDrawPile = [...state.drawPile];
      let newDiscardPile = [...state.discardPile];

      // Remove the card from the appropriate pile
      const drawIndex = newDrawPile.findIndex(c => c.id === cardId);
      if (drawIndex !== -1) {
        newDrawPile.splice(drawIndex, 1);
      } else {
        const discardIndex = newDiscardPile.findIndex(c => c.id === cardId);
        if (discardIndex !== -1) {
          newDiscardPile.splice(discardIndex, 1);
        }
      }

      return {
        ...state,
        player: {
          ...state.player,
          gold: state.player.gold - state.currentShop.removeCardCost
        },
        drawPile: newDrawPile,
        discardPile: newDiscardPile,
        showCardRemovalModal: false,
        selectedCard: null
      };
    });
  },

  setSelectedCard: (card: Card | null) => {
    set((state) => ({
      ...state,
      selectedCard: card
    }));
  },

  openCardRemovalModal: () => {
    set((state) => ({
      ...state,
      showCardRemovalModal: true,
      selectedCard: null
    }));
  },

  closeCardRemovalModal: () => {
    set((state) => ({
      ...state,
      showCardRemovalModal: false,
      selectedCard: null
    }));
  },

  toggleDebugMode: () => {
    set((state) => ({
      ...state,
      debugMode: !state.debugMode
    }));
  },

  restAndHeal: () => {
    set((state) => ({
      ...state,
      gamePhase: GamePhase.MAP,
      player: {
        ...state.player,
        health: Math.min(state.player.maxHealth, state.player.health + 30)
      },
      selectedCard: null
    }));
  },

  upgradeCardAtRest: (cardId?: string) => {
    set((state) => {
      if (!cardId) {
        // If no cardId provided, open the card upgrade modal
        return {
          ...state,
          showCardUpgradeModal: true,
          selectedCard: null
        };
      }
      
      // Upgrade the specific card
      const allCards = [...state.drawPile, ...state.discardPile];
      const cardToUpgrade = allCards.find(c => c.id === cardId);
      
      if (!cardToUpgrade || cardToUpgrade.upgraded) return state;

      let newDrawPile = [...state.drawPile];
      let newDiscardPile = [...state.discardPile];

      // Find and upgrade the card in the appropriate pile
      const drawIndex = newDrawPile.findIndex(c => c.id === cardId);
      if (drawIndex !== -1) {
        newDrawPile[drawIndex] = upgradeCard(cardToUpgrade);
      } else {
        const discardIndex = newDiscardPile.findIndex(c => c.id === cardId);
        if (discardIndex !== -1) {
          newDiscardPile[discardIndex] = upgradeCard(cardToUpgrade);
        }
      }

      return {
        ...state,
        drawPile: newDrawPile,
        discardPile: newDiscardPile,
        showCardUpgradeModal: false,
        gamePhase: GamePhase.MAP,
        selectedCard: null
      };
    });
  },

  openCardUpgradeModal: () => {
    set((state) => ({
      ...state,
      showCardUpgradeModal: true,
      selectedCard: null
    }));
  },

  closeCardUpgradeModal: () => {
    set((state) => ({
      ...state,
      showCardUpgradeModal: false,
      selectedCard: null
    }));
  },

  startNewGame: () => {
    set((state) => ({
      ...createInitialGameState(),
      firstAttackThisCombat: true,
      selectedCard: null,
      showCardRemovalModal: false,
      showCardUpgradeModal: false,
      debugMode: state.debugMode,
      currentFloor: 1,
      hasSavedGame: false,
      gamePhase: GamePhase.MAP
    }));
  },

  returnToTitle: () => {
    set((state) => ({
      ...state,
      gamePhase: GamePhase.TITLE,
      selectedCard: null
    }));
  },

  loadSavedGame: () => {
    // For now, just start a new game - in the future this could load from localStorage
    const state = get();
    if (state.hasSavedGame) {
      set((state) => ({
        ...state,
        gamePhase: GamePhase.MAP
      }));
    }
  }
})); 
