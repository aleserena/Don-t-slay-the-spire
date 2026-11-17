import React, { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../store/gameStore";
import { Card, TurnPhase } from "../types/game";
import { cardNeedsTarget } from "../utils/cardUtils";
import { CardGrid } from "./CardGrid";
import { DamageDebugPanel } from "./DamageDebugPanel";
import { DebugPanel } from "./DebugPanel";
import { EnemyArea } from "./EnemyArea";
import { HandArea } from "./HandArea";
import { PlayerArea } from "./PlayerArea";
import { UnifiedHeader } from "./UnifiedHeader";
import { Button } from "./ui";
import { ICON } from "./ui/icons";

/** The combat screen: both sides, the hand, the piles and the turn button. */
export const GameBoard: React.FC = () => {
  const {
    selectedCard,
    setSelectedCard,
    playCard,
    enemies,
    drawPile,
    discardPile,
    currentTurn,
    endTurn,
    toggleDebugMode,
  } = useGameStore(
    useShallow((state) => ({
      selectedCard: state.selectedCard,
      setSelectedCard: state.setSelectedCard,
      playCard: state.playCard,
      enemies: state.enemies,
      drawPile: state.drawPile,
      discardPile: state.discardPile,
      currentTurn: state.currentTurn,
      endTurn: state.endTurn,
      toggleDebugMode: state.toggleDebugMode,
    })),
  );
  const [showDiscardPile, setShowDiscardPile] = useState(false);
  const [confirmingCard, setConfirmingCard] = useState<Card | null>(null);

  const isPlayerTurn = currentTurn === TurnPhase.PLAYER_TURN;

  const handleCardSelect = (card: Card) => {
    if (cardNeedsTarget(card)) {
      // Selecting the selected card again deselects it
      if (selectedCard?.id === card.id) {
        setSelectedCard(null);
        return;
      }
      setSelectedCard(card);
    } else {
      playCard(card.id);
      setSelectedCard(null);
    }
    setConfirmingCard(card);
  };

  const handleEnemyTarget = (enemyId: string) => {
    if (!confirmingCard) return;
    playCard(confirmingCard.id, enemyId);
    setConfirmingCard(null);
    setSelectedCard(null);
  };

  const handleCardConfirming = (card: Card | null) => {
    setConfirmingCard(card);
    // A card waiting for confirmation replaces one waiting for a target
    if (card && selectedCard) setSelectedCard(null);
  };

  // Keyboard: E ends the turn, Escape cancels a selection, and while a
  // card is waiting for a target 1-9 pick the enemy. D toggles debug mode.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const element = event.target as HTMLElement | null;
      if (element && /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName)) return;

      const key = event.key.toLowerCase();
      if (key === "d") {
        event.preventDefault();
        toggleDebugMode();
      } else if (key === "e") {
        if (isPlayerTurn) {
          event.preventDefault();
          void endTurn();
        }
      } else if (key === "escape") {
        setSelectedCard(null);
        setConfirmingCard(null);
      } else if (/^[1-9]$/.test(key) && selectedCard) {
        const enemy = enemies[Number(key) - 1];
        if (enemy && cardNeedsTarget(selectedCard)) {
          event.preventDefault();
          playCard(selectedCard.id, enemy.id);
          setConfirmingCard(null);
          setSelectedCard(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isPlayerTurn,
    endTurn,
    enemies,
    playCard,
    selectedCard,
    setSelectedCard,
    toggleDebugMode,
  ]);

  return (
    <main className="page combat" aria-label="Combat">
      <UnifiedHeader />

      {isPlayerTurn && (
        <div className="combat__controls">
          <Button
            variant="primary"
            onClick={() => void endTurn()}
            aria-keyshortcuts="E"
          >
            End Turn
          </Button>
          <div className="key-hints">
            <kbd>1</kbd>-<kbd>9</kbd> card or target · <kbd>E</kbd> end turn ·{" "}
            <kbd>Esc</kbd> cancel
          </div>
        </div>
      )}

      <div className="combat__field">
        <PlayerArea />
        <div className="combat__versus" aria-hidden="true">
          VS
        </div>
        <EnemyArea
          selectedCard={selectedCard}
          confirmingCard={confirmingCard}
          onEnemyTarget={handleEnemyTarget}
        />
      </div>

      <div className="combat__tray">
        <div className="pile" data-kind="draw">
          <div className="pile__cards">
            <span aria-hidden="true">{ICON.deck}</span> {drawPile.length}
          </div>
          Deck
        </div>

        <HandArea
          selectedCardId={selectedCard?.id || null}
          onCardSelect={handleCardSelect}
          onCardConfirming={handleCardConfirming}
        />

        <button
          type="button"
          className="pile"
          data-kind="discard"
          onClick={() => setShowDiscardPile(true)}
          aria-label={`Discard pile, ${discardPile.length} cards. Show cards.`}
        >
          <div className="pile__cards">
            <span aria-hidden="true">{ICON.discard}</span> {discardPile.length}
          </div>
          Discard
        </button>
      </div>

      {showDiscardPile && (
        <CardGrid
          cards={discardPile}
          title="Discard Pile"
          tone="warning"
          onClose={() => setShowDiscardPile(false)}
        />
      )}

      <DebugPanel />
      <DamageDebugPanel />
    </main>
  );
};

export default GameBoard;
