# OBS Streamkit Demo

**English** | [日本語](README.ja.md)

A minimal example of driving a stream overlay from an operator's control panel, using nothing but a
single Vite + React SPA and `localStorage`.

One bundle serves two surfaces inside OBS:

- a **Custom Browser Dock** the operator clicks
- a **Browser Source** the audience sees

Picking a screen in the dock switches the on-air overlay instantly. No server, no WebSocket, no OBS
plugin.

## Quick start

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5173/?view=debug> — the dock and a full-size overlay preview sit side by side,
so you can build the overlay without launching OBS. (Vite moves to the next free port if 5173 is
taken; trust the URL it prints.)

## Views

One bundle, three views, selected by the `?view=` query string in `src/App.tsx`.

| URL | What it is |
| --- | --- |
| `?view=debug` | Dock plus a 1920x1080 overlay preview in one window. Development only. |
| `?view=dock` | Operator control panel. Add to OBS as a Custom Browser Dock. |
| `?view=overlay` | The on-air layer. Add to OBS as a Browser Source at 1920x1080. |

The debug preview draws the overlay over a checkerboard, so a lost transparent background shows up
immediately instead of on stream.

## Setting it up in OBS

1. Serve the app (`pnpm dev`, or `pnpm build` and host `dist/`).
2. **Docks -> Custom Browser Docks...**, then add `http://localhost:5173/?view=dock`.
3. Add a **Browser Source** to your scene pointing at `http://localhost:5173/?view=overlay`, with
   width **1920** and height **1080**.
4. Switch screens from the dock. The overlay follows.

The overlay keeps a transparent background so OBS composites it over whatever is underneath.

## How it works

### Talking between two windows

The dock and the overlay are separate browser windows inside OBS, so they cannot share React state.
They share `localStorage` under `obs-demo:selected-screen` instead, wrapped by `src/lib/storage.ts`.

`subscribeScreen` reaches listeners two ways, because neither one covers both cases:

- the `storage` event, which fires only in *other* windows — dock to overlay across OBS windows
- a module-level listener set, for subscribers in the *same* window — dock to preview in `?view=debug`

`setCurrentScreen` drives that second path itself, so every writer must go through it rather than
touching `localStorage` directly.

### One design, two scales

A Browser Source runs at 1920x1080, which does not fit on a development screen. Rather than keeping
two stylesheets in sync, the overlay is laid out entirely in `rem` and the root font size carries the
scale:

```css
html           { font-size: 16px; }  /* dock and usage hint: a plain px world */
html.is-canvas { font-size: 64px; }  /* 1rem = 64px, so the CSS describes a real 1920x1080 canvas */
```

`src/main.tsx` adds `is-canvas` for `?view=overlay` and `?view=debug`. It is a view-based switch, not
an environment probe, so nothing about *where* the overlay is open can scale it differently.

`?view=debug` keeps its stage at a literal 1920x1080 and shrinks only the *presentation* with
`transform: scale()`. Layout is always computed at full size, so the boxes DevTools reports are the
boxes OBS will draw.

When editing styles: everything under `.overlay` must be `rem`, written as *canvas pixels divided by
64*. A single `px` value there escapes the scaling. `.dock`, `.debug*` and other chrome stay in `px`
on purpose, and each declares its own `font-size` so it does not inherit the 64px root.

## Adding a screen

`screens` in `src/lib/storage.ts` is the single source of truth:

```ts
export const screens = {
  waiting: { label: "待機画面", title: "WAITING", message: "配信開始までお待ちください" },
  match:   { label: "試合画面", title: "MATCH",   message: "試合中" },
  break:   { label: "休憩画面", title: "BREAK",   message: "しばらくお待ちください" },
} as const;
```

Add an entry and the dock's `<select>`, the overlay's rendering and the `ScreenId` type all follow
automatically. The only extra work is a `.overlay-<id>` rule in `src/index.css` for the theming.

Unknown or removed values fall back to `waiting` rather than crashing the overlay mid-stream.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server |
| `pnpm build` | `tsc -b`, then `vite build` |
| `pnpm lint` | ESLint |
| `pnpm spell` | cspell across the repo |
| `pnpm check` | type check, lint and spell in one go |
| `pnpm preview` | serve the production build |

No test runner is configured; `pnpm check` is the full gate.

## Stack

Vite 8, React 19, TypeScript 6. No router, no UI framework, no state library — `src/index.css` holds
every style.
