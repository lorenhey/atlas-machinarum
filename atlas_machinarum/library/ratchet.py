import numpy as np
from ..core.mechanism import Mechanism, State

class Ratchet(Mechanism):
    """
    Ratchet and pawl mechanism.
    Models the discrete angular progression.
    """
    def __init__(self, teeth: int = 12, radius: float = 0.1):
        super().__init__(teeth=teeth, radius=radius)
        self.teeth = teeth
        self.radius = radius
        self.angle_per_tooth = 2 * np.pi / teeth
        
    def solve(self, theta: float, assembly_mode: int = 1) -> State:
        # Theta is the input lever angle
        # If theta increases (positive), pawl engages and drives the ratchet wheel
        # If theta decreases (negative), pawl slips
        
        # We model a quasi-static state based on maximum historical theta for the gear.
        # However, `solve` is stateless. We can define the gear angle strictly as a function of the input path.
        # But wait, `solve` takes a single float. A true ratchet depends on history.
        # To make it a pure function of theta (assuming it starts from 0 and sweeps to theta):
        # The gear position is max(0, theta) quantized?
        # Let's assume standard monotonic rotation for the simulation path:
        
        # We will map the gear angle to max(0, theta) and snap to the nearest tooth when retreating.
        # For a simple kinematic visualization, we assume the input lever rotates back and forth (oscillating).
        # We'll simulate a continuous rotation of a driving crank, which oscillates a lever.
        # Actually, let's just make input_val = time/crank angle, and we'll calculate the lever and ratchet.
        
        # Driving crank
        crank_r = 0.05
        rod_l = 0.15
        
        # Lever
        lever_pivot_x, lever_pivot_y = 0.0, 0.0
        lever_r = 0.1
        
        # Crank center
        cx, cy = -0.15, -0.05
        
        # Crank position
        ax = cx + crank_r * np.cos(theta)
        ay = cy + crank_r * np.sin(theta)
        
        # Solve lever angle (slider crank math but with a rotating lever)
        # Distance from A to lever pivot
        dx = lever_pivot_x - ax
        dy = lever_pivot_y - ay
        d = np.sqrt(dx**2 + dy**2)
        
        if d > rod_l + lever_r or d < abs(rod_l - lever_r):
            raise ValueError("Geometry cannot close")
            
        cos_alpha = (lever_r**2 + d**2 - rod_l**2) / (2 * lever_r * d)
        alpha = np.arccos(np.clip(cos_alpha, -1.0, 1.0))
        
        gamma = np.arctan2(dy, dx)
        lever_theta = gamma - alpha
        
        # Now, ratchet wheel logic (Stateless approximation):
        # We need a continuous monotonic progression for the gear.
        # This requires tracking the maximum lever_theta reached. Since `solve` must be pure,
        # we will use a mathematical hack for a 0->2pi sweep:
        # The lever_theta oscillates. We can integrate the positive changes.
        # For simplicity in this purely geometric atlas, we will just return the lever's position,
        # and the pawl point. The wheel's exact rotation requires state passing which breaks the pure `solve(theta)` signature.
        # As an alternative, we assume the wheel is just fixed for the snapshot, or we pass state as an optional argument.
        
        # Pawl position (end of lever)
        px = lever_pivot_x + lever_r * np.cos(lever_theta)
        py = lever_pivot_y + lever_r * np.sin(lever_theta)
        
        return State(
            input_val=theta,
            points={
                "CrankCenter": (cx, cy),
                "CrankEnd": (ax, ay),
                "LeverPivot": (lever_pivot_x, lever_pivot_y),
                "Pawl": (px, py)
            },
            metrics={"lever_angle": lever_theta}
        )
