# Design notes

This file describes how the demo looks and why. For how the code is organised, see [`ARCHITECTURE.md`](../ARCHITECTURE.md). For what the app does, see the [README](../README.md).

The UI is dark and quiet. Most of the screen is the map, and the numbers are meant to be read like output from a tool, so there is very little decoration.

## Colors and typography

The background is `#0a0b0f` with a faint 40px grid and a radial vignette. Panels use `rgba(255, 255, 255, 0.03)` with hairline borders instead of solid fills.

Colors are defined as CSS variables in `src/app/styles/tokens.css` and components refer to the variables, not to literal colors. The ones that matter most:

| Token | Used for |
| --- | --- |
| `--color-route-ga` | GA route, `#4f9eff` |
| `--color-route-baseline` | Baseline route, `#ff6b4a`, dashed |
| `--color-success` | Start marker, positive improvement |
| `--color-danger` | End marker, errors |
| `--color-fg-dim` | Small labels, `#7f8491` |

Start is green, end is red and stops are blue. The two routes use different colors and different line styles (solid and dashed), so you can tell them apart even when they overlap.

Numbers (distances, coordinates, parameter values, improvement percentages) use JetBrains Mono, so digits line up in columns. Everything else uses Geist Sans. Both are loaded through `next/font/google`.

## Map

- **Basemap:** Esri World Dark Gray. It needs no API key. I first used CartoDB Dark Matter, but it started requiring a key. A CSS filter, `brightness(0.72) contrast(1.08) saturate(0.75)`, darkens the tiles a little so they sit closer to the app background.
- **Markers:** Start and end markers have a pulsing ring. Stops are numbered in the monospaced font. When a route is shown, the numbers are the visit order, which matches the sequence in the results panel. With no route, they are the order in which the stops were added.
- **GA route:** drawn twice, a wide soft line behind a thin sharp one, and animated drawing in whenever a new solution arrives. The baseline is dashed and is not animated.
- **Auto-fit:** the map fits the current points when it mounts. Loading a preset or resetting remounts it, so the view adjusts without panning by hand.

The Leaflet-specific CSS (container, controls, dark popup) lives in `src/app/styles/leaflet.css`, and the marker and route styles in `markers.css`.

## Layout

On desktop there are three columns: controls (340px), map (flexible) and results (380px).

On mobile the map takes 45% of the viewport height (`45dvh`). The controls and results panels share the rest of the screen and switch with a two-tab bar at the bottom, which respects `env(safe-area-inset-bottom)`. The Results tab opens by itself when a run finishes.

The header is a fixed 56px bar. On the right, a status pill follows the state of the app:

`Add points to start` → `Ready · 5 stops` → `Optimizing…` → `11.1% better`

Next to the pill, a GitHub icon links to the repository. A small floating HUD on the map shows the stop count and warns when the start or end is missing. The browser tab title also shows the improvement once a run is done.

## Motion

| Animation | Where |
| --- | --- |
| `pulse-ring` | Start and end markers |
| `stroke-dashoffset` transition | GA route drawing in; the path length is measured on each render |
| `pathLength={1}` with `sparkline-draw` | Convergence curve |
| `fade-in`, `slide-up` | Panels and popovers |

All of them are turned off under `prefers-reduced-motion: reduce` (`src/app/styles/a11y.css`).

## Accessibility

- The focus ring is the brand blue instead of the browser default.
- `--color-fg-dim` was lightened to `#7f8491` so 10–11px labels meet WCAG AA contrast.
- Everything can be used with the keyboard. Sliders have visible focus states, <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> runs the solver, and <kbd>Esc</kbd> closes the map popup.
- Toggle buttons use `aria-pressed`, icon-only controls have an `aria-label`, and error messages use `role="alert"`.
- The GitHub link has `aria-label="View source on GitHub"` and `rel="noopener noreferrer"`.

## Styles

`src/app/globals.css` only imports the files in `src/app/styles/` and defines nothing itself:

| File | Contents |
| --- | --- |
| `tokens.css` | `@theme` tokens: colors, fonts, radii, animations |
| `keyframes.css` | All `@keyframes` |
| `base.css` | `html` and `body` defaults, grid texture, scrollbars, focus ring |
| `leaflet.css` | Leaflet container, controls and popup |
| `markers.css` | Marker and route-line styles |
| `slider.css` | Slider track and progress |
| `a11y.css` | `prefers-reduced-motion` override |

A new concern gets its own file and one `@import`, without touching existing components. The project uses Tailwind CSS v4, which has no `tailwind.config.js`; tokens live in `@theme`. Tailwind v4 reads `@theme` from imported files today, but check that again after a major Tailwind upgrade.

## Why a few things look the way they do

- **Tokens instead of literal colors.** Changing a color means editing one variable, not many class names.
- **Monospaced numbers.** Columns of distances and times are easier to compare when the digits align.
- **Different route colors and line styles.** The comparison between the GA route and the baseline is the main point of the app, and it should be readable at a glance, including for people who can't tell blue and orange apart well.
- **The header link and the page metadata share one constant.** `GITHUB_REPO_URL` in `src/lib/constants.ts` is used by both, so a fork changes one line.