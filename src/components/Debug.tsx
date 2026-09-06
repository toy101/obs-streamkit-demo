import { useEffect, useRef, useState } from "react";
import { Dock } from "./Dock";
import { Overlay } from "./Overlay";

/** OBS のブラウザソースの実寸。デバッグ画面のステージも同じ寸法で組む。 */
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

export function Debug() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (viewport === null) {
      return;
    }

    // 計測するのは空きスペース側。ステージは絶対配置でフローから外してあるので、
    // 縮小した結果がこの計測に跳ね返る無限ループにはならない。
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;

      setScale(
        Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT, 1),
      );
    });

    observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="debug">
      <div className="debug-dock">
        <Dock />
      </div>

      <div className="debug-preview">
        <p className="debug-preview-label">
          Overlay プレビュー — {CANVAS_WIDTH} × {CANVAS_HEIGHT} 実寸（表示倍率{" "}
          {Math.round(scale * 100)}%）
        </p>

        <div className="debug-viewport" ref={viewportRef}>
          <div className="debug-stage" style={{ transform: `scale(${scale})` }}>
            <Overlay />
          </div>
        </div>
      </div>
    </div>
  );
}
