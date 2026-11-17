import React from "react";
import { useGameStore } from "../store/gameStore";
import { BlockPill, HealthBar, StatusList } from "./ui/Combat";
import { ICON } from "./ui/icons";

/** The player's side of a combat: health, block, energy, statuses, powers. */
export const PlayerArea: React.FC = () => {
  const player = useGameStore((state) => state.player);

  return (
    <section className="combatant" data-side="player" aria-label="Player">
      <div className="combatant__name">Player</div>

      <HealthBar health={player.health} maxHealth={player.maxHealth} />
      <BlockPill block={player.block} />
      <div className="pill" data-kind="energy">
        <span aria-hidden="true">{ICON.energy}</span> Energy: {player.energy}/
        {player.maxEnergy}
      </div>

      <StatusList effects={player.statusEffects} />

      {player.powerCards.length > 0 && (
        <div className="combatant__powers" aria-label="Active powers">
          <div className="combatant__powers-title">Active Powers</div>
          {player.powerCards.map((power, index) => (
            <span
              key={`${power.id}-${index}`}
              className="power"
              tabIndex={0}
              aria-label={`${power.name}. ${power.description}`}
            >
              {power.name}
              <span className="tooltip" role="tooltip">
                <span className="tooltip__title">{power.name}</span>
                <span>{power.description}</span>
              </span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
};
