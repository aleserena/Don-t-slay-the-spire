import React from "react";
import { useShallow } from "zustand/react/shallow";
import { previewCardPlay } from "../engine/preview";
import { useGameStore } from "../store/gameStore";
import { Card, Enemy, IntentType, StatusType } from "../types/game";
import { cardNeedsTarget } from "../utils/cardUtils";
import { calculateDamage } from "../utils/statusEffects";
import { MonsterCardPreview } from "./MonsterCardPreview";
import { asButton } from "./ui/asButton";
import { BlockPill, HealthBar, StatusList } from "./ui/Combat";
import { INTENT_ICON, INTENT_LABEL } from "./ui/icons";

interface EnemyAreaProps {
  selectedCard: Card | null;
  confirmingCard?: Card | null;
  onEnemyTarget: (enemyId: string) => void;
}

/** The enemies of a combat, with what each is about to do. */
export const EnemyArea: React.FC<EnemyAreaProps> = ({
  selectedCard,
  confirmingCard,
  onEnemyTarget,
}) => {
  const { enemies, player, firstAttackThisCombat, combat } = useGameStore(
    useShallow((state) => ({
      enemies: state.enemies,
      player: state.player,
      firstAttackThisCombat: state.firstAttackThisCombat,
      combat: state.combat,
    })),
  );

  const needsTarget = Boolean(selectedCard && cardNeedsTarget(selectedCard));

  /** What the card being aimed or confirmed would do to this enemy. */
  const getDamagePreview = (enemy: Enemy) => {
    const cardToPreview = selectedCard || confirmingCard;
    if (!cardToPreview) return null;

    const preview = previewCardPlay({
      card: cardToPreview,
      player,
      enemies,
      targetId: enemy.id,
      isFirstAttack: firstAttackThisCombat,
      counters: combat,
    })[enemy.id];
    if (!preview) return null;

    return {
      ...preview,
      isVulnerable: enemy.statusEffects.some(
        (effect) => effect.type === StatusType.VULNERABLE,
      ),
    };
  };

  /** What the enemy has announced, in words. */
  const describeIntent = (enemy: Enemy): string => {
    const { type, value } = enemy.intent;
    if (type === IntentType.ATTACK && value) {
      return `${calculateDamage(value, enemy, player)} damage`;
    }
    if (type === IntentType.DEFEND && value) return `${value} block`;
    return INTENT_LABEL[type];
  };

  return (
    <div className="combat__enemies" role="group" aria-label="Enemies">
      {enemies.map((enemy, index) => {
        const preview = getDamagePreview(enemy);
        const intentCard = enemy.intent.card;

        return (
          <div
            key={enemy.id}
            className={
              needsTarget
                ? "combatant enemy-card is-targetable"
                : "combatant enemy-card"
            }
            data-side="enemy"
            {...asButton(() => onEnemyTarget(enemy.id), {
              disabled: !needsTarget,
              label: `${index + 1}: ${enemy.name}, ${enemy.health} of ${
                enemy.maxHealth
              } health${enemy.block > 0 ? `, ${enemy.block} block` : ""}${
                intentCard ? `. Next: ${intentCard.name}` : ""
              }${
                preview
                  ? `. This card deals ${preview.healthLost} damage${
                      preview.wouldKill ? " and defeats it" : ""
                    }`
                  : ""
              }`,
            })}
          >
            {preview && (
              <div
                className={
                  preview.wouldKill
                    ? "damage-preview is-lethal"
                    : "damage-preview"
                }
              >
                <div>
                  {preview.isVulnerable && "🔥 "}
                  {preview.totalDamage}
                </div>
                <div className="damage-preview__detail">
                  -{preview.healthLost} HP
                </div>
                {preview.wouldKill && (
                  <div className="damage-preview__detail">💀 KILL</div>
                )}
              </div>
            )}

            <div className="combatant__name">{enemy.name}</div>
            <HealthBar health={enemy.health} maxHealth={enemy.maxHealth} />
            <BlockPill block={enemy.block} />

            <div className="intent" data-intent={enemy.intent.type}>
              <div className="intent__label">Next Turn:</div>
              <div className="intent__value">
                <span aria-hidden="true">{INTENT_ICON[enemy.intent.type]}</span>{" "}
                {describeIntent(enemy)}
              </div>
              {intentCard && (
                <>
                  <div className="intent__card">{intentCard.name}</div>
                  <span className="tooltip tooltip--below" role="tooltip">
                    <MonsterCardPreview card={intentCard} />
                  </span>
                </>
              )}
            </div>

            <StatusList effects={enemy.statusEffects} />
          </div>
        );
      })}
    </div>
  );
};
