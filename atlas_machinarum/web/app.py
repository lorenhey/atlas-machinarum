from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import numpy as np
import os

from ..library import SliderCrank, FourBar, ScotchYoke, GenevaDrive, GearPair, PeaucellierLipkin

app = FastAPI(title="Atlas Machinarum API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MECHANISMS = {
    "slider_crank": {
        "class": SliderCrank,
        "params": {"crank": 0.05, "rod": 0.20, "offset": 0.0}
    },
    "four_bar": {
        "class": FourBar,
        "params": {"ground": 0.20, "crank": 0.05, "coupler": 0.15, "rocker": 0.15, "cp_length": 0.1, "cp_angle": 0.5}
    },
    "scotch_yoke": {
        "class": ScotchYoke,
        "params": {"crank": 0.05}
    },
    "geneva": {
        "class": GenevaDrive,
        "params": {"n_slots": 4, "center_distance": 0.1}
    },
    "gears": {
        "class": GearPair,
        "params": {"n1": 20, "n2": 40, "module": 0.002, "internal": False}
    },
    "peaucellier": {
        "class": PeaucellierLipkin,
        "params": {"a": 0.1, "b": 0.3, "c": 0.1}
    }
}

@app.get("/api/mechanisms")
def get_mechanisms():
    return {name: info["params"] for name, info in MECHANISMS.items()}

@app.post("/api/simulate/{name}")
def simulate(name: str, params: dict, steps: int = 100):
    if name not in MECHANISMS:
        raise HTTPException(status_code=404, detail="Mechanism not found")
        
    cls = MECHANISMS[name]["class"]
    try:
        mech = cls(**params)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {e}")
        
    # Generate path
    # For now, input range is 0 to 2*pi
    theta_range = np.linspace(0, 2*np.pi, steps)
    
    path_data = []
    for theta in theta_range:
        try:
            state = mech.solve(theta)
            # Serialize
            path_data.append({
                "input": theta,
                "points": state.points,
                "metrics": state.metrics
            })
        except Exception as e:
            # Assembly failure (e.g. non-Grashof)
            continue
            
    if not path_data:
        raise HTTPException(status_code=400, detail="Could not simulate mechanism with given parameters (no valid assemblies).")
        
    return {"path": path_data}

# Mount static files and serve index
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", response_class=HTMLResponse)
def get_index():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Atlas Machinarum API Running. No UI built yet.</h1>"
