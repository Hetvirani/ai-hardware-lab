import sys
import os

vlsi_path    = os.path.abspath(os.path.join(os.path.dirname(__file__), "../vlsi"))
designs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../designs"))
agent_path   = os.path.abspath(os.path.join(os.path.dirname(__file__), "../ai_agent"))

sys.path.insert(0, vlsi_path)
sys.path.insert(0, agent_path)

from test_generator import run_test_suite
from waveform_analyzer import analyze_waveform
from design_analyzer import analyze_design
from tb_generator import generate_testbench_for_design


def run_vlsi_simulation(design_name=None):
    path = os.path.join(designs_path, design_name) if design_name else vlsi_path
    return run_test_suite(path)


def analyze_vlsi_waveform(design_name=None):
    path = os.path.join(designs_path, design_name) if design_name else vlsi_path
    return analyze_waveform(path)


def analyze_vlsi_design(design_name=None):
    path = os.path.join(designs_path, design_name) if design_name else vlsi_path
    return analyze_design(path)


def generate_tb(design_name):
    path = os.path.join(designs_path, design_name)
    return generate_testbench_for_design(path)