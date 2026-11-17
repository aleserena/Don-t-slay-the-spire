import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/theme.css";
import { installAutosave } from "./store/autosave";
import { useGameStore } from "./store/gameStore";

// Save the run while it is on the map and offer to continue it
installAutosave(useGameStore);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
