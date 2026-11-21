from .distance import evaluate_sequence, haversine_distance
from .types import BaselineResult, GAConfig, Point
from .validation import require_start_and_end


def solve_nearest_neighbor(points: list[Point], config: GAConfig) -> BaselineResult:
    """
    Greedy nearest-neighbor baseline.
    From the current point, hop to the nearest unvisited stop; terminate
    at the fixed end.
    """
    start, end = require_start_and_end(points)

    remaining = [p for p in points if p.role == "stop"]
    sequence: list[str] = [start.id]
    current: Point = start

    while remaining:
        best_idx = 0
        best_dist = float("inf")
        for i, p in enumerate(remaining):
            d = haversine_distance(current, p)
            if d < best_dist:
                best_dist = d
                best_idx = i
        next_point = remaining.pop(best_idx)
        sequence.append(next_point.id)
        current = next_point
    sequence.append(end.id)

    result = evaluate_sequence(points, sequence, config.objective)
    return BaselineResult(
        sequence=result.sequence,
        totalDistance=result.totalDistance,
        totalTime=result.totalTime,
        fitness=result.fitness,
    )
