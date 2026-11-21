import pytest

from vrp_solver.validation import ValidationError, parse_optimize_request


def test_validation_happy_path():
    raw = {
        "points": [
            {"id": "s", "lat": 35.0, "lng": 51.0, "role": "start"},
            {"id": "a", "lat": 35.1, "lng": 51.1, "role": "stop"},
            {"id": "e", "lat": 35.2, "lng": 51.2, "role": "end"},
        ]
    }
    req = parse_optimize_request(raw)
    assert len(req.points) == 3
    assert req.config.populationSize == 80  # default


def test_validation_missing_start():
    raw = {
        "points": [
            {"id": "a", "lat": 35.1, "lng": 51.1, "role": "stop"},
            {"id": "e", "lat": 35.2, "lng": 51.2, "role": "end"},
            {"id": "x", "lat": 35.3, "lng": 51.3, "role": "stop"},
        ]
    }
    with pytest.raises(ValidationError, match="start"):
        parse_optimize_request(raw)


def test_validation_duplicate_ids():
    raw = {
        "points": [
            {"id": "s", "lat": 35.0, "lng": 51.0, "role": "start"},
            {"id": "s", "lat": 35.1, "lng": 51.1, "role": "stop"},
            {"id": "e", "lat": 35.2, "lng": 51.2, "role": "end"},
        ]
    }
    with pytest.raises(ValidationError, match="unique"):
        parse_optimize_request(raw)


def test_validation_elitism_greater_than_population():
    raw = {
        "points": [
            {"id": "s", "lat": 35.0, "lng": 51.0, "role": "start"},
            {"id": "a", "lat": 35.1, "lng": 51.1, "role": "stop"},
            {"id": "e", "lat": 35.2, "lng": 51.2, "role": "end"},
        ],
        "config": {"populationSize": 10, "elitismCount": 15},
    }
    with pytest.raises(ValidationError, match="elitismCount"):
        parse_optimize_request(raw)
