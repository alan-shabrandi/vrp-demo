# vrp-solver

[![PyPI version](https://img.shields.io/pypi/v/vrp-solver.svg)](https://pypi.org/project/vrp-solver/)
[![Python versions](https://img.shields.io/pypi/pyversions/vrp-solver.svg)](https://pypi.org/project/vrp-solver/)
[![CI](https://github.com/alan-shabrandi/vrp-demo/actions/workflows/python-solver.yml/badge.svg)](https://github.com/alan-shabrandi/vrp-demo/actions/workflows/python-solver.yml)
[![tests](https://img.shields.io/badge/tests-36%20passing-brightgreen)](https://github.com/alan-shabrandi/vrp-demo/tree/main/packages/vrp-solver/tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-vrp--demo--phi.vercel.app-4f9eff)](https://vrp-demo-phi.vercel.app)

A standalone Python implementation of a **Genetic Algorithm** for the **Vehicle Routing Problem** (open VRP with fixed start and end points).

This package is the Python counterpart to my [vrp-demo web application](https://vrp-demo-phi.vercel.app), and is **validated bit-exactly** against the TypeScript implementation there using shared golden test vectors. For the same seed and inputs, both versions produce identical routes, fitness values, and convergence histories.

The algorithm originates from my BSc thesis in Geomatics Engineering (GIS), where it was implemented in Python. The web demo later reimplemented it in TypeScript for visualization; this package brings the algorithm back to Python as a reusable, installable library.

## Install

```bash
pip install vrp-solver
```

Or with `uv`:

```bash
uv add vrp-solver
```

## Quick start (CLI)

Save a problem definition to `problem.json`:

```json
{
  "points": [
    { "id": "start", "lat": 35.6892, "lng": 51.389,  "role": "start" },
    { "id": "s1",    "lat": 35.7005, "lng": 51.4013, "role": "stop"  },
    { "id": "s2",    "lat": 35.6500, "lng": 51.4500, "role": "stop"  },
    { "id": "end",   "lat": 35.7795, "lng": 51.4033, "role": "end"   }
  ],
  "config": {
    "objective": "distance",
    "populationSize": 50,
    "generations": 30,
    "mutationRate": 0.15,
    "elitismCount": 2,
    "tournamentSize": 3,
    "randomSeed": 42
  }
}
```

Then:

```bash
vrp-solver problem.json
```

The output is a JSON object with three keys: `ga` (the evolved route), `baseline` (a greedy nearest-neighbor comparison), and `improvementPercent` (how much better the GA is, clamped to `[0, 1]`).

## Quick start (Python API)

```python
from vrp_solver import Point, GAConfig, solve_ga, solve_nearest_neighbor, compute_improvement

points = [
    Point(id="start", lat=35.6892, lng=51.389,  role="start"),
    Point(id="s1",    lat=35.7005, lng=51.4013, role="stop"),
    Point(id="s2",    lat=35.6500, lng=51.4500, role="stop"),
    Point(id="end",   lat=35.7795, lng=51.4033, role="end"),
]

config = GAConfig(
    populationSize=50,
    generations=30,
    mutationRate=0.15,
    elitismCount=2,
    tournamentSize=3,
    objective="distance",
    randomSeed=42,
)

ga = solve_ga(points, config)
baseline = solve_nearest_neighbor(points, config)

print(ga.sequence)                # ['start', 's2', 's1', 'end']
print(ga.fitness)                 # total distance in meters
print(ga.history[-1].best)        # final best fitness
print(compute_improvement(baseline.fitness, ga.fitness))
```

## What it does

- **Problem formulation:** open VRP with a fixed start, a fixed end, and any number of intermediate stops.
- **Chromosome:** a permutation of stop IDs only. Start and end are fixed wrappers, so the search space is `n!` for `n` stops instead of `(n+2)!`.
- **Initial population:** shuffled permutations.
- **Selection:** k-way tournament.
- **Crossover:** Order Crossover (OX), which always produces a valid permutation — no repair step required.
- **Mutation:** swap mutation, applied per offspring at the configured rate.
- **Elitism:** the top `elitismCount` individuals survive unchanged, guaranteeing monotonic non-increasing best fitness.
- **Fitness:** total Haversine distance, or total time at a constant 40 km/h.

## Determinism

Pass an integer `randomSeed` and the run becomes fully reproducible — same seed, same points, same config, **same route** — across machines, Python versions, and repeated calls.

This is not an accident: the RNG is a bit-exact port of `mulberry32` as used in the TypeScript reference implementation, and the golden test suite (`tests/test_cross_validation.py`) asserts that both implementations produce identical sequences and fitness values for a fixed scenario. This makes the package safe to use for benchmarking and regression testing.

## Validation

All inputs are validated with Pydantic:

- Points: `id` (non-empty string), `lat` in `[-90, 90]`, `lng` in `[-180, 180]`, `role` in `{start, stop, end}`.
- Point set: between 3 and 25 points, exactly one `start`, exactly one `end`, no duplicate IDs.
- Config: every numeric field checked against its documented bounds; `elitismCount <= populationSize`.

Invalid input raises `ValidationError` with a descriptive message.

## Testing

```bash
uv run pytest -v
```

36 tests covering Haversine math, OX permutation invariants, mutation invariants, tournament selection, GA pipeline structure, monotonic convergence, Pydantic validation, and cross-validation against the TypeScript implementation.

The suite is split across 7 files:

| File | What it covers |
| --- | --- |
| `test_rng.py` | Mulberry32 output matches the TypeScript implementation bit-exactly. |
| `test_distance.py` | Haversine symmetry, accuracy, sequence evaluation, improvement clamping. |
| `test_operators.py` | OX validity, swap mutation invariants, tournament determinism. |
| `test_ga.py` | Sequence validity, monotonic history, seed-based determinism, edge cases. |
| `test_nearest_neighbor.py` | Baseline sequence validity and determinism. |
| `test_validation.py` | Pydantic schemas for happy path and error cases. |
| `test_cross_validation.py` | **Golden tests**: same seed → identical routes, fitness, history. |

## What this package is not

- **Not multi-vehicle.** One vehicle, one trip, fixed start and end.
- **Not a real-traffic router.** Distance is Haversine; time assumes a constant 40 km/h.
- **Not a benchmark against OR-Tools.** The baseline is deliberately simple (nearest-neighbor).

## Related documentation

This package is one piece of a larger project. For the full context:

- **[`docs/PROVENANCE.md`](https://github.com/alan-shabrandi/vrp-demo/blob/main/docs/PROVENANCE.md)** — the lineage from thesis (Python) → web demo (TypeScript) → this package (Python), and how cross-validation works.
- **[`ARCHITECTURE.md`](https://github.com/alan-shabrandi/vrp-demo/blob/main/ARCHITECTURE.md)** — the layered model of the TypeScript reference implementation.
- **[Main README](https://github.com/alan-shabrandi/vrp-demo)** — the web demo, its 81 Vitest tests, and the full stack.

## Links

- **Web demo:** [vrp-demo-phi.vercel.app](https://vrp-demo-phi.vercel.app)
- **Source:** [github.com/alan-shabrandi/vrp-demo](https://github.com/alan-shabrandi/vrp-demo) (the `packages/vrp-solver/` directory)
- **PyPI:** [pypi.org/project/vrp-solver](https://pypi.org/project/vrp-solver/)

## License

MIT — see [LICENSE](./LICENSE).