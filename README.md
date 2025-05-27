# Slay the Spire Clone

A roguelike deck-building card game inspired by Slay the Spire, built with React, TypeScript, and modern web technologies.

## 🎮 Game Features

### Current Implementation (Phase 2 - Enhanced Combat)
- ✅ **Core Game Architecture**: Complete game state management with Zustand
- ✅ **Advanced Card System**: Attack, Skill, and Power cards with complex effects
- ✅ **Enhanced Combat System**: Turn-based combat with status effects and targeting
- ✅ **Status Effects**: Vulnerable, Weak, Strength, Poison, and more
- ✅ **Targeting System**: Click-to-target with damage preview and vulnerable calculations
- ✅ **Map System**: Node-based progression with different encounter types (Combat, Elite, Boss, Shop, Rest, Events)
- ✅ **Deck Building**: Card rewards, deck persistence, and proper state management
- ✅ **Relics System**: Passive abilities with floating tooltips and rarity-based effects
- ✅ **UI Components**: Modern, responsive game interface with visual feedback
- ✅ **Player Management**: Health, energy, block, gold, and relic tracking
- ✅ **Enemy System**: Advanced enemy AI with intent display and elite encounters
- ✅ **Hand Management**: Proper card drawing, playing, and deck preservation

### Recent Bug Fixes (v2.1)
- 🔧 **Deck Preservation**: Fixed deck state management across all game phases
- 🔧 **Map Progression**: Fixed old nodes remaining available after advancing
- 🔧 **Targeting UX**: Removed obscuring overlay when selecting attack targets
- 🔧 **Anger Card**: Fixed Anger effect to properly add copies to discard pile
- 🔧 **Map Connectivity**: Improved map generation to ensure all nodes are reachable
- 🔧 **Elite Energy Bug**: Fixed energy not resetting properly for elite encounters
- 🔧 **Turn Indicator**: Moved to avoid collision with player area

### Planned Features (Future Phases)
- 🔄 **More Content**: Additional cards, enemies, and encounters
- 🔄 **Visual Polish**: Animations, particle effects, and improved graphics
- 🔄 **Audio**: Sound effects and background music
- 🔄 **Save System**: Progress persistence and multiple save slots
- 🔄 **Multiple Characters**: Different character classes with unique cards

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

## 🎯 How to Play

### Basic Gameplay
1. **Map Navigation**: Click on available nodes to progress through the spire
2. **Energy**: You start each turn with 3 energy to spend on cards
3. **Combat**: Use attack cards to damage enemies, skill cards for defense and utility
4. **Targeting**: Click attack cards, then click enemies to target them
5. **Status Effects**: Apply and manage various status effects for strategic advantage
6. **Deck Building**: Choose card rewards after combat to improve your deck
7. **Relics**: Collect powerful relics that provide passive benefits

### Card Types
- **Attack Cards** (Red): Deal damage to enemies, some with special effects
- **Skill Cards** (Blue): Provide utility effects like block, card draw, or status effects
- **Power Cards** (Yellow): Permanent effects that last the entire combat

### Node Types
- **Combat** (⚔️): Fight regular enemies
- **Elite** (⭐): Fight stronger enemies for better rewards
- **Boss** (👑): Major encounters with powerful foes
- **Rest** (🔥): Heal or upgrade cards
- **Shop** (💰): Buy cards, relics, or remove cards from your deck
- **Event** (❓): Random encounters with choices and consequences

### Status Effects
- **Vulnerable**: Take 50% more damage
- **Weak**: Deal 25% less damage
- **Strength**: Increase damage dealt
- **Poison**: Take damage at turn start
- **Block**: Absorb incoming damage

### Controls
- **Click cards** to select them for targeting
- **Click enemies** to target them with attack cards
- **Click "End Turn"** to end your turn
- **Hover over relics** to see detailed descriptions

## 🏗️ Project Structure

```
src/
├── components/          # React UI components
│   ├── GameBoard.tsx   # Main game layout with targeting system
│   ├── PlayerArea.tsx  # Player stats with relic tooltips
│   ├── EnemyArea.tsx   # Enemy display with damage preview
│   ├── HandArea.tsx    # Card hand with targeting mechanics
│   ├── GameUI.tsx      # Top bar with game controls
│   ├── MapView.tsx     # Map navigation interface
│   ├── CardRewardScreen.tsx  # Card selection after combat
│   ├── ShopScreen.tsx  # Shop interface
│   ├── RestScreen.tsx  # Rest site options
│   └── EventScreen.tsx # Random event handling
├── store/              # State management
│   └── gameStore.ts    # Zustand store with comprehensive game logic
├── types/              # TypeScript type definitions
│   ├── game.ts         # Core game interfaces and enums
│   └── map.ts          # Map and progression types
├── data/               # Game content
│   ├── cards.ts        # Comprehensive card definitions
│   ├── enemies.ts      # Enemy definitions with AI
│   ├── bosses.ts       # Boss encounters
│   ├── relics.ts       # Relic definitions and effects
│   └── events.ts       # Random event definitions
├── utils/              # Utility functions
│   ├── statusEffects.ts     # Status effect calculations
│   ├── mapGeneration.ts     # Map generation algorithms
│   ├── relicEffects.ts      # Relic effect processing
│   └── cardUpgrades.ts      # Card upgrade logic
├── __tests__/          # Test suites
│   ├── bugfixes.test.ts     # Bug fix verification tests
│   └── integration.test.ts  # Integration tests
├── App.tsx             # Main application component
└── main.tsx           # Application entry point
```

## 🧪 Testing

The project includes comprehensive test coverage:
- **133 tests** across 9 test files
- **Bug fix verification**: Tests for all major bug fixes
- **Integration tests**: End-to-end game flow testing
- **Unit tests**: Individual component and utility testing

Run tests with:
```bash
npm test
```

## 🛠️ Technology Stack

- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development with comprehensive type coverage
- **Zustand**: Lightweight state management for complex game state
- **Vite**: Fast development build tool with HMR
- **Vitest**: Fast unit testing framework
- **UUID**: Unique identifier generation for game entities

## 🎨 Design Philosophy

This project recreates the core mechanics of Slay the Spire while maintaining:
- **Clean Architecture**: Modular, maintainable code structure
- **Type Safety**: Full TypeScript coverage for robust development
- **Modern UI**: Responsive design with smooth interactions and visual feedback
- **Performance**: Optimized rendering and state management
- **Extensibility**: Easy to add new cards, enemies, and features
- **Test Coverage**: Comprehensive testing for reliability

## 🤝 Contributing

This is a learning project, but contributions are welcome! Areas where help would be appreciated:
- Additional card implementations
- Enemy AI improvements
- UI/UX enhancements
- Bug fixes and optimizations
- Test coverage improvements

## 📝 Development Roadmap

### Phase 1: Core Foundation ✅
- Basic game loop and state management
- Card playing mechanics
- Simple combat system

### Phase 2: Enhanced Combat ✅
- Status effects (Poison, Weak, Vulnerable, etc.)
- Advanced card effects and targeting
- Enemy variety and behaviors
- Map progression system
- Deck building mechanics
- Relic system

### Phase 3: Content Expansion 🔄
- More cards, enemies, and encounters
- Multiple character classes
- Advanced relics and synergies

### Phase 4: Polish & Features 🔄
- Visual effects and animations
- Sound and music integration
- Save/load system
- Endless mode and challenges

## 📄 License

MIT License - feel free to use this project for learning and experimentation!

---

**Note**: This is a fan project inspired by Slay the Spire and is not affiliated with Mega Crit Games. 