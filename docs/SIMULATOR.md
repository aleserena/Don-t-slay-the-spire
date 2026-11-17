# Simulator

`src/sim` plays whole runs headlessly through the real store, so its numbers come from the same rules the game uses. It answers two kinds of question:

- **Balance:** how often does a decent player win, where do runs die, what is a card or relic worth?
- **Correctness:** can a run get stuck, and does the game ever reach a state it should not?

## Commands

```bash
npm run simulate          # three bots on the same 300 seeds, detailed report for one
npm run simulate:impact   # what each relic and card is worth on its own
```

Both run through Vitest with `vitest.sim.config.ts` and are not part of `npm test`. Options are environment variables:

| Variable          | Default                    | Meaning                                                        |
| ----------------- | -------------------------- | -------------------------------------------------------------- |
| `VITE_SIM_RUNS`   | 300 (report), 150 (impact) | Seeds per bot or per variant                                   |
| `VITE_SIM_SEED`   | 1                          | First seed                                                     |
| `VITE_SIM_POLICY` | `lookahead`                | Bot for the detailed report: `lookahead`, `greedy` or `random` |

`npm run simulate` fails if any run gets stuck or breaks an invariant.

## Bots — `policies.ts`

| Bot         | How it plays                                                                                                                                    | Use                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `random`    | Any legal action, including shopping, sometimes ending the turn early                                                                           | Fuzzing: reaches states the others never do |
| `greedy`    | Blocks when about to be hit, otherwise attacks the weakest enemy; rests when hurt; avoids elites                                                | A simple baseline                           |
| `lookahead` | Searches every order of the hand each turn (`search.ts`), plans a route over the map, weighs event choices, shops, rates cards by their numbers | Balance numbers                             |

The lookahead search uses the engine's own pure functions and scores the position after the enemies' announced attacks. It plans one turn only and does not know what will be drawn, so it undervalues effects that pay off later. No bot knows anything about specific cards.

A new bot implements `Policy` (`types.ts`): choose a node, a card and target, a reward, an event choice, a rest action, a shop action.

## The report — `report.ts`

- Win rate with a 95% interval, average floor, turns, deck size and relics.
- Survival by floor and deaths by node type.
- Fights by node type and by encounter, sorted by health lost.
- Per card: offered, picked, bought, played, and the win-rate difference of runs that had it.
- Per relic: the same win-rate difference.
- All bots compared on the same seeds.

The card and relic tables show association, not effect: runs that go further collect more relics and see more cards. Use the impact experiments for single items.

## Experiments — `experiments.ts`

`runExperiment(seeds, policy, variants)` plays the seeds unchanged, then once per variant, and compares seed by seed. `withStartingRelic(id)` and `withStartingCard(baseId)` start every run with one extra item; any function that changes a fresh run can be a variant.

An extra card changes every shuffle of the run, so a variant typically wins some seeds the baseline lost and loses about as many. With 150 seeds, differences under about 8 win-rate points are noise.

## Invariants — `invariants.ts`

After every action the simulator checks the state: health, block, energy and gold within range; no duplicate relics; no card in two piles; combat piles made of the deck plus temporary copies; no dead enemy left in combat; every enemy with a card to play; out of combat, the whole deck in the draw pile and no leftover statuses; a map with somewhere to go; a valid random state. Up to five violations per run are reported with the seed and step that reproduce them.

## Reproducing a run

Runs are seeded, so a reported seed replays exactly:

```ts
import { simulateRun } from "./simulator";
import { lookaheadPolicy } from "./policies";

const result = await simulateRun(1234, lookaheadPolicy);
```

`result.fights` lists every combat with its encounter, turns and health lost.

## Results so far

Seeds 1–300, before the theme and content changes:

| Bot       | Win rate | 95% range  |
| --------- | -------- | ---------- |
| random    | 0.0%     | 0.0–1.3%   |
| greedy    | 13.7%    | 10.2–18.0% |
| lookahead | 64.7%    | 59.1–69.9% |

Relics that add energy every turn were worth +27 to +33 win-rate points; the weakest relics about +3. These numbers describe the placeholder content and will change with the original content.
