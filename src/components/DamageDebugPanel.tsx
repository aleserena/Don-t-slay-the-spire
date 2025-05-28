import React, { useState, useEffect } from 'react';
import { damageDebugger } from '../utils/damageDebugger';

export const DamageDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState(damageDebugger.getRecentLogs(20));
  const [discrepancies, setDiscrepancies] = useState(damageDebugger.getDiscrepancies());

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(damageDebugger.getRecentLogs(20));
      setDiscrepancies(damageDebugger.getDiscrepancies());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = () => {
    damageDebugger.clearLogs();
    setLogs([]);
    setDiscrepancies([]);
  };

  const handlePrintSummary = () => {
    damageDebugger.printSummary();
  };

  const handleToggleDebugger = () => {
    if (damageDebugger['enabled']) {
      damageDebugger.disable();
    } else {
      damageDebugger.enable();
    }
  };

  if (!isOpen) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: discrepancies.length > 0 ? '#e74c3c' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            animation: discrepancies.length > 0 ? 'pulse 2s infinite' : 'none'
          }}
          title={`Damage Debugger ${discrepancies.length > 0 ? `(${discrepancies.length} issues)` : ''}`}
        >
          🔍
        </button>
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '500px',
      maxHeight: '600px',
      background: 'rgba(0, 0, 0, 0.95)',
      border: '2px solid #3498db',
      borderRadius: '10px',
      padding: '15px',
      color: 'white',
      fontSize: '12px',
      zIndex: 1000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        borderBottom: '1px solid #555',
        paddingBottom: '10px'
      }}>
        <h3 style={{ margin: 0, color: '#3498db' }}>🔍 Damage Debugger</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '15px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleToggleDebugger}
          style={{
            background: '#2ecc71',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Toggle Debug
        </button>
        <button
          onClick={handleClearLogs}
          style={{
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Clear Logs
        </button>
        <button
          onClick={handlePrintSummary}
          style={{
            background: '#f39c12',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Print Summary
        </button>
      </div>

      {/* Stats */}
      <div style={{
        background: 'rgba(52, 152, 219, 0.2)',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '15px'
      }}>
        <div><strong>Total Calculations:</strong> {logs.length}</div>
        <div><strong>Discrepancies:</strong> <span style={{ color: discrepancies.length > 0 ? '#e74c3c' : '#2ecc71' }}>{discrepancies.length}</span></div>
        <div><strong>Accuracy:</strong> {logs.length > 0 ? `${((logs.length - discrepancies.length) / logs.length * 100).toFixed(1)}%` : 'N/A'}</div>
      </div>

      {/* Discrepancies Section */}
      {discrepancies.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ color: '#e74c3c', margin: '0 0 10px 0' }}>🚨 Issues Found:</h4>
          <div style={{
            maxHeight: '150px',
            overflowY: 'auto',
            background: 'rgba(231, 76, 60, 0.1)',
            padding: '10px',
            borderRadius: '5px'
          }}>
            {discrepancies.slice(-5).map((log, index) => (
              <div key={index} style={{
                marginBottom: '8px',
                padding: '5px',
                background: 'rgba(231, 76, 60, 0.2)',
                borderRadius: '3px'
              }}>
                <div><strong>{log.cardName}</strong> → {log.targetName}</div>
                <div>Expected: {log.discrepancy?.expected}, Actual: {log.discrepancy?.actual}</div>
                <div>Difference: {log.discrepancy?.difference}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <h4 style={{ color: '#3498db', margin: '0 0 10px 0' }}>Recent Calculations:</h4>
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '10px',
          borderRadius: '5px'
        }}>
          {logs.slice(-10).reverse().map((log, index) => (
            <div key={index} style={{
              marginBottom: '8px',
              padding: '5px',
              background: log.discrepancy ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)',
              borderRadius: '3px',
              borderLeft: `3px solid ${log.discrepancy ? '#e74c3c' : '#2ecc71'}`
            }}>
              <div style={{ fontWeight: 'bold' }}>
                {log.discrepancy ? '🚨' : '✅'} {log.cardName} → {log.targetName}
              </div>
              <div>
                {log.baseDamage} base → {log.calculatedDamage} calc → {log.actualDamageDealt} dealt
              </div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                {log.effectType} | {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 