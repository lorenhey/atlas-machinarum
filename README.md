# ATLAS MACHINARUM

> *A mechanism is a rather elaborate way of persuading one motion to become another.*

**Atlas Machinarum** is a computational atlas of mechanisms and motion. It is not a gallery of GIF animations. It is a declarative, parametric, and mathematically rigorous library for defining, analyzing, simulating, and synthesizing mechanical linkages.

## 1. The Core Philosophy

The fundamental questions of this project are:
- Given a mechanism, what motion does it produce exactly?
- Given a desired motion, what mechanisms can produce it, and how does each behave?

Atlas Machinarum separates the **mathematical solver** from the **mechanism definition** where possible, and provides exact analytical solutions for classical families (Slider-Crank, Four-Bar, Peaucellier-Lipkin, etc.), falling back to robust numerical methods when necessary. 

Every mechanism is fully parametric, and changes in geometry immediately reflect in kinematics, singularities, and metrics.

## 2. Included Library & Features

- **Linkages**: Slider-Crank, Four-Bar, Scotch Yoke, Peaucellier-Lipkin, Chebyshev, Pantograph.
- **Intermittent & Rotary**: Geneva Drive, Ratchet.
- **Cam & Gears**: Cam Follower, Spur Gears, Planetary Gears.
- **Search by Motion**: Find mechanisms by input/output types (e.g., Continuous to Intermittent).
- **Compare Mode**: Overlay multiple mechanisms side-by-side visually.
- **Data Export**: Export kinematic paths to CSV for external analysis.
- **Declarative Schemas**: Extensible validation via JSON Schema (Pydantic).

## 4. Usage

### Installation
Clone the repository and install via pip (in editable mode for development):
```bash
git clone https://github.com/lorenhey/atlas-machinarum.git
cd atlas-machinarum
pip install -e .
```

### Python API
Atlas Machinarum can be used directly as a Python scientific library.

```python
import numpy as np
from atlas_machinarum.library import FourBar

# Define a crank-rocker mechanism
# ground=4, crank=1, coupler=3, rocker=3
fb = FourBar(ground=4.0, crank=1.0, coupler=3.0, rocker=3.0)

# Check Grashof condition
print("Type:", fb.grashof_condition()) # Output: CRANK_ROCKER

# Solve for a specific input angle
state = fb.solve(theta2=np.pi/4)

print("Coupler point position:", state.points["B"])
print("Transmission angle (rad):", state.metrics["transmission_angle"])
```

### Command Line Interface (CLI)
The CLI allows querying and starting the server.

```bash
# List all available mechanisms
atlas-machinarum list

# Start the interactive visualizer server
atlas-machinarum serve --port 8000
```

### Interactive Interface
Run `atlas-machinarum serve` and navigate to `http://localhost:8000`. 
The interface provides a clean, technical drawing visualization (HTML5 Canvas) where you can select mechanisms, scrub through input domains, and observe paths, constraints, and metrics in real-time. No SaaS bloat, just construction geometry.

## 5. Mechanism Schema and Models

Mechanisms are defined in `atlas_machinarum.library`, inheriting from the base `Mechanism` class in `atlas_machinarum.core.mechanism`. 

A mechanism solver returns a `State` object containing:
- `input_val`: The driving parameter.
- `points`: A dictionary of labeled $(x,y)$ coordinates.
- `velocities`: First derivatives.
- `accelerations`: Second derivatives.
- `metrics`: Mechanism-specific scalars (e.g. transmission angles, dwell states).

## 6. Synthesis and Future Goals

While the current version focuses on the **forward problem** (Mechanism $\rightarrow$ Motion), the architecture is designed to support the **inverse problem** (Motion $\rightarrow$ Mechanism). Future work includes:
- Coupler-curve trajectory matching.
- Function generation synthesis.
- Tolerance analysis via Monte Carlo simulation.
- Export to CAD (SVG, DXF) and fabrication files.

## 7. Contributing

To add a new mechanism:
1. Identify the topological family and parameters.
2. Implement an analytical solver in a new file under `library/` inheriting from `Mechanism`.
3. Ensure it returns a correct `State` object.
4. Add physical/mathematical tests in `tests/test_kinematics.py`.
5. Add the mechanism to the Web API in `web/app.py` and implement drawing logic in `index.html`.

## 8. License
MIT License. See `LICENSE` for details.
