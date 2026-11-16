import { SHOP_REMOVE_CARD_COST_INCREASE } from "../../engine/constants";
import { createCardInstance, removeCard } from "../../engine/deck";
import { ShopActions, SliceCreator } from "../types";

/** Returns a copy of the list with the item at `index` marked as purchased. */
const markPurchased = <T extends { purchased: boolean }>(
  items: T[],
  index: number,
): T[] =>
  items.map((item, i) => (i === index ? { ...item, purchased: true } : item));

export const createShopSlice: SliceCreator<ShopActions> = (set, get) => ({
  purchaseShopCard: (index) =>
    set((state) => {
      const shop = state.currentShop;
      const shopCard = shop?.cards[index];
      if (!shop || !shopCard) return state;
      if (shopCard.purchased || state.player.gold < shopCard.cost) return state;

      const purchasedCard = createCardInstance(shopCard.card);

      return {
        player: { ...state.player, gold: state.player.gold - shopCard.cost },
        drawPile: [...state.drawPile, purchasedCard],
        persistentDeck: [...state.persistentDeck, purchasedCard],
        currentShop: { ...shop, cards: markPurchased(shop.cards, index) },
        selectedCard: null,
      };
    }),

  purchaseShopRelic: (index) =>
    set((state) => {
      const shop = state.currentShop;
      const shopRelic = shop?.relics[index];
      if (!shop || !shopRelic) return state;
      if (shopRelic.purchased || state.player.gold < shopRelic.cost)
        return state;

      return {
        player: {
          ...state.player,
          gold: state.player.gold - shopRelic.cost,
          relics: [...state.player.relics, shopRelic.relic],
        },
        currentShop: { ...shop, relics: markPurchased(shop.relics, index) },
        selectedCard: null,
      };
    }),

  removeCardFromDeck: (cardId) => {
    const state = get();
    const shop = state.currentShop;
    if (!shop || state.player.gold < shop.removeCardCost) return;

    if (!cardId) {
      get().openCardRemovalModal();
      return;
    }

    const isInDeck = [
      ...state.persistentDeck,
      ...state.drawPile,
      ...state.discardPile,
    ].some((card) => card.id === cardId);
    if (!isInDeck) return;

    set({
      player: {
        ...state.player,
        gold: state.player.gold - shop.removeCardCost,
      },
      drawPile: removeCard(state.drawPile, cardId),
      discardPile: removeCard(state.discardPile, cardId),
      persistentDeck: removeCard(state.persistentDeck, cardId),
      currentShop: {
        ...shop,
        removeCardCost: shop.removeCardCost + SHOP_REMOVE_CARD_COST_INCREASE,
      },
      selectedCard: null,
    });
  },
});
