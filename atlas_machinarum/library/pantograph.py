import numpy as np
from ..core.mechanism import Mechanism, State

class Pantograph(Mechanism):
    """
    Pantograph mechanism for scaling motion.
    Points:
    O2: Fixed origin
    A: Input point on the first link
    B: Joint connecting link 1 and link 2
    C: Joint connecting link 3 and link 4
    D: Output point
    
    Links form a parallelogram.
    Let r1 = O2 to B
    Let r2 = B to D
    Let r3 = O2 to C
    Let r4 = C to A
    Parallelogram requires B-A || O2-C, so O2-B-A-C forms a parallelogram if tracing from A.
    Usually: Fixed point O2, Input point A, Output point D.
    O2-B-C-A is a parallelogram.
    """
    def __init__(self, L1: float = 0.2, L2: float = 0.4):
        # Simplest 2D pantograph: 
        # Fixed point O
        # Link 1: O to A (length L1+L2). Point B is at L1.
        # Link 2: B to C (length L2).
        # Link 3: C to D (length L1).
        # Link 4: A to D (length L2).
        # We trace point C. Point A is the output.
        # Wait, standard pantograph:
        # Origin O. Input point P. Output point P'.
        # O, P, P' are always collinear.
        # Scale factor S = OP' / OP = (L1 + L2) / L1
        super().__init__(L1=L1, L2=L2)
        self.L1 = L1
        self.L2 = L2
        
    def solve(self, input_val: float, assembly_mode: int = 1) -> State:
        # Since it's a 2DOF mechanism to trace arbitrary paths, we can simulate a circle for demo
        # input_val is the angle theta of the input point P rotating around an offset center
        
        # Define a circle for input P
        center_x, center_y = 0.1, 0.1
        radius = 0.05
        
        Px = center_x + radius * np.cos(input_val)
        Py = center_y + radius * np.sin(input_val)
        
        Ox, Oy = 0.0, 0.0
        
        # Scale factor
        scale = (self.L1 + self.L2) / self.L1
        
        # P' is collinear with O and P
        P_prime_x = Px * scale
        P_prime_y = Py * scale
        
        # To draw the rest of the mechanism (O-B-C-P and P-A-P_prime)
        # O to B is along OP.
        Bx = Px * (self.L1 / (self.L1 + self.L2)) # No, wait, O-B-P_prime is the line. P is on the lower link?
        
        # Standard configuration:
        # Fixed: O(0,0)
        # B is on line O-P' at distance L1. (Wait, O-B-P_prime is not the link).
        # Let O = (0,0)
        # First link: O -> A. length L1+L2.
        # B is on OA at distance L1 from O.
        # Link BD of length L2.
        # Link AC of length L2.
        # Link CD of length L1.
        # Input point D. Output point C.
        
        # Let's solve the kinematics:
        # We have O(0,0), and D(Px, Py).
        # The distance OD = sqrt(Px**2 + Py**2)
        # We need to find A and B.
        # In triangle OBD: sides are OB=L1, BD=L2, OD=D
        D = np.sqrt(Px**2 + Py**2)
        if D > self.L1 + self.L2 or D < abs(self.L1 - self.L2):
            raise ValueError(f"Target outside reachable workspace: {D}")
            
        cos_beta = (self.L1**2 + D**2 - self.L2**2) / (2 * self.L1 * D)
        beta = np.arccos(np.clip(cos_beta, -1.0, 1.0))
        
        gamma = np.arctan2(Py, Px)
        
        theta_OB = gamma - assembly_mode * beta
        
        Bx = self.L1 * np.cos(theta_OB)
        By = self.L1 * np.sin(theta_OB)
        
        # A is along OB, extended to length L1+L2
        Ax = (self.L1 + self.L2) * np.cos(theta_OB)
        Ay = (self.L1 + self.L2) * np.sin(theta_OB)
        
        # BD vector
        vec_BD_x = Px - Bx
        vec_BD_y = Py - By
        
        # C is A + vec_BD
        Cx = Ax + vec_BD_x
        Cy = Ay + vec_BD_y
        
        # Output C is exactly scaled D
        scale_actual = (self.L1 + self.L2) / self.L1
        
        return State(
            input_val=input_val,
            points={
                "O": (Ox, Oy),
                "B": (Bx, By),
                "A": (Ax, Ay),
                "D_in": (Px, Py),
                "C_out": (Cx, Cy)
            },
            metrics={"scale_factor": scale_actual}
        )
