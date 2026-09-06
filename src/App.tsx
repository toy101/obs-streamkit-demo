import { Debug } from "./components/Debug";
import { Dock } from "./components/Dock";
import { Overlay } from "./components/Overlay";

export default function App() {
  const param = new URLSearchParams(window.location.search);
  const view = param.get("view");

  if (view === "dock") {
    return <Dock />;
  }

  if (view === "overlay") {
    return <Overlay />;
  }

  if (view === "debug") {
    return <Debug />;
  }

  return (
    <main className="error">
      <p>?view=dock / ?view=overlay / ?view=debug のいずれかを指定してください</p>
    </main>
  );
}
