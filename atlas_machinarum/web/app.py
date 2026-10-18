from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import numpy as np
import os

from ..library import (
    SliderCrank, FourBar, ScotchYoke, GenevaDrive, GearPair, PlanetaryGear,
    PeaucellierLipkin, Chebyshev, Pantograph, CamFollower, Ratchet
)
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
        "params": {"crank": 0.05, "rod": 0.20, "offset": 0.0},
        "input_type": "continuous_rotation",
        "output_type": "oscillating_linear"
    },
    "four_bar": {
        "class": FourBar,
        "params": {"ground": 0.20, "crank": 0.05, "coupler": 0.15, "rocker": 0.15, "cp_length": 0.1, "cp_angle": 0.5},
        "input_type": "continuous_rotation",
        "output_type": "oscillating_rotation"
    },
    "scotch_yoke": {
        "class": ScotchYoke,
        "params": {"crank": 0.05},
        "input_type": "continuous_rotation",
        "output_type": "oscillating_linear"
    },
    "geneva": {
        "class": GenevaDrive,
        "params": {"n_slots": 4, "center_distance": 0.1},
        "input_type": "continuous_rotation",
        "output_type": "intermittent_rotation"
    },
    "gears": {
        "class": GearPair,
        "params": {"n1": 20, "n2": 40, "module": 0.002, "internal": False},
        "input_type": "continuous_rotation",
        "output_type": "continuous_rotation"
    },
    "peaucellier": {
        "class": PeaucellierLipkin,
        "params": {"a": 0.1, "b": 0.3, "c": 0.1},
        "input_type": "oscillating_rotation",
        "output_type": "oscillating_linear"
    },
    "chebyshev": {
        "class": Chebyshev,
        "params": {"a": 0.1},
        "input_type": "continuous_rotation",
        "output_type": "continuous_linear"
    },
    "pantograph": {
        "class": Pantograph,
        "params": {"L1": 0.2, "L2": 0.4},
        "input_type": "complex_path",
        "output_type": "complex_path"
    },
    "cam_follower": {
        "class": CamFollower,
        "params": {"base_radius": 0.1, "lift": 0.05, "roller_radius": 0.02},
        "input_type": "continuous_rotation",
        "output_type": "oscillating_linear"
    },
    "ratchet": {
        "class": Ratchet,
        "params": {"teeth": 12, "radius": 0.1},
        "input_type": "continuous_rotation",
        "output_type": "intermittent_rotation"
    },
    "planetary": {
        "class": PlanetaryGear,
        "params": {"n_sun": 20, "n_planet": 20, "n_ring": 60, "module": 0.002},
        "input_type": "continuous_rotation",
        "output_type": "continuous_rotation"
    }
}

@app.get("/api/mechanisms")
def get_mechanisms():
    return {name: info["params"] for name, info in MECHANISMS.items()}

@app.get("/api/search")
def search_mechanisms(input_type: str = None, output_type: str = None):
    results = []
    for name, info in MECHANISMS.items():
        if input_type and info["input_type"] != input_type:
            continue
        if output_type and info["output_type"] != output_type:
            continue
        results.append({
            "name": name,
            "input_type": info["input_type"],
            "output_type": info["output_type"]
        })
    return {"results": results}

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

@app.post("/api/export/{name}")
def export_csv(name: str, params: dict, steps: int = 100):
    """Exports the mechanism path as CSV"""
    sim_data = simulate(name, params, steps)["path"]
    
    # We'll return it as a JSON payload for the frontend to download as CSV,
    # or just return a structured JSON and the frontend can parse to CSV.
    # Returning JSON is easiest, let frontend do the formatting, or we can send text.
    import io
    import csv
    from fastapi.responses import PlainTextResponse
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    if not sim_data:
        return PlainTextResponse("No data", status_code=400)
        
    # Header
    pt_names = sorted(sim_data[0]["points"].keys())
    metric_names = sorted(sim_data[0]["metrics"].keys())
    
    headers = ["input_val"]
    for pt in pt_names:
        headers.extend([f"{pt}_x", f"{pt}_y"])
    for m in metric_names:
        headers.append(m)
        
    writer.writerow(headers)
    
    for row in sim_data:
        csv_row = [row["input"]]
        for pt in pt_names:
            csv_row.extend([row["points"][pt][0], row["points"][pt][1]])
        for m in metric_names:
            csv_row.append(row["metrics"][m])
        writer.writerow(csv_row)
        
    return PlainTextResponse(output.getvalue(), media_type="text/csv")

# Mount static files and serve index
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    css_dir = os.path.join(static_dir, "css")
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    js_dir = os.path.join(static_dir, "js")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")

@app.get("/", response_class=HTMLResponse)
def get_index():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Atlas Machinarum API Running. No UI built yet.</h1>"
