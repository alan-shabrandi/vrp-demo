# Provenance

This project has three lives, and this document records the lineage between them.

## At a glance

| Version | Year | Language | Purpose | Proof |
| --- | --- | --- | --- | --- |
| BSc thesis | 2017 | Python | Academic research | — |
| Web demo | 2026 | TypeScript | Visualization & verification | 81 Vitest tests |
| Python package | 2026 | Python | Reusable artifact & parity proof | 36 pytest tests (incl. cross-validation) |

## 1. BSc Thesis (Python) — 2017

The algorithm was originally implemented in **Python** as my Bachelor's thesis in Geomatics Engineering at K. N. Toosi University of Technology.

**Thesis title:** Genetic Algorithm for the Vehicle Routing Problem

**Focus:** Permutation encoding, Order Crossover, k-way tournament selection, elitism, and fitness evaluation under a Haversine metric. Spatial data processing and computational geometry.

## 2. Web Demo (TypeScript) — 2026

The algorithm was reimplemented from scratch in **TypeScript** as an interactive web application for visualization and verification. The web version preserves the exact algorithmic structure of the thesis, but adds:

- Interactive Leaflet map with live point placement
- Animated convergence sparkline
- Side-by-side comparison against a greedy nearest-neighbor baseline
- An HTTP-only boundary between UI and solver, with 81 Vitest tests

**Source:** [github.com/alan-shabrandi/vrp-demo](https://github.com/alan-shabrandi/vrp-demo)
**Live demo:** [vrp-demo-phi.vercel.app](https://vrp-demo-phi.vercel.app)

## 3. Python Package (`vrp-solver`) — 2026

The algorithm was brought back to **Python** as a standalone, installable package. This is not a copy of the original thesis code — it is a modern reimplementation with:

- Full type hints (mypy strict mode passing)
- Pydantic input validation
- A CLI (via Typer)
- **36 tests, including golden cross-validation against the TypeScript implementation**

**Source:** [github.com/alan-shabrandi/vrp-demo/tree/main/packages/vrp-solver](https://github.com/alan-shabrandi/vrp-demo/tree/main/packages/vrp-solver)
**PyPI:** [pypi.org/project/vrp-solver](https://pypi.org/project/vrp-solver/)

## What was preserved across versions

The three implementations are not merely similar — they are structurally identical. The following pieces were ported verbatim:

- **`mulberry32` PRNG** — 8 lines, bit-exact. Without this, determinism would be broken and cross-validation impossible.
- **Order Crossover (OX)** — with the same left/right cut-point logic and the same fill-from-other-parent strategy.
- **k-way tournament selection** — uniform sampling with replacement, lowest fitness wins.
- **Swap mutation** — two distinct random positions, swap.
- **Elitism** — top N carried forward unchanged, guaranteeing monotonic non-increasing `history.best`.
- **Haversine fitness** — same earth radius constant (6,371,000 m), same average speed (40 km/h), same radians conversion.
- **GA pipeline** — same order: init → sort → snapshot → elitism + breed offspring → next generation.

The only difference is the surrounding infrastructure: TypeScript uses a Next.js HTTP boundary and Vitest; Python uses Pydantic + Typer and pytest.

## How parity is verified

The claim "the Python and TypeScript versions implement the same algorithm" is not taken on faith. It is asserted by `packages/vrp-solver/tests/test_cross_validation.py`, which does three things:

1. **Runs the TypeScript GA** with a fixed scenario and `randomSeed = 42`, producing a route, fitness value, and full convergence history.
2. **Runs the Python GA** on the exact same scenario and seed.
3. **Asserts bit-exact equality** — not approximate, not "within tolerance". The same sequence of IDs, the same floating-point fitness value, the same per-generation `best` and `average`.

Because `mulberry32` is ported line-for-line and the operators consume the RNG in the same order, both implementations draw the same random numbers on every call. That is why the test can compare exact floats rather than using `pytest.approx`.

The test suite includes three layers of cross-validation:

- `test_haversine_matches_typescript` — a single distance calculation matches.
- `test_ox_matches_typescript` — a single crossover with `seed=42` produces the same permutation.
- `test_full_ga_matches_typescript` — 30 generations of the full algorithm produce the same final route, fitness, and per-generation history.

If you change the algorithm in either language, the cross-validation tests will fail until the other side is updated to match. This is intentional: it is what keeps the two implementations honest.

## Why this matters

It would have been easy to write a Python version that is "inspired by" the TypeScript one — similar operators, similar structure, similar results. That would be a lie of omission. The interesting engineering claim is not "I wrote a VRP solver twice." It is: **"I can prove the two are the same algorithm."**

That proof requires:

1. Designing both implementations to be deterministic under a fixed seed.
2. Choosing a PRNG small enough to port line-for-line (`mulberry32`, 8 lines).
3. Keeping operators pure and RNG-consumption order identical.
4. Writing tests that compare exact floats, not tolerances.
5. Doing this across two languages with different number types, different iteration semantics, and different sorting defaults.

That is the part of this project worth pointing at. The three versions (thesis → web → package) are the surface. The cross-validation is the substance.