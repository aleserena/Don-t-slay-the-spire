import { useGameStore } from './store/gameStore';
import { GameBoard } from './components/GameBoard';
import { MapView } from './components/MapView';
import { CardRewardScreen } from './components/CardRewardScreen';
import { RelicRewardScreen } from './components/RelicRewardScreen';
import { EventScreen } from './components/EventScreen';
import { RestScreen } from './components/RestScreen';
import { ShopScreen } from './components/ShopScreen';
import { TitleScreen } from './components/TitleScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { GamePhase } from './types/game';
import './App.css';

function App() {
  const { gamePhase, startNewRun } = useGameStore();

  const renderCurrentPhase = () => {
    switch (gamePhase) {
      case GamePhase.TITLE:
        return <TitleScreen />;
      case GamePhase.MAP:
        return <MapView />;
      case GamePhase.COMBAT:
        return <GameBoard />;
      case GamePhase.CARD_REWARD:
        return <CardRewardScreen />;
      case GamePhase.RELIC_REWARD:
        return <RelicRewardScreen />;
      case GamePhase.EVENT:
        return <EventScreen />;
      case GamePhase.REST:
        return <RestScreen />;
      case GamePhase.SHOP:
        return <ShopScreen />;
      case GamePhase.GAME_OVER:
        return <GameOverScreen />;
      case GamePhase.VICTORY:
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            color: 'white'
          }}>
            <h1 style={{ fontSize: '48px', color: '#ffd700', marginBottom: '20px' }}>
              Victory!
            </h1>
            <p style={{ fontSize: '18px', marginBottom: '30px' }}>
              You have conquered the Spire!
            </p>
            <button
              onClick={startNewRun}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              Start New Run
            </button>
          </div>
        );
      default:
        return <MapView />;
    }
  };

  return (
    <div className="App" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {renderCurrentPhase()}
    </div>
  );
}

export default App; 