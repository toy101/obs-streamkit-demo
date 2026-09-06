import { useEffect, useState } from "react";
import {
  getCurrentScreen,
  screens,
  subscribeScreen,
  type ScreenId,
} from "../lib/storage";

export function Overlay() {
  const [screenId, setScreenId] = useState<ScreenId>(() => getCurrentScreen());

  useEffect(() => {
    const unsubscribe = subscribeScreen((screen) => {
      setScreenId(screen);
    });

    return unsubscribe;
  }, []);

  const screen = screens[screenId];

  return (
    <main className={`overlay overlay-${screenId}`}>
      <div className="overlay-content">
        <h1>{screen.title}</h1>
        <p>{screen.message}</p>
      </div>
    </main>
  );
}
