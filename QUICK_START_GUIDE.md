# Quick Start Guide - Development Rules Implementation

## 🚀 Immediate Actions (First 30 Minutes)

### 1. Install Required Tools
```bash
# Install development dependencies
npm install --save-dev @commitlint/cli @commitlint/config-conventional
npm install --save-dev husky lint-staged prettier
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install --save-dev eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y
npm install --save-dev rollup-plugin-visualizer

# Install Husky git hooks
npx husky install
npx husky add .husky/pre-commit "npm run pre-commit"
npx husky add .husky/commit-msg "npx --no -- commitlint --edit \$1"
```

### 2. Update package.json Scripts
Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "validate": "npm run lint && npm run format:check && npm run type-check && npm run test:coverage",
    "pre-commit": "npm run validate"
  }
}
```

### 3. Create Configuration Files
Copy the configuration files from `DEVELOPMENT_TOOLS.md`:
- `.eslintrc.cjs`
- `.prettierrc`
- `.commitlintrc.js`
- `vitest.config.ts`

## 📋 Daily Development Workflow

### Before Starting Work
1. **Pull latest changes**: `git pull origin main`
2. **Run validation**: `npm run validate`
3. **Check current test coverage**: `npm run test:coverage`

### During Development
1. **Write tests first** (TDD approach)
2. **Follow naming conventions**:
   - Files: `kebab-case.ts`
   - Functions: `camelCase`
   - Components: `PascalCase`
   - Constants: `UPPER_SNAKE_CASE`

3. **Document your code**:
   ```typescript
   /**
    * Calculates damage for a card effect
    * @param baseDamage - Base damage value
    * @param modifiers - Damage modifiers
    * @returns Final damage value
    */
   function calculateDamage(baseDamage: number, modifiers: DamageModifier[]): number {
     // Implementation
   }
   ```

### Before Committing
1. **Run all checks**: `npm run validate`
2. **Write meaningful commit message**:
   ```bash
   git commit -m "feat: add power card stacking mechanics

   - Allow multiple copies of same power card
   - Implement effect stacking logic
   - Add comprehensive tests for new feature"
   ```

## 🎯 Key Rules Summary

### Testing (RULE 1-4)
- **90% minimum coverage** for new features
- **100% coverage** for critical game logic
- **Test naming**: `should [expected behavior] when [condition]`
- **Test categories**: Unit, Integration, Game Logic, Edge Cases, Regression

### Modularity (RULE 5-8)
- **Single responsibility** per component
- **Clear module boundaries** - no circular dependencies
- **Separation of concerns**: UI, Logic, Data, Utility layers
- **Interface contracts** between modules

### Future-Proofing (RULE 9-12)
- **Extensible interfaces** with optional properties
- **Configuration-driven** design
- **Plugin architecture** for future expansion
- **Semantic versioning** and backward compatibility

### Change Management (RULE 13-15)
- **Document every change** with JSDoc comments
- **Impact assessment** before implementation
- **Test validation** for all changes
- **Changelog updates** for all releases

### Quality Assurance (RULE 16-19)
- **Comprehensive error handling** with Result types
- **Input validation** at all boundaries
- **State consistency** validation
- **Performance monitoring** with metrics

## 🔧 Essential Tools Setup

### VS Code Extensions
Install these extensions for better development experience:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Jest Runner
- Coverage Gutters
- GitLens

### VS Code Settings (.vscode/settings.json)
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "jest.autoRun": {
    "watch": false,
    "onSave": "test-file"
  }
}
```

## 📊 Quality Metrics to Track

### Code Quality Targets
- **Test Coverage**: > 90%
- **Code Duplication**: < 5%
- **Cyclomatic Complexity**: < 10 per function
- **Maintainability Index**: > 70

### Performance Targets
- **Frame Rate**: 60 FPS
- **Load Time**: < 3 seconds
- **Memory Usage**: < 100MB
- **Bundle Size**: < 3MB

### Development Targets
- **Release Frequency**: Weekly releases
- **Bug Rate**: < 1 bug per release
- **Feature Velocity**: 2-3 features per week

## 🚨 Common Pitfalls to Avoid

### ❌ Don't Do This
```typescript
// ❌ No error handling
function playCard(card: Card) {
  const damage = card.damage * player.strength;
  enemy.health -= damage;
}

// ❌ No input validation
function calculateDamage(damage: any) {
  return damage * 2;
}

// ❌ No documentation
function processEffect() {
  // Complex logic without explanation
}

// ❌ No tests
// Missing test file for new feature
```

### ✅ Do This Instead
```typescript
// ✅ Proper error handling
function playCard(card: Card): Result<CardResult, Error> {
  try {
    if (!card || !enemy) {
      return Result.err(new Error('Invalid card or enemy'));
    }
    
    const damage = calculateDamage(card.damage, player.strength);
    enemy.health = Math.max(0, enemy.health - damage);
    
    return Result.ok({ damage, target: enemy });
  } catch (error) {
    return Result.err(new Error(`Card play failed: ${error.message}`));
  }
}

// ✅ Input validation
function calculateDamage(damage: number): number {
  if (typeof damage !== 'number' || damage < 0) {
    throw new Error('Damage must be a non-negative number');
  }
  return damage * 2;
}

// ✅ Proper documentation
/**
 * Processes card effects during combat
 * @param effect - The effect to process
 * @param context - Current game context
 * @returns Processed effect result
 */
function processEffect(effect: CardEffect, context: GameContext): EffectResult {
  // Implementation with clear logic
}

// ✅ Comprehensive tests
describe('playCard', () => {
  it('should deal damage to enemy when valid card is played', () => {
    // Test implementation
  });
  
  it('should return error when card is invalid', () => {
    // Test implementation
  });
});
```

## 📞 Questions to Ask Before Every Feature

### Planning Questions
1. **What could go wrong?** - Identify failure points
2. **How will this scale?** - Consider future growth
3. **What are the performance implications?** - Monitor resources
4. **How will this be tested?** - Ensure testability

### Development Questions
1. **Is this the simplest solution?** - Prefer simplicity
2. **Is this maintainable?** - Consider long-term maintenance
3. **Does this follow our patterns?** - Maintain consistency
4. **What documentation is needed?** - Plan documentation

### Review Questions
1. **Have all tests passed?** - Ensure quality
2. **Is performance acceptable?** - Meet targets
3. **Is the user experience good?** - Validate UX
4. **Is this ready for production?** - Final validation

## 🎮 Game-Specific Guidelines

### Card System
- **Extensible card effects** with array-based design
- **Configuration-driven** card definitions
- **Comprehensive testing** for all card interactions
- **Performance optimization** for large decks

### Combat System
- **Turn-based mechanics** with clear state management
- **Status effect system** with proper stacking
- **Targeting system** with validation
- **Animation system** for visual feedback

### Progression System
- **Save/load functionality** with version compatibility
- **Map generation** with procedural algorithms
- **Reward system** with balanced progression
- **Difficulty scaling** with smooth curves

## 🔄 Continuous Improvement

### Weekly Reviews
- **Code quality metrics** review
- **Performance metrics** analysis
- **User feedback** collection
- **Process improvement** discussions

### Monthly Assessments
- **Architecture review** and refactoring
- **Technology stack** evaluation
- **Team velocity** and satisfaction
- **Long-term planning** and roadmap

### Quarterly Planning
- **Major feature** planning
- **Technical debt** assessment
- **Team skill** development
- **Process optimization** initiatives

---

## 🎯 Success Checklist

### First Week
- [ ] All configuration files created
- [ ] Git hooks installed and working
- [ ] Team trained on new workflow
- [ ] First feature developed following rules

### First Month
- [ ] 90% test coverage achieved
- [ ] All code follows style guidelines
- [ ] Documentation is comprehensive
- [ ] Performance targets met

### First Quarter
- [ ] Development velocity increased
- [ ] Bug rate decreased
- [ ] User satisfaction improved
- [ ] Team productivity enhanced

---

*This guide provides immediate actionable steps to implement the development rules. Refer to the full `DEVELOPMENT_RULES.md` and `DEVELOPMENT_TOOLS.md` for comprehensive details.* 

## 🎯 **My Commitment to Following Your Rules**

I will now consistently apply these standards in all my work on your project:

### **Testing Standards (RULE 1-4)**
- ✅ **90%+ test coverage** for all new features
- ✅ **TDD approach** - write tests first, then implementation
- ✅ **Comprehensive test categories** (unit, integration, game logic, edge cases)
- ✅ **Proper test naming** and organization

### **Modularity & Architecture (RULE 5-8)**
- ✅ **Single responsibility** for each component/function
- ✅ **Clear module boundaries** with no circular dependencies
- ✅ **Separation of concerns** (UI, Logic, Data, Utility layers)
- ✅ **Interface contracts** between modules

### **Future-Proofing (RULE 9-12)**
- ✅ **Extensible interfaces** with optional properties
- ✅ **Configuration-driven design** for easy balancing
- ✅ **Plugin architecture** considerations
- ✅ **Semantic versioning** and backward compatibility

### **Change Management (RULE 13-15)**
- ✅ **Document every change** with JSDoc comments
- ✅ **Impact assessment** before implementation
- ✅ **Test validation** for all changes
- ✅ **Changelog updates** for releases

### **Quality Assurance (RULE 16-19)**
- ✅ **Comprehensive error handling** with Result types
- ✅ **Input validation** at all boundaries
- ✅ **State consistency** validation
- ✅ **Performance monitoring** and optimization

### **Documentation Standards (RULE 20-22)**
- ✅ **JSDoc documentation** for all public APIs
- ✅ **Architecture documentation** for complex systems
- ✅ **Clear code comments** for complex logic

### **Technology & Innovation (RULE 26-28)**
- ✅ **Cutting-edge frameworks** and modern JavaScript features
- ✅ **Performance optimization** best practices
- ✅ **Accessibility standards** (WCAG AA compliance)

### **Visual & Mechanical Appeal (RULE 29-31)**
- ✅ **Consistent design system** implementation
- ✅ **Excellent user experience** with smooth interactions
- ✅ **Game balance** principles

## 🔧 **How I'll Apply These Rules**

### **Before Making Any Changes:**
1. **Ask the 5 planning questions** from the rules
2. **Assess impact** on existing functionality
3. **Plan test coverage** and validation
4. **Consider modularity** and future extensibility

### **During Implementation:**
1. **Write tests first** (TDD approach)
2. **Follow naming conventions** strictly
3. **Document everything** with JSDoc
4. **Implement proper error handling**
5. **Validate inputs** at boundaries

### **Before Suggesting Code:**
1. **Ensure 90%+ test coverage**
2. **Validate modularity** and separation of concerns
3. **Check performance implications**
4. **Verify accessibility compliance**
5. **Update changelog** appropriately

## 📋 **My Development Workflow**

### **For Every Feature Request:**
```typescript
// I will always:
1. ✅ Plan comprehensive test coverage
2. ✅ Design for modularity and extensibility
3. ✅ Document with JSDoc comments
4. ✅ Implement proper error handling
5. ✅ Validate all inputs and state
6. ✅ Consider performance implications
7. ✅ Follow naming conventions
8. ✅ Update changelog and documentation
```

### **For Every Code Review:**
```typescript
// I will always check:
1. ✅ Test coverage meets 90%+ requirement
2. ✅ Code follows single responsibility principle
3. ✅ Error handling is comprehensive
4. ✅ Documentation is complete
5. ✅ Performance is optimized
6. ✅ Accessibility standards are met
7. ✅ Code is maintainable and readable
```

## 🎮 **Game-Specific Application**

Since this is a card game, I'll particularly focus on:

### **Card System Development:**
- ✅ **Extensible card effects** with array-based design
- ✅ **Configuration-driven** card definitions
- ✅ **Comprehensive testing** for all card interactions
- ✅ **Performance optimization** for large decks

### **Combat System:**
- ✅ **Turn-based mechanics** with clear state management
- ✅ **Status effect system** with proper stacking
- ✅ **Targeting system** with validation
- ✅ **Animation system** for visual feedback

### **Progression System:**
- ✅ **Save/load functionality** with version compatibility
- ✅ **Map generation** with procedural algorithms
- ✅ **Reward system** with balanced progression
- ✅ **Difficulty scaling** with smooth curves

## 🚀 **Ready to Follow Your Rules**

I'm now fully committed to following your development rules for all future work on your "Don't Slay the Spire" project. Every suggestion, code change, or feature implementation will adhere to these standards.

**What would you like me to help you with next?** Whether it's:
- Adding new game features
- Refactoring existing code
- Improving test coverage
- Optimizing performance
- Enhancing the user experience
- Or any other development task

I'll ensure everything follows the comprehensive rule set we've established! 🎯 