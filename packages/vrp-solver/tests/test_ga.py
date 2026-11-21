import pytest

from vrp_solver.ga import solve_ga
from vrp_solver.types import GAConfig, Point


def _make_points():
    return [
        Point(id="s", lat=35.0, lng=51.0, role="start"),
        Point(id="a", lat=35.5, lng=51.5, role="stop"),
        Point(id="b", lat=35.2, lng=51.2, role="stop"),
        Point(id="e", lat=35.8, lng=51.8, role="end"),
    ]


def _config(**kwargs) -> GAConfig:
    defaults = dict(
        populationSize=20,
        generations=30,
        mutationRate=0.15,
        elitismCount=2,
        tournamentSize=3,
        objective="distance",
        randomSeed=42,
    )
    defaults.update(kwargs)
    return GAConfig(**defaults)


def test_ga_sequence_valid():
    result = solve_ga(_make_points(), _config())
    assert result.sequence[0] == "s"
    assert result.sequence[-1] == "e"
    assert set(result.sequence) == {"s", "a", "b", "e"}


def test_ga_history_monotonic():
    result = solve_ga(_make_points(), _config())
    bests = [h.best for h in result.history]
    for i in range(1, len(bests)):
        assert bests[i] <= bests[i - 1] + 1e-9  # small float tolerance


def test_ga_deterministic_with_seed():
    r1 = solve_ga(_make_points(), _config(randomSeed=42))
    r2 = solve_ga(_make_points(), _config(randomSeed=42))
    assert r1.sequence == r2.sequence
    assert r1.fitness == pytest.approx(r2.fitness)


def test_ga_zero_stops():
    points = [
        Point(id="s", lat=35.0, lng=51.0, role="start"),
        Point(id="e", lat=35.1, lng=51.1, role="end"),
    ]
    result = solve_ga(points, _config())
    assert result.sequence == ["s", "e"]
    assert result.history == []
    assert result.generationsRun == 0
