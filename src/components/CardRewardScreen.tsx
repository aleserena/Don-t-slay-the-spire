import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../store/gameStore";
import { UnifiedHeader } from "./UnifiedHeader";
import { Button } from "./ui";
import { CardView } from "./ui/CardView";

/** After a combat: the gold earned and a choice of one card. */
export const CardRewardScreen: React.FC = () => {
  const { combatReward, selectCardReward, skipCardReward } = useGameStore(
    useShallow((state) => ({
      combatReward: state.combatReward,
      selectCardReward: state.selectCardReward,
      skipCardReward: state.skipCardReward,
    })),
  );

  if (!combatReward) return null;

  return (
    <main className="page" aria-label="Card reward">
      <UnifiedHeader />

      <div className="page__body page__body--centered">
        <h1 className="page__title">Victory!</h1>
        <p className="screen__text">You earned {combatReward.gold} gold!</p>
        <p className="screen__text">Choose a card to add to your deck</p>

        <div className="card-row">
          {combatReward.cardRewards.map((card) => (
            <CardView
              key={card.id}
              card={card}
              size="large"
              showMeta
              onActivate={() => selectCardReward(card.id)}
            />
          ))}
        </div>

        <Button onClick={skipCardReward}>Skip Reward</Button>
      </div>
    </main>
  );
};
