import React from "react";
import { useShallow } from "zustand/react/shallow";
import { REST_HEAL_AMOUNT } from "../engine/constants";
import { useGameStore } from "../store/gameStore";
import { canUpgradeCard, getUpgradePreview } from "../utils/cardUpgrades";
import { CardGrid } from "./CardGrid";
import { UnifiedHeader } from "./UnifiedHeader";
import { ICON } from "./ui/icons";

/** A rest site: heal, or upgrade one card. */
export const RestScreen: React.FC = () => {
  const {
    drawPile,
    discardPile,
    showCardUpgradeModal,
    restAndHeal,
    upgradeCardAtRest,
    openCardUpgradeModal,
    closeCardUpgradeModal,
  } = useGameStore(
    useShallow((state) => ({
      drawPile: state.drawPile,
      discardPile: state.discardPile,
      showCardUpgradeModal: state.showCardUpgradeModal,
      restAndHeal: state.restAndHeal,
      upgradeCardAtRest: state.upgradeCardAtRest,
      openCardUpgradeModal: state.openCardUpgradeModal,
      closeCardUpgradeModal: state.closeCardUpgradeModal,
    })),
  );

  const upgradableCards = [...drawPile, ...discardPile].filter(canUpgradeCard);
  const canUpgrade = upgradableCards.length > 0;

  return (
    <main className="page" aria-label="Rest site">
      <UnifiedHeader />

      <div className="page__body page__body--centered">
        <h1 className="page__title">Rest Site</h1>
        <p className="screen__text">
          A quiet place to stop. Choose how to spend the time.
        </p>

        <div className="btn-row">
          <button
            type="button"
            className="option"
            data-tone="heal"
            onClick={restAndHeal}
          >
            <span className="option__icon" aria-hidden="true">
              {ICON.health}
            </span>
            <h2 className="option__title">Rest</h2>
            <p className="option__text">Heal {REST_HEAL_AMOUNT} HP</p>
          </button>

          <button
            type="button"
            className="option"
            data-tone="accent"
            disabled={!canUpgrade}
            onClick={() => openCardUpgradeModal()}
          >
            <span className="option__icon" aria-hidden="true">
              {ICON.energy}
            </span>
            <h2 className="option__title">Upgrade</h2>
            <p className="option__text">
              {canUpgrade
                ? "Upgrade a card permanently"
                : "No cards available to upgrade"}
            </p>
            <span className="option__note">
              {canUpgrade
                ? `${upgradableCards.length} card${
                    upgradableCards.length === 1 ? "" : "s"
                  } can be upgraded`
                : "All cards are already upgraded"}
            </span>
          </button>
        </div>
      </div>

      {showCardUpgradeModal && (
        <CardGrid
          cards={upgradableCards}
          title="Select Card to Upgrade"
          tone="accent"
          onCardClick={(card) => upgradeCardAtRest(card.id)}
          onClose={closeCardUpgradeModal}
          getUpgradePreview={getUpgradePreview}
        />
      )}
    </main>
  );
};
