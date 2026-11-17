import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../store/gameStore";
import { UnifiedHeader } from "./UnifiedHeader";
import { Button } from "./ui";
import { RelicTile } from "./ui/RelicTile";

/** A relic to take or leave, after an elite fight or from a treasure. */
export const RelicRewardScreen: React.FC = () => {
  const { combatReward, selectRelicReward, skipRelicReward } = useGameStore(
    useShallow((state) => ({
      combatReward: state.combatReward,
      selectRelicReward: state.selectRelicReward,
      skipRelicReward: state.skipRelicReward,
    })),
  );

  if (!combatReward?.relicReward) return null;

  const relic = combatReward.relicReward;
  const isTreasure = combatReward.isTreasureReward || false;

  return (
    <main className="page" aria-label="Relic reward">
      <UnifiedHeader />

      <div className="page__body page__body--centered">
        <h1 className="page__title">
          {isTreasure ? "Treasure Found!" : "Elite Defeated!"}
        </h1>
        <p className="screen__text">
          {isTreasure ? "A relic awaits you!" : "Choose your reward!"}
        </p>

        <RelicTile
          relic={relic}
          size="large"
          showRarity
          onActivate={selectRelicReward}
        />

        <div className="btn-row">
          <Button variant="primary" onClick={selectRelicReward}>
            Take Relic
          </Button>
          <Button onClick={skipRelicReward}>Skip</Button>
        </div>

        <p className="screen__note">Relics last for the whole run.</p>
      </div>
    </main>
  );
};
