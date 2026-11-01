# Architecture

This document is for engineers who need to change the VRP demo, not just
run it. The README explains what the demo does. This file explains where
the pieces live, how they talk to each other, and which boundaries we
try not to cross. It is deliberately more concrete than the README. If
the code and this document disagree, trust the code first, then fix this
file.

------------------------------------------------------------------------

## Table of contents

-   [System overview](#system-overview)
-   [Layer model](#layer-model)
-   [Data flow](#data-flow)
-   [Module responsibilities](#module-responsibilities)
-   [Algorithm design](#algorithm-design)
-   [State management](#state-management)
-   [React 19 constraints](#react-19-constraints)
-   [Map rendering](#map-rendering)
-   [API contract](#api-contract)
-   [Type contracts](#type-contracts)
-   [Testing strategy](#testing-strategy)
-   [Extension points](#extension-points)
-   [Known constraints and
    trade-offs](#known-constraints-and-trade-offs)
-   [Dependency map](#dependency-map)

------------------------------------------------------------------------

## System overview

The application is split into a browser-based UI, a thin Next.js API
route, a pure domain layer, and a Vitest test suite. The browser
communicates with the solver only through HTTP; it never imports or
invokes the algorithm directly.

``` mermaid
flowchart TB
    subgraph Browser["Browser"]
        direction TB
        Page["app/page.tsx<br/>(application state owner)"]
        Controls["ControlPanel<br/>+ 7 children<br/>(controlled)"]
        Map["MapView<br/>+ 10 children<br/>(dynamic import; client-only)"]
        Results["ResultsPanel<br/>+ 5 children<br/>(presentation)"]
        Hooks["hooks/<br/>useOptimize · useKeyboardShortcut<br/>useDynamicTitle"]
        UILib["lib/ UI helpers and data<br/>summarizePointSet · placePoint · presets"]

        Controls --> Page
        Map --> Page
        Results --> Page
        Page --> Hooks
        Page --> UILib
    end

    Page -->|"POST /api/optimize<br/>{ points, config }<br/>(AbortController signal)"| API

    subgraph Server["Next.js API route"]
        API["app/api/optimize/route.ts<br/>(HTTP handling only)"]
        Parse["parseOptimizeRequest()"]
        GA["solveGA()"]
        NN["solveNearestNeighbor()"]
        Improvement["computeImprovement()"]

        API --> Parse
        API --> GA
        API --> NN
        API --> Improvement
    end

    subgraph Domain["lib/ — pure domain modules"]
        Types["types.ts"]
        Distance["distance.ts"]
        Operators["operators.ts"]
        RNG["rng.ts"]
        Validation["validation/"]
        Points["points.ts"]
        Other["constants · format · presets<br/>role-meta · utils"]
    end

    Parse --> Validation
    GA --> Types
    GA --> Distance
    GA --> Operators
    GA --> RNG
    NN --> Distance
    NN --> Types
    Improvement --> Distance

    Domain --> Tests["tests/ (Vitest)<br/>81 tests across 7 files"]
```

The important part of that picture is the split between the browser and
the API route. The UI never calls the algorithm directly. It sends
points and config over HTTP, and the route does the parsing, validation,
solving, and response shaping. Everything under `lib/` is pure enough to
run in Node, in tests, or in a worker later if we need to move the
solver off the request thread.

## Layer model

There are five layers, and dependencies only point downward:

``` mermaid
flowchart TB
    Presentation["Presentation (React)<br/>components/ · app/page.tsx<br/>app/layout.tsx · app/styles/*.css"]
    Hooks["Hooks (React only)<br/>hooks/<br/>useOptimize · useDynamicTitle · useKeyboardShortcut"]
    API["API (Next.js route)<br/>app/api/optimize/route.ts"]
    Domain["Domain (pure logic)<br/>lib/distance.ts · lib/ga.ts · lib/nearest-neighbor.ts<br/>lib/validation/* · lib/points.ts · lib/format.ts"]
    Contracts["Contracts and constants<br/>lib/types.ts (types only)<br/>lib/constants.ts (runtime values)"]

    Presentation -->|"depends on"| Hooks
    Hooks -->|"depends on"| API
    API -->|"depends on"| Domain
    Domain -->|"uses"| Contracts
```

### Rules

-   `lib/types.ts` is the shared contract. It contains types only, with
    no runtime imports.
-   `lib/*.ts` files do not import React or Next. The one exception is
    `lib/utils.ts`, which is a tiny helper around `clsx` and
    `tailwind-merge` for the UI. `lib/role-meta.ts` is plain data.
    Everything else, including `lib/validation/*`, runs in Node, in
    tests, and potentially in a worker without changes.
-   `app/api/*` never imports from `components/` or `hooks/`. The API
    layer does not know the UI exists.
-   `components/*` never import from `app/api/*`. The UI goes through
    HTTP; it does not reach into the route handler.
-   `hooks/*` depend only on `lib/`, never on `components/`.
-   Only `app/page.tsx` holds application state. Child components are
    either controlled (`ControlPanel`, `ResultsPanel`) or own only
    Leaflet's internal state (`MapView`).
-   `lib/validation/*` is a directory, not a file. Its public facade
    (`index.ts`) exports exactly three names: `ValidationError`,
    `parseOptimizeRequest`, and `requireStartAndEnd`. The internal
    helpers (`primitives`, `fields`) are not re-exported. That is what
    keeps the split invisible to consumers.

If you break one of these rules, it is usually a sign that someone took
a shortcut around the HTTP boundary or let a UI concern leak into the
algorithm. Both are worth fixing before they spread.

------------------------------------------------------------------------

## Data flow

### 1. Point placement

``` text
User clicks the map
  → MapClickHandler (react-leaflet useMapEvents)
  → MapView.onMapClick(lat, lng)
  → page.tsx handleMapClick(lat, lng)
  → placePoint(points, clickMode, lat, lng, id)  ← pure, lib/points.ts
  → setPoints([...])
  → reset()  ← invalidates result and aborts an in-flight request
```

`placePoint` owns the per-role rules: `start` replaces the existing
start, `end` replaces the existing end, and `stop` appends. The `id` is
passed in rather than generated inside the function, so the function
stays pure and testable. The caller owns uniqueness, currently via
`Date.now()`.

Any change to the point set invalidates the previous route. `reset()` is
the authoritative way to do that. The caller does not have to remember
to also clear `result`, `error`, and the loading state.

### 2. Config change

``` text
User drags a slider
  → ControlPanel.onConfigChange(newConfig)
  → page.tsx handleConfigChange
  → setConfig(newConfig)
  → reset()
```

### 3. Optimization run

``` text
User clicks "Optimize route" (or Ctrl/Cmd + Enter)
  → useOptimize.run()  (from ControlPanel via onOptimize, or via useKeyboardShortcut)
  → abortRef.current?.abort()  ← supersede any in-flight request
  → POST /api/optimize  { points, config }  (with AbortController signal)
     ↓
  → route.ts: parse → validate → runGA → nearestNeighbor → respond
     ↓
  → useOptimize setResult(data)
  → onSuccess(data) → setActiveRoute("ga") · setMobileTab("results")
  → useDynamicTitle updates document.title
  → ResultsPanel renders · MapView renders new polyline
```

### 4. Route toggle

``` text
User clicks "Baseline" tab in ResultsPanel
  → page.tsx setActiveRoute("baseline")
  → MapView receives route = baseline.sequence, variant = "baseline"
  → MapView renumbers stops by baseline visit order
  → ResultsPanel renders baseline metrics as active
```

There is no additional API call here. Both routes are already in
`result`.

### 5. Reset (during or after a run)

``` text
User clicks "Reset points"
  → page.tsx handleReset()
  → setPoints(INITIAL_POINTS)
  → reset()  ← aborts in-flight fetch, clears result/error/loading
  → setMapKey(k => k + 1)  ← remounts MapView (fitBounds fires fresh)
```

If a fetch was in flight, its response is never applied. The
`AbortController` fires and the `try/catch` short-circuits before
`setResult`.

------------------------------------------------------------------------

## Module responsibilities

### `lib/types.ts`

This is the contract everyone shares. It defines:

  Symbol                                  Purpose
  --------------------------------------- ----------------------------------------------
  `Point`, `PointRole`                    A geographic point with role
  `Objective`                             `"distance"` or `"time"`
  `GAConfig`                              The tunable parameters
  `FitnessHistoryPoint`                   One row of the convergence history
  `RouteSolution`                         A fully evaluated route
  `GAResult`, `BaselineResult`            Algorithm-specific extensions
  `Preset`                                A named point set (used by `lib/presets.ts`)
  `OptimizeRequest`, `OptimizeResponse`   HTTP contract

There are zero runtime values here. Every constant lives in
`lib/constants.ts`.

### `lib/constants.ts`

All runtime constants live here:

-   `EARTH_RADIUS_M`, `AVERAGE_SPEED_KMH`, `AVERAGE_SPEED_MS` for the
    physics.
-   `MIN_POINTS`, `MAX_POINTS` for safety bounds.
-   `VALID_ROLES`, `VALID_OBJECTIVES` as `as const satisfies` arrays
    that stay in sync with their corresponding types via TypeScript.
-   `DEFAULT_GA_CONFIG`, `GA_CONFIG_BOUNDS` for GA defaults and
    validation ranges.
-   `BoundedGAConfigKey`, the exported type for `keyof` bounds.
-   `GITHUB_REPO_URL`, the public repo URL. It is consumed by
    `Header.tsx` for the source link and by `layout.tsx` for
    `metadata.other.repository`, so a fork updates one line.

### `lib/distance.ts`

Pure geospatial primitives:

-   `haversineDistance(a, b)` gives great-circle distance in meters.
-   `evaluateSequence(points, sequence, objective)` computes
    `{ sequence, totalDistance, totalTime, fitness }`.
-   `computeImprovement(baseline, candidate)` returns fractional
    improvement, clamped to `[0, 1]`.

No state. No randomness. Deterministic given inputs. That is why it can
be tested exhaustively against known distances.

### `lib/operators.ts`

GA operators as individually exported pure functions:

-   `orderCrossover(p1, p2, rng)` always produces a valid permutation.
-   `swapMutation(chrom, rng)` returns a new array and does not mutate
    the input.
-   `tournamentSelect(population, k, rng)` performs k-way selection.

They are exported rather than kept private to `ga.ts` so they can be
tested directly in `tests/operators.test.ts` without running a full GA.

### `lib/rng.ts`

-   `createRng(seed?)` uses mulberry32 when a seed is provided, and
    `Math.random` when `seed` is `undefined`.
-   `shuffle(arr, rng)` is Fisher--Yates and non-mutating.
-   `randomIndex(length, rng)` is `Math.floor(rng() * length)`.

Determinism is a contract here, not an accident. `createRng(42)()`
returns the same sequence of numbers in every environment. That is what
makes the "deterministic with a fixed seed" assertion in
`tests/ga.test.ts` reliable.

### `lib/validation/` --- request parsing and domain invariants

This is a directory with five files. The split is invisible because
`index.ts` re-exports only the public API.

  -----------------------------------------------------------------------
  File                                Responsibility
  ----------------------------------- -----------------------------------
  `index.ts`                          Facade. Exports `ValidationError`,
                                      `parseOptimizeRequest`,
                                      `requireStartAndEnd`.

  `error.ts`                          The `ValidationError` class that
                                      the API route maps to HTTP 400. It
                                      has no dependencies, so
                                      `primitives`, `fields`, and
                                      `request` can all import it without
                                      a cycle.

  `primitives.ts`                     `isObject`, `asNumber`,
                                      `asIntInRange`, `isValidRole`,
                                      `isValidObjective`. Generic helpers
                                      with no domain knowledge.

  `fields.ts`                         `parsePoint(raw, index)` and
                                      `parseConfig(raw)` as leaf parsers.

  `request.ts`                        `parseOptimizeRequest(body)`, which
                                      orchestrates the leaf parsers in
                                      the documented error-precedence
                                      order, plus
                                      `requireStartAndEnd(points)`, the
                                      domain invariant used defensively
                                      by both solvers.
  -----------------------------------------------------------------------

The public surface is exactly three names, unchanged from when this was
a single file. Every consumer (`route.ts`, `ga.ts`,
`nearest-neighbor.ts`, `validation.test.ts`) imports from
`@/lib/validation` and resolves to `index.ts`.

The original file was about 250 lines with four visible concerns: the
error type, primitives, field parsers, and the request orchestrator. The
`/* ----- Public: full request parsing ----- */` banner comments already
marked those boundaries. The split makes them structural instead of just
decorative.

### `lib/points.ts`

-   `summarizePointSet(points)` returns
    `{ startCount, endCount, stopCount, isReady, missing }`. It is the
    single source of truth for "is this set ready to optimize?" and is
    used by `ControlPanel` for the CTA disabled state and missing hint,
    and by `page.tsx` for the header status pill and keyboard-shortcut
    gate.
-   `placePoint(points, clickMode, lat, lng, id)` applies a map click:
    `start` replaces, `end` replaces, and `stop` appends. It assumes
    `id` is unique, which is the caller's responsibility. It was
    extracted from `page.tsx`'s `handleMapClick` so the branching rules
    stay testable and `page.tsx` stays a pure state router.

### `lib/ga.ts`

Exports `solveGA(points, config) → GAResult`. The pipeline is:

1.  `requireStartAndEnd(points)`.
2.  If there are zero stops, short-circuit to a single-edge route.
3.  `createRng(config.randomSeed)`.
4.  Initialise the population with `populationSize` shuffled
    permutations.
5.  Loop `generations` times: sort, record history, breed the next
    generation.
6.  Return the best individual, history, and generations run.

Three private helpers keep the main function readable without adding
module surface: `snapshotGeneration` for best and average,
`breedNextGeneration` for elitism and fill, and `breedOffspring` for two
tournament picks, OX, conditional mutation, and evaluation. They are not
exported. `ga.test.ts` exercises the pipeline at the integration level:
monotonic best, determinism, and GA versus baseline. That is a stronger
check than isolated unit tests on the helpers would be.

### `lib/nearest-neighbor.ts`

Greedy baseline: from the current point, always hop to the nearest
unvisited stop, then terminate at the fixed end. It is deliberately
weak.

### `lib/format.ts`

-   `formatDistance(meters)` returns `"12.35 km"` with two decimal
    places.
-   `formatTime(seconds)` returns `"45s"`, `"5m 5s"`, or `"1h 25m"`.
    Seconds are omitted above one hour.

Both are pure and exported for unit tests and for reuse in future views.

### `lib/presets.ts`

-   `INITIAL_POINTS` are the two starting points on page load.
-   `PRESETS` are three demo scenarios.

The data lives in `lib/`, not `page.tsx`, so tests and alternative UIs
can load it without importing page state.

### `lib/role-meta.ts`

-   `ROLE_META` is
    `Record<PointRole, { short, label, color, bg, border }>`
-   `ROLE_ORDER` is `["start", "stop", "end"]` for consistent iteration.

This consolidates what used to be two nearly identical maps (`ROLE_META`
in `ControlPanel` and `CHIP_META` in `ResultsPanel`) that had drifted by
0.01 alpha.

### `lib/utils.ts`

`cn(...inputs)` combines `clsx` and `tailwind-merge`. It is the only
Tailwind-aware helper. It is used by `page.tsx`'s
`sidebarClass(side, mobileTab)` helper and by `Button` and `Spinner` to
compose conditional class names with correct Tailwind conflict
resolution.

### `app/api/optimize/route.ts` (\~50 lines)

A thin HTTP wrapper:

-   `await req.json()`; on failure, `400` with
    `{ error: "Invalid JSON body" }`.
-   `parseOptimizeRequest(body)`; on `ValidationError`, `400` with the
    error message.
-   `solveGA`, `solveNearestNeighbor`, and `computeImprovement`.
-   `200` with `OptimizeResponse`.

There is no algorithm logic and no validation logic in this file. Test
coverage comes through `parseOptimizeRequest` at the unit level and
through the manual UI at the integration level.

### `app/page.tsx` (\~155 lines)

This is the state owner. It holds:

  State                               Purpose
  ----------------------------------- -----------------------------------
  `points: Point[]`                   The current map markers
  `config: GAConfig`                  The GA parameters
  `clickMode: PointRole`              What the next map click creates
  `activeRoute: "ga" \| "baseline"`   Which route is shown
  `mapKey: number`                    Force map remount on reset/preset
  `mobileTab: MobileTab`              Which panel is visible on mobile

Everything else comes from hooks:

-   `useOptimize({ points, config, onSuccess })` →
    `{ run, reset, loading, error, result }`
-   `useDynamicTitle(result)`
-   `useKeyboardShortcut({ key: "Enter", ctrlOrMeta: true, enabled: ready && !loading, handler: run })`
-   `useMemo(summarizePointSet, [points])` → `{ stopCount, isReady }`
-   `useMemo` for `activeSequence`

Two local helpers keep the component body short:

-   `handleMapClick`, now four lines, delegates to `placePoint`.
-   `sidebarClass(side, mobileTab)`, a single helper that covers the
    shared majority of the old `controlsClass` and `resultsClass`
    blocks. The differences, such as which side, which order, which
    width, which border, and the slide-up animation on Results only, are
    parameters.

There is no `useEffect` in the body. There is no `useState` for
`result`, `error`, or `loading`; those live in `useOptimize`.

### `hooks/useOptimize.ts` (\~100 lines)

This is the most important hook. It manages:

-   **Fetch lifecycle** --- POST `/api/optimize`, JSON in and out,
    mapping 4xx/5xx responses to errors.
-   **Concurrency** --- an in-flight request is aborted when `run()` is
    called again.
-   **Reset safety** --- `reset()` aborts any in-flight request. This
    prevents the "add a point while optimizing, then watch a stale
    result flash in" bug.
-   **Callback stability** --- `onSuccess` is mirrored into a ref via
    `useEffect`, following the React 19 rule below, so `run` stays
    stable across renders even when the caller passes an inline arrow.
-   **Loading hygiene** --- `setLoading(false)` runs in `finally`, but
    only for the current controller. A superseded run must not clear
    loading for the newer one.

Return shape:

``` typescript
{
  run: () => Promise<void>;
  reset: () => void;
  loading: boolean;
  error: string | null;
  result: OptimizeResponse | null;
}
```

### `hooks/useDynamicTitle.ts` (\~20 lines)

A `useEffect` that syncs `document.title` with
`result.improvementPercent`. The `Metadata` in `layout.tsx` stays
authoritative for SSR and social previews. This hook only touches the
tab label after hydration.

### `hooks/useKeyboardShortcut.ts` (\~50 lines)

A generic keybinding hook with two effects:

1.  Mirror `handler` into a ref, following the React 19 purity rule.
2.  Attach or detach `keydown` when `enabled` changes.

The two-effect split means the `keydown` listener is not re-attached
when only `handler` changes. It re-attaches only when `key`,
`ctrlOrMeta`, or `enabled` changes.

### `components/layout/Header.tsx` + `StatusPill.tsx`

`Header` is a shell: logo, title, and a right-aligned cluster containing
`StatusPill` and the GitHub link. `StatusPill` is extracted because it
is a four-state machine (`loading` → `hasResult` → `ready` →
`not ready`) with its own prop surface. If it were inlined, it would
dominate `Header.tsx`.

`HeaderProps` is aliased to `StatusPillProps` so the shell does not
duplicate the contract. The GitHub link (`<a href={GITHUB_REPO_URL}>`)
has `aria-label`, `title`, `rel="noopener noreferrer"`, and a
focus-visible background, matching the interaction pattern used in the
rest of the header.

### `components/results/ConvergenceSparkline.tsx` + `sparkline-geometry.ts`

The component owns rendering: SVG, gradient via `useId`, and animation.
`sparkline-geometry.ts` owns the math: Y-axis inversion, `buildPath` for
`best` and `average`, fill-path extrapolation, and `animationKey` from
the endpoints. The split makes the coordinate math testable without
mounting the DOM, and it lets the render path focus on shapes.

`computeSparklineGeometry` throws if `history.length < 2`. The component
guards with `if (history.length < 2) return null` before calling it, so
the throw is a defensive invariant, not an expected path.

------------------------------------------------------------------------

## Algorithm design

### Encoding

``` text
chromosome = [stopId_1, stopId_2, ..., stopId_n]
fullRoute  = [startId, ...chromosome, endId]
```

Only stop IDs are permuted. Start and end are fixed wrappers. The search
space is `n!` instead of `(n+2)!`.

### Fitness

`evaluateSequence(points, fullRoute, objective)` returns:

-   `totalDistance` in meters, as the sum of haversine distances.
-   `totalTime` in seconds, as `totalDistance / AVERAGE_SPEED_MS`.
-   `fitness`, whichever objective was selected.

Lower is better. The GA minimises.

### Selection --- tournament

`tournamentSelect(population, k, rng)`:

1.  Draw `k` individuals uniformly at random, with replacement.
2.  Return the one with the lowest `fitness`.

Higher `k` means more selective pressure, faster convergence, and a
higher risk of premature convergence. Bounds are `2..10`.

### Crossover --- OX

`orderCrossover(p1, p2, rng)`:

1.  Pick two random cut points, `[start, end]`.
2.  Copy `p1[start..end]` into the child at the same positions.
3.  Fill the remaining positions from `p2` in order, skipping genes that
    are already present.

The result is always a valid permutation. No repair step is needed.

### Mutation --- swap

`swapMutation(chrom, rng)`:

1.  Pick two distinct positions at random and swap them.
2.  Call it per offspring with probability `mutationRate`.

### Elitism

The top `elitismCount` individuals from generation `g` carry unchanged
into generation `g+1`. This guarantees:

-   `history[g].best <= history[g-1].best` for all `g`.
-   The convergence chart is monotonic.
-   The final result is never worse than the initial population's best.

Bounds are `1..10`, and it must be `< populationSize`, which is enforced
by `parseOptimizeRequest`.

### Determinism

When `config.randomSeed` is a number, `createRng(seed)` returns a
mulberry32 generator. The same seed produces identical runs in any Node
version and in any order.

Tests always set a seed. The UI never does, so production runs are
non-deterministic, as users expect.

------------------------------------------------------------------------

## State management

### Ownership

All application state lives in `app/page.tsx` except for:

-   The optimize lifecycle, which owns `loading`, `error`, and `result`
    internally and exposes them through `useOptimize`.
-   Map internals such as Leaflet's tile cache, viewport, and popups.

There is no Redux, Zustand, or Context. The state is small, linear, and
confined to one page. Adding a store would add ceremony without removing
friction. If persistence becomes a requirement, the migration path is a
single `Context` provider wrapped around `page.tsx`.

### Invalidation rule

Any change to `points` or `config` sets `result` to `null` and aborts
any in-flight request.

That rule lives in `useOptimize.reset()`. The alternative, leaving a
stale result visible while points change, was rejected. Showing a route
that no longer matches the current points is misleading.

### Loading

`useOptimize.loading` gates:

-   The Optimize button, via `disabled={notReady || loading}`.
-   The map overlay, which shows a spinner and "Evolving route...".
-   The keyboard shortcut, via `enabled: ready && !loading`.
-   The status pill, which shows `"Optimizing…"`.

There is no separate cancel button. `reset()` is invoked by any point or
config change and serves that role.

### Errors

`useOptimize.error: string | null` is set by the API-call failure
handler in `useOptimize.run`. It is rendered in `ControlPanel` with
`role="alert"`. It is cleared by `reset()` or by a successful subsequent
run.

------------------------------------------------------------------------

## React 19 constraints

### The "latest ref" pattern

Pre-React-19 code often looked like this:

``` typescript
const ref = useRef(handler);
ref.current = handler; // React 19 lints this
```

React 19 forbids writes to `ref.current` during render
(`react-hooks/refs`). The correct form is:

``` typescript
const ref = useRef(handler);
useEffect(() => {
  ref.current = handler;
}, [handler]);
```

Effect ordering helps here: the ref-sync effect runs before any user
event can fire, so the ref always holds the latest value by the time
`run` or `keydown` executes.

Both `useOptimize` and `useKeyboardShortcut` use this pattern. The
two-effect split in `useKeyboardShortcut` is deliberate. It prevents the
`keydown` listener from re-attaching on every parent re-render while
still keeping the handler fresh.

### `useId` for SVG gradients

`ConvergenceSparkline` uses `useId()` for the `<linearGradient>` ID. A
hardcoded ID would collide if the chart were rendered twice on one page.
The second instance's `url(#sparkFill)` would resolve to the first
instance's gradient. `useId` generates a unique, SSR-stable ID per
instance.

### Render purity in `SequenceDisplay`

`SequenceDisplay` used to increment `visitIndex` inside
`sequence.map()`:

``` typescript
let visitIndex = 0;
{sequence.map((id, i) => {
  if (p.role === "stop") visitIndex++; // mutation during render
  // ...
})}
```

It worked because `let` was local and `Array.map` is synchronous, but it
was fragile. The fix is to compute a `SequenceItem[]` in a `for` loop
before `return`, then render with `items.map(...)`. There is no mutation
inside the render path, and the arrow-emission condition becomes
`i < items.length - 1`. That also fixes a dangling-arrow edge case if
the sequence ever contained an unknown ID at the end.

------------------------------------------------------------------------

## Map rendering

`MapView` sits at the boundary between React's declarative model and
Leaflet's imperative one. A few pieces are worth calling out.

### 1. Draw-in animation

`RoutePolyline`'s `useLayoutEffect` does the following:

1.  Read the rendered SVG path via `lineRef.current?.getElement()`.
2.  Set `strokeDasharray = length` and `strokeDashoffset = length`.
3.  Force reflow with `getBoundingClientRect()` so the browser commits
    the initial state.
4.  Set `strokeDashoffset = 0` with a CSS transition.

This runs whenever `route` changes, identified by joining the sequence
into a key. Baseline skips it because `dashArray: "8 8"` conflicts with
the draw-in's `strokeDasharray`.

### 2. Stop numbering

`useStopNumbers(points, route)` returns a `Map<string, number>`:

-   When a route is active, it returns visit order, matching the
    sequence in `ResultsPanel`.
-   When there is no route, it returns creation order, which is stable
    across renders.

That is the single source of truth. `SequenceDisplay` mirrors the same
visit-order logic in its pre-compute pass, so the map and the sidebar
always agree.

### 3. Auto-fit

`FitBoundsOnce` runs once per mount, guarded by `useRef(false)`. To
reset it on preset load or point reset, `page.tsx` bumps `mapKey`, which
remounts `MapView` entirely. That is cleaner than an imperative "re-fit
now" call after state updates.

### 4. Dynamic import

`MapViewWrapper` uses `next/dynamic` with `ssr: false` because Leaflet
needs a DOM. The wrapper is the only entry point the page sees.
`MapView` and its siblings are never imported outside `components/map/`.

`MapViewWrapperProps` is exactly `MapViewProps`, with no extra props. An
earlier unused `loading?: boolean` prop was removed during the recent
refactor.

------------------------------------------------------------------------

## API contract

### Request

``` typescript
interface OptimizeRequest {
  points: Point[];
  config: GAConfig;
}
```

### Response

``` typescript
interface OptimizeResponse {
  ga: GAResult;
  baseline: BaselineResult;
  improvementPercent: number; // clamped to [0, 1]
}
```

### Error responses

-   `400` for invalid points or config. Body: `{ error: string }`.
-   `500` for an unexpected server error. Body: `{ error: string }`.

### Validation order (in `parseOptimizeRequest`)

1.  Body is an object.
2.  `points` is an array.
3.  Point count is within `[MIN_POINTS, MAX_POINTS]`.
4.  Each point is a valid `Point` (`id`, `lat`, `lng`, `role`, optional
    `label`).
5.  There is exactly one `start` and exactly one `end`.
6.  There are no duplicate IDs.
7.  `config`, if present, has every numeric field within
    `GA_CONFIG_BOUNDS`.
8.  `elitismCount < populationSize`.

Order matters for error messages because the user should see the most
specific error first. The `validation/` split preserves this order.
`request.ts` calls `parsePoint` for the full array before counting
roles, so a malformed point produces a point-level error even if a
role-count violation also exists.

------------------------------------------------------------------------

## Type contracts

### Between domain and API

The API only receives types declared in `lib/types.ts`. Adding a field
to `Point` is a one-line change that both layers see.

### Between API and UI

`OptimizeResponse` is the only shape the UI consumes from the network.
There are no partial responses, no streaming, and no incremental
updates.

### Between UI and components

Every child component has an explicit `Props` interface. There are no
`any` bridges across component boundaries. If a prop's type changes,
TypeScript catches every call site.

### Between UI and Leaflet

`MapView` uses react-leaflet primitives: `MapContainer`, `Marker`,
`Polyline`, `Popup`, `TileLayer`, `useMap`, and `useMapEvents`. For
imperative operations such as measuring path length or fitting bounds,
it uses `useLayoutEffect` and Leaflet refs. It never touches `L.map`
directly outside those controlled places.

------------------------------------------------------------------------

## Testing strategy

Tests are unit tests on `lib/` only. There are no component tests, no
integration tests, and no E2E tests.

### Why tests stop at `lib/`

-   The algorithm and pure helpers are where bugs are subtle and
    expensive. They get exhaustive coverage.
-   The UI is visual and interactive. Manual QA catches regressions in
    seconds that a snapshot test would miss.
-   The API is a thin wrapper over `lib/validation/` and the solvers.
    Testing those directly gives stronger coverage than a mocked HTTP
    handler.

### Coverage

-   `distance.test.ts` (14 tests): haversine accuracy, route sum, time
    conversion, and `computeImprovement` clamping and divide-by-zero.
-   `operators.test.ts` (7 tests): OX validity, including permutation,
    no duplicates, and determinism, plus swap mutation invariants.
-   `format.test.ts` (9 tests): `formatDistance` and `formatTime`
    boundary cases.
-   `points.test.ts` (7 tests): `summarizePointSet` for every point-set
    permutation.
-   `validation.test.ts` (28 tests): `parseOptimizeRequest` happy path
    plus 22 error cases, and `requireStartAndEnd` invariants.
-   `ga.test.ts` (12 tests): structural invariants, determinism, GA
    versus baseline, and edge cases.
-   `nearest-neighbor.test.ts` (4 tests): sequence validity and
    determinism.

**Total: 81 tests.**

### Candidates for follow-up

Two pure helpers were added or extracted during the recent refactor and
would fit the existing test conventions:

-   `placePoint` (`lib/points.ts`): the per-role branching, where
    `start` replaces, `end` replaces, and `stop` appends, is worth a
    small table test.
-   `computeSparklineGeometry`
    (`components/results/sparkline-geometry.ts`): the Y-axis inversion
    and `|| 1` range fallback are exactly the kind of edge cases
    `format.test.ts` covers for `formatTime`.

Neither is urgent. Both are exercised end-to-end by the manual UI and
the `ga.test.ts` integration path, but adding them would keep
`lib/`-level coverage at 100% of pure functions.

### What is not tested, deliberately

-   **Hooks** (`useOptimize`, `useKeyboardShortcut`, `useDynamicTitle`):
    testing them would require `@testing-library/react` plus `jsdom`.
    The manual QA checklist in commit history covers their behavior.
    Adding a second Vitest project to the config would be a non-trivial
    cost for a demo.
-   **React components**: visual and exercised manually before every
    deploy.
-   **Map rendering**: Leaflet's own test suite covers the primitives,
    and the app's integration is trivial.
-   **Sparkline SVG**: the geometry is now testable in isolation through
    `sparkline-geometry.ts`, but the rendering path is exercised by the
    manual UI.

### CI

`.github/workflows/ci.yml` runs on every push and pull request:

``` text
typecheck → lint → format:check → test → build
```

`npm run ci` locally mirrors this pipeline exactly.

------------------------------------------------------------------------

## Extension points

### Cleanly supported

-   **New objective, such as "minimize fuel".** Add `"fuel"` to
    `Objective` in `types.ts`. Extend `evaluateSequence` in
    `distance.ts` with a `fuelCost` function. Pass it through the API
    and results panel as-is.
-   **New constraint, such as "must visit a specific stop first".** Add
    a constraint to `GAConfig`. In `solveGA`'s `breedOffspring`, apply a
    repair step after crossover and mutation. Or replace `swapMutation`
    with a constraint-aware operator. All operators live in
    `lib/operators.ts` and are individually testable.
-   **URL state (`?points=...&config=...`).** No API change is needed.
    Serialize points and config to query params in `page.tsx`. On mount,
    hydrate from the URL. `INITIAL_POINTS` and `DEFAULT_GA_CONFIG`
    provide the fallback.
-   **Real traffic routing.** Replace `distance.ts` with a call to OSRM
    or a commercial router. `evaluateSequence` returns the same shape,
    so nothing above it changes. The API route will need to `await`; it
    is currently synchronous. `useOptimize` already handles the async
    pattern.
-   **Persisting results.** Add a database. The API gains a write after
    `solveGA`. The UI gains a history panel. No change to `lib/`.
-   **Adding a design token.** Add it to `app/styles/tokens.css` under
    `@theme`. Every component picks it up via `var(--color-*)`, with no
    component file changes.
-   **Adding a keyframe.** Add it to `app/styles/keyframes.css` and
    reference it via `--animate-*` in `tokens.css` or by name in
    `style={{ animation: ... }}`.

### Requires restructuring

-   **Multi-vehicle VRP.** The chromosome becomes an array of arrays,
    one permutation per vehicle. Crossover and mutation need to be
    redesigned. This is a different algorithm, so plan for a new
    `lib/ga-multi.ts` and a new API endpoint.
-   **Live map interaction while optimizing.** The map already allows
    panning during loading because the overlay uses
    `pointer-events-none`. But state mutations during a run currently
    abort it. Allowing optimistic updates without aborting would require
    a more careful state model. It is doable, but not a drop-in.
-   **Very large point sets (100+).** `MAX_POINTS = 25` because
    `populationSize × generations × n²` grows fast. At 100 points, the
    synchronous API route would block the Node event loop for seconds.
    This needs a worker (`worker_threads`) or a job queue, and the UI
    would need polling or SSE.

------------------------------------------------------------------------

## Known constraints and trade-offs

-   **`MAX_POINTS = 25`.** This is a safety cap so a single request
    never blocks the server for more than about 500ms at the default
    config.
-   **Synchronous API.** The route handler blocks the Node event loop
    while `solveGA` runs. That is fine at the current scale and
    documented as a known limit. `useOptimize` already handles the async
    client side, so moving to a worker or queue is an API-only
    migration.
-   **No request cancellation button.** `reset()` cancels implicitly
    whenever points or config change. There is no explicit cancel CTA
    because the request completes in under a second for every realistic
    point set.
-   **Weak baseline is intentional.** See the README. The improvement
    percentage shows that the GA finds a better route than greedy. It is
    not a claim of optimality.
-   **No component or hook tests.** See the testing strategy. Manual QA
    is documented in commit history.
-   **Single map mount per state.** Reset and preset-load remount the
    map with `key={mapKey}`. This is a deliberate trade-off: easier to
    reason about than imperative `fitBounds` on state change. The
    remount cost is negligible because `MapContainer` reuses the
    underlying DOM node.
-   **No SSR for the map.** `MapViewWrapper` uses
    `dynamic(..., { ssr: false })`. Leaflet requires a DOM, so the
    server renders a dark card with a spinner.
-   **`globals.css` is an entry, not a stylesheet.** It imports seven
    files from `app/styles/` and defines nothing itself. Adding a new
    concern, such as a future print-styles layer, means adding one file
    and one `@import`, with no component changes. One caveat: Tailwind
    v4 processes `@theme` in an imported file, so the split works today,
    but a future Tailwind upgrade should re-verify that.
-   **`GITHUB_REPO_URL` is a single source of truth.** Both the header
    link and `metadata.other.repository` read from `lib/constants.ts`. A
    fork updates one line, and everything, including the link
    `aria-label` context, stays consistent.
-   **`ValidationError` is a class, not a tagged union.** This keeps the
    API route's `err instanceof ValidationError` check simple, but it
    means a future streaming or structured-error API would need to
    change the response shape, not just the validation module. That is
    acceptable for the current scope.

------------------------------------------------------------------------

## Dependency map

Who imports what. Read top-to-bottom: each row imports only from rows
below it.

``` text
app/page.tsx
 ├── components/control/ControlPanel.tsx
 ├── components/layout/Header.tsx
 ├── components/layout/MobileTabBar.tsx
 ├── components/map/{MapHUD, MapLoadingOverlay, MapViewWrapper}.tsx
 ├── components/results/ResultsPanel.tsx
 ├── hooks/{useOptimize, useDynamicTitle, useKeyboardShortcut}.ts
 ├── lib/{constants, points, presets, types, utils}.ts
 └── (transitively: all lib modules)

app/layout.tsx
 ├── lib/constants.ts (GITHUB_REPO_URL for metadata)
 ├── app/globals.css (entry — imports app/styles/*)
 └── (Next.js: font loaders, Metadata type)

app/globals.css
 └── app/styles/{tokens, keyframes, base, leaflet, markers, slider, a11y}.css

components/control/ControlPanel.tsx
 ├── components/control/{ErrorBanner, GAParameterSliders, OptimizeCta,
 │     PointList, PointModeSelector, PresetSelector}.tsx
 ├── components/ui/{Button, Section}.tsx
 ├── lib/points.ts
 └── lib/types.ts

components/layout/Header.tsx
 ├── components/layout/StatusPill.tsx
 └── lib/constants.ts (GITHUB_REPO_URL)

components/layout/StatusPill.tsx
 └── (no internal imports — pure presentational)

components/map/MapView.tsx
 ├── components/map/{FitBoundsOnce, MapClickHandler, RoutePolyline, StopMarker}.tsx
 ├── components/map/useStopNumbers.ts
 └── lib/types.ts

components/results/ResultsPanel.tsx
 ├── components/results/{ConvergenceSparkline, ImprovementBanner,
 │     MetricCard, RouteToggle, SequenceDisplay}.tsx
 ├── components/ui/Section.tsx
 ├── lib/format.ts
 └── lib/types.ts

components/results/ConvergenceSparkline.tsx
 ├── components/results/sparkline-geometry.ts
 └── lib/types.ts

components/results/sparkline-geometry.ts
 └── lib/types.ts (types only — pure math, no React)

hooks/useOptimize.ts
 └── lib/types.ts

app/api/optimize/route.ts
 ├── lib/{distance, ga, nearest-neighbor, validation, types}.ts
 └── (no React, no components, no hooks)

tests/*.test.ts
 └── lib/*.ts (all pure modules)
```

**No cycles.** This is enforced by review, not by tooling. If you ever
need to add a dependency that would create a cycle, that is the signal
that a shared type belongs in `lib/types.ts` or a shared util needs its
own file.

**Structural invariant:** no file inside `lib/`, except `utils.ts`,
imports React. That is what makes the entire algorithm layer portable to
Node, browsers, workers, and tests without special transpilation.

**Structural invariant:** `lib/validation/index.ts` is the only file in
`lib/validation/` that consumers import directly. `error.ts`,
`primitives.ts`, `fields.ts`, and `request.ts` are internal. Adding a
fourth internal file or renaming one is invisible outside the directory.