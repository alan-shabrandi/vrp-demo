from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator

from .constants import (
    DEFAULT_GA_CONFIG,
    GA_CONFIG_BOUNDS,
    MAX_POINTS,
    MIN_POINTS,
    VALID_ROLES,
)
from .types import GAConfig, Objective, OptimizeRequest, Point, PointRole


class ValidationError(ValueError):
    pass


class PointSchema(BaseModel):
    id: str = Field(min_length=1)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    role: PointRole
    label: str | None = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in VALID_ROLES:
            raise ValueError(f"role must be one of {', '.join(VALID_ROLES)}")
        return v


class ConfigSchema(BaseModel):
    populationSize: int = Field(
        default=DEFAULT_GA_CONFIG.populationSize,
        ge=GA_CONFIG_BOUNDS["populationSize"]["min"],
        le=GA_CONFIG_BOUNDS["populationSize"]["max"],
    )
    generations: int = Field(
        default=DEFAULT_GA_CONFIG.generations,
        ge=GA_CONFIG_BOUNDS["generations"]["min"],
        le=GA_CONFIG_BOUNDS["generations"]["max"],
    )
    mutationRate: float = Field(
        default=DEFAULT_GA_CONFIG.mutationRate,
        ge=GA_CONFIG_BOUNDS["mutationRate"]["min"],
        le=GA_CONFIG_BOUNDS["mutationRate"]["max"],
    )
    elitismCount: int = Field(
        default=DEFAULT_GA_CONFIG.elitismCount,
        ge=GA_CONFIG_BOUNDS["elitismCount"]["min"],
        le=GA_CONFIG_BOUNDS["elitismCount"]["max"],
    )
    tournamentSize: int = Field(
        default=DEFAULT_GA_CONFIG.tournamentSize,
        ge=GA_CONFIG_BOUNDS["tournamentSize"]["min"],
        le=GA_CONFIG_BOUNDS["tournamentSize"]["max"],
    )
    objective: Objective = DEFAULT_GA_CONFIG.objective
    randomSeed: int | None = None

    @model_validator(mode="after")
    def check_elitism(self) -> "ConfigSchema":
        if self.elitismCount > self.populationSize:
            raise ValueError("elitismCount must be <= populationSize")
        return self


class OptimizeRequestSchema(BaseModel):
    points: list[PointSchema]
    config: ConfigSchema | None = None

    @field_validator("points")
    @classmethod
    def validate_points_length(cls, v: list[PointSchema]) -> list[PointSchema]:
        if len(v) < MIN_POINTS:
            raise ValueError(f"At least {MIN_POINTS} points are required")
        if len(v) > MAX_POINTS:
            raise ValueError(f"At most {MAX_POINTS} points are allowed")
        return v

    @model_validator(mode="after")
    def check_roles_and_ids(self) -> "OptimizeRequestSchema":
        starts = [p for p in self.points if p.role == "start"]
        ends = [p for p in self.points if p.role == "end"]
        if len(starts) != 1:
            raise ValueError('Exactly one point must have role "start"')
        if len(ends) != 1:
            raise ValueError('Exactly one point must have role "end"')

        ids = [p.id for p in self.points]
        if len(ids) != len(set(ids)):
            raise ValueError("Point IDs must be unique")
        return self


def parse_optimize_request(body: dict[str, Any]) -> OptimizeRequest:
    try:
        schema = OptimizeRequestSchema.model_validate(body)
    except Exception as e:
        raise ValidationError(str(e)) from e

    points = [
        Point(id=p.id, lat=p.lat, lng=p.lng, role=p.role, label=p.label) for p in schema.points
    ]

    if schema.config:
        config = GAConfig(
            populationSize=schema.config.populationSize,
            generations=schema.config.generations,
            mutationRate=schema.config.mutationRate,
            elitismCount=schema.config.elitismCount,
            tournamentSize=schema.config.tournamentSize,
            objective=schema.config.objective,
            randomSeed=schema.config.randomSeed,
        )
    else:
        config = DEFAULT_GA_CONFIG

    return OptimizeRequest(points=points, config=config)


def require_start_and_end(points: list[Point]) -> tuple[Point, Point]:
    """Defensive invariant used by both solvers."""
    start = next((p for p in points if p.role == "start"), None)
    end = next((p for p in points if p.role == "end"), None)
    if start is None or end is None:
        raise ValueError("Points must include exactly one start and one end")
    return start, end
