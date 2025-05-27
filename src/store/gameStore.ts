import { create } from 'zustand';
import { GameState, Player, Enemy, TurnPhase, EffectType, TargetType, StatusType, IntentType, GamePhase, Relic, RelicTrigger } from '../types/game';
import { createInitialDeck, getAllCards } from '../data/cards';
import { getRandomEnemyEncounter } from '../data/enemies';
import { getBossForFloor } from '../data/bosses';
import { getStarterRelic, getAllRelics } from '../data/relics';
import { generateMap, completeNode } from '../utils/mapGeneration';
import { getRandomEvent, processEventConsequence } from '../data/events';
import { processRelicEffects } from '../utils/relicEffects';
import { 
  applyStatusEffect, 
  processStatusEffects, 
  calculateDamage, 
  calculateBlock 
} from '../utils/statusEffects';

interface GameStore extends GameState {
  // Actions
  playCard: (cardId: string, targetId?: string) => void;
  endTurn: () => void;
  startCombat: () => void;
  drawCards: (count: number) => void;
  shuffleDiscardIntoDraw: () => void;
  processEnemyTurn: () => void;
  
  // Progression actions
  startNewRun: () => void;
  selectNode: (nodeId: string) => void;
  selectCardReward: (cardId: string) => void;
  skipCardReward: () => void;
  selectEventChoice: (choiceId: string) => void;
  returnToMap: () => void;
  
  // Shop actions
  purchaseShopCard: (index: number) => void;
  purchaseShopRelic: (index: number) => void;
  removeCardFromDeck: () => void;
}

const createInitialPlayer = (): Player => ({
  health: 80,
  maxHealth: 80,
  block: 0,
  energy: 3,
  maxEnergy: 3,
  statusEffects: [],
  gold: 99,
  relics: [getStarterRelic()]
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
    gamePhase: GamePhase.MAP,
    map: generateMap()
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialGameState(),

  startNewRun: () => {
    set(createInitialGameState());
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
            map: updatedMap,
            player: {
              ...state.player,
              health: Math.min(state.player.maxHealth, state.player.health + 30)
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

      // Combine ALL cards back into the draw pile (including hand cards)
      const allCards = [...state.drawPile, ...state.discardPile, ...state.exhaustPile, ...state.hand];
      
      return {
        ...state,
        drawPile: [...allCards, { ...card, id: `${card.id}_${Date.now()}` }],
        discardPile: [],
        exhaustPile: [],
        hand: [],
        gamePhase: GamePhase.MAP,
        combatReward: undefined,
        currentTurn: TurnPhase.PLAYER_TURN
      };
    });
  },

  skipCardReward: () => {
    set((state) => {
      // Combine ALL cards back into the draw pile (including hand cards)
      const allCards = [...state.drawPile, ...state.discardPile, ...state.exhaustPile, ...state.hand];
      
      return {
        ...state,
        drawPile: allCards,
        discardPile: [],
        exhaustPile: [],
        hand: [],
        gamePhase: GamePhase.MAP,
        combatReward: undefined,
        currentTurn: TurnPhase.PLAYER_TURN
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
        currentEvent: undefined
      };
    });
  },

  returnToMap: () => {
    set((state) => {
      // Combine ALL cards back into the draw pile when returning to map (including hand cards)
      const allCards = [...state.drawPile, ...state.discardPile, ...state.exhaustPile, ...state.hand];
      
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
        enemies: []
      };
    });
  },

  playCard: (cardId: string, targetId?: string) => {
    const state = get();
    const card = state.hand.find(c => c.id === cardId);
    
    if (!card || state.player.energy < card.cost || state.currentTurn !== TurnPhase.PLAYER_TURN) return;

    set((state) => {
      const newHand = state.hand.filter(c => c.id !== cardId);
      const newDiscardPile = [...state.discardPile, card];
      let newPlayer = { ...state.player, energy: state.player.energy - card.cost };
      let newEnemies = [...state.enemies];

      // Apply basic card effects
      if (card.damage && card.damage > 0) {
        if (targetId) {
          const enemyIndex = newEnemies.findIndex(e => e.id === targetId);
          if (enemyIndex !== -1) {
            const finalDamage = calculateDamage(card.damage, newPlayer, newEnemies[enemyIndex]);
            const damageAfterBlock = Math.max(0, finalDamage - newEnemies[enemyIndex].block);
            
            newEnemies[enemyIndex] = {
              ...newEnemies[enemyIndex],
              health: newEnemies[enemyIndex].health - damageAfterBlock,
              block: Math.max(0, newEnemies[enemyIndex].block - finalDamage)
            };
          }
        }
      }

      if (card.block && card.block > 0) {
        const finalBlock = calculateBlock(card.block, newPlayer);
        newPlayer.block += finalBlock;
      }

      // Apply advanced card effects
      if (card.effects) {
        for (const effect of card.effects) {
          switch (effect.type) {
            case EffectType.DAMAGE:
              if (effect.target === TargetType.ALL_ENEMIES) {
                newEnemies = newEnemies.map(enemy => {
                  const finalDamage = calculateDamage(effect.value, newPlayer, enemy);
                  const damageAfterBlock = Math.max(0, finalDamage - enemy.block);
                  return {
                    ...enemy,
                    health: enemy.health - damageAfterBlock,
                    block: Math.max(0, enemy.block - finalDamage)
                  };
                });
              } else if (effect.target === TargetType.ENEMY && targetId) {
                const enemyIndex = newEnemies.findIndex(e => e.id === targetId);
                if (enemyIndex !== -1) {
                  const finalDamage = calculateDamage(effect.value, newPlayer, newEnemies[enemyIndex]);
                  const damageAfterBlock = Math.max(0, finalDamage - newEnemies[enemyIndex].block);
                  
                  newEnemies[enemyIndex] = {
                    ...newEnemies[enemyIndex],
                    health: newEnemies[enemyIndex].health - damageAfterBlock,
                    block: Math.max(0, newEnemies[enemyIndex].block - finalDamage)
                  };
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

            case EffectType.ADD_CARD_TO_DISCARD:
              if (effect.target === TargetType.SELF) {
                // Add a copy of the current card to the discard pile
                const cardCopy = { ...card, id: `${card.id}_copy_${Date.now()}` };
                newDiscardPile.push(cardCopy);
              }
              break;
          }
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

        return {
          ...state,
          hand: newHand,
          discardPile: newDiscardPile,
          player: { ...newPlayer, gold: newPlayer.gold + rewardGold },
          enemies: newEnemies,
          currentTurn: TurnPhase.COMBAT_END,
          gamePhase: GamePhase.CARD_REWARD,
          combatReward: {
            gold: rewardGold,
            cardRewards: rewardCards
          }
        };
      }

      return {
        ...state,
        hand: newHand,
        discardPile: newDiscardPile,
        player: newPlayer,
        enemies: newEnemies
      };
    });
  },

  processEnemyTurn: () => {
    set((state) => {
      let newPlayer = { ...state.player };
      let newEnemies = [...state.enemies];

      // Process status effects on enemies
      newEnemies = newEnemies.map(enemy => processStatusEffects(enemy) as Enemy);
      
      // Process status effects on player
      newPlayer = processStatusEffects(newPlayer) as Player;

      // Each enemy performs their intended action
      for (let i = 0; i < newEnemies.length; i++) {
        const enemy = newEnemies[i];
        
        switch (enemy.intent.type) {
          case 'attack':
            if (enemy.intent.value) {
              const damage = calculateDamage(enemy.intent.value, enemy, newPlayer);
              const damageAfterBlock = Math.max(0, damage - newPlayer.block);
              newPlayer = {
                ...newPlayer,
                health: newPlayer.health - damageAfterBlock,
                block: Math.max(0, newPlayer.block - damage)
              };
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

      // Restore energy and reset block for new player turn
      newPlayer = {
        ...newPlayer,
        energy: newPlayer.maxEnergy,
        block: 0
      };

      return {
        ...state,
        player: newPlayer,
        enemies: newEnemies,
        currentTurn: TurnPhase.PLAYER_TURN
      };
    });

    // Draw new hand for player turn
    get().drawCards(5);
  },

  endTurn: () => {
    const state = get();
    
    if (state.currentTurn === TurnPhase.PLAYER_TURN) {
      set((currentState) => {
        // Discard remaining hand
        const newDiscardPile = [...currentState.discardPile, ...currentState.hand];
        
        return {
          ...currentState,
          hand: [],
          discardPile: newDiscardPile,
          currentTurn: TurnPhase.ENEMY_TURN,
          player: { ...currentState.player, block: 0 } // Reset block at end of turn
        };
      });

      // Process enemy turn
      setTimeout(() => {
        get().processEnemyTurn();
      }, 1000); // Add delay for better UX
    }
  },

  startCombat: () => {
    const currentState = get();
    
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
        discardPile: newDiscardPile
      };
    });
  },

  shuffleDiscardIntoDraw: () => {
    set((state) => ({
      ...state,
      drawPile: [...state.drawPile, ...state.discardPile].sort(() => Math.random() - 0.5),
      discardPile: []
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
        drawPile: [...state.drawPile, { ...shopCard.card, id: `${shopCard.card.id}_${Date.now()}` }],
        currentShop: newShop
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
        currentShop: newShop
      };
    });
  },

  removeCardFromDeck: () => {
    set((state) => {
      if (!state.currentShop || state.player.gold < state.currentShop.removeCardCost) return state;
      
      // For now, remove a random card from the deck (in a real implementation, player would choose)
      const allCards = [...state.drawPile, ...state.discardPile];
      if (allCards.length === 0) return state;

      const randomIndex = Math.floor(Math.random() * allCards.length);
      const cardToRemove = allCards[randomIndex];

      let newDrawPile = [...state.drawPile];
      let newDiscardPile = [...state.discardPile];

      // Remove the card from the appropriate pile
      const drawIndex = newDrawPile.findIndex(c => c.id === cardToRemove.id);
      if (drawIndex !== -1) {
        newDrawPile.splice(drawIndex, 1);
      } else {
        const discardIndex = newDiscardPile.findIndex(c => c.id === cardToRemove.id);
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
        discardPile: newDiscardPile
      };
    });
  }
})); 