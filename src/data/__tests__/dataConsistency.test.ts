/**
 * Checks that the card and relic data only uses mechanics the engine
 * implements, so text and behaviour cannot drift apart unnoticed.
 */
import { describe, expect, it } from "vitest";
import { getAllCards } from "../cards";
import { getAllRelics } from "../relics";
import { SUPPORTED_CARD_EFFECTS } from "../../engine/cardPlay";
import {
  SUPPORTED_POWER_TRIGGERS,
  SUPPORTED_RELIC_TRIGGERS,
} from "../../engine/triggers";
import { CardType, EffectType } from "../../types/game";

/**
 * Entries whose text is not fully implemented, with what is missing. Each
 * needs a mechanic of its own rather than a data change. Remove an id from
 * here when its text and behaviour match.
 */
const KNOWN_UNIMPLEMENTED_CARDS: Record<string, string> = {
  true_grit: "does not exhaust a random card from the hand",
  battle_trance: "does not stop further draws this turn",
  perfected_strike: "does not count Strikes in the deck",
  entrench: "does not double Block",
  immolate: "does not add a Burn",
  reaper: "does not heal for the damage dealt",
};

const KNOWN_UNIMPLEMENTED_RELICS: Record<string, string> = {
  dead_branch: "does not add a random card when a card is exhausted",
};

/** Effect types that only make sense as an ongoing power effect. */
const POWER_ONLY_EFFECTS = [EffectType.LIMIT_BLOCK_LOSS];

/** Relic effects that are read where they apply instead of being fired. */
const PASSIVE_RELIC_EFFECTS = [
  EffectType.LIMIT_BLOCK_LOSS,
  EffectType.FIRST_ATTACK_DAMAGE,
];

/** Effect types a relic or power can apply when its trigger fires. */
const TRIGGERED_EFFECTS = [
  EffectType.HEAL,
  EffectType.BLOCK,
  EffectType.LOSE_HP,
  EffectType.GAIN_ENERGY,
  EffectType.DRAW_CARDS,
  EffectType.APPLY_STATUS,
  EffectType.DAMAGE,
];

describe("card data", () => {
  const cards = getAllCards();

  it("uses only effect types the engine applies", () => {
    for (const card of cards) {
      for (const effect of card.effects ?? []) {
        const supported = effect.trigger
          ? [...TRIGGERED_EFFECTS, ...POWER_ONLY_EFFECTS]
          : SUPPORTED_CARD_EFFECTS;
        expect(supported, `${card.baseId}: ${effect.type}`).toContain(
          effect.type,
        );
      }
    }
  });

  it("only gives ongoing effects to power cards, with triggers that fire", () => {
    for (const card of cards) {
      for (const effect of card.effects ?? []) {
        if (!effect.trigger) continue;
        expect(card.type, card.baseId).toBe(CardType.POWER);
        expect(SUPPORTED_POWER_TRIGGERS, card.baseId).toContain(effect.trigger);
      }
    }
  });

  it("gives every power card at least one effect", () => {
    for (const card of cards.filter((c) => c.type === CardType.POWER)) {
      expect(card.effects?.length ?? 0, card.baseId).toBeGreaterThan(0);
    }
  });

  it("has no effect that does nothing", () => {
    const allowedZero = [
      // The damage comes from the player's block
      EffectType.DAMAGE_MULTIPLIER_BLOCK,
      // Lose at most 0 block
      EffectType.LIMIT_BLOCK_LOSS,
    ];

    for (const card of cards) {
      if (card.baseId in KNOWN_UNIMPLEMENTED_CARDS) continue;
      for (const effect of card.effects ?? []) {
        if (allowedZero.includes(effect.type)) continue;
        expect(effect.value, `${card.baseId}: ${effect.type}`).toBeGreaterThan(
          0,
        );
      }
    }
  });

  it("marks cards whose text says Exhaust", () => {
    for (const card of cards) {
      // "Exhaust." as its own sentence means the card itself exhausts
      const saysExhaust = /(^|\. )Exhaust\.$/.test(card.description);
      expect(card.exhaust ?? false, card.baseId).toBe(saysExhaust);
    }
  });

  it("lists only existing cards as unimplemented", () => {
    const ids = cards.map((card) => card.baseId);
    for (const id of Object.keys(KNOWN_UNIMPLEMENTED_CARDS)) {
      expect(ids).toContain(id);
    }
  });
});

describe("relic data", () => {
  const relics = getAllRelics();

  it("uses only triggers that fire and effects the engine applies", () => {
    for (const relic of relics) {
      for (const effect of relic.effects) {
        expect(SUPPORTED_RELIC_TRIGGERS, relic.id).toContain(effect.trigger);
        expect(
          [...TRIGGERED_EFFECTS, ...PASSIVE_RELIC_EFFECTS],
          `${relic.id}: ${effect.effect}`,
        ).toContain(effect.effect);
      }
    }
  });

  it("gives every relic an effect unless it is listed as unimplemented", () => {
    for (const relic of relics) {
      const expectsEffects = !(relic.id in KNOWN_UNIMPLEMENTED_RELICS);
      expect(relic.effects.length > 0, relic.id).toBe(expectsEffects);
    }
  });

  it("lists only existing relics as unimplemented", () => {
    const ids = relics.map((relic) => relic.id);
    for (const id of Object.keys(KNOWN_UNIMPLEMENTED_RELICS)) {
      expect(ids).toContain(id);
    }
  });
});
