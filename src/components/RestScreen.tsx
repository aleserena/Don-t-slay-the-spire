import React from 'react';
import { useGameStore } from '../store/gameStore';

export const RestScreen: React.FC = () => {
  const { returnToMap } = useGameStore();

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '40px',
        borderRadius: '20px',
        border: '3px solid #96ceb4',
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '36px', 
          color: '#96ceb4', 
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}>
          🔥 Rest Site
        </h1>

        <div style={{
          fontSize: '18px',
          lineHeight: '1.6',
          marginBottom: '40px',
          padding: '20px',
          background: 'rgba(150, 206, 180, 0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(150, 206, 180, 0.3)'
        }}>
          You find a peaceful campfire. The warmth soothes your wounds and calms your mind.
          <br /><br />
          <strong style={{ color: '#96ceb4' }}>You have been healed for 30 HP!</strong>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            padding: '20px',
            background: 'rgba(150, 206, 180, 0.2)',
            borderRadius: '10px',
            border: '2px solid #96ceb4'
          }}>
            <h3 style={{ 
              fontSize: '20px', 
              marginBottom: '10px',
              color: '#96ceb4'
            }}>
              Rest Benefits
            </h3>
            <ul style={{ 
              textAlign: 'left', 
              fontSize: '16px',
              listStyle: 'none',
              padding: 0
            }}>
              <li style={{ marginBottom: '8px' }}>
                ❤️ Restored 30 Health
              </li>
              <li style={{ marginBottom: '8px' }}>
                🧘 Removed all debuffs
              </li>
              <li style={{ marginBottom: '8px' }}>
                ✨ Feeling refreshed
              </li>
            </ul>
          </div>
        </div>

        <button
          onClick={returnToMap}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: '#96ceb4',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#7fb3a3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#96ceb4';
          }}
        >
          Continue Journey
        </button>
      </div>
    </div>
  );
}; 