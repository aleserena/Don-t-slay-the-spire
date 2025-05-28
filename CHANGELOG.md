# Changelog

All notable changes to the Slay the Spire Clone project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-19

### Added
- **One Node Per Floor Rule**: Enforced strategic map progression
  - Only one node per floor can now be visited
  - Completing a node disables all other nodes on the same floor
  - Enhanced strategic decision-making in map progression
- **Comprehensive Test Coverage**: Added test for new node availability behavior
  - New test verifies one-node-per-floor functionality
  - Increased test count to 135 tests with full coverage

### Fixed
- **Map Node Availability**: Fixed node availability to enforce one node per floor rule
  - Maintains proper game progression by only allowing advancement to the next floor
  - Updated test suite to verify the new behavior
  - Ensures strategic decision-making in map progression
- **CSS Grid Typo**: Fixed typo in MapView.tsx gridTemplateColumns property
  - Changed 'minWidth' to 'minmax' for proper CSS grid functionality
  - Fixes layout issues in deck view modal
- **Code Quality**: Cleaned up TypeScript warnings and unused variables
  - Removed unused imports and variables in test files
  - Added underscore prefix to intentionally unused parameters
  - Fixed all TypeScript strict mode warnings
  - Improved code maintainability and build reliability

### Enhanced
- **Card Readability Improvements**: Propagated improved card styling across all game interfaces
  - Applied enhanced damage/block indicators to discard pile modal
  - Updated deck view modal with improved card readability
  - Enhanced card reward screen with better damage/block visibility
  - Improved shop card display with consistent damage/block indicators
  - Added special handling for Body Slam card across all interfaces
- **Layout Improvements**: Better positioning and centering of game elements
  - Centered player and enemy areas with increased padding
  - Improved VS indicator positioning
  - Enhanced hand area padding for better card positioning
  - Added maximum width constraint with auto-centering for large screens
- **Visual Consistency**: Standardized card appearance across all game screens
  - Consistent damage indicators with red background and sword icon
  - Consistent block indicators with blue background and shield icon
  - Uniform hover effects and transitions across all card displays

## [1.0.0] - 2024-12-18

### Added
- **Complete Game Foundation**: Full Slay the Spire clone implementation
  - Core game architecture with Zustand state management
  - Advanced card system with Attack, Skill, and Power cards
  - Enhanced combat system with turn-based mechanics and targeting
  - Comprehensive status effects system (Vulnerable, Weak, Strength, Poison)
  - Map system with node-based progression and different encounter types
  - Deck building mechanics with card rewards and persistence
  - Relics system with passive abilities and floating tooltips
  - Modern, responsive UI with visual feedback
  - Player management (health, energy, block, gold, relics)
  - Advanced enemy AI with intent display and elite encounters
  - Proper hand management with card drawing and deck preservation

### Fixed
- **Targeting UI Issues**: Fixed yellow targeting line appearing over damage calculation box
- **Relic Effect Integration**: Enhanced damage calculation system to properly show relic effects
- **Bronze Scales Relic Effect**: Implemented missing Bronze Scales functionality
- **Centennial Puzzle Relic Effect**: Implemented missing Centennial Puzzle functionality
- **Bag of Marbles Relic Effect**: Fixed Bag of Marbles not applying vulnerable to enemies
- **Card Persistence Bug**: Fixed cards created during battle persisting after combat
- **Shop Power Card Color**: Fixed incorrect power card color in shop interface
- **Enemy Tooltip Visibility**: Enhanced enemy tooltip z-index for better visibility
- **Enemy Block Timing**: Fixed enemy block reset timing
- **Treasure Node Rewards**: Added missing relic rewards for treasure nodes
- **Cleave Card Issues**: Fixed Cleave card implementation
- **Akabeko Relic Effect**: Implemented missing Akabeko effect
- **Intent Damage Display**: Fixed enemy intent damage to show final calculated damage
- **Block Reset Timing**: Fixed block reset to occur at start of player turn only
- **Twin Strike Damage Preview**: Fixed damage calculation for multi-hit cards
- **Armaments Card Effect**: Implemented missing upgrade functionality
- **Status Effect & Intent Tooltips**: Fixed tooltip visibility issues
- **Poison Death Bug**: Fixed enemies not dying when poison reduces health to 0
- **Status Effect Persistence**: Fixed status effects not clearing at end of combat
- **Body Slam Card**: Fixed Body Slam dealing 0 damage
- **Enemy Tooltips**: Fixed enemy intent and status effect tooltips not showing
- **Card Readability**: Improved damage and block visibility on cards

### Enhanced
- **Relic System Integration**: Comprehensive relic effect processing improvements
- **Combat Mechanics**: Enhanced damage calculation and status effect processing
- **Card Visual Design**: Comprehensive card appearance improvements
- **Tooltip System**: Robust tooltip implementation using React portals
- **Combat Mechanics**: Proper status effect lifecycle management

### Technical
- **Game State Management**: Enhanced combat state tracking
- **Card System Improvements**: Refactored card damage system
- **Relic System**: Implemented comprehensive relic effect processing
- **UI/UX Enhancements**: Improved damage preview and tooltip systems
- **Test Coverage**: Updated test suite to handle new card mechanics
- **Game Mechanics**: Enhanced card effect system with new upgrade functionality

## [0.1.0] - 2024-12-17

### Added
- **Initial Project Setup**: Basic project structure and development environment
  - React 18 with TypeScript and Vite
  - Zustand for state management
  - Vitest for testing framework
  - Basic game architecture and component structure
- **Core Game Loop**: Fundamental game mechanics implementation
  - Basic card playing system
  - Simple combat mechanics
  - Initial deck management
  - Basic UI components and layout

---

**Note**: This project follows [Semantic Versioning](https://semver.org/). Version 1.0.0 represents the first stable release with complete core functionality. Version 1.1.0 adds strategic gameplay improvements and code quality enhancements. 