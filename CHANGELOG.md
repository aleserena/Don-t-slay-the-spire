# Changelog

All notable changes to this project will be documented in this file.

## [1.22.0] - 2024-12-19

### Added
- **Title Screen**: New title screen with "New Game" and "Continue" buttons
- **Game Over Screen**: Comprehensive game over screen with final statistics and action buttons
- **Game Flow**: Proper game state management from title → game → game over → title
- **Player Death Detection**: Game automatically transitions to game over when player health reaches 0
- **UI Improvements**: 
  - Reusable CardGrid component for consistent card displays across all modals
  - Fixed card sizing to maintain consistent dimensions (140x200px)
  - 3 cards per row layout with proper centering
  - Removed horizontal scroll from card grids
  - Custom scrollbar styling across the project (subtle, transparent)
  - Text shadows on all card descriptions for better readability
  - Header reorganization: Health on left, View Deck in center, Gold on right
  - Relic prices moved above names in shop
  - Card removal modal now matches deck view styling

### Fixed
- **Card Grid Layout**: All card views (deck, discard, upgrade, removal) now use the same base component
- **Scrollbar Appearance**: Consistent, subtle scrollbar styling throughout the application
- **Card Display Consistency**: Unified visual style across all card interaction modals
- **Text Readability**: Added shadows to improve text visibility on cards

### Technical
- Added TITLE and GAME_OVER phases to GamePhase enum
- Implemented proper game state transitions
- Created reusable CardGrid component to reduce code duplication
- Added global CSS for consistent scrollbar styling
- Enhanced game store with title screen and game over functionality

### UI/UX
- Beautiful animated title screen with floating background elements
- Detailed game over screen showing final statistics (health, gold, floor, relics)
- Improved card grid layouts with better spacing and visual consistency
- Enhanced readability with text shadows on card descriptions
- More intuitive header layout with logical grouping of elements

## [1.21.1] - Previous Release
- Previous features and improvements...