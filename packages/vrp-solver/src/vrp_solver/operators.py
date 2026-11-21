from .rng import Rng, random_index
from .types import RouteSolution


def order_crossover(p1: list[str], p2: list[str], rng: Rng) -> list[str]:
    """
    Order Crossover (OX). Always yields a valid permutation of the same set.

    See ``operators.ts`` for the full rationale.
    """
    n = len(p1)
    if n < 2:
        return list(p1)

    a = int(rng() * n)
    b = int(rng() * n)
    start, end = (a, b) if a < b else (b, a)

    child: list[str | None] = [None] * n
    used: set[str] = set()

    for i in range(start, end + 1):
        child[i] = p1[i]
        used.add(p1[i])

    j = 0
    for i in range(n):
        if child[i] is not None:
            continue
        while p2[j] in used:
            j += 1
        child[i] = p2[j]
        j += 1

    # All positions must be filled by construction; if not, that's a bug.
    assert all(c is not None for c in child), "OX left null slots"
    return child  # type: ignore[return-value]


def swap_mutation(chrom: list[str], rng: Rng) -> list[str]:
    """Picks two distinct positions and swaps them. Returns a new list."""
    out = list(chrom)
    if len(out) < 2:
        return out
    i = random_index(len(out), rng)
    j = random_index(len(out), rng)
    while j == i:
        j = random_index(len(out), rng)
    out[i], out[j] = out[j], out[i]
    return out


def tournament_select(
    population: list[RouteSolution],
    k: int,
    rng: Rng,
) -> RouteSolution:
    """
    k-way tournament selection. Samples ``k`` individuals uniformly (with
    replacement) and returns the one with the lowest ``fitness``.
    """
    best = population[random_index(len(population), rng)]
    for _ in range(1, k):
        candidate = population[random_index(len(population), rng)]
        if candidate.fitness < best.fitness:
            best = candidate
    return best
