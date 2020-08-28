from ..core.mechanism import Mechanism, State
import numpy as np

class GearPair(Mechanism):
    """
    Simple Spur Gear Pair.
    
    Parameters:
    - n1: number of teeth of driving gear
    - n2: number of teeth of driven gear
    - module: gear module (m) in mm (Pitch diameter D = m * N)
    - internal: if True, gear 2 is an internal ring gear
    """
    def __init__(self, n1: int, n2: int, module: float = 1.0, internal: bool = False):
        super().__init__(n1=n1, n2=n2, module=module, internal=internal)
        self.n1 = n1
        self.n2 = n2
        self.m = module
        self.internal = internal
        
        self.r1 = (self.m * self.n1) / 2.0
        self.r2 = (self.m * self.n2) / 2.0
        
        if self.internal:
            self.C = self.r2 - self.r1
            self.ratio = self.n1 / self.n2
        else:
            self.C = self.r1 + self.r2
            self.ratio = -self.n1 / self.n2
            
    def solve(self, theta1: float, assembly_mode: int = 1) -> State:
        theta2 = theta1 * self.ratio
        
        return State(
            input_val=theta1,
            points={
                "O1": (0.0, 0.0),
                "O2": (self.C, 0.0)
            },
            metrics={
                "theta2": theta2,
                "velocity_ratio": self.ratio
            }
        )

class PlanetaryGear(Mechanism):
    """
    Planetary (Epicyclic) Gear Train.
    Parameters:
    - n_sun: Number of teeth on the sun gear
    - n_planet: Number of teeth on the planet gear
    - n_ring: Number of teeth on the ring gear
    - module: Gear module
    """
    def __init__(self, n_sun: int = 20, n_planet: int = 20, n_ring: int = 60, module: float = 0.002):
        # Geometric check: n_ring = n_sun + 2 * n_planet
        if n_ring != n_sun + 2 * n_planet:
            raise ValueError("Teeth do not mesh: n_ring must equal n_sun + 2*n_planet")
            
        super().__init__(n_sun=n_sun, n_planet=n_planet, n_ring=n_ring, module=module)
        self.n_sun = n_sun
        self.n_planet = n_planet
        self.n_ring = n_ring
        self.module = module
        
        self.r_sun = (self.n_sun * self.module) / 2
        self.r_planet = (self.n_planet * self.module) / 2
        self.r_ring = (self.n_ring * self.module) / 2
        self.r_carrier = self.r_sun + self.r_planet

    def solve(self, theta_sun: float, assembly_mode: int = 1) -> State:
        # Assuming ring gear is fixed (theta_ring = 0)
        theta_ring = 0.0
        
        # Willis Equation:
        ratio = self.n_ring / self.n_sun
        theta_carrier = (theta_sun + ratio * theta_ring) / (1 + ratio)
        
        # Planet gear rotation relative to carrier
        ratio_sp = self.n_sun / self.n_planet
        theta_planet = theta_carrier - ratio_sp * (theta_sun - theta_carrier)
        
        Cx, Cy = 0.0, 0.0
        Px = self.r_carrier * np.cos(theta_carrier)
        Py = self.r_carrier * np.sin(theta_carrier)
        
        return State(
            input_val=theta_sun,
            points={
                "SunCenter": (Cx, Cy),
                "PlanetCenter": (Px, Py)
            },
            metrics={
                "theta_sun": theta_sun,
                "theta_ring": theta_ring,
                "theta_carrier": theta_carrier,
                "theta_planet": theta_planet
            }
        )
