from collections.abc import Callable

from .distance import evaluate_sequence
from .operators import order_crossover, swap_mutation, tournament_select
from .rng import Rng, create_rng, shuffle
from .types import FitnessHistoryPoint, GAConfig, GAResult, Point, RouteSolution
from .validation import require_start_and_end

Evaluator = Callable[[list[str]], RouteSolution]


def solve_ga(points: list[Point], config: GAConfig) -> GAResult:
    """
    Run the genetic algorithm.
    Chromosome = permutation of stop IDs only; start and end are fixed wrappers.
    """
    start, end = require_start_and_end(points)
    stops = [p for p in points if p.role == "stop"]

    if not stops:
        sequence = [start.id, end.id]
        result = evaluate_sequence(points, sequence, config.objective)
        return GAResult(
            sequence=result.sequence,
            totalDistance=result.totalDistance,
            totalTime=result.totalTime,
            fitness=result.fitness,
            history=[],
            generationsRun=0,
        )

    rng = create_rng(config.randomSeed)
    stop_ids = [p.id for p in stops]

    def evaluate(perm: list[str]) -> RouteSolution:
        return evaluate_sequence(points, [start.id, *perm, end.id], config.objective)

    population: list[RouteSolution] = [
        evaluate(shuffle(stop_ids, rng)) for _ in range(config.populationSize)
    ]

    history: list[FitnessHistoryPoint] = []

    for gen in range(config.generations):
        population.sort(key=lambda x: x.fitness)
        history.append(snapshot_generation(population, gen + 1))
        population = breed_next_generation(population, config, evaluate, rng)

    population.sort(key=lambda x: x.fitness)
    best = population[0]

    return GAResult(
        sequence=best.sequence,
        totalDistance=best.totalDistance,
        totalTime=best.totalTime,
        fitness=best.fitness,
        history=history,
        generationsRun=config.generations,
    )


def snapshot_generation(sorted_pop: list[RouteSolution], generation: int) -> FitnessHistoryPoint:
    total = sum(ind.fitness for ind in sorted_pop)
    return FitnessHistoryPoint(
        generation=generation,
        best=sorted_pop[0].fitness,
        average=total / len(sorted_pop),
    )


def breed_next_generation(
    population: list[RouteSolution],
    config: GAConfig,
    evaluate: Evaluator,
    rng: Rng,
) -> list[RouteSolution]:
    next_pop = population[: config.elitismCount]
    while len(next_pop) < config.populationSize:
        next_pop.append(breed_offspring(population, config, evaluate, rng))
    return next_pop


def breed_offspring(
    population: list[RouteSolution],
    config: GAConfig,
    evaluate: Evaluator,
    rng: Rng,
) -> RouteSolution:
    p1 = tournament_select(population, config.tournamentSize, rng)
    p2 = tournament_select(population, config.tournamentSize, rng)

    # Slice off the start/end wrappers to get permutations of stops only.
    stop_p1 = p1.sequence[1:-1]
    stop_p2 = p2.sequence[1:-1]

    child_perm = order_crossover(stop_p1, stop_p2, rng)
    if rng() < config.mutationRate:
        child_perm = swap_mutation(child_perm, rng)

    return evaluate(child_perm)
