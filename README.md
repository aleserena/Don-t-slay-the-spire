# Don't Slay the Spire 🗡️

A roguelike deck-building card game inspired by Slay the Spire, built with React, TypeScript, and modern web technologies.

## 🎮 Game Overview

**Don't Slay the Spire** is a strategic card game where you:
- Build a deck of powerful cards through your journey
- Battle increasingly difficult enemies with unique abilities
- Collect relics that provide permanent passive effects
- Navigate a branching map to choose your path
- Experience procedurally generated runs with different strategies

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** 2.30.0 or higher

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd "Don't slay the spire"

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Available Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # Run TypeScript type checking
npm run validate     # Run all quality checks

# Documentation
npm run docs         # Generate documentation
npm run docs:serve   # Serve documentation locally

# Analysis
npm run analyze      # Analyze bundle size
```

## 🏗️ Architecture Overview

### Core Components

```
src/
├── components/          # React UI components
│   ├── GameBoard.tsx    # Main game interface
│   ├── PlayerArea.tsx   # Player stats and hand
│   ├── EnemyArea.tsx    # Enemy display and intents
│   ├── MapView.tsx      # Map navigation
│   └── ...              # Other UI components
├── store/
│   └── gameStore.ts     # Main game state management (Zustand)
├── data/                # Game data definitions
│   ├── cards.ts         # Player card definitions
│   ├── enemies.ts       # Enemy definitions
│   ├── relics.ts        # Relic definitions
│   └── ...              # Other game data
├── types/
│   ├── game.ts          # Core game type definitions
│   └── map.ts           # Map-related types
├── utils/               # Game logic utilities
│   ├── statusEffects.ts # Status effect processing
│   ├── cardUtils.ts     # Card-related utilities
│   └── ...              # Other utilities
└── __tests__/           # Test files
```

### Key Technologies

- **React 18** - UI framework with hooks
- **TypeScript** - Type-safe JavaScript
- **Zustand** - Lightweight state management
- **Vite** - Fast build tool and dev server
- **Vitest** - Unit testing framework
- **ESLint + Prettier** - Code quality and formatting

### State Management

The game uses **Zustand** for state management with a single store (`gameStore.ts`) that contains:

- **Game State**: Player, enemies, deck, hand, current phase
- **UI State**: Modals, card selection, debug mode
- **Actions**: All game interactions (play cards, end turn, etc.)

```typescript
// Example usage
const { player, enemies, hand } = useGameStore();
const { playCard, endTurn } = useGameStore();

// Play a card
playCard('strike', 'enemy_1');
```

## 🧪 Testing Strategy

### Test Coverage Requirements
- **Minimum 90% coverage** for all new features
- **TDD approach** - write tests first, then implementation
- **Comprehensive testing** of game logic, edge cases, and UI interactions

### Test Categories
- **Unit Tests**: Individual functions and utilities
- **Integration Tests**: Component interactions
- **Game Logic Tests**: Combat mechanics, card effects, status effects
- **Edge Case Tests**: Error conditions and boundary cases

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/__tests__/gameStore.test.ts

# Watch mode for development
npm run test:watch
```

## 📚 Development Guidelines

### Code Quality Standards
- **ESLint** enforces code style and catches errors
- **Prettier** ensures consistent formatting
- **TypeScript** provides type safety
- **Pre-commit hooks** run quality checks automatically

### Documentation Standards
- **JSDoc comments** for all public APIs
- **README files** for major components
- **Inline comments** for complex logic
- **Type definitions** for all data structures

### Git Workflow
1. **Feature branches** for new development
2. **Conventional commits** for clear history
3. **Pull requests** with comprehensive reviews
4. **Automated CI/CD** for quality assurance

### Automated Quality Checks
The project includes automated quality checks that run:
- **On every commit** (pre-commit hooks)
- **On every push** (GitHub Actions CI)
- **Before merging** (PR checks)

These checks ensure:
- ✅ All tests pass
- ✅ Code is properly formatted
- ✅ No linting errors
- ✅ TypeScript compilation succeeds
- ✅ Test coverage meets requirements

## 🎯 Game Mechanics

### Core Systems

#### Cards
- **Attack Cards**: Deal damage to enemies
- **Skill Cards**: Provide utility, block, or status effects
- **Power Cards**: Provide ongoing effects across turns

#### Combat
- **Turn-based system** with player and enemy phases
- **Energy system** for playing cards
- **Block system** for damage reduction
- **Status effects** for buffs and debuffs

#### Progression
- **Map navigation** with different node types
- **Card rewards** after combat victories
- **Relic collection** for permanent bonuses
- **Shop system** for purchasing upgrades

### Status Effects
- **Poison**: Deals damage over time
- **Weak**: Reduces damage dealt
- **Vulnerable**: Increases damage taken
- **Strength**: Increases damage dealt
- **Dexterity**: Increases block generated

## 🔧 Development Workflow

### For New Developers

1. **Setup Environment**
   ```bash
   git clone <repository-url>
   cd "Don't slay the spire"
   npm install
   npm run dev
   ```

2. **Understand the Codebase**
   - Start with `src/types/game.ts` for data structures
   - Review `src/store/gameStore.ts` for game logic
   - Explore `src/components/` for UI components

3. **Make Changes**
   - Create a feature branch: `git checkout -b feature/new-feature`
   - Write tests first (TDD approach)
   - Implement functionality
   - Ensure all quality checks pass

4. **Submit Changes**
   - Commit with conventional format: `feat: add new card type`
   - Push and create a pull request
   - Ensure CI checks pass

### For Contributors

- **Follow the development rules** in `DEVELOPMENT_RULES.md`
- **Write comprehensive tests** for all new features
- **Document all public APIs** with JSDoc
- **Maintain 90%+ test coverage**
- **Use conventional commits** for clear history

## 📖 Documentation

### Key Documents
- **[DEVELOPMENT_RULES.md](DEVELOPMENT_RULES.md)** - Comprehensive development standards
- **[DEVELOPMENT_TOOLS.md](DEVELOPMENT_TOOLS.md)** - Tools and automation setup
- **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** - Quick implementation guide
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes

### API Documentation
- **TypeScript definitions** in `src/types/`
- **JSDoc comments** throughout the codebase
- **Generated docs** via `npm run docs`

## 🐛 Debugging

### Debug Mode
Enable debug mode in the game to access:
- **Damage calculation details**
- **Status effect processing**
- **Card effect debugging**
- **State inspection tools**

### Common Issues
- **Type errors**: Run `npm run type-check`
- **Linting issues**: Run `npm run lint:fix`
- **Test failures**: Check test output for specific errors
- **Build issues**: Ensure all dependencies are installed

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Before Contributing
1. Read the [Development Rules](DEVELOPMENT_RULES.md)
2. Set up your development environment
3. Familiarize yourself with the codebase
4. Write tests for your changes

### Code Review Process
1. **Automated checks** must pass
2. **Test coverage** must remain above 90%
3. **Documentation** must be updated
4. **Code review** by maintainers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by **Slay the Spire** by MegaCrit
- Built with modern web technologies
- Community-driven development

---

**Happy coding! 🎮✨** 