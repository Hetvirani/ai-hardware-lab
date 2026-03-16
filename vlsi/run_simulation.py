import subprocess
import os

def run_verilog():

    # Get the directory where this script is located
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # Compile the Verilog files
    compile_cmd = [
        "iverilog",
        "-o",
        "alu.out",
        "alu.v",
        "testbench.v"
    ]

    subprocess.run(compile_cmd, cwd=current_dir)

    # Run the simulation
    run_cmd = ["vvp", "alu.out"]

    result = subprocess.run(
        run_cmd,
        cwd=current_dir,
        capture_output=True,
        text=True
    )

    return result.stdout