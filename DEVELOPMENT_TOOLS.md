# Development Tools & Automation

This document provides the tools, scripts, and configurations needed to enforce the development rules and maintain high code quality.

## 🛠️ Development Environment Setup

### Required Tools
```bash
# Core Development Tools
node >= 18.0.0
npm >= 9.0.0
git >= 2.30.0

# Recommended IDE Extensions (VS Code)
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Jest Runner
- Coverage Gutters
- GitLens
- Auto Rename Tag
- Bracket Pair Colorizer
```

### Environment Configuration
```bash
# .nvmrc - Node version management
18.17.0

# .gitignore additions
coverage/
.vscode/settings.json
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## 📦 Package Scripts

### Enhanced package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:performance": "vitest run --config vitest.performance.config.ts",
    "type-check": "tsc --noEmit",
    "validate": "npm run lint && npm run format:check && npm run type-check && npm run test:coverage",
    "pre-commit": "npm run validate",
    "analyze": "npm run build && npx vite-bundle-analyzer dist",
    "docs": "typedoc --out docs src",
    "docs:serve": "npx serve docs",
    "clean": "rm -rf dist coverage docs",
    "prepare": "husky install"
  }
}
```

## 🔧 Configuration Files

### ESLint Configuration (.eslintrc.js)
```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'import',
  ],
  rules: {
    // Code Quality
    'complexity': ['error', 10],
    'max-lines-per-function': ['error', 50],
    'max-params': ['error', 4],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    
    // TypeScript
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-const': 'error',
    
    // React
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Import/Export
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
      },
    ],
    
    // Accessibility
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/aria-props': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

### Prettier Configuration (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "jsxSingleQuote": true,
  "proseWrap": "preserve"
}
```

### TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/data/*": ["src/data/*"],
      "@/store/*": ["src/store/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Vitest Configuration (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'coverage/'
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/data': path.resolve(__dirname, './src/data'),
      '@/store': path.resolve(__dirname, './src/store')
    }
  }
});
```

## 🚀 Git Hooks

### Husky Configuration (.husky/pre-commit)
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run linting
echo "📝 Checking code style..."
npm run lint

# Check formatting
echo "🎨 Checking code formatting..."
npm run format:check

# Type checking
echo "🔧 Type checking..."
npm run type-check

# Run tests
echo "🧪 Running tests..."
npm run test:coverage

echo "✅ All pre-commit checks passed!"
```

### Husky Configuration (.husky/commit-msg)
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Conventional commit message validation
npx --no -- commitlint --edit $1
```

### Commitlint Configuration (.commitlintrc.js)
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New features
        'fix',      // Bug fixes
        'docs',     // Documentation changes
        'style',    // Code style changes
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Test changes
        'chore',    // Build process or auxiliary tool changes
        'ci',       // CI/CD changes
        'revert'    // Revert previous commits
      ]
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100]
  }
};
```

## 📊 Quality Assurance Tools

### Bundle Analyzer Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          game: ['zustand'],
          utils: ['uuid'],
        },
      },
    },
  },
});
```

### Performance Testing Configuration
```typescript
// vitest.performance.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.perf.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/performance-setup.ts'],
    testTimeout: 10000,
  },
});
```

### Integration Testing Configuration
```typescript
// vitest.integration.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.integration.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/integration-setup.ts'],
    testTimeout: 30000,
  },
});
```

## 🔍 Code Quality Tools

### SonarQube Configuration (.sonar-project.properties)
```properties
sonar.projectKey=dont-slay-the-spire
sonar.projectName=Don't Slay the Spire
sonar.projectVersion=1.0.0

sonar.sources=src
sonar.tests=src
sonar.test.inclusions=src/**/*.{test,spec}.{js,ts,jsx,tsx}
sonar.exclusions=src/test/**,src/**/*.d.ts,dist/**,coverage/**

sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.testExecutionReportPaths=coverage/test-report.xml

sonar.qualitygate.wait=true
```

### Dependency Check Configuration (.dependency-check.json)
```json
{
  "suppressionFiles": ["suppressions.xml"],
  "failOnCVSS": 7,
  "formats": ["HTML", "JSON"],
  "outputDirectory": "reports"
}
```

## 📈 Monitoring & Analytics

### Performance Monitoring Setup
```typescript
// src/utils/performance.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    };
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name] of this.metrics) {
      result[name] = this.getAverageMetric(name);
    }
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

### Error Tracking Setup
```typescript
// src/utils/errorTracking.ts
export class ErrorTracker {
  private errors: Array<{
    message: string;
    stack?: string;
    timestamp: number;
    context?: Record<string, any>;
  }> = [];

  trackError(error: Error, context?: Record<string, any>): void {
    this.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context,
    });

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error, context);
    }
  }

  private sendToErrorService(error: Error, context?: Record<string, any>): void {
    // Implementation for error tracking service (e.g., Sentry)
    console.error('Error tracked:', error, context);
  }

  getErrorStats(): {
    totalErrors: number;
    recentErrors: number;
    errorRate: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    const totalErrors = this.errors.length;
    const recentErrors = this.errors.filter(e => e.timestamp > oneHourAgo).length;
    const errorRate = totalErrors > 0 ? (recentErrors / totalErrors) * 100 : 0;

    return { totalErrors, recentErrors, errorRate };
  }
}

export const errorTracker = new ErrorTracker();
```

## 🎯 Development Workflow Scripts

### Development Helper Scripts
```bash
#!/bin/bash
# scripts/dev-setup.sh

echo "🚀 Setting up development environment..."

# Install dependencies
npm install

# Install git hooks
npx husky install

# Create necessary directories
mkdir -p coverage reports docs

# Set up environment variables
if [ ! -f .env.local ]; then
  echo "Creating .env.local file..."
  cat > .env.local << EOF
# Development Environment Variables
VITE_APP_NAME="Don't Slay the Spire"
VITE_APP_VERSION="1.0.0"
VITE_DEBUG_MODE=true
EOF
fi

echo "✅ Development environment setup complete!"
```

### Build and Deploy Scripts
```bash
#!/bin/bash
# scripts/build.sh

echo "🏗️ Building project..."

# Clean previous build
npm run clean

# Run validation
npm run validate

# Build project
npm run build

# Run bundle analysis
npm run analyze

echo "✅ Build complete!"
```

### Release Script
```bash
#!/bin/bash
# scripts/release.sh

if [ -z "$1" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 1.27.0"
  exit 1
fi

VERSION=$1

echo "🚀 Releasing version $VERSION..."

# Update version in package.json
npm version $VERSION --no-git-tag-version

# Build project
npm run build

# Run all tests
npm run test:coverage

# Generate documentation
npm run docs

# Create git tag
git add .
git commit -m "chore: release version $VERSION"
git tag -a "v$VERSION" -m "Release version $VERSION"

echo "✅ Release $VERSION complete!"
echo "Don't forget to:"
echo "1. Push changes: git push origin main --tags"
echo "2. Create release notes in GitHub"
echo "3. Deploy to production"
```

## 📋 Development Checklists

### Feature Development Checklist
```markdown
## Feature Development Checklist

### Planning Phase
- [ ] Requirements documented
- [ ] Design reviewed
- [ ] Test cases planned
- [ ] Documentation plan created

### Development Phase
- [ ] Feature branch created
- [ ] Tests written first (TDD)
- [ ] Code follows style guidelines
- [ ] Error handling implemented
- [ ] Performance considered
- [ ] Accessibility requirements met

### Testing Phase
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Performance tests pass
- [ ] Manual testing completed
- [ ] Edge cases tested

### Documentation Phase
- [ ] Code documented
- [ ] API documentation updated
- [ ] README updated if needed
- [ ] Changelog updated

### Review Phase
- [ ] Self-review completed
- [ ] Peer review completed
- [ ] All feedback addressed
- [ ] Final validation passed

### Release Phase
- [ ] Feature merged to main
- [ ] Release notes created
- [ ] Version tagged
- [ ] Deployed to production
```

### Code Review Checklist
```markdown
## Code Review Checklist

### Functionality
- [ ] Does the code work as intended?
- [ ] Are all requirements met?
- [ ] Are edge cases handled?
- [ ] Is error handling appropriate?

### Code Quality
- [ ] Is the code readable and well-structured?
- [ ] Are naming conventions followed?
- [ ] Is the code maintainable?
- [ ] Are there any code smells?

### Testing
- [ ] Are tests comprehensive?
- [ ] Do all tests pass?
- [ ] Are tests maintainable?
- [ ] Is test coverage adequate?

### Performance
- [ ] Is performance acceptable?
- [ ] Are there any obvious bottlenecks?
- [ ] Is memory usage reasonable?
- [ ] Is bundle size optimized?

### Security
- [ ] Are there any security vulnerabilities?
- [ ] Is input validation appropriate?
- [ ] Are sensitive data handled properly?

### Documentation
- [ ] Is code properly documented?
- [ ] Are API changes documented?
- [ ] Are breaking changes noted?
```

## 🔄 Continuous Integration

### GitHub Actions Workflow (.github/workflows/ci.yml)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Check formatting
      run: npm run format:check
    
    - name: Type checking
      run: npm run type-check
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
    
    - name: Build project
      run: npm run build
    
    - name: Analyze bundle
      run: npm run analyze

  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run security audit
      run: npm audit --audit-level=moderate
    
    - name: Check for vulnerabilities
      run: npx audit-ci --moderate

  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build project
      run: npm run build
    
    - name: Deploy to production
      run: echo "Deploy to production server"
      # Add actual deployment commands here
```

## 📊 Metrics Dashboard

### Development Metrics Tracking
```typescript
// src/utils/metrics.ts
export interface DevelopmentMetrics {
  codeQuality: {
    testCoverage: number;
    codeDuplication: number;
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
  };
  performance: {
    frameRate: number;
    loadTime: number;
    memoryUsage: number;
    bundleSize: number;
  };
  userExperience: {
    errorRate: number;
    sessionLength: number;
    userRetention: number;
  };
  development: {
    releaseFrequency: number;
    bugRate: number;
    featureVelocity: number;
  };
}

export class MetricsTracker {
  private metrics: DevelopmentMetrics;

  constructor() {
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): DevelopmentMetrics {
    return {
      codeQuality: {
        testCoverage: 0,
        codeDuplication: 0,
        cyclomaticComplexity: 0,
        maintainabilityIndex: 0,
      },
      performance: {
        frameRate: 0,
        loadTime: 0,
        memoryUsage: 0,
        bundleSize: 0,
      },
      userExperience: {
        errorRate: 0,
        sessionLength: 0,
        userRetention: 0,
      },
      development: {
        releaseFrequency: 0,
        bugRate: 0,
        featureVelocity: 0,
      },
    };
  }

  updateMetrics(newMetrics: Partial<DevelopmentMetrics>): void {
    this.metrics = { ...this.metrics, ...newMetrics };
  }

  getMetrics(): DevelopmentMetrics {
    return this.metrics;
  }

  generateReport(): string {
    return `
# Development Metrics Report

## Code Quality
- Test Coverage: ${this.metrics.codeQuality.testCoverage}%
- Code Duplication: ${this.metrics.codeQuality.codeDuplication}%
- Cyclomatic Complexity: ${this.metrics.codeQuality.cyclomaticComplexity}
- Maintainability Index: ${this.metrics.codeQuality.maintainabilityIndex}

## Performance
- Frame Rate: ${this.metrics.performance.frameRate} FPS
- Load Time: ${this.metrics.performance.loadTime}ms
- Memory Usage: ${this.metrics.performance.memoryUsage}MB
- Bundle Size: ${this.metrics.performance.bundleSize}KB

## User Experience
- Error Rate: ${this.metrics.userExperience.errorRate}%
- Session Length: ${this.metrics.userExperience.sessionLength} minutes
- User Retention: ${this.metrics.userExperience.userRetention}%

## Development
- Release Frequency: ${this.metrics.development.releaseFrequency} releases/week
- Bug Rate: ${this.metrics.development.bugRate} bugs/release
- Feature Velocity: ${this.metrics.development.featureVelocity} features/week
    `;
  }
}

export const metricsTracker = new MetricsTracker();
```

---

*This document provides the tools and automation needed to enforce the development rules. Regular updates to these tools ensure they remain effective and aligned with project goals.* 