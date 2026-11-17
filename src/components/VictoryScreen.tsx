import React from "react";
import { useShallow } from "zustand/react/shallow";
import { BRANDING } from "../config/branding";
import { useGameStore } from "../store/gameStore";
import { Button, Screen, Stat, StatGrid } from "./ui";

/** Shown when the boss is defeated: a summary of the run that was won. */
export const VictoryScreen: React.FC = () => {
  const {
    player,
    deckSize,
    currentFloor,
    combatsWon,
    seed,
    startNewGame,
    startNewRun,
  } = useGameStore(
    useShallow((state) => ({
      player: state.player,
      deckSize: state.persistentDeck.length,
      currentFloor: state.currentFloor,
      combatsWon: state.combatsWon,
      seed: state.seed,
      startNewGame: state.startNewGame,
      startNewRun: state.startNewRun,
    })),
  );

  return (
    <Screen label="Victory">
      <h1 className="screen__title">Victory!</h1>
      <p className="screen__text">{BRANDING.victoryMessage}</p>

      <StatGrid>
        <Stat label="Floors Climbed" value={currentFloor} />
        <Stat label="Combats Won" value={combatsWon} />
        <Stat label="Health" value={`${player.health} / ${player.maxHealth}`} />
        <Stat label="Gold" value={player.gold} />
        <Stat label="Deck Size" value={deckSize} />
        <Stat label="Relics" value={player.relics.length} />
      </StatGrid>

      <p className="screen__note">Seed {seed}</p>

      <div className="btn-row">
        <Button variant="primary" onClick={() => startNewGame()}>
          New Run
        </Button>
        <Button onClick={() => startNewRun()}>Title Screen</Button>
      </div>
    </Screen>
  );
};
