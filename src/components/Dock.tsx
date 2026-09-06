import { useState } from "react";
import {
  getCurrentScreen,
  screens,
  setCurrentScreen,
  type ScreenId,
} from "../lib/storage";

export function Dock() {
  const [selectedScreen, setSelectedScreen] = useState<ScreenId>(() =>
    getCurrentScreen(),
  );

  const handleChange = (screen: ScreenId) => {
    setSelectedScreen(screen);
    setCurrentScreen(screen);
  };

  return (
    <main className="dock">
      <h1>Overlay Controller</h1>

      <label>
        表示する画面
        <select
          value={selectedScreen}
          onChange={(event) => handleChange(event.target.value as ScreenId)}
        >
          {Object.entries(screens).map(([id, screen]) => (
            <option key={id} value={id}>
              {screen.label}
            </option>
          ))}
        </select>
      </label>

      <p>
        現在の表示:
        <strong>{screens[selectedScreen].label}</strong>
      </p>
    </main>
  );
}
