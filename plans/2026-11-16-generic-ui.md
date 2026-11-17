# Generic UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An interface that works for any content: nothing in it names the game, a card, a relic or an enemy, so original content can replace the current data later without touching components.

**Architecture:** Three rules. What a card shows is read from its effects (`getCardStatBadges`) and what it would do is worked out by the engine itself (`previewCardPlay` resolves the card on a copy of the combat). Everything that names the game lives in `src/config/branding.ts`. Shared look lives in `src/styles/theme.css` as custom properties and a few classes, used through the components in `src/components/ui`.

**Tech Stack:** React, Zustand, CSS custom properties, Vitest with Testing Library.

**Spec:** "Plan 7" of the 2026-11-16 review, plus the request for a generic UI ahead of original content.

## Global Constraints

- No component or config file may contain a card id, relic id, or card, relic or enemy name. A test enforces this.
- The game's name appears only in `src/config/branding.ts` and the page title in `index.html`.
- Everything a mouse can do in the map and in combat can be done with the keyboard.
- `npm run validate` passes; no new dependencies.

## Review Focus

- A card with a shape no current card has (several effect kinds at once) must still get sensible badges and a preview.
- Keyboard shortcuts must not fire while a modifier key is held or while typing in a field.
- A card the player cannot afford must be announced as disabled and must not react to its number.
- Escape must cancel both a card waiting for a target and one waiting for confirmation.

---

### Task 1: Cards and previews from data

- [x] `getCardStatBadges(card, context?)` reads effects through `getCardEffects`; with a player it applies Strength, Dexterity, the first-attack bonus, current block and energy.
- [x] `src/engine/preview.ts`: `previewCardPlay` returns, per enemy, the damage dealt, health lost and whether it dies.
- [x] `HandArea` uses `CardStatBadges` instead of per-card markup; `EnemyArea` uses the engine preview and the shared status helpers; `isMultiTargetCard` reads effects.
- [x] The debug panel lists cards from data and finds an energy relic by its effect.

### Task 2: Branding in one place

- [x] `src/config/branding.ts` (title, subtitle, tagline, map name, end-of-run lines); used by the title screen, header, map and end screens. Page title updated. Unused `GameUI` component removed.

### Task 3: Theme and shared pieces

- [x] `src/styles/theme.css`: colors, spacing, radii and type sizes as custom properties; classes for screens, panels, buttons, stat tiles, key hints; a visible focus ring everywhere.
- [x] `src/components/ui`: `Button`, `Screen`, `Stat`, `StatGrid`, and `asButton` for clickable non-buttons.
- [x] Title, defeat and victory screens rewritten on these pieces. The defeat screen now also shows combats won and deck size.

### Task 4: Keyboard and screen readers

- [x] Map nodes, cards in hand and enemies are focusable, labelled, and activate with Enter or Space; unreachable nodes and unaffordable cards are marked disabled.
- [x] Combat keys: `1`-`9` and `0` act on the card in that position, a second number picks the target, `E` ends the turn, `Esc` cancels. A hint line shows them.

### Task 5: Store subscriptions

- [x] Every component subscribes to the fields it reads (`useShallow`) instead of the whole store.

### Task 6: Tests

- [x] `src/__tests__/generic-ui.test.tsx`: the no-content guard over component sources, badges for known and made-up cards, engine previews, the shared screens, and keyboard play on the map and in combat.

## Outcome

Checked in a browser as well as by tests: title screen, map entered with Enter, a card selected and aimed with number keys, the damage preview, end of turn with `E`; no console errors.

## Not done

- **Most screens still style themselves inline.** The combat board, hand, enemy and player areas, shop, rest, event, reward screens, map, header and card grid keep their inline styles (about 300 style objects) and their hard-coded colors. They should move to the theme classes one screen at a time; the tokens they need already exist.
- **Icons are emoji.** A real icon set belongs with the original content.
- **Text is hard-coded English** in components; there is no string table.
- **The package is still named `slay-the-spire-clone`**, and the README and older docs still describe the game by that name.
- **Card, relic and enemy data is unchanged.** Replacing it is the original-content work that comes later.
