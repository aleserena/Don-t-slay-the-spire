import { PowerCard } from "../types/game";
import { getAllCards } from "./cards";

/**
 * The power a power card leaves in play, derived from the card data: the
 * card's effects that have a trigger. Returns `null` for an unknown card or
 * one that is not a power.
 */
export const getPowerCardDefinition = (cardId: string): PowerCard | null => {
  const card = getAllCards().find((c) => c.baseId === cardId);
  if (!card || card.type !== "power") return null;

  return {
    id: card.baseId,
    name: card.name,
    description: card.description,
    effects: (card.effects ?? []).flatMap((effect) =>
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
  };
};
