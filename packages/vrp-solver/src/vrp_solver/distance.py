import math

from .constants import AVERAGE_SPEED_MS, EARTH_RADIUS_M
from .types import Objective, Point, RouteSolution


def _to_rad(deg: float) -> float:
    return (deg * math.pi) / 180.0


def haversine_distance(a: Point, b: Point) -> float:
    """Great-circle distance between two WGS84 points, in meters."""
    d_lat = _to_rad(b.lat - a.lat)
    d_lng = _to_rad(b.lng - a.lng)
    lat1 = _to_rad(a.lat)
    lat2 = _to_rad(b.lat)
    h = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
    # Guard against floating-point overshoot. In JS, Math.asin returns NaN
    # for inputs > 1; Python's math.asin raises ValueError. Clamp to match
    # the "safe" behavior for valid WGS84 coordinates.
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(min(1.0, h)))


def evaluate_sequence(
    points: list[Point],
    sequence: list[str],
    objective: Objective,
) -> RouteSolution:
    """
    Evaluate a full route.

    ``sequence`` must include start, end, and every stop, in visit order,
    starting with the start point and ending with the end point.
    """
    by_id = {p.id: p for p in points}
    total_distance = 0.0

    for i in range(len(sequence) - 1):
        a = by_id.get(sequence[i])
        b = by_id.get(sequence[i + 1])
        if a is None or b is None:
            raise ValueError(f"Unknown point in sequence: {sequence[i]} or {sequence[i + 1]}")
        total_distance += haversine_distance(a, b)

    total_time = total_distance / AVERAGE_SPEED_MS
    fitness = total_distance if objective == "distance" else total_time

    return RouteSolution(
        sequence=sequence,
        totalDistance=total_distance,
        totalTime=total_time,
        fitness=fitness,
    )


def compute_improvement(baseline_fitness: float, candidate_fitness: float) -> float:
    """
    Fractional improvement of ``candidate`` over ``baseline``, clamped to [0, 1].
    ``0.111`` means the candidate is 11.1% better.
    """
    if baseline_fitness <= 0:
        return 0.0
    raw = (baseline_fitness - candidate_fitness) / baseline_fitness
    return max(0.0, min(1.0, raw))
