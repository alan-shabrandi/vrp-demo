from vrp_solver.nearest_neighbor import solve_nearest_neighbor
from vrp_solver.types import GAConfig, Point


def _make_points():
    return [
        Point(id="s", lat=35.0, lng=51.0, role="start"),
        Point(id="a", lat=35.1, lng=51.1, role="stop"),
        Point(id="b", lat=35.2, lng=51.2, role="stop"),
        Point(id="e", lat=35.3, lng=51.3, role="end"),
    ]


def _config(**kwargs) -> GAConfig:
    defaults = dict(
        populationSize=10,
        generations=10,
        mutationRate=0.1,
        elitismCount=1,
        tournamentSize=2,
        objective="distance",
    )
    defaults.update(kwargs)
    return GAConfig(**defaults)


def test_nn_sequence_valid():
    points = _make_points()
    result = solve_nearest_neighbor(points, _config())
    assert result.sequence[0] == "s"
    assert result.sequence[-1] == "e"
    assert set(result.sequence) == {"s", "a", "b", "e"}
    assert result.algorithm == "nearest-neighbor"


def test_nn_deterministic():
    points = _make_points()
    r1 = solve_nearest_neighbor(points, _config())
    r2 = solve_nearest_neighbor(points, _config())
    assert r1.sequence == r2.sequence
