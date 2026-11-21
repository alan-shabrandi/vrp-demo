import pytest

from vrp_solver.distance import haversine_distance
from vrp_solver.ga import solve_ga
from vrp_solver.operators import order_crossover
from vrp_solver.rng import create_rng
from vrp_solver.types import GAConfig, Point


def test_haversine_matches_typescript():
    """Reference value extracted from JS implementation."""
    a = Point(id="a", lat=35.6892, lng=51.389, role="stop")
    b = Point(id="b", lat=36.2605, lng=59.6168, role="stop")
    # From node -e: 742890.5725646897
    assert haversine_distance(a, b) == pytest.approx(742890.5725646897, rel=1e-15)


def test_ox_matches_typescript():
    """Reference value extracted from JS implementation (seed=42)."""
    p1 = ["a", "b", "c", "d", "e"]
    p2 = ["c", "a", "e", "b", "d"]
    rng = create_rng(42)
    child = order_crossover(p1, p2, rng)
    # From node -e: ["a","e","c","d","b"]
    assert child == ["a", "e", "c", "d", "b"]


def test_full_ga_matches_typescript():
    """
    Golden test: run the full GA with a fixed seed and scenario,
    matching the exact output of the TS implementation.
    """
    points = [
        Point(id="s", lat=35.0, lng=51.0, role="start"),
        Point(id="a", lat=35.5, lng=51.5, role="stop"),
        Point(id="b", lat=35.2, lng=51.2, role="stop"),
        Point(id="e", lat=35.8, lng=51.8, role="end"),
    ]
    config = GAConfig(
        populationSize=20,
        generations=30,
        mutationRate=0.15,
        elitismCount=2,
        tournamentSize=3,
        objective="distance",
        randomSeed=42,
    )

    result = solve_ga(points, config)

    # From node -e output:
    assert result.sequence == ["s", "b", "a", "e"]
    assert result.fitness == pytest.approx(114764.29985046442, rel=1e-15)
    assert result.generationsRun == 30
    assert len(result.history) == 30
    assert result.history[0].generation == 1
    assert result.history[0].best == pytest.approx(114764.29985046442, rel=1e-15)
    assert result.history[0].average == pytest.approx(162116.1570811758, rel=1e-15)
    assert result.history[2].average == pytest.approx(123373.72843786646, rel=1e-15)
