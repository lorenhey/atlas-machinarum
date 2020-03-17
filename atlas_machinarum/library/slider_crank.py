import numpy as np
from ..core.mechanism import Mechanism, State

class SliderCrank(Mechanism):
    """
    Slider-Crank Mechanism.
    
    Parameters:
    - crank: length of the crank (R)
    - rod: length of the connecting rod (L)
    - offset: perpendicular distance from the crank center to the slider axis (E)
    """
    def __init__(self, crank: float, rod: float, offset: float = 0.0):
        super().__init__(crank=crank, rod=rod, offset=offset)
        self.R = crank
        self.L = rod
        self.E = offset
        
        # Check Grashof-like condition for slider crank:
        # A slider crank can fully rotate if L >= R + |E|
        if self.L < self.R + abs(self.E):
            print(f"Warning: SliderCrank with crank={self.R}, rod={self.L}, offset={self.E} cannot fully rotate.")
            
    def solve(self, theta: float, assembly_mode: int = 1) -> State:
        """
        Solves the kinematics for a given crank angle `theta` (radians).
        `assembly_mode` can be 1 or -1.
        """
        # A = crank pin
        Ax = self.R * np.cos(theta)
        Ay = self.R * np.sin(theta)
        
        # B = slider pin. We know By = E.
        # (Bx - Ax)^2 + (By - Ay)^2 = L^2
        # (Bx - Ax)^2 = L^2 - (E - Ay)^2
        inner = self.L**2 - (self.E - Ay)**2
        
        if inner < 0:
            raise ValueError(f"No assembly possible for theta={theta}. Geometry cannot close.")
            
        # Two solutions for Bx based on assembly mode
        Bx = Ax + assembly_mode * np.sqrt(inner)
        By = self.E
        
        # Velocity Analysis (assuming d_theta/dt = 1 for normalized velocities)
        omega = 1.0
        v_Ax = -self.R * np.sin(theta) * omega
        v_Ay =  self.R * np.cos(theta) * omega
        
        # d/dt [(Bx - Ax)^2 + (E - Ay)^2] = d/dt [L^2] = 0
        # 2(Bx - Ax)(v_Bx - v_Ax) + 2(E - Ay)(-v_Ay) = 0
        # (Bx - Ax) v_Bx = (Bx - Ax) v_Ax + (E - Ay) v_Ay
        if abs(Bx - Ax) < 1e-9:
            # Singularity (toggle position)
            v_Bx = np.inf if v_Ax != 0 or v_Ay != 0 else 0
        else:
            v_Bx = v_Ax + (self.E - Ay) * v_Ay / (Bx - Ax)
            
        v_By = 0.0
        
        # Connecting rod angle phi (angle of vector AB)
        # Bx - Ax = L cos(phi)
        # By - Ay = L sin(phi)
        phi = np.arctan2(By - Ay, Bx - Ax)
        
        return State(
            input_val=theta,
            points={"O": (0.0, 0.0), "A": (Ax, Ay), "B": (Bx, By)},
            velocities={"O": (0.0, 0.0), "A": (v_Ax, v_Ay), "B": (v_Bx, v_By)},
            metrics={
                "slider_position": Bx,
                "slider_velocity": v_Bx,
                "transmission_angle": np.arccos((self.E - Ay) / self.L)  # Actually angle between rod and vertical/slider normal
            }
        )
