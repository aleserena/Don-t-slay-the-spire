# Development

## Setup

```bash
npm install          # also installs the Git hooks (Husky)
npm run dev          # http://localhost:3000
```

Node.js 20.19 or newer; `.nvmrc` pins 22.

## Workflow

1. Branch from `master` (`feat/…`, `fix/…`).
2. For anything larger than a small fix, write a plan in `docs/plans/` first: goal, decisions, tasks with their tests. The existing plans show the format.
3. Write the failing test, make it pass, keep `npm run validate` green.
4. Update `CHANGELOG.md` under **Unreleased** and `KNOWN_BUGS.md` when you fix or find a bug.
5. Open a pull request against `master`.

The pre-commit hook runs `npm run validate` (lint, format check, type-check, tests). A commit that fails it is not created; fix the cause rather than skipping the hook.

## Testing

Vitest with jsdom and Testing Library. `src/test/setup.ts` provides fixtures (`createTestPlayer`, `createTestEnemy`, `createTestCard`, …).

| Where                  | What                                                                         |
| ---------------------- | ---------------------------------------------------------------------------- |
| `src/engine/__tests__` | Rules as pure functions                                                      |
| `src/store/__tests__`  | Store actions, game flow, saving                                             |
| `src/data/__tests__`   | Content shape and the data consistency checks                                |
| `src/sim/__tests__`    | Simulator, bots, reports                                                     |
| `src/__tests__`        | Cross-cutting suites: regressions, seeded runs, run structure, the interface |

Guidelines:

- Test behaviour through the store or the engine, not implementation details.
- Use fixture cards and relics for mechanics, so tests survive content changes. Use real content only to check that content.
- Anything random takes an `rng`; pass `createSeededRng(seed)` for repeatable results.
- `npm run test:coverage` enforces floors for `src/engine` (80% lines, 90% functions, 75% branches) and `src/store` (80% lines and functions, 75% branches).
- For balance and long fuzz runs, use `npm run simulate` ([SIMULATOR.md](SIMULATOR.md)).

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on pushes to `master`: install, lint, format check, type-check, tests with coverage, build. CodeQL analysis also runs on pull requests.

## Conventions

- **Rules are pure.** `src/engine` never imports the store or React. The store sequences engine calls and holds the state.
- **Behaviour comes from data.** No code outside `src/data` checks for a specific card, relic or enemy id. New behaviour is a generic effect, trigger or condition that data can use. See [CONTENT.md](CONTENT.md).
- **The interface is content-free and themed.** No colors or content names in components; the game's name lives in `src/config/branding.ts`. See [UI.md](UI.md). Tests enforce this.
- **Randomness is seeded.** Use the helpers in `utils/random.ts` with an `rng` parameter; never call `Math.random` in rules.
- **Logging** goes through `debugConsole` (`utils/debugUtils.ts`), which is silent unless debug mode is on. ESLint rejects `console` elsewhere.
- **Formatting** is Prettier's; run `npm run format` (or `npm run fix` for lint fixes too).
- **Comments** say why, not what. Exported functions get a short doc comment.

## Releasing

1. Move the **Unreleased** entries in `CHANGELOG.md` under a new version heading.
2. Bump `version` in `package.json` (it is shown on the title screen).
3. Merge to `master` and tag the release.
