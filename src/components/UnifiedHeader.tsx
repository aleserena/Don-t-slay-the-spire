import React, { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { BRANDING } from "../config/branding";
import { isTemporaryCard } from "../engine/deck";
import { useGameStore } from "../store/gameStore";
import { CardGrid } from "./CardGrid";
import { ICON } from "./ui/icons";
import { Modal } from "./ui/Modal";
import { RelicTile } from "./ui/RelicTile";

/** The bar on top of every in-run screen: health, relics, deck and gold. */
export const UnifiedHeader: React.FC = () => {
  const { player, drawPile, discardPile, exhaustPile, hand } = useGameStore(
    useShallow((state) => ({
      player: state.player,
      drawPile: state.drawPile,
      discardPile: state.discardPile,
      exhaustPile: state.exhaustPile,
      hand: state.hand,
    })),
  );
  const [showDeck, setShowDeck] = useState(false);
  const [showRelics, setShowRelics] = useState(false);

  // Every card the player owns, wherever it is right now, without the
  // cards that only exist for the current combat
  const fullDeck = [
    ...drawPile,
    ...hand,
    ...discardPile,
    ...exhaustPile,
  ].filter((card) => !isTemporaryCard(card));

  return (
    <>
      <header className="header">
        <div className="header__group">
          <span className="chip" data-kind="health">
            <span aria-hidden="true">{ICON.health}</span>
            <span className="visually-hidden">Health</span>
            {player.health}/{player.maxHealth}
          </span>
          <button
            type="button"
            className="chip"
            data-kind="relics"
            onClick={() => setShowRelics(true)}
          >
            <span aria-hidden="true">{ICON.relic}</span>
            View Relics ({player.relics.length})
          </button>
        </div>

        <div className="header__title">{BRANDING.title}</div>

        <div className="header__group">
          <button
            type="button"
            className="chip"
            data-kind="deck"
            onClick={() => setShowDeck(true)}
          >
            <span aria-hidden="true">{ICON.deck}</span>
            View Deck ({fullDeck.length})
          </button>
          <span className="chip" data-kind="gold">
            <span aria-hidden="true">{ICON.gold}</span>
            <span className="visually-hidden">Gold</span>
            {player.gold}
          </span>
        </div>
      </header>

      {showRelics && (
        <Modal
          title={`Relics (${player.relics.length})`}
          tone="accent"
          onClose={() => setShowRelics(false)}
        >
          {player.relics.map((relic) => (
            <RelicTile key={relic.id} relic={relic} showRarity />
          ))}
        </Modal>
      )}

      {showDeck && (
        <CardGrid
          cards={fullDeck}
          title="Complete Deck"
          onClose={() => setShowDeck(false)}
        />
      )}
    </>
  );
};
