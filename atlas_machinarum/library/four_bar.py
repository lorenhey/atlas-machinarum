import numpy as np
from ..core.mechanism import Mechanism, State
from typing import Optional, Tuple

class FourBar(Mechanism):
    """
    Four-Bar Linkage Mechanism.
    
    Parameters:
    - ground: length of the fixed link (O2 to O4)
    - crank: length of the input link (O2 to A)
    - coupler: length of the connecting link (A to B)
    - rocker: length of the output link (O4 to B)
    - cp_length: distance from A to coupler point P
    - cp_angle: angle of vector AP relative to vector AB (in radians)
    """
    def __init__(self, ground: float, crank: float, coupler: float, rocker: float, 
                 cp_length: float = 0.0, cp_angle: float = 0.0):
        super().__init__(ground=ground, crank=crank, coupler=coupler, rocker=rocker)
        self.r1 = ground
        self.r2 = crank
        self.r3 = coupler
        self.r4 = rocker
        self.cp_length = cp_length
        self.cp_angle = cp_angle
        
    def grashof_condition(self) -> str:
        lengths = sorted([self.r1, self.r2, self.r3, self.r4])
        s = lengths[0]
        l = lengths[3]
        p = lengths[1]
        q = lengths[2]
        
        if s + l < p + q:
            if s == self.r2: return "CRANK_ROCKER"
            if s == self.r1: return "DOUBLE_CRANK"
            if s == self.r3: return "DOUBLE_ROCKER"
            if s == self.r4: return "ROCKER_CRANK"
        elif s + l == p + q:
            return "CHANGE_POINT"
        else:
            return "NON_GRASHOF (DOUBLE_ROCKER)"

    def solve(self, theta2: float, assembly_mode: int = 1) -> State:
        """
        Solves kinematics for input angle theta2.
        assembly_mode: 1 or -1 for the two branches of the four-bar.
        """
        # O2 is origin
        O2x, O2y = 0.0, 0.0
        O4x, O4y = self.r1, 0.0
        
        # A is end of crank
        Ax = self.r2 * np.cos(theta2)
        Ay = self.r2 * np.sin(theta2)
        
        # Distance from A to O4
        Dx = O4x - Ax
        Dy = O4y - Ay
        D2 = Dx**2 + Dy**2
        D = np.sqrt(D2)
        
        # Check if closed loop is possible
        if D > self.r3 + self.r4 or D < abs(self.r3 - self.r4):
            raise ValueError(f"Geometry cannot close at theta2={theta2}. D={D}, r3={self.r3}, r4={self.r4}")
            
        # Cosine rule to find angle at A
        cos_alpha = (self.r3**2 + D2 - self.r4**2) / (2 * self.r3 * D)
        alpha = np.arccos(np.clip(cos_alpha, -1.0, 1.0))
        
        # Angle of vector A->O4
        gamma = np.arctan2(Dy, Dx)
        
        # Two solutions for theta3 based on assembly_mode
        theta3 = gamma - assembly_mode * alpha
        
        # Position of B
        Bx = Ax + self.r3 * np.cos(theta3)
        By = Ay + self.r3 * np.sin(theta3)
        
        # Transmission angle (angle between coupler and rocker)
        # Cosine rule on O2-A-B-O4 triangle
        cos_mu = (self.r3**2 + self.r4**2 - D2) / (2 * self.r3 * self.r4)
        mu = np.arccos(np.clip(cos_mu, -1.0, 1.0))
        
        # Coupler point P
        theta_P = theta3 + self.cp_angle
        Px = Ax + self.cp_length * np.cos(theta_P)
        Py = Ay + self.cp_length * np.sin(theta_P)
        
        return State(
            input_val=theta2,
            points={
                "O2": (O2x, O2y),
                "A": (Ax, Ay),
                "B": (Bx, By),
                "O4": (O4x, O4y),
                "P": (Px, Py)
            },
            metrics={
                "transmission_angle": mu
            }
        )
