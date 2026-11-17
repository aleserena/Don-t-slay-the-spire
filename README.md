# Deckbuilder

A roguelike deck-building card game for the browser, built with React, TypeScript and Zustand.

You climb a map of 15 floors. Each floor offers a choice of fights, events, shops, rest sites and treasure. You win cards and relics as you go, and the run ends when you defeat the boss at the top or run out of health.

> **About the content.** The engine and interface are generic. The cards, relics, enemies and events in `src/data` are placeholders modelled on _Slay the Spire_ by Mega Crit, which inspired this project. They will be replaced with original content; nothing outside `src/data` depends on them. See [docs/CONTENT.md](docs/CONTENT.md).

## Quick start

You need Node.js 20.19 or newer (`.nvmrc` pins 22).

```bash
npm install
npm run dev        # http://localhost:3000
```

### Playing

- **Mouse:** click a map node to enter it. In combat, click a card once to select it, then click an enemy to aim it; cards without a target are played with a second click.
- **Keyboard:** <kbd>Tab</kbd> and <kbd>Enter</kbd> work everywhere. In combat, <kbd>1</kbd>–<kbd>9</kbd> pick a card and then a target, <kbd>E</kbd> ends the turn, <kbd>Esc</kbd> cancels.
- **Saving:** the run is saved automatically while you are on the map. **Continue** on the title screen picks it up again.
- **Debug mode:** press <kbd>D</kbd> in combat for a panel that adds cards and relics and changes the state.

## Scripts

| Command                           | What it does                                                             |
| --------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                     | Development server with hot reload                                       |
| `npm run build`                   | Type-check and build to `dist/`                                          |
| `npm run preview`                 | Serve the production build                                               |
| `npm test`                        | Run the test suite once                                                  |
| `npm run test:coverage`           | Tests with a coverage report and the coverage floors                     |
| `npm run validate`                | Lint, format check, type-check and tests (the pre-commit hook runs this) |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                        |
| `npm run simulate`                | Bots play 300 seeded runs each and print a balance report                |
| `npm run simulate:impact`         | Measures what each relic and card is worth on its own                    |

## Project layout

```
src/
  engine/       Rules as pure functions: card play, triggers, combat, encounters, rewards, events
  store/        Zustand store, its slices, saving
  data/         Content: cards, relics, enemies and their cards, bosses, events
  utils/        Helpers: statuses, upgrades, map generation, randomness, card display
  components/   React screens; ui/ holds the shared pieces
  styles/       Theme tokens and the classes every screen uses
  config/       The game's name and descriptive text
  sim/          Headless simulator, bots and balance reports
docs/           Architecture, content, UI, simulator and development guides
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — how the engine, triggers, store and UI fit together
- [Content](docs/CONTENT.md) — adding cards, relics, enemies and events
- [Interface](docs/UI.md) — theme, shared components, branding, keyboard and screen readers
- [Simulator](docs/SIMULATOR.md) — bots, reports and experiments
- [Development](docs/DEVELOPMENT.md) — workflow, testing, CI and conventions
- [Known bugs](KNOWN_BUGS.md) and [changelog](CHANGELOG.md)
- [docs/plans](docs/plans) — the implementation plans behind recent changes

## License

MIT.
