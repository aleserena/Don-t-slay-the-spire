import { useGameStore } from "./store/gameStore";
import { GameBoard } from "./components/GameBoard";
import { MapView } from "./components/MapView";
import { CardRewardScreen } from "./components/CardRewardScreen";
import { RelicRewardScreen } from "./components/RelicRewardScreen";
import { EventScreen } from "./components/EventScreen";
import { RestScreen } from "./components/RestScreen";
import { ShopScreen } from "./components/ShopScreen";
import { TitleScreen } from "./components/TitleScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { VictoryScreen } from "./components/VictoryScreen";
import { GamePhase } from "./types/game";
import "./App.css";

function App() {
  const gamePhase = useGameStore((state) => state.gamePhase);

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
        return <VictoryScreen />;
      default:
        return <MapView />;
    }
  };

  return (
    <div
      className="App"
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    >
      {renderCurrentPhase()}
    </div>
  );
}

export default App;
