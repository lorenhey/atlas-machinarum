import numpy as np
from ..core.mechanism import Mechanism, State

class Chebyshev(Mechanism):
    """
    Chebyshev's approximate straight-line linkage.
    It is a four-bar linkage where the crossed links and ground have specific proportions.
    Common proportions: r1 (ground) = 2a, r2 (crank) = a, r3 (coupler) = 2.5a, r4 (rocker) = 2.5a
    Coupler point is midway on the coupler.
    """
    def __init__(self, a: float = 1.0):
        super().__init__(a=a)
        self.r1 = 2 * a
        self.r2 = a
        self.r3 = 2.5 * a
        self.r4 = 2.5 * a
        # Coupler point is exactly in the middle of the coupler
        self.cp_length = 1.25 * a
        self.cp_angle = 0.0

    def solve(self, theta2: float, assembly_mode: int = -1) -> State:
        # Cross configuration is typically required for the straight line
        # O2 is origin
        O2x, O2y = 0.0, 0.0
        O4x, O4y = self.r1, 0.0
        
        Ax = self.r2 * np.cos(theta2)
        Ay = self.r2 * np.sin(theta2)
        
        Dx = O4x - Ax
        Dy = O4y - Ay
        D2 = Dx**2 + Dy**2
        D = np.sqrt(D2)
        
        if D > self.r3 + self.r4 or D < abs(self.r3 - self.r4):
            raise ValueError(f"Geometry cannot close at theta2={theta2}")
            
        cos_alpha = (self.r3**2 + D2 - self.r4**2) / (2 * self.r3 * D)
        alpha = np.arccos(np.clip(cos_alpha, -1.0, 1.0))
        
        gamma = np.arctan2(Dy, Dx)
        
        # Chebyshev is usually crossed, assembly_mode = -1 typically gives the crossed branch
        theta3 = gamma - assembly_mode * alpha
        
        Bx = Ax + self.r3 * np.cos(theta3)
        By = Ay + self.r3 * np.sin(theta3)
        
        # Coupler point
        Px = Ax + self.cp_length * np.cos(theta3)
        Py = Ay + self.cp_length * np.sin(theta3)
        
        return State(
            input_val=theta2,
            points={
                "O2": (O2x, O2y),
                "A": (Ax, Ay),
                "B": (Bx, By),
                "O4": (O4x, O4y),
                "P": (Px, Py)
            },
            metrics={"straightness_y": Py} # Py should remain nearly constant during the straight line phase
        )
