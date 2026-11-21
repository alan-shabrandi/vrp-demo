from vrp_solver.rng import create_rng, shuffle


def test_mulberry32_matches_typescript():
    """
    Test that Python mulberry32 matches the JS implementation bit-exactly.
    Expected values extracted from the actual TS implementation with seed=42.
    """
    rng = create_rng(42)
    expected = [
        0.6011037519201636,
        0.44829055899754167,
        0.8524657934904099,
        0.6697340414393693,
        0.17481389874592423,
    ]
    for i, exp in enumerate(expected):
        actual = rng()
        assert actual == exp, f"mismatch at index {i}: got {actual!r}, expected {exp!r}"


def test_shuffle_does_not_mutate():
    rng = create_rng(42)
    arr = [1, 2, 3, 4]
    out = shuffle(arr, rng)
    assert out != arr
    assert arr == [1, 2, 3, 4]
