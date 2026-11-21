import pytest

from vrp_solver.distance import (
    compute_improvement,
    evaluate_sequence,
    haversine_distance,
)
from vrp_solver.types import Point


def _pt(id: str, lat: float, lng: float, role: str = "stop") -> Point:
    return Point(id=id, lat=lat, lng=lng, role=role)  # type: ignore[arg-type]


def test_haversine_self_distance_is_zero():
    a = _pt("a", 35.6892, 51.389)
    assert haversine_distance(a, a) == 0.0


def test_haversine_is_symmetric():
    a = _pt("a", 35.6892, 51.389)
    b = _pt("b", 36.2605, 59.6168)
    assert haversine_distance(a, b) == pytest.approx(haversine_distance(b, a))


def test_haversine_tehran_mashhad_reasonable():
    # Tehran → Mashhad is roughly 740 km great-circle distance.
    a = _pt("tehran", 35.6892, 51.389)
    b = _pt("mashhad", 36.2605, 59.6168)
    d = haversine_distance(a, b)
    assert 730_000 < d < 760_000


def test_evaluate_sequence_sums_distances():
    points = [
        _pt("s", 35.0, 51.0, "start"),
        _pt("m", 35.5, 51.5),
        _pt("e", 36.0, 52.0, "end"),
    ]
    result = evaluate_sequence(points, ["s", "m", "e"], "distance")
    expected = haversine_distance(points[0], points[1]) + haversine_distance(points[1], points[2])
    assert result.totalDistance == pytest.approx(expected)
    assert result.fitness == pytest.approx(expected)
    assert result.totalTime == pytest.approx(expected / (40 * 1000 / 3600))


def test_evaluate_sequence_time_objective():
    points = [
        _pt("s", 35.0, 51.0, "start"),
        _pt("e", 36.0, 52.0, "end"),
    ]
    result = evaluate_sequence(points, ["s", "e"], "time")
    assert result.fitness == pytest.approx(result.totalTime)


def test_evaluate_sequence_unknown_id_raises():
    points = [_pt("s", 35.0, 51.0, "start")]
    with pytest.raises(ValueError, match="Unknown point"):
        evaluate_sequence(points, ["s", "ghost"], "distance")


def test_compute_improvement_normal():
    assert compute_improvement(100.0, 90.0) == pytest.approx(0.1)


def test_compute_improvement_clamps_negative_to_zero():
    # Candidate worse than baseline → no negative improvement.
    assert compute_improvement(100.0, 110.0) == 0.0


def test_compute_improvement_clamps_above_one():
    # Candidate somehow better than 100% → clamp to 1.
    assert compute_improvement(10.0, -5.0) == 1.0


def test_compute_improvement_baseline_zero():
    assert compute_improvement(0.0, 0.0) == 0.0
    assert compute_improvement(-1.0, 0.0) == 0.0
