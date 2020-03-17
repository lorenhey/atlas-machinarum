import numpy as np
from ..core.mechanism import Mechanism, State

class GenevaDrive(Mechanism):
    """
    Geneva Drive Mechanism (Intermittent Motion).
    
    Parameters:
    - n_slots: number of slots on the driven wheel (N >= 3)
    - center_distance: distance between driving and driven shafts (C)
    """
    def __init__(self, n_slots: int, center_distance: float):
        super().__init__(n_slots=n_slots, center_distance=center_distance)
        self.N = n_slots
        self.C = center_distance
        
        # Geometry for orthogonal engagement
        self.R2 = self.C * np.sin(np.pi / self.N)  # Driving crank radius
        self.R3 = self.C * np.cos(np.pi / self.N)  # Driven wheel radius (outer)
        
        # Engagement angle limit for the driving crank
        self.alpha = np.pi / 2 - np.pi / self.N
        
    def solve(self, theta2: float, assembly_mode: int = 1) -> State:
        """
        Solves the kinematics for driving crank angle theta2.
        theta2 is measured from the line of centers O2->O3.
        """
        # Normalize theta2 to [-pi, pi]
        theta2_norm = (theta2 + np.pi) % (2 * np.pi) - np.pi
        
        O2x, O2y = 0.0, 0.0
        O3x, O3y = self.C, 0.0
        
        # Pin A on driving crank
        Ax = self.R2 * np.cos(theta2_norm)
        Ay = self.R2 * np.sin(theta2_norm)
        
        # Determine if pin is engaged
        is_engaged = -self.alpha <= theta2_norm <= self.alpha
        
        if is_engaged:
            # Angle of the slot relative to O3
            # Using arctan2(Ay - O3y, Ax - O3x)
            theta3 = np.arctan2(Ay, Ax - self.C)
            
            # Kinematics (Velocity)
            # Differentiate theta3 with respect to theta2
            # Let k = R2/C = sin(pi/N)
            k = self.R2 / self.C
            cos_t = np.cos(theta2_norm)
            
            # d(theta3)/d(theta2) = k(k - cos_t) / (1 + k^2 - 2k cos_t)
            omega3_ratio = k * (k - cos_t) / (1 + k**2 - 2 * k * cos_t)
            
            # Acceleration
            # d^2(theta3)/d(theta2)^2 = k(1-k^2) sin_t / (1 + k^2 - 2k cos_t)^2
            sin_t = np.sin(theta2_norm)
            alpha3_ratio = k * (1 - k**2) * sin_t / ((1 + k**2 - 2 * k * cos_t)**2)
            
        else:
            # Not engaged, wheel is locked (dwell)
            # Determine which slot it's locked at based on entry/exit
            if theta2_norm > self.alpha:
                theta3 = np.pi - np.pi/self.N
            else:
                theta3 = -(np.pi - np.pi/self.N) # Approximate placeholder logic for single revolution dwell
            
            # Since the actual wheel accumulates angle, we track local position.
            # Usually the slot angle is constant during dwell.
            omega3_ratio = 0.0
            alpha3_ratio = 0.0
            
        # Point B on the edge of the driven wheel slot
        Bx = O3x + self.R3 * np.cos(theta3)
        By = O3y + self.R3 * np.sin(theta3)
        
        return State(
            input_val=theta2,
            points={
                "O2": (O2x, O2y),
                "O3": (O3x, O3y),
                "A": (Ax, Ay),
                "B": (Bx, By)
            },
            metrics={
                "is_engaged": float(is_engaged),
                "driven_angle": theta3,
                "velocity_ratio": omega3_ratio,
                "acceleration_ratio": alpha3_ratio
            }
        )
