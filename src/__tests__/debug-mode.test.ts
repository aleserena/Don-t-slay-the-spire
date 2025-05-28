import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { debugConsole, isDebugMode } from '../utils/debugUtils';

describe('Debug Mode Functionality', () => {
  beforeEach(() => {
    const store = useGameStore.getState();
    store.startNewRun();
    // Ensure debug mode starts as false
    if (store.debugMode) {
      store.toggleDebugMode();
    }
  });

  describe('Debug Mode State Management', () => {
    it('should start with debug mode disabled', () => {
      const store = useGameStore.getState();
      expect(store.debugMode).toBe(false);
      expect(isDebugMode()).toBe(false);
    });

    it('should toggle debug mode on and off', () => {
      const { toggleDebugMode } = useGameStore.getState();
      
      // Initially off
      expect(useGameStore.getState().debugMode).toBe(false);
      
      // Toggle on
      toggleDebugMode();
      expect(useGameStore.getState().debugMode).toBe(true);
      expect(isDebugMode()).toBe(true);
      
      // Toggle off
      toggleDebugMode();
      expect(useGameStore.getState().debugMode).toBe(false);
      expect(isDebugMode()).toBe(false);
    });
  });

  describe('Debug Console Conditional Logging', () => {
    it('should not log when debug mode is off', () => {
      const store = useGameStore.getState();
      expect(store.debugMode).toBe(false);
      
      // Mock console.log to track calls
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Try to log something
      debugConsole.log('Test message');
      
      // Should not have called console.log
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should log when debug mode is on', () => {
      const { toggleDebugMode } = useGameStore.getState();
      
      // Enable debug mode
      toggleDebugMode();
      expect(useGameStore.getState().debugMode).toBe(true);
      
      // Mock console.log to track calls
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Try to log something
      debugConsole.log('Test message');
      
      // Should have called console.log
      expect(consoleSpy).toHaveBeenCalledWith('Test message');
      
      consoleSpy.mockRestore();
    });

    it('should handle error logging conditionally', () => {
      const { toggleDebugMode } = useGameStore.getState();
      
      // Test with debug mode off
      expect(useGameStore.getState().debugMode).toBe(false);
      const errorSpyOff = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      debugConsole.error('Error message');
      expect(errorSpyOff).not.toHaveBeenCalled();
      
      errorSpyOff.mockRestore();
      
      // Test with debug mode on
      toggleDebugMode();
      expect(useGameStore.getState().debugMode).toBe(true);
      
      const errorSpyOn = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      debugConsole.error('Error message');
      expect(errorSpyOn).toHaveBeenCalledWith('Error message');
      
      errorSpyOn.mockRestore();
    });
  });

  describe('Debug Mode Integration', () => {
    it('should maintain debug mode state across game actions', () => {
      const { toggleDebugMode, selectNode } = useGameStore.getState();
      
      // Enable debug mode
      toggleDebugMode();
      expect(useGameStore.getState().debugMode).toBe(true);
      
      // Perform some game actions
      const availableNodes = useGameStore.getState().map?.nodes.filter(n => n.available && n.type === 'combat') || [];
      if (availableNodes.length > 0) {
        selectNode(availableNodes[0].id);
      }
      
      // Debug mode should still be enabled
      expect(useGameStore.getState().debugMode).toBe(true);
      expect(isDebugMode()).toBe(true);
    });

    it('should preserve debug mode when starting new run', () => {
      const { toggleDebugMode, startNewRun } = useGameStore.getState();
      
      // Enable debug mode
      toggleDebugMode();
      expect(useGameStore.getState().debugMode).toBe(true);
      
      // Start new run
      startNewRun();
      
      // Debug mode should be preserved
      expect(useGameStore.getState().debugMode).toBe(true);
      expect(isDebugMode()).toBe(true);
    });
  });
}); 