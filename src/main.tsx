import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

/*
 * Overlay のサイズ指定は rem 基準で、1rem = 64px = 1920 x 1080 キャンバスの実寸。
 * そのキャンバスを描画するドキュメントにだけ root の font-size を 64px へ上げる。
 *
 *   ?view=overlay … 本番。OBS でも素のブラウザでも常に同じ実寸で描画される。
 *   ?view=debug   … その実寸のステージを transform で縮めて画面に収めるだけ。
 *
 * ドックは OBS の UI パネルであってキャンバスの一部ではないので、対象から外す。
 */
const view = new URLSearchParams(window.location.search).get("view");

if (view === "overlay" || view === "debug") {
  document.documentElement.classList.add("is-canvas");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
