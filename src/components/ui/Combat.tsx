/**
 * Pieces shared by the player and enemy panels in combat.
 */
import React from "react";
import { StatusEffect } from "../../types/game";
import {
  getStatusEffectDescription,
  getStatusEffectIcon,
  getStatusEffectName,
} from "../../utils/statusEffects";
import { ICON } from "./icons";

interface HealthBarProps {
  health: number;
  maxHealth: number;
}

/** Health as a number and a bar that changes color as it empties. */
export const HealthBar: React.FC<HealthBarProps> = ({ health, maxHealth }) => {
  const ratio = maxHealth > 0 ? Math.max(0, health) / maxHealth : 0;
  const level = ratio > 0.5 ? "high" : ratio > 0.25 ? "mid" : "low";

  return (
    <div className="meter" data-level={level}>
      <div className="meter__row">
        <span>
          <span aria-hidden="true">{ICON.health}</span> Health
        </span>
        <span>
          {health}/{maxHealth}
        </span>
      </div>
      <div
        className="meter__track"
        role="progressbar"
        aria-label="Health"
        aria-valuemin={0}
        aria-valuemax={maxHealth}
        aria-valuenow={health}
      >
        <div className="meter__fill" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
};

/** Block, shown only when there is some. */
export const BlockPill: React.FC<{ block: number }> = ({ block }) =>
  block > 0 ? (
    <div className="pill" data-kind="block">
      <span aria-hidden="true">{ICON.block}</span> Block: {block}
    </div>
  ) : null;

/**
 * The statuses on a combatant. Each one explains itself in a tooltip on
 * hover or keyboard focus.
 */
export const StatusList: React.FC<{ effects: StatusEffect[] }> = ({
  effects,
}) => {
  if (effects.length === 0) return null;

  return (
    <ul className="statuses" aria-label="Statuses">
      {effects.map((effect) => {
        const name = getStatusEffectName(effect.type);
        const description = getStatusEffectDescription(effect.type);
        return (
          <li
            key={effect.type}
            className="status"
            data-status={effect.type}
            tabIndex={0}
            aria-label={`${name} ${effect.stacks}. ${description}`}
          >
            <span aria-hidden="true">{getStatusEffectIcon(effect.type)}</span>
            {effect.stacks}
            {effect.duration ? ` (${effect.duration})` : ""}
            <span className="tooltip" role="tooltip">
              <span className="tooltip__title">
                {name} ({effect.stacks})
              </span>
              <span>{description}</span>
              {effect.duration ? (
                <span className="tooltip__note">
                  Duration: {effect.duration} turns
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
