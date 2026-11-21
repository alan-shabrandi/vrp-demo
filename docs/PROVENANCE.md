# Provenance

The same genetic algorithm exists in this repository in three forms. This file explains how they relate and how I check that the two current implementations agree.

| Version | Year | Language | Purpose |
| --- | --- | --- | --- |
| B.Sc. thesis | 2017 | Python | Academic work |
| Web demo | 2026 | TypeScript | Visualization, so the algorithm can be tried in a browser |
| `vrp-solver` package | 2026 | Python | Installable library, checked against the web demo |

## 1. B.Sc. thesis (2017)

I first implemented the algorithm in Python for my bachelor's thesis in Geomatics Engineering at K. N. Toosi University of Technology. The thesis is titled *Genetic Algorithm for the Vehicle Routing Problem*. It used permutation encoding, order crossover, k-way tournament selection and elitism, with fitness computed from haversine distances.

## 2. Web demo (2026)

I rewrote the algorithm in TypeScript for an interactive demo. It follows the same structure as the thesis version and adds a Leaflet map with live point placement, a convergence chart, and a comparison with a nearest-neighbor baseline. The UI talks to the solver only through an HTTP route.

- Source: [github.com/alan-shabrandi/vrp-demo](https://github.com/alan-shabrandi/vrp-demo)
- Live demo: [vrp-demo-phi.vercel.app](https://vrp-demo-phi.vercel.app)

## 3. Python package (2026)

I then brought the algorithm back to Python as a package. It is a new implementation, not the thesis code. It has type hints (checked with mypy in strict mode), Pydantic input validation and a CLI built with Typer.

- Source: [`packages/vrp-solver`](../packages/vrp-solver)
- PyPI: [pypi.org/project/vrp-solver](https://pypi.org/project/vrp-solver/)

## What the two implementations share

The TypeScript and Python versions are ports of each other, line by line where it matters:

- **`mulberry32` random generator.** A short function, ported exactly. Both versions draw the same numbers from the same seed.
- **Order crossover.** Same cut-point logic, and the rest of the child is filled from the other parent in the same order.
- **Tournament selection.** Uniform sampling with replacement, and the lowest fitness wins.
- **Swap mutation.** Two distinct random positions are swapped.
- **Elitism.** The top N individuals are carried over unchanged.
- **Fitness.** Haversine distance with an earth radius of 6,371,000 m, and time at a constant 40 km/h.
- **Order of steps in a generation.** Sort, record the history, copy the elite, breed the rest.

What differs is the code around the algorithm: Next.js and Vitest on the TypeScript side, Pydantic, Typer and pytest on the Python side.

## How parity is checked

`packages/vrp-solver/tests/test_cross_validation.py` holds golden values: results produced by the TypeScript implementation for a fixed scenario with `randomSeed = 42`, stored in the test file. The Python tests run the same scenario and compare:

- `test_haversine_matches_typescript`: one distance calculation.
- `test_ox_matches_typescript`: one crossover with seed 42 gives the same permutation.
- `test_full_ga_matches_typescript`: 30 generations give the same final sequence, the same fitness, and the same `best` and `average` for every generation.

Fitness values are compared exactly, not with `pytest.approx`. That works because the random numbers are identical, so every random choice is identical, so the same arithmetic happens in the same order.

If you change the algorithm in one language, the golden values have to be regenerated from the TypeScript side and both test suites run again.

### Limits of this check

- It covers the scenarios in the test file. It does not prove that the two versions agree on every input.
- Exact float equality assumes both runtimes compute `sin`, `cos` and `atan2` to the same last bit. That holds for the tested scenario. It is not guaranteed for every input or platform, since the two languages use different math libraries. If a platform ever fails on the last digit of a fitness value, compare the sequence exactly and the fitness with a small tolerance.

## What made this possible

- Both implementations are deterministic for a given seed.
- The random generator is small enough to port exactly. In Python the 32-bit integer arithmetic of `mulberry32` has to be masked explicitly, because Python integers don't overflow.
- The operators are pure functions that consume random numbers in a fixed order.
- Sorting must break ties the same way in both languages, otherwise equal-fitness individuals could swap places.
- The tests compare exact values, so a small difference in the algorithm cannot hide inside a tolerance.