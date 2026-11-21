from vrp_solver.operators import (
    order_crossover,
    swap_mutation,
    tournament_select,
)
from vrp_solver.rng import create_rng
from vrp_solver.types import RouteSolution


def _sol(fitness: float) -> RouteSolution:
    return RouteSolution(
        sequence=["dummy"],
        totalDistance=fitness,
        totalTime=fitness,
        fitness=fitness,
    )


# ---------- order_crossover ----------


def test_ox_returns_valid_permutation():
    rng = create_rng(42)
    p1 = ["a", "b", "c", "d", "e"]
    p2 = ["c", "a", "e", "b", "d"]
    child = order_crossover(p1, p2, rng)
    assert len(child) == 5
    assert set(child) == set(p1)
    assert len(set(child)) == 5  # no duplicates


def test_ox_small_input_returns_copy():
    rng = create_rng(42)
    p1 = ["x"]
    child = order_crossover(p1, ["y"], rng)
    assert child == ["x"]


def test_ox_is_deterministic_with_seed():
    p1 = ["a", "b", "c", "d", "e", "f"]
    p2 = ["f", "e", "d", "c", "b", "a"]
    c1 = order_crossover(p1, p2, create_rng(42))
    c2 = order_crossover(p1, p2, create_rng(42))
    assert c1 == c2


def test_ox_does_not_mutate_inputs():
    p1 = ["a", "b", "c", "d"]
    p2 = ["d", "c", "b", "a"]
    p1_copy, p2_copy = list(p1), list(p2)
    order_crossover(p1, p2, create_rng(42))
    assert p1 == p1_copy
    assert p2 == p2_copy


# ---------- swap_mutation ----------


def test_swap_mutation_swaps_exactly_two():
    chrom = ["a", "b", "c", "d", "e"]
    out = swap_mutation(chrom, create_rng(42))
    diffs = [i for i in range(len(chrom)) if chrom[i] != out[i]]
    assert len(diffs) == 2
    assert set(out) == set(chrom)


def test_swap_mutation_does_not_mutate_input():
    chrom = ["a", "b", "c"]
    swap_mutation(chrom, create_rng(42))
    assert chrom == ["a", "b", "c"]


def test_swap_mutation_short_input_returns_copy():
    assert swap_mutation(["a"], create_rng(42)) == ["a"]
    assert swap_mutation([], create_rng(42)) == []


def test_swap_mutation_deterministic():
    chrom = ["a", "b", "c", "d", "e"]
    r1 = swap_mutation(chrom, create_rng(42))
    r2 = swap_mutation(chrom, create_rng(42))
    assert r1 == r2


# ---------- tournament_select ----------


def test_tournament_picks_global_min_for_large_k():
    pop = [_sol(10), _sol(5), _sol(15), _sol(3), _sol(20)]
    # k=100 over a size-5 population: missing the min is astronomically unlikely.
    result = tournament_select(pop, 100, create_rng(42))
    assert result.fitness == 3


def test_tournament_picks_single_individual_k1():
    pop = [_sol(10), _sol(5), _sol(20)]
    # k=1 means pick exactly one at random; result must be one of them.
    result = tournament_select(pop, 1, create_rng(42))
    assert result.fitness in {10, 5, 20}


def test_tournament_deterministic():
    pop = [_sol(i) for i in range(10)]
    r1 = tournament_select(pop, 3, create_rng(42))
    r2 = tournament_select(pop, 3, create_rng(42))
    assert r1.fitness == r2.fitness
