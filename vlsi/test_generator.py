import subprocess
import os
import glob


def run_test_suite(design_path=None):

    if design_path is None:
        design_path = os.path.dirname(os.path.abspath(__file__))

    design_path = os.path.abspath(design_path)

    if not os.path.exists(design_path):
        return {"error": f"Design folder not found: {design_path}"}

    verilog_files = glob.glob(os.path.join(design_path, "*.v"))

    if len(verilog_files) == 0:
        return {"error": "No Verilog (.v) files found in design folder"}

    compile_cmd = ["iverilog", "-o", os.path.join(design_path, "design.out")] + verilog_files

    compile_result = subprocess.run(
        compile_cmd,
        cwd=design_path,
        capture_output=True,
        text=True
    )

    if compile_result.returncode != 0:
        return {
            "error": "Compilation failed",
            "details": compile_result.stderr
        }

    run_cmd = ["vvp", os.path.join(design_path, "design.out")]

    result = subprocess.run(
        run_cmd,
        cwd=design_path,
        capture_output=True,
        text=True
    )

    output = result.stdout
    passed = output.count("PASS")
    failed = output.count("FAIL")

    return {
        "design": os.path.basename(design_path),
        "files_compiled": [os.path.basename(f) for f in verilog_files],
        "output": output.strip(),
        "passed": passed,
        "failed": failed,
        "total_tests": passed + failed
    }