import random
from collections.abc import Callable
from typing import TypeVar

T = TypeVar("T")
Rng = Callable[[], float]


def _imul(a: int, b: int) -> int:
    """Equivalent to JavaScript's Math.imul (32-bit integer multiplication)."""
    return (a * b) & 0xFFFFFFFF


def create_rng(seed: int | None = None) -> Rng:
    """
    Mulberry32 PRNG.
    Without a seed, returns `random.random` so production runs stay non-deterministic.
    """
    if seed is None:
        return random.random

    s = seed & 0xFFFFFFFF

    def next_val() -> float:
        nonlocal s
        s = (s + 0x6D2B79F5) & 0xFFFFFFFF
        t = s
        t = _imul(t ^ (t >> 15), t | 1)
        t = (t ^ (t + _imul(t ^ (t >> 7), t | 61))) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0

    return next_val


def shuffle(arr: list[T], rng: Rng) -> list[T]:
    """Fisher-Yates shuffle. Returns a new array; does not mutate the input."""
    out = list(arr)
    for i in range(len(out) - 1, 0, -1):
        j = int(rng() * (i + 1))
        out[i], out[j] = out[j], out[i]
    return out


def random_index(length: int, rng: Rng) -> int:
    """Uniform integer in [0, length)."""
    return int(rng() * length)
