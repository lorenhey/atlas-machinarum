import numpy as np
from ..core.mechanism import Mechanism, State

class PeaucellierLipkin(Mechanism):
    """
    Peaucellier-Lipkin Exact Straight-Line Mechanism.
    
    Parameters:
    - a: length of the crank (and distance between ground pivots O and O')
    - b: length of the long arms (OB and OC)
    - c: length of the rhombus links (AB, BC, CP, PA)
    """
    def __init__(self, a: float, b: float, c: float):
        super().__init__(a=a, b=b, c=c)
        self.a = a
        self.b = b
        self.c = c
        
        if self.b <= self.c:
            raise ValueError("Long arms 'b' must be greater than rhombus links 'c'")
            
    def solve(self, theta: float, assembly_mode: int = 1) -> State:
        # Fixed points
        Ox, Oy = 0.0, 0.0
        Opx, Opy = self.a, 0.0
        
        # Crank point A
        Ax = Opx + self.a * np.cos(theta)
        Ay = Opy + self.a * np.sin(theta)
        
        d = np.sqrt(Ax**2 + Ay**2)
        if d == 0:
            raise ValueError("Singular configuration: A is at O.")
            
        # Direction of OA
        ux, uy = Ax / d, Ay / d
        
        # Distance to midpoint M of the rhombus
        x = (self.b**2 - self.c**2 + d**2) / (2 * d)
        
        y2 = self.b**2 - x**2
        if y2 < 0:
            raise ValueError("Geometry cannot close (rhombus broken).")
        y = np.sqrt(y2)
        
        # M coordinates
        Mx = x * ux
        My = x * uy
        
        # Perpendicular direction
        vx, vy = -uy, ux
        
        # B and C coordinates
        Bx = Mx + y * vx
        By = My + y * vy
        
        Cx = Mx - y * vx
        Cy = My - y * vy
        
        # P coordinates (end of rhombus)
        Px = Mx + (x - d) * ux
        Py = My + (x - d) * uy
        
        return State(
            input_val=theta,
            points={
                "O": (Ox, Oy),
                "O'": (Opx, Opy),
                "A": (Ax, Ay),
                "B": (Bx, By),
                "C": (Cx, Cy),
                "P": (Px, Py)
            },
            metrics={
                "P_x": Px,  # Should be constant
                "P_y": Py
            }
        )
