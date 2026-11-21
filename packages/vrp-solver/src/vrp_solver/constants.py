from typing import TypedDict

from .types import GAConfig

EARTH_RADIUS_M = 6_371_000
AVERAGE_SPEED_KMH = 40
AVERAGE_SPEED_MS = (AVERAGE_SPEED_KMH * 1000) / 3600

MIN_POINTS = 3
MAX_POINTS = 25

VALID_ROLES = ["start", "stop", "end"]
VALID_OBJECTIVES = ["distance", "time"]

DEFAULT_GA_CONFIG = GAConfig(
    populationSize=80,
    generations=150,
    mutationRate=0.15,
    elitismCount=2,
    tournamentSize=3,
    objective="distance",
)


class Bound(TypedDict):
    min: float
    max: float


GA_CONFIG_BOUNDS: dict[str, Bound] = {
    "populationSize": {"min": 10, "max": 300},
    "generations": {"min": 10, "max": 500},
    "mutationRate": {"min": 0.0, "max": 1.0},
    "elitismCount": {"min": 1, "max": 10},
    "tournamentSize": {"min": 2, "max": 10},
}
