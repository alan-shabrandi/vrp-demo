import { evaluateSequence } from "./distance";
import { orderCrossover, swapMutation, tournamentSelect } from "./operators";
import { createRng, shuffle, type Rng } from "./rng";
import { requireStartAndEnd } from "./validation";
import type {
  FitnessHistoryPoint,
  GAConfig,
  GAResult,
  Point,
  RouteSolution,
} from "./types";

type Evaluator = (perm: string[]) => RouteSolution;

/**
 * Run the genetic algorithm.
 *
 * Chromosome = permutation of stop IDs only; start and end are fixed
 * wrappers, so the search space is n! for n stops instead of (n+2)!.
 *
 * Elitism guarantees `history[i].best <= history[i-1].best` — the
 * invariant the tests assert on.
 */
export function solveGA(points: Point[], config: GAConfig): GAResult {
  const { start, end } = requireStartAndEnd(points);
  const stops = points.filter((p) => p.role === "stop");

  if (stops.length === 0) {
    const sequence = [start.id, end.id];
    const result = evaluateSequence(points, sequence, config.objective);
    return { ...result, algorithm: "genetic", history: [], generationsRun: 0 };
  }

  const rng = createRng(config.randomSeed);
  const stopIds = stops.map((p) => p.id);
  const evaluate: Evaluator = (perm) =>
    evaluateSequence(points, [start.id, ...perm, end.id], config.objective);

  let population = Array.from({ length: config.populationSize }, () =>
    evaluate(shuffle(stopIds, rng)),
  );

  const history: FitnessHistoryPoint[] = [];

  for (let gen = 0; gen < config.generations; gen++) {
    population.sort((a, b) => a.fitness - b.fitness);
    history.push(snapshotGeneration(population, gen + 1));
    population = breedNextGeneration(population, config, evaluate, rng);
  }

  population.sort((a, b) => a.fitness - b.fitness);

  return {
    ...population[0],
    algorithm: "genetic",
    history,
    generationsRun: config.generations,
  };
}

function snapshotGeneration(
  sorted: RouteSolution[],
  generation: number,
): FitnessHistoryPoint {
  const sum = sorted.reduce((acc, ind) => acc + ind.fitness, 0);
  return {
    generation,
    best: sorted[0].fitness,
    average: sum / sorted.length,
  };
}

function breedNextGeneration(
  population: RouteSolution[],
  config: GAConfig,
  evaluate: Evaluator,
  rng: Rng,
): RouteSolution[] {
  const next = population.slice(0, config.elitismCount);
  while (next.length < config.populationSize) {
    next.push(breedOffspring(population, config, evaluate, rng));
  }
  return next;
}

function breedOffspring(
  population: RouteSolution[],
  config: GAConfig,
  evaluate: Evaluator,
  rng: Rng,
): RouteSolution {
  const p1 = tournamentSelect(population, config.tournamentSize, rng);
  const p2 = tournamentSelect(population, config.tournamentSize, rng);

  const stopP1 = p1.sequence.slice(1, -1);
  const stopP2 = p2.sequence.slice(1, -1);

  let childPerm = orderCrossover(stopP1, stopP2, rng);
  if (rng() < config.mutationRate) {
    childPerm = swapMutation(childPerm, rng);
  }

  return evaluate(childPerm);
}
