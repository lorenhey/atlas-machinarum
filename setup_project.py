import os
import shutil

def write_file(path, content):
    d = os.path.dirname(path)
    if d:
        os.makedirs(d, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# Project structure
directories = [
    "atlas_machinarum",
    "atlas_machinarum/core",
    "atlas_machinarum/library",
    "atlas_machinarum/utils",
    "atlas_machinarum/cli",
    "atlas_machinarum/web",
    "atlas_machinarum/web/templates",
    "atlas_machinarum/web/static",
    "mechanisms",
    "tests",
    "examples",
    "experiments",
    "docs",
]

for d in directories:
    os.makedirs(d, exist_ok=True)

# Generate README.md
write_file("README.md", """
# ATLAS MACHINARUM

> Machines are full of small geometric arguments about how one thing ought to move when another one does.

A computational atlas of mechanisms and motion.

Atlas Machinarum is not a gallery of mechanism animations. It is a declarative, parametric, and mathematically rigorous library for defining, analyzing, and synthesizing mechanical linkages and mechanisms.

## Philosophy

The fundamental questions of this project are:
- Given a desired motion, what mechanisms can produce it?
- Given a mechanism, what motion does it produce exactly?

## Features
- **Rigorous Kinematics**: Exact analytical and numerical solvers for planar kinematics (position, velocity, acceleration).
- **Parametric Models**: All dimensions and constraints are parametric.
- **Search and Synthesis**: Find mechanisms by input/output types, or matching trajectories.
- **Declarative Schema**: Mechanisms defined cleanly, with Python APIs for integration.
- **Interactive Visualization**: Clean, technical visualizations with HTML/Canvas.

## Installation
```bash
pip install -e .
```

## Usage
```python
from atlas_machinarum.library.slider_crank import SliderCrank

m = SliderCrank(crank=0.05, rod=0.20)
state = m.solve(theta=1.2)
print(state.position)
```
""")

write_file("setup.py", """
from setuptools import setup, find_packages

setup(
    name="atlas_machinarum",
    version="0.1.0",
    description="A computational atlas of mechanisms and motion.",
    author="Loren",
    packages=find_packages(),
    install_requires=[
        "numpy",
        "scipy",
        "pydantic",
        "fastapi",
        "uvicorn",
        "typer",
        "pyyaml",
    ],
    entry_points={
        "console_scripts": [
            "atlas-machinarum = atlas_machinarum.cli.main:app"
        ]
    }
)
""")

write_file("atlas_machinarum/__init__.py", "")
write_file("atlas_machinarum/core/__init__.py", "")
write_file("atlas_machinarum/library/__init__.py", "")
write_file("atlas_machinarum/cli/__init__.py", "")
write_file("tests/__init__.py", "")

print("Initial structure created.")
