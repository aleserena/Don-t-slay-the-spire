# Interface

The interface is built to outlive its content: no component names a card, relic or enemy, the game's name lives in one config file, and every color and size comes from the theme.

## Where things are

| Path                        | What it holds                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/config/branding.ts`    | The game's name, subtitle, tagline, map name, end-of-run lines                                                      |
| `src/styles/theme.css`      | Design tokens (custom properties) and the base classes: screens, panels, buttons, stat tiles, key hints, focus ring |
| `src/styles/components.css` | Shared pieces: header, cards, badges, health bars, statuses, tooltips, modals, relic tiles                          |
| `src/styles/screens.css`    | Layout of each screen: combat, map, shop, rest site, events, rewards                                                |
| `src/components/ui/`        | React versions of the shared pieces (below)                                                                         |
| `src/components/*.tsx`      | The screens                                                                                                         |

## Theme

`theme.css` defines every color as a custom property on `:root`: surfaces and text, meaning (`--color-primary`, `--color-danger`, …), game concepts (`--color-health`, `--color-block`, `--color-energy`), and one token per card type, rarity, map node type, status and enemy intent.

Components never set colors. What differs by content is passed as a data attribute and colored in CSS:

```tsx
<div className="card" data-type={card.type} data-rarity={card.rarity}>
```

```css
.card[data-type="attack"] { --card-from: var(--card-attack-from); … }
```

A new look is a new set of token values. A new card type, rarity or status needs one token and one CSS rule.

Inline styles are allowed only for geometry that comes from data: the width of a health bar and a node's position on the map. A test enforces both rules.

## Shared components — `src/components/ui`

| Component                              | Use                                                                                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                               | Buttons, with `variant` (`neutral`, `primary`, `danger`) and `large`                                                                         |
| `Screen`, `Stat`, `StatGrid`           | Full-page screens (title, victory, defeat) and labelled numbers                                                                              |
| `CardView`                             | A card drawn from its data. Sizes `hand`, `grid`, `large`; optional price, sold state, banner, footer, and a player context for live numbers |
| `CardStatBadges`                       | A card's damage and block numbers, read from its effects                                                                                     |
| `HealthBar`, `BlockPill`, `StatusList` | The parts of a combatant; statuses explain themselves on hover or focus                                                                      |
| `Modal`                                | A dialog; closes with its button, Escape, or a click outside                                                                                 |
| `RelicTile`                            | A relic with its rarity as the frame color                                                                                                   |
| `asButton`                             | Makes any element focusable and activatable with Enter or Space                                                                              |
| `icons.ts`                             | Symbols and labels for concepts: node types, intents, health, gold, …                                                                        |

## What a card shows

- **Badges** come from `getCardStatBadges(card, context)` (`utils/cardDisplay.ts`). Without a context they show the card's own numbers; in the hand they include Strength, Dexterity, the first-attack bonus, current block and energy.
- **The damage preview** on an enemy comes from `previewCardPlay` (`engine/preview.ts`), which resolves the card on a copy of the combat. Anything the engine can play, the interface can preview.

## Keyboard and screen readers

- Map nodes, cards in hand, enemies, statuses and powers are focusable and labelled. Unreachable nodes and unaffordable cards are announced as disabled.
- In combat: <kbd>1</kbd>–<kbd>9</kbd> and <kbd>0</kbd> act on the card in that position. A card that needs a target is then aimed with a second number. <kbd>E</kbd> ends the turn, <kbd>Esc</kbd> cancels. Shortcuts are ignored while a modifier key is held or a text field has focus.
- Focus is always visible (`:focus-visible` ring from the theme).

## Store access

Components read only the fields they use, with `useShallow` selectors, so a change elsewhere in the store does not re-render them.

## Debug tools

`DebugPanel` and `DamageDebugPanel` appear in combat when debug mode is on (press <kbd>D</kbd>). They are developer tools: they keep their own inline styles and are exempt from the theme checks.

## Not done yet

- Icons are emoji. A proper icon set belongs with the original content.
- Text is English and written in the components; there is no string table.
- The layout targets desktop screens.
