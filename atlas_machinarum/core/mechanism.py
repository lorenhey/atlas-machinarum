from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
from enum import Enum
import numpy as np

class JointType(str, Enum):
    REVOLUTE = "revolute"
    PRISMATIC = "prismatic"
    CYLINDRICAL = "cylindrical"
    GEAR = "gear"
    CAM = "cam"

class Parameter(BaseModel):
    name: str
    description: str = ""
    default: float
    min_val: Optional[float] = None
    max_val: Optional[float] = None

class LinkSchema(BaseModel):
    name: str
    is_ground: bool = False

class JointSchema(BaseModel):
    name: str
    type: JointType
    links: List[str]
    properties: Dict[str, Any] = {}

class MechanismSchema(BaseModel):
    name: str
    family: str
    parameters: List[Parameter]
    links: List[LinkSchema]
    joints: List[JointSchema]
    inputs: List[str]  # e.g., name of the driving joint
    
class State(BaseModel):
    """Represents a computed state of a mechanism at a specific input."""
    input_val: float
    points: Dict[str, tuple[float, float]]
    velocities: Dict[str, tuple[float, float]] = {}
    accelerations: Dict[str, tuple[float, float]] = {}
    metrics: Dict[str, float] = {}

class Mechanism:
    """Base class for all mechanisms."""
    def __init__(self, **params):
        self.params = params

    def solve(self, input_val: float, assembly_mode: int = 1) -> State:
        raise NotImplementedError("solve must be implemented by subclasses.")
        
    def path(self, input_range: np.ndarray, num_points: int = 100) -> List[State]:
        return [self.solve(val) for val in input_range]
