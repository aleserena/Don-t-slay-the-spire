import React from "react";
import { useShallow } from "zustand/react/shallow";
import { APP_VERSION, BRANDING } from "../config/branding";
import { useGameStore } from "../store/gameStore";
import { Button, Screen } from "./ui";

export const TitleScreen: React.FC = () => {
  const { startNewGame, loadSavedGame, hasSavedGame } = useGameStore(
    useShallow((state) => ({
      startNewGame: state.startNewGame,
      loadSavedGame: state.loadSavedGame,
      hasSavedGame: state.hasSavedGame,
    })),
  );

  return (
    <Screen label="Title">
      <h1 className="screen__title">{BRANDING.title}</h1>
      <h2 className="screen__subtitle">{BRANDING.subtitle}</h2>
      <p className="screen__text">{BRANDING.tagline}</p>

      <div className="btn-column">
        <Button variant="danger" large onClick={() => startNewGame()}>
          New Game
        </Button>
        <Button
          large
          disabled={!hasSavedGame}
          onClick={() => loadSavedGame()}
          title={hasSavedGame ? undefined : "No saved run"}
        >
          Continue
        </Button>
      </div>

      {APP_VERSION && <p className="screen__note">v{APP_VERSION}</p>}
    </Screen>
  );
};
