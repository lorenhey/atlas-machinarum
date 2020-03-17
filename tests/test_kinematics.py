import pytest
import numpy as np
from atlas_machinarum.library import SliderCrank, FourBar, ScotchYoke

def test_slider_crank_dead_centers():
    sc = SliderCrank(crank=1.0, rod=3.0, offset=0.0)
    
    # At theta = 0, slider should be at R + L = 4.0
    state1 = sc.solve(0.0)
    assert np.isclose(state1.points["B"][0], 4.0)
    assert np.isclose(state1.points["B"][1], 0.0)
    assert np.isclose(state1.velocities["B"][0], 0.0)
    
    # At theta = pi, slider should be at -(R) + L? No, wait.
    # Ax = -1, B is at distance 3 from A. Bx - (-1) = 3 => Bx = 2
    state2 = sc.solve(np.pi)
    assert np.isclose(state2.points["B"][0], 2.0)
    assert np.isclose(state2.points["B"][1], 0.0)
    assert np.isclose(state2.velocities["B"][0], 0.0)

def test_four_bar_grashof():
    # Crank rocker
    fb1 = FourBar(ground=4, crank=1, coupler=3, rocker=3)
    assert fb1.grashof_condition() == "CRANK_ROCKER"
    
    # Double rocker (Grashof type where coupler is shortest)
    fb2 = FourBar(ground=3, crank=3, coupler=1, rocker=4)
    assert fb2.grashof_condition() == "DOUBLE_ROCKER"
    
    # Non-Grashof
    fb3 = FourBar(ground=4, crank=2, coupler=2, rocker=3)
    assert fb3.grashof_condition() == "NON_GRASHOF (DOUBLE_ROCKER)"

def test_four_bar_closure():
    fb = FourBar(ground=2.0, crank=1.0, coupler=2.0, rocker=2.0)
    state = fb.solve(np.pi/4)
    
    A = np.array(state.points["A"])
    B = np.array(state.points["B"])
    O4 = np.array(state.points["O4"])
    
    # Check lengths
    assert np.isclose(np.linalg.norm(A), 1.0)
    assert np.isclose(np.linalg.norm(B - A), 2.0)
    assert np.isclose(np.linalg.norm(B - O4), 2.0)

def test_scotch_yoke_harmonic():
    sy = ScotchYoke(crank=2.0)
    state = sy.solve(np.pi/6) # 30 deg
    
    # disp = R cos(theta)
    assert np.isclose(state.metrics["displacement"], 2.0 * np.sqrt(3)/2)
    # vel = -R sin(theta)
    assert np.isclose(state.metrics["velocity"], -2.0 * 0.5)
