# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Headless simulator** (`src/sim`, `npm run simulate`, `npm run simulate:impact`): bots play seeded runs through the real store. Three bots (random, greedy, one-turn lookahead) are compared on the same seeds; the report gives win rate with a 95% interval, survival by floor, costliest encounters, and card and relic statistics. The state is checked against invariants after every action, and a run that can neither end nor continue is reported as stuck. Experiments start every run with one extra relic or card to measure its effect
- **Map generation**: path-based on a 7-column grid. Six routes from the first floor to the floor before the boss, stepping to the same or a neighbouring column and never crossing. Fixed floors (combat, treasure, rest, boss), weighted types elsewhere with floor limits, no repeated elite/rest/shop in a row, and a guaranteed shop and elite
- **Encounters by floor** (`src/engine/encounters.ts`): easy, normal and hard tiers plus dedicated elite encounters; `createEncounter` uses them
- **Victory screen** (`src/components/VictoryScreen.tsx`): run summary with floors climbed, combats won, health, gold, deck size, relics and seed. The store counts `combatsWon`, which is kept in the save
- **Event costs**: `getChoiceGoldCost` and `canChooseEventOption`; the store rejects and the event screen disables choices the player cannot pay for
- **Seeded runs**: the store keeps `seed` and `rngState`; every random pick in the engine, data generators and map generation takes the run's random source, so a run is reproducible from its seed. `startNewGame(seed?)` and `startNewRun(seed?)` accept a seed
- **Save and continue**: `src/store/saveGame.ts` writes a versioned snapshot to local storage while the run is on the map (`installAutosave`, called from `main.tsx`), and `loadSavedGame` restores it. Unreadable or other-version saves count as no save
- **`SeededRng`**: `createSeededRng` exposes its `state`, and `createSeededRng(rng.state)` continues the sequence
- **Trigger pipeline** (`src/engine/triggers.ts`): combat raises events (`combat_start`, `turn_start`, `turn_end`, `card_played`, `card_exhausted`, `hp_lost`, `block_gained`, `enemy_died`) and `dispatch` applies every power and relic effect that listens, powers first. Effects can raise further events; chains stop at a fixed depth
- **Combat counters**: per-combat bookkeeping in the store (`combat`) for attacks played this turn, once-per-combat effects, energy owed next turn and statuses that expire at turn end
- **Effect primitives** (`src/engine/effects.ts`): `takeDamage` and `getCardEffects`, shared by player cards, enemy cards, powers and relics
- **Data primitives**: `Card.exhaust`, `CardEffect.trigger` (ongoing power effect), `CardEffect.untilEndOfTurn`, `TargetType.RANDOM_ENEMY`, `EffectType.LOSE_HP`, `EffectType.FIRST_ATTACK_DAMAGE`, and relic conditions `cardType`, `oncePerCombat`, `nextTurn`, `ifNoAttacksThisTurn`
- **Data consistency test**: card and relic data may only use effect types and triggers the engine implements; entries whose text is not implemented are listed explicitly
- **Hand limit**: 10 cards

### Changed
- **Elites**: elite nodes no longer use a normal encounter with 1.5x health (`ELITE_HEALTH_MULTIPLIER` is removed)
- **Power cards**: the power left in play is derived from the card's triggered effects, so `src/data/powerCards.ts` no longer keeps a second copy of them
- **Legacy `damage`/`block` fields**: read in one place (`getCardEffects`) when resolving a card
- **`cardNeedsTarget`**: decided from card effects instead of a list of card ids
- **Relic and power damage**: goes through enemy Block
- `processRelicEffects` and `processPowerCardEffects` delegate to the pipeline

### Fixed
- **Status timing**: Weak and Vulnerable tick after the affected side has acted (enemies after their action, the player at the end of the enemy turn), so 1 stack lasts one turn
- **Block**: Combat-start block survives the first turn; block-loss limits (Calipers) are a relic effect type (`LIMIT_BLOCK_LOSS`) instead of negative block
- **Power cards**: Leave play when played instead of being discarded and redrawn
- **Targeting**: `playCard` rejects a targeted card without a living target, and targets the only enemy automatically
- **First-attack bonus**: Applies to one hit per card and before percentage modifiers
- **Upgrades**: Upgrades edit card effects, so upgraded base cards deal their shown numbers. The generic upgrade is +3 damage/block, or +1 on other numbers, or -1 cost when nothing else improves; descriptions are rewritten with the new numbers
- **Bosses**: Bosses use a boss deck (they used the Cultist deck), every enemy picks an opening card when combat starts, and boss selection uses 15-floor acts
- **Victory**: Defeating a boss ends the run on the victory screen
- **Floor tracking**: `currentFloor` follows the map node that was entered
- **Combat start**: Combats entered from the map now shuffle the deck, apply turn-start relic and power effects on turn 1, and deal the first hand immediately instead of after a timer
- **Events**: Upgrade-card and remove-card outcomes are implemented; losing the last health in an event ends the run
- **Unique ids**: Card, enemy and enemy-card instances use UUID-based ids instead of timestamps, which could collide
- **Shuffling**: Replaced the biased random-sort shuffle with Fisher-Yates
- **Victory cleanup**: All status effects are cleared when a combat is won
- **Relic offers**: Rewards, treasure and shops skip relics the player already owns; shops always stock two relics
- **Enemy turn**: An enemy turn in progress stops if the combat goes away (e.g. new run)
- **Flaky test**: The rarity weighting test uses a seeded random source

### Changed
- **Store**: `gameStore.ts` (1,950 lines) is split into slices (`run`, `map`, `combat`, `reward`, `shop`) that sequence pure rule functions in `src/engine`
- **Relic effects**: Turn-limited, draw and retaliation effects are driven by relic data (`onTurn`, effect type) instead of checks for specific relic ids
- **Card views**: Deck grid, reward and shop screens share `CardStatBadges`, which reads damage and block from card effects instead of per-card markup. Attack cards that had no badge before now show one
- **Combat-start relics**: `startCombat` applies them (previously only the map path did)
- **Logging**: Engine logging goes through `debugConsole` and is silent unless debug mode is on; ESLint forbids direct `console` use
- **Removed**: Unused store state and actions (`_resolveStep`, `resolveStep`, `originalDeckBeforeCombat`, `processBeforeAttackEffects`, `processAfterAttackEffects`, `processEnemyAttack`) and `processEventConsequence` (replaced by `src/engine/events.ts`)

### Tooling
- **CI**: Runs on pushes to `master` and on all pull requests (it previously only watched `main`, `develop` and `newCards`, so it never ran for the default branch); adds a build step, npm caching, a pinned Node version (`.nvmrc`) and cancels superseded runs
- **Type checking**: Test files are now type-checked
- **Coverage**: Floors for `src/engine` and `src/store`
- **Formatting**: `.gitattributes` and Prettier `endOfLine: auto` so the format check passes on Windows checkouts
- **Scripts**: `validate` only checks (it no longer rewrites files); `fix` applies lint and format fixes; `husky` and `prettier` moved to devDependencies
- **Tests**: 346 tests (from 273), with shared test factories and a seedable random source

## [1.26.0] - 2024-12-19

### Changed
- **Power Card Behavior**: Power cards are now discarded normally after use and remain available for future fights
- **Multiple Power Cards**: Multiple copies of the same power card can now be attached to the player, allowing for stacking effects
- **Deck Persistence**: Power cards stay in the deck and can be drawn and played in subsequent combats

### Fixed
- **Power Card Availability**: Power cards are no longer removed from the deck permanently after being played
- **Power Card Stacking**: Removed restriction that prevented multiple copies of the same power card from being active
- **Effect Double Application**: Fixed issue where power card effects were being applied twice (once from card effects, once from power card system)

### Added
- **Enhanced Power Card Tests**: Added comprehensive tests for power card stacking and deck persistence
- **Effect Stacking Test**: Added test to verify that multiple power cards properly stack their effects

### Technical Improvements
- **Power Card Logic**: Simplified power card attachment logic to always allow multiple copies
- **Card Flow**: Power cards now follow the same discard mechanics as other card types
- **Effect Processing**: Improved effect processing to prevent double application of immediate effects
- **Test Coverage**: Increased test coverage to 232 tests (from 231)

## [1.25.0] - 2024-12-19

### Fixed
- **Power Card Clearing**: Power cards are now properly cleared and discarded after each combat ends
- **Combat Flow**: Power cards no longer persist between different combats, following proper Slay the Spire mechanics

### Added
- **Power Card Tests**: Added comprehensive test to verify power cards are cleared after combat

### Technical Improvements
- **Combat End Logic**: Enhanced combat ending logic to properly clean up temporary effects and power cards
- **Test Coverage**: Increased test coverage to 229 tests (from 228)

## [1.24.0] - 2024-12-19

### Added
- **Damage Debug Panel**: Restored the damage debug panel that shows real-time player and enemy status information
- **Enhanced Card Descriptions**: Card descriptions now dynamically show actual damage values when modified by strength, weak, or other effects
- **Smart Damage Display**: Cards now display both base damage and actual damage (e.g., "Deal 8 (11) damage") when modifiers are active

### Fixed
- **Bash Card Display**: Bash card now correctly shows actual damage accounting for strength and other modifiers
- **Attack Card Accuracy**: All attack cards (bash, twin strike, anger) now display accurate damage values in real-time
- **Modifier Visibility**: Players can now see exactly how much damage their cards will deal before playing them

### Technical Improvements
- **Enhanced Card Utils**: Improved `getActualCardDamage` and `getEnhancedCardDescription` functions for better damage calculation
- **Real-time Updates**: Card damage displays update immediately when player status effects change
- **Debug Integration**: Damage debug panel integrates seamlessly with existing debug mode (toggle with 'D' key)

## [1.23.0] - 2024-12-19

### Fixed
- **Strength Mechanics**: Fixed strength to add exactly 1 damage per stack (was previously adding the full stack value)
- **Power Card Mechanics**: Power cards are now properly attached to the player instead of being discarded
- **Power Card Lookup**: Fixed power card definition lookup to use baseId instead of id

### Removed
- **Damage Debugger**: Removed the damage debugging system to simplify the codebase
- **Debug Panel Damage Tab**: Simplified debug panel by removing damage debugging features

### Added
- **Power Card Tests**: Added comprehensive tests for power card attachment and strength mechanics

### Technical Improvements
- **Clean Codebase**: Removed unused variables and imports for better maintainability
- **Type Safety**: Enhanced type safety throughout the damage calculation system
- **Test Coverage**: Increased test coverage from 219 to 223 tests

## [1.22.0] - 2024-12-19

### Major Features
- **Title Screen**: Added animated title screen with New Game and Continue buttons
- **Game Over Screen**: Added game over screen showing final statistics (health, gold, floor, relics)
- **Enhanced Debug System**: Comprehensive debug panel with 5 organized tabs (Player, Enemies, Cards, Game, Debug)

### Game Flow Improvements
- **Proper Game States**: Game now starts at title screen instead of jumping directly into combat
- **Save/Load System**: Basic save and load functionality for game continuation
- **Game Over Logic**: Automatic transition to game over screen when player health reaches 0

### Debug System Enhancements
- **Tabbed Interface**: Organized debug features into logical categories
- **Player Controls**: Heal, add energy, gold, block, strength, and status effect management
- **Enemy Controls**: Kill enemies, apply status effects, real-time status monitoring
- **Card Controls**: Add specific cards, random cards, draw cards, clear hand
- **Game Controls**: Phase changes, floor teleportation, combat reset, relic management
- **Real-time Monitoring**: Live display of game state, player stats, and status effects

### Technical Achievements
- **Test Coverage**: Maintained 100% test pass rate with 234 tests
- **Type Safety**: Enhanced TypeScript implementation with zero compilation errors
- **Performance**: Optimized rendering and state management
- **Code Quality**: Professional-grade code organization and documentation

### Previous Features (Maintained)
- **Card Mechanics**: Cleave double damage fix, Whirlwind energy consumption, Twin Strike mechanics
- **Unified Systems**: Card selection, targeting, and confirmation systems
- **UI Improvements**: Player health in header, CardGrid component, custom scrollbars
- **Rest Site**: Card upgrade functionality with proper state management
- **Enemy System**: Unique enemy IDs and proper intent handling

## [1.21.1] - Previous Release
- Previous features and improvements...