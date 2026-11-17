import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../store/gameStore";
import { CardGrid } from "./CardGrid";
import { UnifiedHeader } from "./UnifiedHeader";
import { Button } from "./ui";
import { CardView } from "./ui/CardView";
import { RelicTile } from "./ui/RelicTile";

/** The shop: cards and relics for gold, and paying to remove a card. */
export const ShopScreen: React.FC = () => {
  const {
    currentShop,
    player,
    drawPile,
    discardPile,
    showCardRemovalModal,
    returnToMap,
    purchaseShopCard,
    purchaseShopRelic,
    removeCardFromDeck,
    openCardRemovalModal,
    closeCardRemovalModal,
  } = useGameStore(
    useShallow((state) => ({
      currentShop: state.currentShop,
      player: state.player,
      drawPile: state.drawPile,
      discardPile: state.discardPile,
      showCardRemovalModal: state.showCardRemovalModal,
      returnToMap: state.returnToMap,
      purchaseShopCard: state.purchaseShopCard,
      purchaseShopRelic: state.purchaseShopRelic,
      removeCardFromDeck: state.removeCardFromDeck,
      openCardRemovalModal: state.openCardRemovalModal,
      closeCardRemovalModal: state.closeCardRemovalModal,
    })),
  );

  if (!currentShop) return null;

  const canRemove = player.gold >= currentShop.removeCardCost;

  return (
    <main className="page" aria-label="Shop">
      <UnifiedHeader />

      <div className="page__body">
        <div className="page__top">
          <h1 className="page__title">Shop</h1>
          <Button onClick={returnToMap}>Leave Shop</Button>
        </div>

        <section className="page__section">
          <h2 className="page__section-title">Cards for Sale</h2>
          <div className="card-row">
            {currentShop.cards.map(({ card, cost, purchased }, index) => {
              const affordable = player.gold >= cost;
              return (
                <CardView
                  key={`${card.id}-${index}`}
                  card={card}
                  size="large"
                  price={cost}
                  affordable={affordable}
                  sold={purchased}
                  disabled={purchased || !affordable}
                  onActivate={() => purchaseShopCard(index)}
                />
              );
            })}
          </div>
        </section>

        {currentShop.relics.length > 0 && (
          <section className="page__section">
            <h2 className="page__section-title">Relics for Sale</h2>
            <div className="card-row">
              {currentShop.relics.map(({ relic, cost, purchased }, index) => {
                const affordable = player.gold >= cost;
                return (
                  <RelicTile
                    key={relic.id}
                    relic={relic}
                    showRarity
                    price={cost}
                    affordable={affordable}
                    sold={purchased}
                    disabled={purchased || !affordable}
                    onActivate={() => purchaseShopRelic(index)}
                  />
                );
              })}
            </div>
          </section>
        )}

        <section className="page__section panel">
          <h2 className="panel__title">Card Removal Service</h2>
          <p className="screen__text">
            Remove a card from your deck permanently
          </p>
          <Button
            variant="danger"
            disabled={!canRemove}
            onClick={() => openCardRemovalModal()}
          >
            Remove Card ({currentShop.removeCardCost} Gold)
          </Button>
        </section>
      </div>

      {showCardRemovalModal && (
        <CardGrid
          cards={[...drawPile, ...discardPile]}
          title={`Select Card to Remove (${currentShop.removeCardCost} Gold)`}
          tone="danger"
          onCardClick={(card) => removeCardFromDeck(card.id)}
          onClose={closeCardRemovalModal}
        />
      )}
    </main>
  );
};
