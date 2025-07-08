# Development Rules & Standards

## 🎯 Core Development Philosophy

This document establishes the foundational rules and standards for developing "Don't Slay the Spire" - a roguelike deck-building card game. These rules ensure code quality, maintainability, and future scalability.

## 📋 Table of Contents

1. [Testing Standards](#testing-standards)
2. [Modularity & Architecture](#modularity--architecture)
3. [Future-Proofing](#future-proofing)
4. [Change Management](#change-management)
5. [Reliability & Quality Assurance](#reliability--quality-assurance)
6. [Documentation Standards](#documentation-standards)
7. [Changelog Management](#changelog-management)
8. [Technology & Innovation](#technology--innovation)
9. [Visual & Mechanical Appeal](#visual--mechanical-appeal)
10. [Code Quality Standards](#code-quality-standards)

---

## 🧪 Testing Standards

### **RULE 1: Comprehensive Test Coverage**
- **Minimum 90% code coverage** for all new features
- **100% test coverage** for critical game logic (combat, damage calculation, status effects)
- **Integration tests** for all user workflows
- **Unit tests** for all utility functions and pure logic

### **RULE 2: Test Categories**
```typescript
// Required test categories for each feature:
✅ Unit Tests: Individual function behavior
✅ Integration Tests: Component interaction
✅ Game Logic Tests: Core mechanics validation
✅ Edge Case Tests: Boundary conditions
✅ Regression Tests: Bug fix verification
✅ Performance Tests: Critical path optimization
```

### **RULE 3: Test Naming & Organization**
```typescript
// File naming: feature-name.test.ts
// Test naming: should [expected behavior] when [condition]
describe('Card Playing System', () => {
  it('should reduce player energy when playing a card', () => {
    // Test implementation
  });
  
  it('should discard card after playing', () => {
    // Test implementation
  });
});
```

### **RULE 4: Test Data Management**
- Use **factory functions** for test data creation
- **Mock external dependencies** consistently
- **Reset state** between tests
- **Isolate tests** to prevent interference

---

## 🏗️ Modularity & Architecture

### **RULE 5: Component Architecture**
```typescript
// Follow single responsibility principle
// Each component should have one clear purpose
interface ComponentStructure {
  components: {
    // UI Components (Presentation)
    GameBoard: 'Main game layout',
    CardDisplay: 'Card rendering',
    EnemyDisplay: 'Enemy visualization',
    
    // Logic Components (Business Logic)
    GameLogic: 'Core game rules',
    CombatSystem: 'Battle mechanics',
    DeckManager: 'Card management',
    
    // Data Components (State)
    GameStore: 'Global state management',
    CardData: 'Card definitions',
    EnemyData: 'Enemy definitions'
  }
}
```

### **RULE 6: Separation of Concerns**
- **UI Layer**: React components, styling, user interaction
- **Logic Layer**: Game mechanics, calculations, rules
- **Data Layer**: State management, data structures, persistence
- **Utility Layer**: Helper functions, pure logic, calculations

### **RULE 7: Module Boundaries**
```typescript
// Clear import/export boundaries
// No circular dependencies
// Explicit dependency injection

// ✅ Good: Clear module boundaries
import { Card } from '../types/game';
import { calculateDamage } from '../utils/combat';
import { CardDisplay } from '../components/CardDisplay';

// ❌ Bad: Circular dependencies
// components/CardDisplay.tsx imports from utils/combat.ts
// utils/combat.ts imports from components/CardDisplay.tsx
```

### **RULE 8: Interface Design**
```typescript
// Define clear contracts between modules
interface GameSystem {
  // Core game systems
  combat: CombatSystem;
  deck: DeckSystem;
  progression: ProgressionSystem;
  
  // Data systems
  cards: CardDataSystem;
  enemies: EnemyDataSystem;
  relics: RelicDataSystem;
}
```

---

## 🔮 Future-Proofing

### **RULE 9: Extensibility First**
```typescript
// Design for future expansion
interface ExtensibleCard {
  id: string;
  name: string;
  type: CardType;
  effects: CardEffect[]; // Array allows multiple effects
  upgrades?: CardUpgrade[]; // Optional upgrade paths
  synergies?: string[]; // Future synergy system
}

interface CardEffect {
  type: EffectType;
  value: number;
  conditions?: EffectCondition[]; // Future conditional effects
  modifiers?: EffectModifier[]; // Future effect modifiers
}
```

### **RULE 10: Configuration-Driven Design**
```typescript
// Use configuration files for game balance
// Easy to modify without code changes
const GAME_CONFIG = {
  startingHealth: 80,
  startingEnergy: 3,
  deckSize: 10,
  statusEffects: {
    vulnerable: { damageMultiplier: 1.5 },
    weak: { damageMultiplier: 0.75 },
    poison: { damagePerTurn: 1 }
  }
};
```

### **RULE 11: Plugin Architecture**
```typescript
// Design for plugin system
interface GamePlugin {
  name: string;
  version: string;
  initialize: (game: GameState) => void;
  hooks: {
    onCardPlay?: (card: Card, context: GameContext) => void;
    onCombatStart?: (enemies: Enemy[]) => void;
    onTurnEnd?: (player: Player) => void;
  };
}
```

### **RULE 12: Version Compatibility**
- **Semantic versioning** for all APIs
- **Backward compatibility** for save files
- **Migration scripts** for data format changes
- **Feature flags** for gradual rollouts

---

## 📝 Change Management

### **RULE 13: Change Documentation**
```typescript
// Every change must be documented
/**
 * @change v1.27.0 - Power Card Stacking Enhancement
 * @reason Improve strategic depth and player choice
 * @impact High - Changes core power card mechanics
 * @breaking No - Backward compatible
 * @testing Required - New tests for stacking behavior
 */
export function processPowerCardEffects(player: Player, card: Card): void {
  // Implementation with detailed comments
}
```

### **RULE 14: Change Impact Assessment**
Before implementing any change, answer:
- **What** is being changed?
- **Why** is this change necessary?
- **How** will this affect existing functionality?
- **Who** will be impacted by this change?
- **When** should this change be deployed?

### **RULE 15: Change Validation**
```typescript
// Validate changes with tests
describe('Power Card Stacking Changes', () => {
  it('should allow multiple copies of the same power card', () => {
    // Test implementation
  });
  
  it('should properly stack power card effects', () => {
    // Test implementation
  });
  
  it('should maintain backward compatibility', () => {
    // Test implementation
  });
});
```

---

## 🛡️ Reliability & Quality Assurance

### **RULE 16: Error Handling**
```typescript
// Comprehensive error handling
function processCardEffect(card: Card, target: Target): Result<Effect, Error> {
  try {
    // Validate inputs
    if (!card || !target) {
      return Result.err(new Error('Invalid card or target'));
    }
    
    // Process effect
    const effect = calculateEffect(card, target);
    
    // Validate output
    if (!isValidEffect(effect)) {
      return Result.err(new Error('Invalid effect generated'));
    }
    
    return Result.ok(effect);
  } catch (error) {
    return Result.err(new Error(`Card effect processing failed: ${error.message}`));
  }
}
```

### **RULE 17: Input Validation**
```typescript
// Validate all inputs at boundaries
interface ValidationRules {
  cardId: 'Must be valid UUID format',
  damage: 'Must be non-negative integer',
  energy: 'Must be between 0 and max energy',
  health: 'Must be between 0 and max health',
  statusEffects: 'Must be valid status effect types'
}
```

### **RULE 18: State Consistency**
```typescript
// Ensure game state remains consistent
function validateGameState(state: GameState): ValidationResult {
  const errors: string[] = [];
  
  // Validate player state
  if (state.player.health > state.player.maxHealth) {
    errors.push('Player health exceeds max health');
  }
  
  // Validate deck consistency
  const totalCards = state.drawPile.length + state.discardPile.length + state.hand.length;
  if (totalCards !== state.player.deckSize) {
    errors.push('Deck size mismatch');
  }
  
  return { isValid: errors.length === 0, errors };
}
```

### **RULE 19: Performance Monitoring**
```typescript
// Monitor critical performance metrics
interface PerformanceMetrics {
  frameRate: number; // Target: 60 FPS
  memoryUsage: number; // Target: < 100MB
  renderTime: number; // Target: < 16ms
  gameLogicTime: number; // Target: < 8ms
}
```

---

## 📚 Documentation Standards

### **RULE 20: Code Documentation**
```typescript
/**
 * Processes a card's effects when played during combat.
 * 
 * @param card - The card being played
 * @param target - The target of the card effect
 * @param context - Current game context (player, enemies, etc.)
 * 
 * @returns Promise<CardResult> - The result of playing the card
 * 
 * @example
 * ```typescript
 * const result = await playCard(bashCard, enemy, gameContext);
 * if (result.success) {
 *   console.log(`Dealt ${result.damage} damage`);
 * }
 * ```
 * 
 * @throws {InvalidTargetError} When target is invalid for card type
 * @throws {InsufficientEnergyError} When player lacks energy to play card
 * 
 * @since v1.25.0
 * @author Development Team
 */
async function playCard(card: Card, target: Target, context: GameContext): Promise<CardResult> {
  // Implementation
}
```

### **RULE 21: Architecture Documentation**
```markdown
# Game Architecture Overview

## Core Systems
- **Combat System**: Handles turn-based combat mechanics
- **Deck System**: Manages card drawing, shuffling, and deck state
- **Progression System**: Handles map navigation and run progression

## Data Flow
1. User Action → UI Component
2. UI Component → Game Store Action
3. Game Store Action → Game Logic
4. Game Logic → State Update
5. State Update → UI Re-render

## State Management
- **Zustand Store**: Global game state
- **Local State**: Component-specific state
- **Persistence**: Save/load functionality
```

### **RULE 22: API Documentation**
```typescript
// Document all public APIs
export interface GameAPI {
  /**
   * Starts a new game run
   * @param options - Game configuration options
   */
  startNewRun(options?: GameOptions): void;
  
  /**
   * Plays a card during combat
   * @param cardId - ID of the card to play
   * @param targetId - ID of the target (optional for some cards)
   */
  playCard(cardId: string, targetId?: string): void;
  
  /**
   * Ends the current turn
   */
  endTurn(): void;
}
```

---

## 📋 Changelog Management

### **RULE 23: Changelog Structure**
```markdown
## [Version] - YYYY-MM-DD

### Added
- New features and functionality

### Changed
- Modifications to existing features

### Fixed
- Bug fixes and corrections

### Removed
- Deprecated or removed features

### Technical Improvements
- Code quality, performance, or architectural improvements

### Breaking Changes
- Changes that require migration or break existing functionality
```

### **RULE 24: Version Numbering**
- **Major.Minor.Patch** (Semantic Versioning)
- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

### **RULE 25: Release Notes**
```markdown
# Release Notes v1.27.0

## 🎮 New Features
- **Power Card Stacking**: Multiple copies of power cards now stack their effects
- **Enhanced Tooltips**: Improved card and relic descriptions

## 🔧 Improvements
- **Performance**: 20% faster combat processing
- **UI**: Smoother animations and better visual feedback

## 🐛 Bug Fixes
- Fixed power card effects being applied twice
- Corrected strength mechanics calculation

## 📊 Technical Details
- Test coverage: 95% (up from 92%)
- Bundle size: 2.1MB (down from 2.3MB)
- Performance: 60 FPS maintained during combat
```

---

## 🚀 Technology & Innovation

### **RULE 26: Framework Selection**
```typescript
// Use cutting-edge, well-maintained frameworks
const TECHNOLOGY_STACK = {
  // Core Framework
  react: '^18.2.0', // Latest stable React
  typescript: '^5.2.2', // Latest TypeScript
  
  // State Management
  zustand: '^4.4.7', // Lightweight, modern state management
  
  // Build Tools
  vite: '^5.0.8', // Fast, modern build tool
  vitest: '^3.1.4', // Fast testing framework
  
  // Animation
  framerMotion: '^10.16.16', // Modern animation library
  
  // Development
  eslint: '^8.55.0', // Code quality
  prettier: 'latest' // Code formatting
};
```

### **RULE 27: Performance Optimization**
```typescript
// Implement performance best practices
const PERFORMANCE_RULES = {
  // React Optimization
  useMemo: 'For expensive calculations',
  useCallback: 'For function references',
  React.memo: 'For component memoization',
  
  // Rendering Optimization
  virtualScrolling: 'For large lists',
  lazyLoading: 'For non-critical components',
  codeSplitting: 'For route-based splitting',
  
  // Game-Specific
  frameRate: 'Target 60 FPS',
  memoryUsage: 'Monitor and optimize',
  bundleSize: 'Keep under 3MB'
};
```

### **RULE 28: Modern JavaScript Features**
```typescript
// Use latest language features
const MODERN_FEATURES = {
  // ES2022+ Features
  optionalChaining: '?.',
  nullishCoalescing: '??',
  topLevelAwait: 'await',
  
  // TypeScript Features
  strictMode: 'enabled',
  noImplicitAny: 'enabled',
  strictNullChecks: 'enabled',
  
  // React Features
  hooks: 'functional components only',
  concurrentFeatures: 'when stable',
  suspense: 'for loading states'
};
```

---

## 🎨 Visual & Mechanical Appeal

### **RULE 29: Visual Design Standards**
```typescript
// Maintain consistent visual design
const DESIGN_SYSTEM = {
  // Color Palette
  colors: {
    primary: '#4A90E2', // Blue for cards
    secondary: '#F5A623', // Orange for energy
    success: '#7ED321', // Green for health
    danger: '#D0021B', // Red for damage
    warning: '#F5A623', // Yellow for status effects
    neutral: '#9B9B9B' // Gray for disabled states
  },
  
  // Typography
  fonts: {
    primary: 'Inter, sans-serif',
    secondary: 'Roboto Mono, monospace'
  },
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  
  // Animation
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};
```

### **RULE 30: User Experience Standards**
```typescript
// Ensure excellent user experience
const UX_STANDARDS = {
  // Responsiveness
  targetFrameRate: 60,
  maxInputLag: 100, // milliseconds
  
  // Accessibility
  keyboardNavigation: 'Full keyboard support',
  screenReader: 'ARIA labels and descriptions',
  colorContrast: 'WCAG AA compliance',
  
  // Feedback
  visualFeedback: 'Immediate response to actions',
  audioFeedback: 'Optional sound effects',
  hapticFeedback: 'Mobile vibration support',
  
  // Information
  tooltips: 'Contextual help and information',
  tutorials: 'Progressive learning system',
  errorMessages: 'Clear, actionable feedback'
};
```

### **RULE 31: Game Balance**
```typescript
// Maintain balanced gameplay
const BALANCE_PRINCIPLES = {
  // Card Balance
  cardCosts: 'Energy costs proportional to effect power',
  cardRarity: 'Rare cards more powerful but situational',
  cardSynergies: 'Encourage strategic deck building',
  
  // Combat Balance
  enemyScaling: 'Progressive difficulty increase',
  rewardScaling: 'Better rewards for harder encounters',
  riskReward: 'High-risk, high-reward choices',
  
  // Progression Balance
  runLength: '30-60 minutes per run',
  difficultyCurve: 'Smooth progression from easy to hard',
  replayability: 'Multiple viable strategies'
};
```

---

## 🔧 Code Quality Standards

### **RULE 32: Code Style**
```typescript
// Follow consistent code style
const CODE_STYLE = {
  // Naming Conventions
  variables: 'camelCase',
  functions: 'camelCase',
  classes: 'PascalCase',
  constants: 'UPPER_SNAKE_CASE',
  interfaces: 'PascalCase',
  
  // File Organization
  imports: 'Grouped and sorted',
  exports: 'Named exports preferred',
  structure: 'Logical grouping of related code',
  
  // Comments
  documentation: 'JSDoc for public APIs',
  inline: 'Explain complex logic',
  todos: 'Track future improvements'
};
```

### **RULE 33: Code Review Standards**
```typescript
// Code review checklist
const REVIEW_CHECKLIST = {
  // Functionality
  'Does the code work as intended?': 'Test all scenarios',
  'Are edge cases handled?': 'Validate boundary conditions',
  'Is error handling appropriate?': 'Graceful failure modes',
  
  // Quality
  'Is the code readable?': 'Clear variable names and structure',
  'Is the code maintainable?': 'Modular and well-organized',
  'Are there any code smells?': 'Refactor if necessary',
  
  // Testing
  'Are tests comprehensive?': 'Cover all code paths',
  'Do tests pass?': 'All tests must pass',
  'Are tests maintainable?': 'Clear test structure',
  
  // Performance
  'Is performance acceptable?': 'No obvious bottlenecks',
  'Is memory usage reasonable?': 'No memory leaks',
  'Is bundle size optimized?': 'Minimal impact on size'
};
```

### **RULE 34: Refactoring Standards**
```typescript
// When and how to refactor
const REFACTORING_RULES = {
  // When to Refactor
  codeDuplication: 'Extract common functionality',
  longFunctions: 'Break into smaller functions',
  complexLogic: 'Simplify and clarify',
  performanceIssues: 'Optimize bottlenecks',
  
  // How to Refactor
  incremental: 'Small, safe changes',
  tested: 'Maintain test coverage',
  documented: 'Update documentation',
  reviewed: 'Peer review required'
};
```

---

## 🎯 Implementation Checklist

### Before Starting Development
- [ ] **Requirements Analysis**: Understand the feature requirements
- [ ] **Design Review**: Plan the implementation approach
- [ ] **Test Planning**: Define test cases and scenarios
- [ ] **Documentation Plan**: Plan what needs to be documented

### During Development
- [ ] **Follow Coding Standards**: Adhere to style and quality guidelines
- [ ] **Write Tests First**: TDD approach for critical logic
- [ ] **Regular Commits**: Small, focused commits with clear messages
- [ ] **Self-Review**: Review your own code before submitting

### Before Release
- [ ] **Code Review**: Peer review completed
- [ ] **Testing**: All tests pass, coverage adequate
- [ ] **Documentation**: Updated and accurate
- [ ] **Changelog**: Updated with all changes
- [ ] **Performance**: Meets performance targets
- [ ] **Accessibility**: Meets accessibility standards

### After Release
- [ ] **Monitor Performance**: Track key metrics
- [ ] **Gather Feedback**: User feedback and bug reports
- [ ] **Plan Improvements**: Based on feedback and metrics
- [ ] **Update Documentation**: Based on lessons learned

---

## 📞 Questions for Reliability Improvement

### Before Implementing Features
1. **What could go wrong?** - Identify potential failure points
2. **How will this affect existing functionality?** - Assess impact
3. **What edge cases need to be handled?** - Consider boundary conditions
4. **How will this scale?** - Consider future growth
5. **What are the performance implications?** - Monitor resource usage

### During Development
1. **Is this the simplest solution?** - Prefer simplicity over complexity
2. **How will this be tested?** - Ensure testability
3. **Is this maintainable?** - Consider long-term maintenance
4. **Does this follow our patterns?** - Maintain consistency
5. **What documentation is needed?** - Plan documentation

### Before Release
1. **Have all tests passed?** - Ensure quality
2. **Is performance acceptable?** - Meet performance targets
3. **Is the user experience good?** - Validate UX
4. **Are there any security concerns?** - Security review
5. **Is this ready for production?** - Final validation

---

## 🏆 Success Metrics

### Code Quality Metrics
- **Test Coverage**: > 90%
- **Code Duplication**: < 5%
- **Cyclomatic Complexity**: < 10 per function
- **Maintainability Index**: > 70

### Performance Metrics
- **Frame Rate**: 60 FPS
- **Load Time**: < 3 seconds
- **Memory Usage**: < 100MB
- **Bundle Size**: < 3MB

### User Experience Metrics
- **User Engagement**: Session length, retention
- **Error Rate**: < 1%
- **Performance**: Smooth gameplay
- **Accessibility**: WCAG AA compliance

### Development Metrics
- **Release Frequency**: Regular, predictable releases
- **Bug Rate**: Low post-release bugs
- **Feature Velocity**: Consistent delivery
- **Team Satisfaction**: High developer morale

---

*This document is a living guide that should be updated as the project evolves. All team members are responsible for following these rules and suggesting improvements.* 