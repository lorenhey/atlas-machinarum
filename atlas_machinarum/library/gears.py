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
    Sun (1), Planet (2), Ring (3), Carrier (c).
    
    Parameters:
    - n_sun: number of teeth on sun gear
    - n_planet: number of teeth on planet gear
    - n_ring: number of teeth on ring gear (must be n_sun + 2*n_planet for standard spacing)
    - module: gear module
    """
    def __init__(self, n_sun: int, n_planet: int, module: float = 1.0):
        n_ring = n_sun + 2 * n_planet
        super().__init__(n_sun=n_sun, n_planet=n_planet, n_ring=n_ring, module=module)
        self.n_sun = n_sun
        self.n_planet = n_planet
        self.n_ring = n_ring
        self.m = module
        
        self.r_sun = self.m * self.n_sun / 2.0
        self.r_planet = self.m * self.n_planet / 2.0
        self.r_ring = self.m * self.n_ring / 2.0
        self.r_carrier = self.r_sun + self.r_planet
        
    def solve_kinematics(self, omega_sun: float, omega_ring: float, omega_carrier: float) -> State:
        """
        Since planetary gear has 2 DOFs, we need two inputs to solve for the third.
        This method is an example of Willis equation:
        (omega_sun - omega_carrier) / (omega_ring - omega_carrier) = - n_ring / n_sun
        """
        ratio = - self.n_ring / self.n_sun
        
        # Determine the missing input (represented by None or NaN, but here we just pass 0 and solve)
        # We will require user to pass two knowns and one None.
        pass # To be implemented fully in a more generic solver
