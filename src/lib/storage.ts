export const STORAGE_KEY = "obs-demo:selected-screen";

export const screens = {
  waiting: {
    label: "待機画面",
    title: "WAITING",
    message: "配信開始までお待ちください",
  },
  match: {
    label: "試合画面",
    title: "MATCH",
    message: "試合中",
  },
  break: {
    label: "休憩画面",
    title: "BREAK",
    message: "しばらくお待ちください",
  },
} as const;

export type ScreenId = keyof typeof screens;

export function isScreenId(value: string | null): value is ScreenId {
  return value !== null && value in screens;
}

export function getCurrentScreen(): ScreenId {
  const value = localStorage.getItem(STORAGE_KEY);

  if (isScreenId(value)) {
    return value;
  }

  return "waiting";
}

type ScreenListener = (screen: ScreenId) => void;

/**
 * 同一ウィンドウ内の購読者。storage イベントは「他のウィンドウ」にしか飛ばないため、
 * Dock と Overlay が同居する ?view=debug ではこちらを経由して通知する。
 */
const listeners = new Set<ScreenListener>();

export function setCurrentScreen(screen: ScreenId) {
  localStorage.setItem(STORAGE_KEY, screen);

  for (const listener of listeners) {
    listener(screen);
  }
}

export function subscribeScreen(callback: ScreenListener) {
  const handler = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    if (!isScreenId(event.newValue)) {
      return;
    }

    callback(event.newValue);
  };

  // 購読ごとに別の関数を登録し、同じ callback を 2 回渡されても解除が干渉しないようにする。
  const listener: ScreenListener = (screen) => {
    callback(screen);
  };

  window.addEventListener("storage", handler);
  listeners.add(listener);

  return () => {
    window.removeEventListener("storage", handler);
    listeners.delete(listener);
  };
}
