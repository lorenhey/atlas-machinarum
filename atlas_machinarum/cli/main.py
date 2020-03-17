import typer
from rich.console import Console
from rich.table import Table
from ..library import SliderCrank, FourBar, ScotchYoke, GenevaDrive, GearPair
import uvicorn
import os

app = typer.Typer(help="Atlas Machinarum CLI")
console = Console()

MECHANISMS = {
    "slider-crank": SliderCrank,
    "four-bar": FourBar,
    "scotch-yoke": ScotchYoke,
    "geneva": GenevaDrive,
    "gears": GearPair
}

@app.command()
def list():
    """List available mechanisms."""
    table = Table("Mechanism", "Description")
    for name, cls in MECHANISMS.items():
        table.add_row(name, cls.__doc__.split('\n')[1].strip() if cls.__doc__ else "")
    console.print(table)

@app.command()
def serve(port: int = 8000):
    """Start the interactive web interface."""
    console.print(f"Starting server on http://localhost:{port}")
    uvicorn.run("atlas_machinarum.web.app:app", host="127.0.0.1", port=port, reload=False)

if __name__ == "__main__":
    app()
