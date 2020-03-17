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
