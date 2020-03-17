# Contributing to Atlas Machinarum

Thank you for your interest in Atlas Machinarum. 
This project aims to be a mathematically rigorous, declarative, and computationally sound library of mechanisms.

## Adding a new Mechanism

1. **Define the Topology**: Understand the base links, joints, and constraints.
2. **Implement the Solver**: 
   - Create a new file in `atlas_machinarum/library/` (e.g. `my_mechanism.py`).
   - Inherit from `Mechanism` in `atlas_machinarum.core.mechanism`.
   - Implement `__init__` declaring parameters.
   - Implement `solve(self, input_val) -> State`.
   - Prefer exact analytical solutions. If not possible, document numerical limitations.
3. **Tests**: Add a test in `tests/test_kinematics.py` validating the geometry against known positions or invariants (e.g., rigid link lengths).
4. **Web UI**: 
   - Add the mechanism to `MECHANISMS` dictionary in `atlas_machinarum/web/app.py`.
   - Add the explicit rendering logic (lines, points, sliders) in `atlas_machinarum/web/static/index.html`.
5. **Documentation**: Ensure the docstrings cover the parameters and units.

## Code Style
- Use standard Python type hints.
- Prioritize correct math over premature optimization.
- Avoid hidden magic. If a mechanism has multiple assembly branches, make the `assembly_mode` explicit.
