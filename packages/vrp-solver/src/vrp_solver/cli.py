import dataclasses
import json
from pathlib import Path

import typer
from rich.console import Console

from .distance import compute_improvement
from .ga import solve_ga
from .nearest_neighbor import solve_nearest_neighbor
from .types import OptimizeResponse
from .validation import ValidationError, parse_optimize_request

app = typer.Typer(help="VRP Solver — Genetic Algorithm (Python port).")
console = Console()


@app.command()
def solve(
    input_file: Path = typer.Argument(..., help="Path to input JSON file."),
    output_file: Path | None = typer.Option(
        None, "--output", "-o", help="Path to output JSON file. If omitted, prints to stdout."
    ),
) -> None:
    """
    Read a VRP problem from JSON, run the GA and nearest-neighbor baseline,
    and output the result.
    """
    try:
        raw = json.loads(input_file.read_text(encoding="utf-8"))
    except Exception as e:
        console.print(f"[red]Error reading file:[/red] {e}")
        raise typer.Exit(code=1) from e

    try:
        req = parse_optimize_request(raw)
    except ValidationError as e:
        console.print(f"[red]Validation error:[/red] {e}")
        raise typer.Exit(code=1) from e

    console.print("[cyan]Running Genetic Algorithm...[/cyan]")
    ga_result = solve_ga(req.points, req.config)

    console.print("[cyan]Running Nearest-Neighbor baseline...[/cyan]")
    nn_result = solve_nearest_neighbor(req.points, req.config)

    improvement = compute_improvement(nn_result.fitness, ga_result.fitness)

    response = OptimizeResponse(
        ga=ga_result,
        baseline=nn_result,
        improvementPercent=improvement,
    )

    out_dict = dataclasses.asdict(response)
    out_json = json.dumps(out_dict, indent=2, ensure_ascii=False)

    if output_file:
        output_file.write_text(out_json, encoding="utf-8")
        console.print(f"[green]Done. Result written to {output_file}[/green]")
    else:
        print(out_json)


if __name__ == "__main__":
    app()
