import numpy as np
from ..core.mechanism import Mechanism, State

class CamFollower(Mechanism):
    """
    Radial cam with a translating roller follower.
    Harmonic lift profile.
    """
    def __init__(self, base_radius: float = 0.1, lift: float = 0.05, roller_radius: float = 0.02):
        super().__init__(base_radius=base_radius, lift=lift, roller_radius=roller_radius)
        self.base_radius = base_radius
        self.lift = lift
        self.roller_radius = roller_radius
        
    def solve(self, theta: float, assembly_mode: int = 1) -> State:
        # Theta is the cam rotation angle.
        # We will keep the cam fixed and rotate the follower backwards for the kinematic calculation,
        # then rotate everything to simulate cam rotating.
        
        # Lift profile: Simple Harmonic Motion
        # Rise 0 to pi, Fall pi to 2pi
        theta_mod = theta % (2 * np.pi)
        
        if theta_mod <= np.pi:
            # Rise
            h = (self.lift / 2) * (1 - np.cos(theta_mod))
        else:
            # Fall
            h = (self.lift / 2) * (1 + np.cos(theta_mod - np.pi))
            
        # The follower moves vertically
        # Total distance from cam center to roller center
        r = self.base_radius + self.roller_radius + h
        
        # The cam rotates, so if we draw it, the contact point rotates on the cam surface.
        # But to draw the mechanism, we keep the cam centered at origin,
        # and the follower moves only in the Y axis.
        Ox, Oy = 0.0, 0.0
        
        Fx, Fy = 0.0, r
        
        # We can also compute the cam profile to draw it.
        # To draw the cam profile rotating, we just sample it and rotate it.
        # In a real app we'd pass the profile as points. For the state, we pass the follower position.
        
        # Profile generation at this angle: 
        # Cam surface at top (y-axis)
        Cx, Cy = 0.0, r - self.roller_radius
        
        # Rotate the points to simulate cam rotating counter-clockwise
        # Actually, the cam rotates, the follower stays on the Y axis.
        
        return State(
            input_val=theta,
            points={
                "CamCenter": (Ox, Oy),
                "RollerCenter": (Fx, Fy),
                "ContactPoint": (Cx, Cy)
            },
            metrics={"lift": h}
        )
