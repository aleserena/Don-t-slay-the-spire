import React from "react";
import { useShallow } from "zustand/react/shallow";
import { BRANDING } from "../config/branding";
import { useGameStore } from "../store/gameStore";
import { Button, Screen, Stat, StatGrid } from "./ui";

/** Shown when the player runs out of health: a summary of the lost run. */
export const GameOverScreen: React.FC = () => {
  const {
    startNewGame,
    returnToTitle,
    player,
    currentFloor,
    combatsWon,
    deckSize,
    seed,
  } = useGameStore(
    useShallow((state) => ({
      startNewGame: state.startNewGame,
      returnToTitle: state.returnToTitle,
      player: state.player,
      currentFloor: state.currentFloor,
      combatsWon: state.combatsWon,
      deckSize: state.persistentDeck.length,
      seed: state.seed,
    })),
  );

  return (
    <Screen label="Defeat">
      <h1 className="screen__title screen__title--danger">Defeat</h1>
      <p className="screen__text">{BRANDING.defeatMessage}</p>

      <StatGrid>
        <Stat label="Floor Reached" value={currentFloor} />
        <Stat label="Combats Won" value={combatsWon} />
        <Stat label="Final Health" value={`0 / ${player.maxHealth}`} />
        <Stat label="Gold Collected" value={player.gold} />
        <Stat label="Deck Size" value={deckSize} />
        <Stat label="Relics Found" value={player.relics.length} />
      </StatGrid>

      <p className="screen__note">Seed {seed}</p>

      <div className="btn-row">
        <Button variant="primary" onClick={() => startNewGame()}>
          Try Again
        </Button>
        <Button onClick={() => returnToTitle()}>Title Screen</Button>
      </div>
    </Screen>
  );
};
