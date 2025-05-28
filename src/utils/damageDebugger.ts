import { Card, Player, Enemy } from '../types/game';

export interface DamageCalculationDebug {
  cardName: string;
  cardId: string;
  effectType?: string;
  baseDamage: number;
  calculatedDamage: number;
  actualDamageDealt: number;
  damageAfterBlock: number;
  targetName: string;
  targetHealth: number;
  targetBlock: number;
  playerState: {
    energy: number;
    block: number;
    statusEffects: any[];
  };
  targetStatusEffects: any[];
  isFirstAttack: boolean;
  timestamp: number;
  discrepancy?: {
    type: 'calculation_mismatch' | 'block_application_error' | 'status_effect_error';
    expected: number;
    actual: number;
    difference: number;
  };
}

class DamageDebugger {
  private logs: DamageCalculationDebug[] = [];
  private enabled: boolean = true;

  enable() {
    this.enabled = true;
    console.log('🔍 Damage Debugger: ENABLED - Will track damage calculations');
  }

  disable() {
    this.enabled = false;
    console.log('🔍 Damage Debugger: DISABLED');
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
      cardName: card.name,
      cardId: card.id,
      effectType,
      baseDamage,
      calculatedDamage,
      actualDamageDealt,
      damageAfterBlock,
      targetName: target.name,
      targetHealth: target.health,
      targetBlock: target.block,
      playerState: {
        energy: player.energy,
        block: player.block,
        statusEffects: [...player.statusEffects]
      },
      targetStatusEffects: [...target.statusEffects],
      isFirstAttack,
      timestamp: Date.now()
    };

    // Check for discrepancies
    if (actualDamageDealt !== damageAfterBlock) {
      debugInfo.discrepancy = {
        type: 'block_application_error',
        expected: damageAfterBlock,
        actual: actualDamageDealt,
        difference: Math.abs(actualDamageDealt - damageAfterBlock)
      };
    }

    this.logs.push(debugInfo);

    // Log to console if there's a discrepancy
    if (debugInfo.discrepancy) {
      console.error('🚨 DAMAGE DISCREPANCY DETECTED:', {
        card: `${card.name} (${card.id})`,
        target: target.name,
        expected: debugInfo.discrepancy.expected,
        actual: debugInfo.discrepancy.actual,
        difference: debugInfo.discrepancy.difference,
        details: debugInfo
      });
    } else {
      console.log('✅ Damage calculation correct:', {
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

    console.log('🎯 Multi-hit damage calculation:', {
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
        console.error('🚨 MULTI-HIT DAMAGE DISCREPANCY:', {
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

    console.log('⚡ Energy-based damage calculation:', {
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
      console.error('🚨 ENERGY CONSUMPTION DISCREPANCY:', {
        card: `${card.name} (${card.id})`,
        originalEnergy,
        energyUsed,
        expected: 'Should consume ALL energy for Whirlwind'
      });
    }

    // Check for hit count discrepancies
    if (expectedHits !== energyUsed) {
      console.error('🚨 HIT COUNT DISCREPANCY:', {
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
    console.log('🔍 Damage Debugger: Logs cleared');
  }

  printSummary() {
    const totalLogs = this.logs.length;
    const discrepancies = this.getDiscrepancies();
    
    console.log('📊 DAMAGE DEBUGGER SUMMARY:', {
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