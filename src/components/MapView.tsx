import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { NodeType } from '../types/map';

const getCardTypeColor = (cardType: string) => {
  switch (cardType) {
    case 'attack':
      return 'linear-gradient(135deg, #ff6b6b, #ee5a52)'; // Red
    case 'skill':
      return 'linear-gradient(135deg, #4ecdc4, #44a08d)'; // Blue/Teal
    case 'power':
      return 'linear-gradient(135deg, #ffe66d, #ffcc02)'; // Yellow
    default:
      return 'linear-gradient(135deg, #95a5a6, #7f8c8d)'; // Gray
  }
};

export const MapView: React.FC = () => {
  const { map, selectNode, drawPile, exhaustPile } = useGameStore();
  const [showDeckView, setShowDeckView] = useState(false);

  if (!map) return null;

  const getNodeIcon = (type: NodeType): string => {
    switch (type) {
      case NodeType.COMBAT:
        return '⚔️';
      case NodeType.ELITE:
        return '👹';
      case NodeType.BOSS:
        return '💀';
      case NodeType.EVENT:
        return '❓';
      case NodeType.SHOP:
        return '🏪';
      case NodeType.REST:
        return '🔥';
      case NodeType.TREASURE:
        return '💰';
      default:
        return '❓';
    }
  };

  const getNodeColor = (type: NodeType): string => {
    switch (type) {
      case NodeType.COMBAT:
        return '#ff6b6b';
      case NodeType.ELITE:
        return '#ff8c42';
      case NodeType.BOSS:
        return '#8b0000';
      case NodeType.EVENT:
        return '#4ecdc4';
      case NodeType.SHOP:
        return '#45b7d1';
      case NodeType.REST:
        return '#96ceb4';
      case NodeType.TREASURE:
        return '#feca57';
      default:
        return '#95a5a6';
    }
  };

  const handleNodeClick = (nodeId: string) => {
    const node = map.nodes.find(n => n.id === nodeId);
    if (node && node.available && !node.completed) {
      selectNode(nodeId);
    }
  };

  // Group nodes by floor for rendering
  const nodesByFloor: { [floor: number]: typeof map.nodes } = {};
  map.nodes.forEach(node => {
    if (!nodesByFloor[node.y]) {
      nodesByFloor[node.y] = [];
    }
    nodesByFloor[node.y].push(node);
  });

  const maxFloor = Math.max(...map.nodes.map(n => n.y));

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      color: 'white',
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100%'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          marginBottom: '30px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}>
          The Spire - Floor {map.floor + 1}
        </h1>

        <div style={{
          position: 'relative',
          width: '800px',
          height: `${(maxFloor + 1) * 100}px`
        }}>
          {/* Render connections first (behind nodes) */}
          {map.nodes.map(node => 
            node.connections.map(connectionId => {
              const connectedNode = map.nodes.find(n => n.id === connectionId);
              if (!connectedNode) return null;

              return (
                <svg
                  key={`${node.id}-${connectionId}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}
                >
                  <line
                    x1={node.x * 100 + 50}
                    y1={(maxFloor - node.y) * 100 + 50}
                    x2={connectedNode.x * 100 + 50}
                    y2={(maxFloor - connectedNode.y) * 100 + 50}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="2"
                  />
                </svg>
              );
            })
          )}

          {/* Render nodes */}
          {map.nodes.map(node => (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node.id)}
              style={{
                position: 'absolute',
                left: `${node.x * 100}px`,
                top: `${(maxFloor - node.y) * 100}px`,
                width: '100px',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: node.completed 
                  ? 'rgba(100, 100, 100, 0.5)' 
                  : node.available 
                    ? getNodeColor(node.type)
                    : 'rgba(50, 50, 50, 0.8)',
                border: node.available && !node.completed 
                  ? '3px solid #ffd700' 
                  : '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                cursor: node.available && !node.completed ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                zIndex: 2,
                opacity: node.available || node.completed ? 1 : 0.5,
                transform: node.available && !node.completed ? 'scale(1)' : 'scale(0.9)'
              }}
              onMouseEnter={(e) => {
                if (node.available && !node.completed) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (node.available && !node.completed) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '5px' }}>
                {getNodeIcon(node.type)}
              </div>
              <div style={{ 
                fontSize: '10px', 
                textAlign: 'center',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                {node.type.toUpperCase()}
              </div>
              {node.completed && (
                <div style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  fontSize: '16px'
                }}>
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Deck View Button */}
        <div style={{ marginTop: '20px', marginBottom: '10px' }}>
          <button
            onClick={() => setShowDeckView(true)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }}
          >
            📚 View Deck ({drawPile.length + exhaustPile.length} cards)
          </button>
        </div>

        <div style={{
          marginTop: '10px',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '10px',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Legend</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '10px',
            fontSize: '12px'
          }}>
            <div><span style={{ fontSize: '16px' }}>⚔️</span> Combat</div>
            <div><span style={{ fontSize: '16px' }}>👹</span> Elite</div>
            <div><span style={{ fontSize: '16px' }}>💀</span> Boss</div>
            <div><span style={{ fontSize: '16px' }}>❓</span> Event</div>
            <div><span style={{ fontSize: '16px' }}>🏪</span> Shop</div>
            <div><span style={{ fontSize: '16px' }}>🔥</span> Rest</div>
            <div><span style={{ fontSize: '16px' }}>💰</span> Treasure</div>
          </div>
        </div>

        {/* Deck View Modal */}
        {showDeckView && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '90%',
              maxHeight: '90%',
              overflow: 'auto',
              border: '3px solid #4ecdc4'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ color: 'white', margin: 0 }}>Current Deck</h2>
                <button
                  onClick={() => setShowDeckView(false)}
                  style={{
                    background: '#e74c3c',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                {/* Draw Pile */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h3 style={{ color: '#4ecdc4', marginBottom: '15px' }}>
                    Draw Pile ({drawPile.length} cards)
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '10px',
                    maxHeight: '400px',
                    overflow: 'auto',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px'
                  }}>
                    {drawPile.map((card, index) => (
                      <div key={`draw-${index}`} style={{
                        background: getCardTypeColor(card.type),
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        textAlign: 'center',
                        color: 'white',
                        border: '2px solid rgba(255,255,255,0.3)',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                          {card.name}
                        </div>
                        <div style={{ marginBottom: '6px' }}>
                          Cost: {card.cost} energy
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '6px',
                          marginBottom: '4px'
                        }}>
                          {card.damage && card.damage > 0 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#fff',
                              background: 'rgba(255, 107, 107, 0.9)',
                              padding: '2px 5px',
                              borderRadius: '8px',
                              border: '1px solid #fff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                            }}>
                              <span style={{ marginRight: '2px' }}>⚔️</span>
                              {card.damage}
                            </div>
                          )}
                          {card.block && card.block > 0 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#fff',
                              background: 'rgba(68, 68, 255, 0.9)',
                              padding: '2px 5px',
                              borderRadius: '8px',
                              border: '1px solid #fff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                            }}>
                              <span style={{ marginRight: '2px' }}>🛡️</span>
                              {card.block}
                            </div>
                          )}
                          {card.id === 'body_slam' && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#fff',
                              background: 'rgba(255, 107, 107, 0.9)',
                              padding: '2px 5px',
                              borderRadius: '8px',
                              border: '1px solid #fff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                            }}>
                              <span style={{ marginRight: '2px' }}>⚔️</span>
                              Block
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exhaust Pile */}
                {exhaustPile.length > 0 && (
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 style={{ color: '#95a5a6', marginBottom: '15px' }}>
                      Exhausted ({exhaustPile.length} cards)
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                      gap: '10px',
                      maxHeight: '400px',
                      overflow: 'auto',
                      padding: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '8px'
                    }}>
                      {exhaustPile.map((card, index) => (
                        <div key={`exhaust-${index}`} style={{
                          background: getCardTypeColor(card.type),
                          padding: '12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          textAlign: 'center',
                          color: 'white',
                          border: '2px solid rgba(255,255,255,0.3)',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        >
                          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                            {card.name}
                          </div>
                          <div style={{ marginBottom: '6px' }}>
                            Cost: {card.cost} energy
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '6px',
                            marginBottom: '4px'
                          }}>
                            {card.damage && card.damage > 0 && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#fff',
                                background: 'rgba(255, 107, 107, 0.9)',
                                padding: '2px 5px',
                                borderRadius: '8px',
                                border: '1px solid #fff',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                              }}>
                                <span style={{ marginRight: '2px' }}>⚔️</span>
                                {card.damage}
                              </div>
                            )}
                            {card.block && card.block > 0 && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#fff',
                                background: 'rgba(68, 68, 255, 0.9)',
                                padding: '2px 5px',
                                borderRadius: '8px',
                                border: '1px solid #fff',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                              }}>
                                <span style={{ marginRight: '2px' }}>🛡️</span>
                                {card.block}
                              </div>
                            )}
                            {card.id === 'body_slam' && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#fff',
                                background: 'rgba(255, 107, 107, 0.9)',
                                padding: '2px 5px',
                                borderRadius: '8px',
                                border: '1px solid #fff',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                              }}>
                                <span style={{ marginRight: '2px' }}>⚔️</span>
                                Block
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 