import { describe, it, expect } from 'vitest';
import { generateMap, completeNode } from '../mapGeneration';
import { NodeType } from '../../types/map';

describe('MapGeneration', () => {
  describe('generateMap', () => {
    it('should generate a map with correct dimensions', () => {
      const map = generateMap();
      
      expect(map.nodes).toBeDefined();
      expect(map.floor).toBe(0);
      expect(map.maxFloor).toBeDefined();
      
      // Check that we have nodes for all floors (0-14)
      const floors = [...new Set(map.nodes.map(node => node.y))];
      expect(floors).toHaveLength(15);
      expect(Math.min(...floors)).toBe(0);
      expect(Math.max(...floors)).toBe(14);
    });

    it('should have starting nodes available on floor 0', () => {
      const map = generateMap();
      const startingNodes = map.nodes.filter(node => node.y === 0);
      
      expect(startingNodes.length).toBeGreaterThan(0);
      startingNodes.forEach(node => {
        expect(node.available).toBe(true);
        expect(node.completed).toBe(false);
      });
    });

    it('should have boss nodes on final floor', () => {
      const map = generateMap();
      const finalFloor = 14;
      const finalNodes = map.nodes.filter(node => node.y === finalFloor);
      
      expect(finalNodes.length).toBeGreaterThan(0);
      finalNodes.forEach(node => {
        expect(node.type).toBe(NodeType.BOSS);
      });
    });

    it('should have proper node types distribution', () => {
      const map = generateMap();
      
      const nodeTypes = map.nodes.map(node => node.type);
      const typeCount = nodeTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<NodeType, number>);

      // Should have combat nodes
      expect(typeCount[NodeType.COMBAT]).toBeGreaterThan(0);
      
      // Should have at least one boss node
      expect(typeCount[NodeType.BOSS]).toBeGreaterThan(0);
      
      // Should have some variety of node types
      const uniqueTypes = Object.keys(typeCount);
      expect(uniqueTypes.length).toBeGreaterThan(2);
    });

    it('should generate valid connections between nodes', () => {
      const map = generateMap();
      
      map.nodes.forEach(node => {
        node.connections.forEach(connectionId => {
          const connectedNode = map.nodes.find(n => n.id === connectionId);
          
          expect(connectedNode).toBeDefined();
          
          if (connectedNode) {
            // Connections should go to next floor
            expect(connectedNode.y).toBe(node.y + 1);
          }
        });
      });
    });

    it('should ensure all non-starting nodes are initially unavailable', () => {
      const map = generateMap();
      const nonStartingNodes = map.nodes.filter(node => node.y > 0);
      
      nonStartingNodes.forEach(node => {
        expect(node.available).toBe(false);
      });
    });

    it('should generate unique node IDs', () => {
      const map = generateMap();
      const nodeIds = map.nodes.map(node => node.id);
      const uniqueIds = new Set(nodeIds);
      
      expect(uniqueIds.size).toBe(nodeIds.length);
    });
  });

  describe('completeNode', () => {
    it('should mark node as completed and make connected nodes available', () => {
      const map = generateMap();
      const startingNode = map.nodes.find(node => node.y === 0 && node.available);
      
      expect(startingNode).toBeDefined();
      
      if (startingNode) {
        const updatedMap = completeNode(map, startingNode.id);
        const completedNode = updatedMap.nodes.find(n => n.id === startingNode.id);
        
        expect(completedNode?.completed).toBe(true);
        expect(updatedMap.floor).toBe(1);
        
        // Check that connected nodes on next floor are now available
        startingNode.connections.forEach(connectionId => {
          const connectedNode = updatedMap.nodes.find(n => n.id === connectionId);
          expect(connectedNode?.available).toBe(true);
        });
      }
    });

    it('should not modify map if node is not found', () => {
      const map = generateMap();
      const originalMap = JSON.parse(JSON.stringify(map));
      
      const updatedMap = completeNode(map, 'non-existent-node');
      
      expect(updatedMap).toEqual(originalMap);
    });

    it('should not modify map if node is already completed', () => {
      const map = generateMap();
      const startingNode = map.nodes.find(node => node.y === 0 && node.available);
      
      if (startingNode) {
        // Complete the node first
        const firstUpdate = completeNode(map, startingNode.id);
        const originalAfterFirst = JSON.parse(JSON.stringify(firstUpdate));
        
        // Try to complete again
        const secondUpdate = completeNode(firstUpdate, startingNode.id);
        
        expect(secondUpdate).toEqual(originalAfterFirst);
      }
    });

    it('should not modify map if node is not available', () => {
      const map = generateMap();
      const unavailableNode = map.nodes.find(node => node.y > 0 && !node.available);
      
      expect(unavailableNode).toBeDefined();
      
      if (unavailableNode) {
        const originalMap = JSON.parse(JSON.stringify(map));
        const updatedMap = completeNode(map, unavailableNode.id);
        
        expect(updatedMap).toEqual(originalMap);
      }
    });

    it('should handle completing final floor nodes', () => {
      const map = generateMap();
      
      // Simulate completing nodes to reach final floor
      let currentMap = map;
      
      // Complete a path to the final floor
      for (let floor = 0; floor < 14; floor++) {
        const availableNodes = currentMap.nodes.filter(n => n.y === floor && n.available);
        if (availableNodes.length > 0) {
          currentMap = completeNode(currentMap, availableNodes[0].id);
        }
      }
      
      // Now complete a final floor node
      const finalFloorNode = currentMap.nodes.find(n => n.y === 14 && n.available);
      
      if (finalFloorNode) {
        const finalMap = completeNode(currentMap, finalFloorNode.id);
        const completedFinalNode = finalMap.nodes.find(n => n.id === finalFloorNode.id);
        
        expect(completedFinalNode?.completed).toBe(true);
        expect(finalMap.floor).toBe(15); // Beyond the final floor
      }
    });

    it('should maintain map structure integrity after completion', () => {
      const map = generateMap();
      const startingNode = map.nodes.find(node => node.y === 0 && node.available);
      
      if (startingNode) {
        const updatedMap = completeNode(map, startingNode.id);
        
        // Check that all original nodes are still present
        expect(updatedMap.nodes).toHaveLength(map.nodes.length);
        
        // Check that node structure is maintained
        updatedMap.nodes.forEach(node => {
          expect(node).toHaveProperty('id');
          expect(node).toHaveProperty('type');
          expect(node).toHaveProperty('x');
          expect(node).toHaveProperty('y');
          expect(node).toHaveProperty('connections');
          expect(node).toHaveProperty('available');
          expect(node).toHaveProperty('completed');
        });
      }
    });
  });
}); 