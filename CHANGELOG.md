# Changelog

All notable changes to this project will be documented in this file.

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