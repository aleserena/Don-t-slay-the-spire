import { MapNode, NodeType, GameMap } from '../types/map';
import { v4 as uuidv4 } from 'uuid';

const MAP_WIDTH = 7;
const MAP_HEIGHT = 15;

export const generateMap = (): GameMap => {
  const nodes: MapNode[] = [];
  
  // Generate nodes for each floor
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const nodesInFloor = getNodesPerFloor(y);
    
    for (let x = 0; x < nodesInFloor; x++) {
      const nodeType = getNodeType(y);
      const nodeX = calculateNodeX(x, nodesInFloor);
      
      const node: MapNode = {
        id: uuidv4(),
        type: nodeType,
        x: nodeX,
        y: y,
        connections: [],
        completed: false,
        available: y === 0 // Only first floor nodes are initially available
      };
      
      nodes.push(node);
    }
  }
  
  // Generate connections between nodes
  generateConnections(nodes);
  
  // Make starting nodes available
  const startingNodes = nodes.filter(n => n.y === 0);
  startingNodes.forEach(node => {
    node.available = true;
  });
  
  return {
    nodes,
    currentNodeId: null,
    floor: 0,
    maxFloor: MAP_HEIGHT - 1
  };
};

const getNodesPerFloor = (floor: number): number => {
  // Vary the number of nodes per floor for interesting branching
  if (floor === 0) return 1; // Start with one node
  if (floor === MAP_HEIGHT - 1) return 1; // End with one boss node
  if (floor < 3) return Math.floor(Math.random() * 2) + 2; // 2-3 nodes
  if (floor < MAP_HEIGHT - 3) return Math.floor(Math.random() * 3) + 2; // 2-4 nodes
  return Math.floor(Math.random() * 2) + 2; // 2-3 nodes near end
};

const calculateNodeX = (index: number, totalNodes: number): number => {
  // Distribute nodes evenly across the width
  const spacing = MAP_WIDTH / (totalNodes + 1);
  return Math.floor(spacing * (index + 1));
};

const getNodeType = (floor: number): NodeType => {
  if (floor === 0) return NodeType.COMBAT; // Always start with combat
  if (floor === MAP_HEIGHT - 1) return NodeType.BOSS; // Always end with boss
  
  // Elite floors (every 8 floors)
  if (floor % 8 === 7) {
    return Math.random() < 0.7 ? NodeType.ELITE : NodeType.COMBAT;
  }
  
  // Rest floors (every 6 floors)
  if (floor % 6 === 5) {
    return Math.random() < 0.6 ? NodeType.REST : NodeType.COMBAT;
  }
  
  // Shop floors (every 10 floors)
  if (floor % 10 === 9) {
    return Math.random() < 0.8 ? NodeType.SHOP : NodeType.COMBAT;
  }
  
  // Random distribution for other floors
  const rand = Math.random();
  if (rand < 0.6) return NodeType.COMBAT;
  if (rand < 0.75) return NodeType.EVENT;
  if (rand < 0.85) return NodeType.TREASURE;
  if (rand < 0.92) return NodeType.REST;
  if (rand < 0.97) return NodeType.SHOP;
  return NodeType.ELITE;
};

const generateConnections = (nodes: MapNode[]): void => {
  // Group nodes by floor
  const nodesByFloor: MapNode[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    nodesByFloor[y] = nodes.filter(n => n.y === y);
  }
  
  // Connect each floor to the next
  for (let y = 0; y < MAP_HEIGHT - 1; y++) {
    const currentFloor = nodesByFloor[y];
    const nextFloor = nodesByFloor[y + 1];
    
    if (currentFloor.length === 0 || nextFloor.length === 0) continue;
    
    // First, ensure every node on the next floor has at least one connection
    nextFloor.forEach((nextNode) => {
      // Find the closest node from current floor
      const closestCurrentNode = currentFloor
        .map(node => ({
          node,
          distance: Math.abs(node.x - nextNode.x)
        }))
        .sort((a, b) => a.distance - b.distance)[0];
      
      if (closestCurrentNode && !closestCurrentNode.node.connections.includes(nextNode.id)) {
        closestCurrentNode.node.connections.push(nextNode.id);
      }
    });
    
    // Then, add additional connections for variety
    currentFloor.forEach(currentNode => {
      // Skip if this node already has many connections
      if (currentNode.connections.length >= 3) return;
      
      // Each node connects to 1-2 additional nodes on the next floor
      const maxAdditionalConnections = Math.min(2, nextFloor.length);
      const additionalConnections = Math.min(
        Math.floor(Math.random() * 2) + 1,
        maxAdditionalConnections
      );
      
      // Find the closest nodes to connect to (excluding already connected ones)
      const availableNextNodes = nextFloor.filter(node => 
        !currentNode.connections.includes(node.id)
      );
      
      const sortedNextNodes = availableNextNodes
        .map(node => ({
          node,
          distance: Math.abs(node.x - currentNode.x)
        }))
        .sort((a, b) => a.distance - b.distance);
      
      // Connect to additional closest nodes
      for (let i = 0; i < Math.min(additionalConnections, sortedNextNodes.length); i++) {
        const targetNode = sortedNextNodes[i].node;
        if (!currentNode.connections.includes(targetNode.id)) {
          currentNode.connections.push(targetNode.id);
        }
      }
    });
  }
};

export const getAvailableNodes = (map: GameMap): MapNode[] => {
  return map.nodes.filter(node => node.available && !node.completed);
};

export const completeNode = (map: GameMap, nodeId: string): GameMap => {
  const nodeToComplete = map.nodes.find(n => n.id === nodeId);
  
  // Don't modify if node doesn't exist, is already completed, or is not available
  if (!nodeToComplete || nodeToComplete.completed || !nodeToComplete.available) {
    return map;
  }
  
  const updatedNodes = map.nodes.map(node => {
    if (node.id === nodeId) {
      return { ...node, completed: true };
    }
    // Disable all nodes from previous floors AND same floor (except the completed one)
    if (node.y <= nodeToComplete.y && !node.completed) {
      return { ...node, available: false };
    }
    return node;
  });
  
  // Make connected nodes available ONLY if they are on the immediate next floor
  nodeToComplete.connections.forEach(connectionId => {
    const nodeIndex = updatedNodes.findIndex(n => n.id === connectionId);
    if (nodeIndex !== -1) {
      const connectedNode = updatedNodes[nodeIndex];
      // Only make available if it's on the immediate next floor (y = current node's y + 1)
      if (connectedNode.y === nodeToComplete.y + 1) {
        updatedNodes[nodeIndex] = { ...updatedNodes[nodeIndex], available: true };
      }
    }
  });
  
  // Update floor to the next floor
  const newFloor = nodeToComplete.y + 1;
  
  return {
    ...map,
    nodes: updatedNodes,
    currentNodeId: nodeId,
    floor: newFloor
  };
};

export const getNodeById = (map: GameMap, nodeId: string): MapNode | undefined => {
  return map.nodes.find(node => node.id === nodeId);
}; 