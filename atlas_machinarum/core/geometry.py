import numpy as np
from pydantic import BaseModel
from typing import Tuple

class Point(BaseModel):
    x: float
    y: float
    
    def to_array(self) -> np.ndarray:
        return np.array([self.x, self.y])
    
    def distance_to(self, other: 'Point') -> float:
        return np.linalg.norm(self.to_array() - other.to_array())

class Vector(BaseModel):
    u: float
    v: float
    
    def to_array(self) -> np.ndarray:
        return np.array([self.u, self.v])
    
    def magnitude(self) -> float:
        return np.linalg.norm(self.to_array())

def rotate(point: Tuple[float, float], angle: float, origin: Tuple[float, float] = (0, 0)) -> Tuple[float, float]:
    ox, oy = origin
    px, py = point
    qx = ox + np.cos(angle) * (px - ox) - np.sin(angle) * (py - oy)
    qy = oy + np.sin(angle) * (px - ox) + np.cos(angle) * (py - oy)
    return qx, qy
