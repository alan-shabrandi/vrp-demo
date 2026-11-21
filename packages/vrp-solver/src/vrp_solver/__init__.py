"""
vrp-solver: A Genetic Algorithm for the Vehicle Routing Problem.

Ported from the original TypeScript web implementation.
"""

from .distance import compute_improvement, evaluate_sequence, haversine_distance
from .ga import solve_ga
from .nearest_neighbor import solve_nearest_neighbor
from .types import (
    BaselineResult,
    GAConfig,
    GAResult,
    OptimizeResponse,
    Point,
    RouteSolution,
)
from .validation import parse_optimize_request

__version__ = "0.1.0"

__all__ = [
    "Point",
    "GAConfig",
    "RouteSolution",
    "GAResult",
    "BaselineResult",
    "OptimizeResponse",
    "solve_ga",
    "solve_nearest_neighbor",
    "evaluate_sequence",
    "haversine_distance",
    "compute_improvement",
    "parse_optimize_request",
]
