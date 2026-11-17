import React from "react";
import { useShallow } from "zustand/react/shallow";
import { canChooseEventOption, getChoiceGoldCost } from "../engine/events";
import { useGameStore } from "../store/gameStore";
import { UnifiedHeader } from "./UnifiedHeader";
import { describeConsequence } from "./ui/icons";

/** An event: a short story and a few choices with their outcomes. */
export const EventScreen: React.FC = () => {
  const { currentEvent, selectEventChoice, player } = useGameStore(
    useShallow((state) => ({
      currentEvent: state.currentEvent,
      selectEventChoice: state.selectEventChoice,
      player: state.player,
    })),
  );

  if (!currentEvent) return null;

  return (
    <main className="page" aria-label="Event">
      <UnifiedHeader />

      <div className="page__body page__body--centered">
        <div className="event panel">
          <h1 className="page__title">{currentEvent.name}</h1>
          <p className="event__text">{currentEvent.description}</p>

          <div className="event__choices">
            {currentEvent.choices.map((choice) => {
              const affordable = canChooseEventOption(choice, player);
              return (
                <button
                  key={choice.id}
                  type="button"
                  className="choice"
                  onClick={() => selectEventChoice(choice.id)}
                  disabled={!affordable}
                  title={
                    affordable
                      ? undefined
                      : `Not enough gold (needs ${getChoiceGoldCost(choice)})`
                  }
                >
                  {choice.text}
                  {!affordable && " (not enough gold)"}
                  <ul className="choice__effects">
                    {choice.consequences.map((consequence, index) => (
                      <li key={index}>{describeConsequence(consequence)}</li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
};
