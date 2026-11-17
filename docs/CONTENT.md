# Content

All game content lives in `src/data` as plain objects. The engine and the interface work from what those objects say, so adding or replacing content is a data change.

The current content (35 cards, 15 relics, 13 enemies, 6 bosses, 6 events) is a placeholder modelled on _Slay the Spire_ and is meant to be replaced with original content.

## Cards — `src/data/cards.ts`

```ts
{
  id: "quick_cut",          // instance id; copies get unique ids at runtime
  baseId: "quick_cut",      // what the card is; used for lookups and upgrades
  name: "Quick Cut",
  cost: 1,                  // a number, or "X" to spend all energy
  type: CardType.ATTACK,    // ATTACK, SKILL or POWER
  rarity: CardRarity.COMMON,// BASE (starter only), COMMON, UNCOMMON, RARE
  description: "Deal 7 damage. Draw 1 card.",
  effects: [
    { type: EffectType.DAMAGE, value: 7, target: TargetType.ENEMY },
    { type: EffectType.DRAW_CARDS, value: 1, target: TargetType.SELF },
  ],
}
```

- **Targets:** `ENEMY` (the player picks one), `ALL_ENEMIES`, `RANDOM_ENEMY`, `SELF`. A card with any immediate `ENEMY` effect asks for a target.
- **Effect types** a card may use are listed in `SUPPORTED_CARD_EFFECTS` (`src/engine/cardPlay.ts`): damage, damage per energy spent, damage equal to block, block, statuses, draw, heal, gain or lose energy, lose health, add a copy to the discard pile, upgrade a card in hand.
- **Exhaust:** set `exhaust: true`. The card goes to the exhaust pile for the rest of the combat.
- **Temporary statuses:** `untilEndOfTurn: true` on a self status removes it at the end of the turn.
- **Powers:** give each ongoing effect a `trigger` (`PowerTrigger.TURN_START`, `TURN_END`, `CARD_EXHAUSTED`, `BLOCK_GAINED`, …). Effects without one apply once, when played. Keeping block between turns is `{ type: LIMIT_BLOCK_LOSS, value: 0, trigger: TURN_START }`.
- **Rewards:** every card that is not `BASE` can be offered as a reward or in shops, weighted by rarity (`REWARD_RARITY_WEIGHTS`).
- **Starting deck:** `createInitialDeck()` in the same file.

### Upgrades — `src/utils/cardUpgrades.ts`

Cards upgrade by a generic rule: damage and block +3; a card with neither gets +1 on its other numbers; a card with nothing to improve costs 1 less. The description's numbers are rewritten. For exact numbers, add the card to `SPECIFIC_UPGRADES`.

## Relics — `src/data/relics.ts`

```ts
{
  id: "spare_battery",
  name: "Spare Battery",
  description: "Whenever you lose HP, gain 1 Energy next turn.",
  rarity: RelicRarity.UNCOMMON,  // STARTER, COMMON, UNCOMMON, RARE, BOSS
  effects: [
    {
      trigger: RelicTrigger.DAMAGE_TAKEN,
      effect: EffectType.GAIN_ENERGY,
      value: 1,
      nextTurn: true,
    },
  ],
}
```

- **Triggers:** `COMBAT_START`, `TURN_START`, `TURN_END`, `CARD_PLAYED`, `CARD_EXHAUSTED`, `DAMAGE_TAKEN`, `ENEMY_DEATH`.
- **Conditions:** `onTurn` (only on that turn of a combat), `cardType` (only for cards of that type), `oncePerCombat`, `nextTurn` (energy arrives after next turn's refill), `ifNoAttacksThisTurn`.
- **Targets** for damage and statuses: `"self"`, `"ALL_ENEMIES"`, `"RANDOM_ENEMY"`, or none. With none, damage after being hit goes back to the attacker; otherwise it hits every enemy.
- **Passive effects:** `LIMIT_BLOCK_LOSS` (lose at most `value` block at turn start) and `FIRST_ATTACK_DAMAGE` (the first attack of each combat deals `value` more).
- The starting relic is chosen in `getStarterRelic()`.

## Enemies — `src/data/enemies.ts`, `monsterCards.ts`, `bosses.ts`

An enemy has health and a deck of monster cards. Each turn it announces one card (its intent) and plays it on the next.

1. Add the enemy's cards to `monsterCards.ts` and a case in `getEnemyDeck` for its name.
2. Add a `create…` function in `enemies.ts` (or `bosses.ts` for a boss).
3. Add it to an encounter pool in `src/engine/encounters.ts`: `EASY_ENCOUNTERS` (floors 0–2), `NORMAL_ENCOUNTERS` (from floor 3; with 25% more health from floor 9) or `ELITE_ENCOUNTERS`. Bosses are picked in `getBossForFloor`.

Monster cards use the same effects as player cards, seen from the enemy: `ENEMY` is the player and `SELF` is the enemy. `priority` weights how often a card is chosen; the AI also prefers blocking and buffing when its health is low.

## Events — `src/data/events.ts`

An event has a name, a description, and choices. Each choice has a list of consequences: gain or lose gold, gain or lose health, gain max health, gain a card or relic, upgrade or remove a card. `cardId` and `relicId` name a specific card or relic, or a random one (`random_attack`, `random_skill`, `random_common`, `random_uncommon`, `random_rare`). A choice that costs more gold than the player has cannot be picked.

## Checks that keep content honest

- **`src/data/__tests__/dataConsistency.test.ts`** fails if a card or relic uses an effect type or trigger the engine does not implement, if a card that says "Exhaust." is not marked `exhaust`, or if an effect does nothing. Entries whose text needs a mechanic the engine lacks are listed in `KNOWN_UNIMPLEMENTED_CARDS` / `KNOWN_UNIMPLEMENTED_RELICS`; the test fails if a listed entry no longer exists.
- **`src/__tests__/generic-ui.test.tsx`** fails if a component mentions a card, relic or enemy by id or name. Screens must stay content-free.
- **`npm run simulate`** plays hundreds of runs and fails on a run that gets stuck or a broken invariant. **`npm run simulate:impact`** measures each card and relic on its own. See [SIMULATOR.md](SIMULATOR.md).

## Replacing the content

1. Replace the entries in `src/data`, keeping the shapes above. Update `createInitialDeck`, `getStarterRelic` and the encounter pools in `src/engine/encounters.ts`.
2. Change the name and text in `src/config/branding.ts` and the page title in `index.html`.
3. Adjust colors and icons in `src/styles/theme.css` and `src/components/ui/icons.ts` if the theme calls for it.
4. Some tests use current card ids as fixtures (for example `strike` and `defend`). Update them with the new starter cards.
5. Run `npm run validate`, then `npm run simulate` and `npm run simulate:impact` to check the balance.
