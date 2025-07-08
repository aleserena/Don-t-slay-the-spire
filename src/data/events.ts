import { Event, ConsequenceType, EventConsequence } from "../types/map";
import { RelicRarity, GameState } from "../types/game";
import { getAllRelics, getRandomRelic } from "./relics";
import { getAllCards } from "./cards";

export const getAllEvents = (): Event[] => {
  return [
    {
      id: "golden_idol",
      name: "Golden Idol",
      description:
        "You come across a golden idol sitting on a pedestal. It gleams with an otherworldly light.",
      choices: [
        {
          id: "take_idol",
          text: "Take the idol",
          consequences: [
            {
              type: ConsequenceType.GAIN_GOLD,
              value: 250,
              description: "You gain 250 gold, but...",
            },
            {
              type: ConsequenceType.LOSE_HEALTH,
              value: 25,
              description: "You lose 25 HP from a curse!",
            },
          ],
        },
        {
          id: "leave_idol",
          text: "Leave it alone",
          consequences: [
            {
              type: ConsequenceType.GAIN_HEALTH,
              value: 5,
              description: "You feel at peace. Heal 5 HP.",
            },
          ],
        },
      ],
    },
    {
      id: "mysterious_sphere",
      name: "Mysterious Sphere",
      description:
        "A strange, pulsing sphere hovers before you. You sense great power within.",
      choices: [
        {
          id: "touch_sphere",
          text: "Touch the sphere",
          consequences: [
            {
              type: ConsequenceType.GAIN_RELIC,
              relicId: "random_common",
              description: "You gain a random relic!",
            },
            {
              type: ConsequenceType.LOSE_HEALTH,
              value: 10,
              description: "The energy burns you for 10 HP.",
            },
          ],
        },
        {
          id: "ignore_sphere",
          text: "Walk away",
          consequences: [
            {
              type: ConsequenceType.GAIN_GOLD,
              value: 50,
              description: "You find some gold on the ground.",
            },
          ],
        },
      ],
    },
    {
      id: "old_beggar",
      name: "Old Beggar",
      description:
        "An old beggar approaches you, asking for help. He looks desperate.",
      choices: [
        {
          id: "give_gold",
          text: "Give him 75 gold",
          consequences: [
            {
              type: ConsequenceType.LOSE_GOLD,
              value: 75,
              description: "You lose 75 gold.",
            },
            {
              type: ConsequenceType.GAIN_RELIC,
              relicId: "random_uncommon",
              description: "He gives you a mysterious relic in return!",
            },
          ],
        },
        {
          id: "ignore_beggar",
          text: "Ignore him",
          consequences: [
            {
              type: ConsequenceType.GAIN_CARD,
              cardId: "random_curse",
              description: "You feel guilty. A curse is added to your deck.",
            },
          ],
        },
      ],
    },
    {
      id: "ancient_writing",
      name: "Ancient Writing",
      description:
        "You discover ancient writing on the wall. The text seems to shift and change as you read.",
      choices: [
        {
          id: "study_writing",
          text: "Study the writing carefully",
          consequences: [
            {
              type: ConsequenceType.UPGRADE_CARD,
              description: "You upgrade a random card in your deck!",
            },
          ],
        },
        {
          id: "quick_glance",
          text: "Take a quick glance",
          consequences: [
            {
              type: ConsequenceType.GAIN_GOLD,
              value: 100,
              description: "You find a hidden cache of 100 gold!",
            },
          ],
        },
      ],
    },
    {
      id: "fountain",
      name: "Fountain",
      description:
        "A pristine fountain bubbles with crystal clear water. You feel refreshed just looking at it.",
      choices: [
        {
          id: "drink_water",
          text: "Drink from the fountain",
          consequences: [
            {
              type: ConsequenceType.GAIN_HEALTH,
              value: 20,
              description: "You heal 20 HP!",
            },
          ],
        },
        {
          id: "wash_hands",
          text: "Just wash your hands",
          consequences: [
            {
              type: ConsequenceType.GAIN_HEALTH,
              value: 10,
              description: "You heal 10 HP.",
            },
            {
              type: ConsequenceType.GAIN_GOLD,
              value: 25,
              description: "You find a coin at the bottom!",
            },
          ],
        },
      ],
    },
    {
      id: "dead_adventurer",
      name: "Dead Adventurer",
      description:
        "You come across the remains of another adventurer. Their belongings are scattered around.",
      choices: [
        {
          id: "search_body",
          text: "Search the body",
          consequences: [
            {
              type: ConsequenceType.GAIN_GOLD,
              value: 150,
              description: "You find 150 gold.",
            },
            {
              type: ConsequenceType.GAIN_CARD,
              cardId: "random_attack",
              description: "You find a weapon and learn a new attack!",
            },
          ],
        },
        {
          id: "pay_respects",
          text: "Pay your respects and move on",
          consequences: [
            {
              type: ConsequenceType.GAIN_MAX_HEALTH,
              value: 5,
              description: "Your resolve strengthens. Gain 5 Max HP.",
            },
          ],
        },
      ],
    },
  ];
};

export const getRandomEvent = (): Event => {
  const events = getAllEvents();
  return events[Math.floor(Math.random() * events.length)];
};

export const processEventConsequence = (
  consequence: EventConsequence,
  gameState: GameState,
) => {
  switch (consequence.type) {
    case ConsequenceType.GAIN_GOLD:
      return {
        ...gameState,
        player: {
          ...gameState.player,
          gold: gameState.player.gold + (consequence.value || 0),
        },
      };

    case ConsequenceType.LOSE_GOLD:
      return {
        ...gameState,
        player: {
          ...gameState.player,
          gold: Math.max(0, gameState.player.gold - (consequence.value || 0)),
        },
      };

    case ConsequenceType.GAIN_HEALTH:
      return {
        ...gameState,
        player: {
          ...gameState.player,
          health: Math.min(
            gameState.player.maxHealth,
            gameState.player.health + (consequence.value || 0),
          ),
        },
      };

    case ConsequenceType.LOSE_HEALTH:
      return {
        ...gameState,
        player: {
          ...gameState.player,
          health: Math.max(
            0,
            gameState.player.health - (consequence.value || 0),
          ),
        },
      };

    case ConsequenceType.GAIN_MAX_HEALTH:
      return {
        ...gameState,
        player: {
          ...gameState.player,
          maxHealth: gameState.player.maxHealth + (consequence.value || 0),
          health: gameState.player.health + (consequence.value || 0),
        },
      };

    case ConsequenceType.GAIN_RELIC: {
      let relic;
      if (consequence.relicId === "random_common") {
        relic = getRandomRelic(RelicRarity.COMMON);
      } else if (consequence.relicId === "random_uncommon") {
        relic = getRandomRelic(RelicRarity.UNCOMMON);
      } else if (consequence.relicId === "random_rare") {
        relic = getRandomRelic(RelicRarity.RARE);
      } else {
        relic = getAllRelics().find((r) => r.id === consequence.relicId);
      }

      if (relic) {
        return {
          ...gameState,
          player: {
            ...gameState.player,
            relics: [...gameState.player.relics, relic],
          },
        };
      }
      return gameState;
    }

    case ConsequenceType.GAIN_CARD: {
      let card;
      if (consequence.cardId === "random_attack") {
        const attackCards = getAllCards().filter((c) => c.type === "attack");
        card = attackCards[Math.floor(Math.random() * attackCards.length)];
      } else if (consequence.cardId === "random_skill") {
        const skillCards = getAllCards().filter((c) => c.type === "skill");
        card = skillCards[Math.floor(Math.random() * skillCards.length)];
      } else {
        card = getAllCards().find((c) => c.id === consequence.cardId);
      }

      if (card) {
        return {
          ...gameState,
          drawPile: [
            ...gameState.drawPile,
            { ...card, id: `${card.baseId}_${Date.now()}` },
          ],
        };
      }
      return gameState;
    }

    default:
      return gameState;
  }
};
