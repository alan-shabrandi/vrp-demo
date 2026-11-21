# vrp-solver

[![PyPI](https://img.shields.io/pypi/v/vrp-solver.svg)](https://pypi.org/project/vrp-solver/)
[![Python versions](https://img.shields.io/pypi/pyversions/vrp-solver.svg)](https://pypi.org/project/vrp-solver/)
[![CI](https://github.com/alan-shabrandi/vrp-demo/actions/workflows/python-solver.yml/badge.svg)](https://github.com/alan-shabrandi/vrp-demo/actions/workflows/python-solver.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/alan-shabrandi/vrp-demo/blob/main/LICENSE)

A genetic algorithm for the open Vehicle Routing Problem: one vehicle, a fixed start, a fixed end, and any number of stops in between.

I wrote the algorithm in Python for my B.Sc. thesis in Geomatics Engineering (GIS). I later ported it to TypeScript for the [web demo](https://vrp-demo-phi.vercel.app), and this package is the Python version as an installable library. The two implementations are checked against each other with golden tests: for the same seed and input, they produce the same route, fitness and convergence history.

## Install

```bash
pip install vrp-solver
```

or with `uv`:

```bash
uv add vrp-solver
```

Python 3.10 or newer.

## Command line

Save a problem to `problem.json`:

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

Run it:

```bash
vrp-solver problem.json
```

The output is JSON with three keys:

- `ga`: the route found by the genetic algorithm
- `baseline`: a nearest-neighbor route for comparison
- `improvementPercent`: how much shorter the GA route is than the baseline, as a fraction between 0 and 1 (`0.0856` means 8.56%)

The input and output are the same as the `POST /api/optimize` endpoint of the web demo.

## Python API

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

print(ga.sequence)            # visit order, e.g. ['start', 's2', 's1', 'end']
print(ga.fitness)             # total distance in meters
print(ga.history[-1].best)    # best fitness in the last generation
print(compute_improvement(baseline.fitness, ga.fitness))
```

The config fields are camelCase on purpose, so the same names work in the Python API, the CLI's JSON and the web API.

## How it works

- **Chromosome:** a permutation of the stop IDs. Start and end are added around it when a route is evaluated, so for `n` stops the search space is `n!`.
- **Initial population:** random permutations.
- **Selection:** k-way tournament.
- **Crossover:** order crossover (OX). Children are always valid permutations, so no repair step is needed.
- **Mutation:** swap two stops, applied to each offspring with the configured probability.
- **Elitism:** the best `elitismCount` individuals pass to the next generation unchanged, so the best fitness never gets worse.
- **Fitness:** total haversine distance, or total time at a constant 40 km/h. Because the speed is constant, both objectives pick the same route; only the reported numbers differ.

The baseline is nearest-neighbor: from the current point, always go to the closest unvisited stop. I haven't compared the GA against 2-opt or OR-Tools.

## Reproducible runs

Pass an integer `randomSeed` and the run is repeatable: same points, same config and same seed give the same route. Leave it out and each run uses a different random sequence.

The random generator is a line-by-line port of the `mulberry32` function in the TypeScript version. `tests/test_cross_validation.py` runs a fixed scenario with a fixed seed and compares the sequence, fitness values and history with results produced by the TypeScript implementation. If you change the algorithm in either language, update the golden values and run both test suites.

## Input validation

Inputs are validated with Pydantic, and invalid input raises `ValidationError` with a message that says what is wrong.

- Each point needs a non-empty `id`, a `lat` in `[-90, 90]`, a `lng` in `[-180, 180]` and a `role` of `start`, `stop` or `end`.
- A problem has between 3 and 25 points, exactly one `start`, exactly one `end` and no duplicate IDs.
- Every numeric config field must be within its allowed range, and `elitismCount` must be smaller than `populationSize`.

## Limits

- One vehicle, one trip.
- Distance is straight-line haversine, and time is a constant-speed estimate. There is no road network or traffic.
- At most 25 points.

## Development

```bash
git clone https://github.com/alan-shabrandi/vrp-demo
cd vrp-demo/packages/vrp-solver
uv sync
```

| Command | What it does |
| --- | --- |
| `uv run pytest -v` | Run the tests |
| `uv run ruff check src/ tests/` | Lint |
| `uv run ruff format --check src/ tests/` | Check formatting |
| `uv run mypy src/` | Type check (strict) |

The tests cover haversine distance, the GA operators, the GA pipeline (valid sequences, non-increasing best fitness, determinism for a fixed seed), validation and the cross-validation against the TypeScript version. CI runs lint, type check and tests whenever something under `packages/vrp-solver/` changes.

## Releasing

For maintainers. You need a PyPI API token.

```bash
cd packages/vrp-solver
# 1. Bump the version in pyproject.toml
uv sync
uv run pytest -v                  # 2. tests must pass
uv run python -m build            # 3. builds the .whl and .tar.gz in dist/
uv run twine check dist/*         # 4. checks the files before upload
uv run twine upload dist/*        # 5. uploads to PyPI
```

## More

- [Main repository and web demo](https://github.com/alan-shabrandi/vrp-demo)
- [`docs/PROVENANCE.md`](https://github.com/alan-shabrandi/vrp-demo/blob/main/docs/PROVENANCE.md): how the project went from thesis to web demo to package
- [`ARCHITECTURE.md`](https://github.com/alan-shabrandi/vrp-demo/blob/main/ARCHITECTURE.md): structure of the TypeScript implementation

## License

MIT. See [LICENSE](https://github.com/alan-shabrandi/vrp-demo/blob/main/LICENSE).