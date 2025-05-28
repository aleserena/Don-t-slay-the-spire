import { Card, Player, Enemy } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { debugConsole, isDebugMode } from './debugUtils';

export interface DamageCalculationDebug {
  cardId: string;
  cardName: string;
  baseDamage: number;
  calculatedDamage: number;
  actualDamageDealt: number;
  damageAfterBlock: number;
  target: string;
  timestamp: number;
  modifiers: {
    strength: number;
    vulnerable: number;
    weak: number;
    relics: string[];
  };
  discrepancy?: {
    expected: number;
    actual: number;
    difference: number;
  };
}

class DamageDebugger {
  private logs: DamageCalculationDebug[] = [];
  private enabled: boolean = false;

  enable() {
    this.enabled = true;
    debugConsole.log('🔍 Damage Debugger: ENABLED - Will track damage calculations');
  }

  disable() {
    this.enabled = false;
    debugConsole.log('🔍 Damage Debugger: DISABLED');
  }

  isEnabled(): boolean {
    return this.enabled && isDebugMode();
  }

  logDamageCalculation(
    card: Card,
    player: Player,
    target: Enemy,
    baseDamage: number,
    calculatedDamage: number,
    actualDamageDealt: number,
    isFirstAttack: boolean = false,
    effectType?: string
  ) {
    if (!this.enabled) return;

    const damageAfterBlock = Math.max(0, calculatedDamage - target.block);
    
    const debugInfo: DamageCalculationDebug = {
      cardId: card.id,
      cardName: card.name,
      baseDamage,
      calculatedDamage,
      actualDamageDealt,
      damageAfterBlock,
      target: target.name,
      timestamp: Date.now(),
      modifiers: {
        strength: player.statusEffects.find(s => s.type === 'strength')?.stacks || 0,
        vulnerable: target.statusEffects.find(s => s.type === 'vulnerable')?.stacks || 0,
        weak: player.statusEffects.find(s => s.type === 'weak')?.stacks || 0,
        relics: player.relics.map(r => r.name)
      }
    };

    // Check for discrepancies
    if (actualDamageDealt !== damageAfterBlock) {
      debugInfo.discrepancy = {
        expected: damageAfterBlock,
        actual: actualDamageDealt,
        difference: Math.abs(actualDamageDealt - damageAfterBlock)
      };
    }

    this.logs.push(debugInfo);

    // Log to console if there's a discrepancy
    if (debugInfo.discrepancy) {
      debugConsole.error('🚨 DAMAGE DISCREPANCY DETECTED:', {
        card: `${card.name} (${card.id})`,
        target: target.name,
        expected: debugInfo.discrepancy.expected,
        actual: debugInfo.discrepancy.actual,
        difference: debugInfo.discrepancy.difference,
        details: debugInfo
      });
    } else {
      debugConsole.log('✅ Damage calculation correct:', {
        card: `${card.name} (${card.id})`,
        target: target.name,
        damage: actualDamageDealt,
        calculation: `${baseDamage} base → ${calculatedDamage} calculated → ${damageAfterBlock} after block → ${actualDamageDealt} dealt`
      });
    }
  }

  logMultiHitDamage(
    card: Card,
    targets: Enemy[],
    hitCount: number,
    damagePerHit: number,
    totalCalculatedDamage: number,
    actualDamageResults: { target: Enemy; damageDealt: number }[],
    isFirstAttack: boolean = false
  ) {
    if (!this.enabled) return;

    debugConsole.log('🎯 Multi-hit damage calculation:', {
      card: `${card.name} (${card.id})`,
      hitCount,
      damagePerHit,
      totalCalculatedDamage,
      targets: targets.length,
      isFirstAttack
    });

    actualDamageResults.forEach((result) => {
      const expectedDamagePerTarget = damagePerHit * hitCount;
      const expectedAfterBlock = Math.max(0, expectedDamagePerTarget - result.target.block);
      
      if (result.damageDealt !== expectedAfterBlock) {
        debugConsole.error('🚨 MULTI-HIT DAMAGE DISCREPANCY:', {
          card: `${card.name} (${card.id})`,
          target: result.target.name,
          hitCount,
          damagePerHit,
          expectedTotal: expectedDamagePerTarget,
          expectedAfterBlock,
          actualDealt: result.damageDealt,
          difference: Math.abs(result.damageDealt - expectedAfterBlock)
        });
      }
    });
  }

  logEnergyBasedDamage(
    card: Card,
    originalEnergy: number,
    energyUsed: number,
    damagePerHit: number,
    expectedHits: number,
    actualResults: { target: Enemy; damageDealt: number }[]
  ) {
    if (!this.enabled) return;

    debugConsole.log('⚡ Energy-based damage calculation:', {
      card: `${card.name} (${card.id})`,
      originalEnergy,
      energyUsed,
      damagePerHit,
      expectedHits,
      expectedDamagePerTarget: damagePerHit * expectedHits,
      actualResults: actualResults.map(r => ({
        target: r.target.name,
        damageDealt: r.damageDealt
      }))
    });

    // Check for energy consumption discrepancies
    if (energyUsed !== originalEnergy && card.baseId === 'whirlwind') {
      debugConsole.error('🚨 ENERGY CONSUMPTION DISCREPANCY:', {
        card: `${card.name} (${card.id})`,
        originalEnergy,
        energyUsed,
        expected: 'Should consume ALL energy for Whirlwind'
      });
    }

    // Check for hit count discrepancies
    if (expectedHits !== energyUsed) {
      debugConsole.error('🚨 HIT COUNT DISCREPANCY:', {
        card: `${card.name} (${card.id})`,
        energyUsed,
        expectedHits,
        difference: Math.abs(expectedHits - energyUsed)
      });
    }
  }

  getRecentLogs(count: number = 10): DamageCalculationDebug[] {
    return this.logs.slice(-count);
  }

  getDiscrepancies(): DamageCalculationDebug[] {
    return this.logs.filter(log => log.discrepancy);
  }

  clearLogs() {
    this.logs = [];
    debugConsole.log('🔍 Damage Debugger: Logs cleared');
  }

  printSummary() {
    const totalLogs = this.logs.length;
    const discrepancies = this.getDiscrepancies();
    
    debugConsole.log('📊 DAMAGE DEBUGGER SUMMARY:', {
      totalCalculations: totalLogs,
      discrepancies: discrepancies.length,
      accuracy: totalLogs > 0 ? `${((totalLogs - discrepancies.length) / totalLogs * 100).toFixed(1)}%` : 'N/A',
      recentDiscrepancies: discrepancies.slice(-5)
    });
  }
}

// Global instance
export const damageDebugger = new DamageDebugger();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).damageDebugger = damageDebugger;
} 