# Monster Card Preview Feature

## Overview
The Monster Card Preview feature allows players to see detailed information about the cards that enemies will play by hovering over their intent indicators.

## How It Works

### Enemy Intent Display
- Each enemy shows their intent for the next turn (Attack, Defend, Buff, Debuff, etc.)
- When an enemy has a monster card selected, the intent area becomes interactive
- A subtle "(Hover for details)" hint appears when a card is available to preview

### Card Preview
When hovering over an enemy's intent:
- A detailed card preview appears showing:
  - **Card Name**: The name of the monster card
  - **Card Type**: Attack, Defend, Buff, Debuff, or Special with color-coded icons
  - **Stats**: Damage, Block, and Priority values
  - **Description**: Full card description
  - **Effects**: Detailed breakdown of all card effects
  - **Card ID**: For debugging purposes

### Visual Features
- **Color-coded borders**: Each card type has a distinct color
- **Smart positioning**: Preview automatically adjusts to stay within screen bounds
- **Hover effects**: Intent area highlights when hovering
- **Non-intrusive**: Preview doesn't interfere with gameplay

## Technical Implementation

### Components
- `MonsterCardPreview.tsx`: Main preview component
- `EnemyArea.tsx`: Updated to include hover handlers

### Key Features
- **Dynamic positioning**: Prevents preview from going off-screen
- **Type safety**: Full TypeScript support for monster cards
- **Performance optimized**: Only renders when hovering
- **Accessible**: Clear visual indicators and smooth transitions

### Monster Card System
- Each enemy has a deck of monster cards
- Cards are selected based on AI strategy (health-based)
- Cards have priority weights for selection probability
- Effects system compatible with existing game mechanics

## Usage
1. Start a combat encounter
2. Look at enemy intent indicators
3. Hover over any intent that shows "(Hover for details)"
4. View the detailed card information in the preview
5. Use this information to plan your strategy

## Benefits for Players
- **Strategic planning**: Know exactly what enemies will do
- **Learning**: Understand enemy abilities and patterns
- **Transparency**: No hidden information about enemy actions
- **Immersion**: See the actual cards enemies are "playing"

## Card Types and Colors
- **Attack** (Red): Damage-dealing cards
- **Defend** (Blue): Block-gaining cards  
- **Buff** (Green): Self-enhancement cards
- **Debuff** (Purple): Player-weakening cards
- **Special** (Orange): Unique effect cards

## Future Enhancements
- Animation effects when cards are played
- Sound effects for different card types
- Extended card information (e.g., card rarity)
- Keyboard shortcuts for accessibility 