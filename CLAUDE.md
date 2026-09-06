# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev      # Vite dev server (default http://localhost:5173)
pnpm build    # tsc -b (type check, project references) then vite build
pnpm lint     # eslint .
pnpm spell    # cspell over the repo
pnpm check    # type check + lint + spell, in that order
pnpm preview  # serve the production build
```

No test runner is configured; `pnpm check` is the full gate.

`cspell.json` drives `pnpm spell`. `**/*.svg` is excluded — the Vite template's SVGs are attribute
names, not prose — and new project vocabulary goes in `words`. Japanese comments need no special
handling: cspell 10 skips CJK on its own.

## Architecture

A single Vite + React 19 SPA that serves **three different views out of one bundle**, selected by the
`?view=` query string in `src/App.tsx`:

- `?view=dock` → `src/components/Dock.tsx` — the operator's control panel, opened as an OBS
  Custom Browser Dock.
- `?view=overlay` → `src/components/Overlay.tsx` — the on-air layer, added as an OBS Browser Source
  configured at 1920×1080.
- `?view=debug` → `src/components/Debug.tsx` — the Dock plus a full-size 1920×1080 Overlay stage,
  shrunk to fit the window, so the layout can be checked without launching OBS. Never used on air.
- No/unknown `view` → a usage hint. There is no router; adding a view means extending this branch.

### Cross-window state

Dock and Overlay are separate browser windows inside OBS, so they cannot share React state. They
communicate through `localStorage` under the key `obs-demo:selected-screen`, wrapped by
`src/lib/storage.ts`:

- `screens` is the single source of truth for the available screens (`waiting` / `match` / `break`)
  and their display text. `ScreenId` is derived from it with `keyof typeof screens`, so **adding a
  screen means adding one entry to `screens`** — the Dock's `<select>`, the Overlay's rendering, and
  the type all follow automatically. The only extra work is a `.overlay-<id>` rule in `index.css`.
- Dock writes with `setCurrentScreen`; Overlay subscribes via `subscribeScreen`. Subscribers are
  reached through **two paths**, because neither one covers both cases: the `storage` event fires
  only in *other* windows (Dock→Overlay across OBS windows), while a module-level `listeners` set in
  `storage.ts` covers subscribers in the *same* window (Dock→Overlay inside `?view=debug`).
  `setCurrentScreen` drives that second path itself, so **every writer must go through
  `setCurrentScreen`** rather than touching `localStorage` directly, or same-window views go stale.
- `isScreenId` guards every read, so unknown/removed values fall back to `waiting` rather than
  crashing the overlay mid-stream.

### Sizing: rem is the overlay's canvas unit

The Browser Source runs at 1920×1080, which does not fit on a development screen. Rather than keeping
two stylesheets in sync, the overlay is laid out entirely in `rem` and the root font size carries the
scale (a technique adapted from a published article, which applies the same trick at 1/4 scale):

- `html { font-size: 16px }` — the default, used by `?view=dock` and the usage hint. A plain px world.
- `html.is-canvas { font-size: 64px }` — `1rem = 64px`, so the CSS describes a real 1920×1080 canvas.

`src/main.tsx` adds `is-canvas` for `?view=overlay` and `?view=debug`. It is a **view-based** switch,
not an environment probe: `?view=overlay` renders at exactly 1920×1080 in OBS, in a plain browser and
inside the debug preview alike, so no environment can scale the overlay differently. The Dock is an
OBS UI panel rather than part of the canvas, and stays at 16px.

`?view=debug` keeps its stage at a literal `1920px × 1080px` and shrinks only the *presentation* with
`transform: scale()`, sized from the free space by a `ResizeObserver`. Layout is always computed at
full size, so the boxes DevTools reports are the boxes OBS will draw.

What this demands when editing styles:

- Under `.overlay`, every size and position value (`font-size`, `width`, `height`, `padding`,
  `border`, `top`, `left`, …) must be `rem`, written as *canvas pixels ÷ 64*. A single `px` there
  escapes the scaling and makes OBS and the debug view disagree — precisely the bug this prevents.
- `.dock`, `.debug*` and other chrome stay in `px` on purpose. Because the debug document's root is
  64px, every px-world container has to declare its own `font-size` — `.dock` and `.debug` both do —
  otherwise text with no explicit size inherits 64px.
- The `64px` is hardcoded, so the Browser Source has to be configured at 1920×1080.

### Overlay styling constraints

`src/index.css` holds all live styles. `.overlay` must keep `background: transparent` — OBS composites
the Browser Source over the scene, so any opaque body/overlay background would black out the stream.
`?view=debug` renders the overlay over a checkerboard so a lost transparency shows up immediately.
Per-screen theming goes on `.overlay-<id> .overlay-content`.

## Notes

- `src/App.css` and `src/assets/*` are leftovers from the Vite template and are not imported anywhere.
- `README.md` (English) and `README.ja.md` (Japanese) carry the same content. Update both together,
  or they drift apart silently — nothing checks that they agree.
- TypeScript runs with `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (type-only
  imports must use `import type` / inline `type`), and `erasableSyntaxOnly` (no enums, no parameter
  properties).
