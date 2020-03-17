import numpy as np
from ..core.mechanism import Mechanism, State

class ScotchYoke(Mechanism):
    """
    Scotch Yoke Mechanism.
    Translates continuous rotation into pure simple harmonic motion.
    
    Parameters:
    - crank: radius of the crank (R)
    """
    def __init__(self, crank: float):
        super().__init__(crank=crank)
        self.R = crank
        
    def solve(self, theta: float, assembly_mode: int = 1) -> State:
        # Origin at crank pivot
        Ax = self.R * np.cos(theta)
        Ay = self.R * np.sin(theta)
        
        # Slider block (Yoke moves horizontally)
        # The yoke is typically aligned so its displacement is exactly the x-projection
        Yx = Ax
        
        # Velocity and acceleration
        omega = 1.0
        alpha = 0.0
        
        v_Ax = -self.R * omega * np.sin(theta)
        v_Ay = self.R * omega * np.cos(theta)
        
        v_Yx = v_Ax
        
        a_Yx = -self.R * omega**2 * np.cos(theta) - self.R * alpha * np.sin(theta)
        
        return State(
            input_val=theta,
            points={
                "O": (0.0, 0.0),
                "A": (Ax, Ay),
                "YokeCenter": (Yx, 0.0)
            },
            velocities={
                "Yoke": (v_Yx, 0.0)
            },
            accelerations={
                "Yoke": (a_Yx, 0.0)
            },
            metrics={
                "displacement": Yx,
                "velocity": v_Yx,
                "acceleration": a_Yx
            }
        )
