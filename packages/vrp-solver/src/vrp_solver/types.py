from dataclasses import dataclass, field
from typing import Literal

PointRole = Literal["start", "stop", "end"]
Objective = Literal["distance", "time"]


@dataclass(frozen=True)
class Point:
    id: str
    lat: float
    lng: float
    role: PointRole
    label: str | None = None


@dataclass(frozen=True)
class GAConfig:
    populationSize: int
    generations: int
    mutationRate: float
    elitismCount: int
    tournamentSize: int
    objective: Objective
    randomSeed: int | None = None


@dataclass(frozen=True)
class FitnessHistoryPoint:
    generation: int
    best: float
    average: float


@dataclass(frozen=True)
class RouteSolution:
    sequence: list[str]
    totalDistance: float
    totalTime: float
    fitness: float


@dataclass(frozen=True)
class GAResult(RouteSolution):
    algorithm: str = "genetic"
    history: list[FitnessHistoryPoint] = field(default_factory=list)
    generationsRun: int = 0


@dataclass(frozen=True)
class BaselineResult(RouteSolution):
    algorithm: str = "nearest-neighbor"


@dataclass(frozen=True)
class OptimizeResponse:
    ga: GAResult
    baseline: BaselineResult
    improvementPercent: float


@dataclass(frozen=True)
class OptimizeRequest:
    points: list[Point]
    config: GAConfig
