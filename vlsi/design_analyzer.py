import os
import glob
import re


def analyze_design(design_path=None):

    if design_path is None:
        design_path = os.path.dirname(os.path.abspath(__file__))

    design_path = os.path.abspath(design_path)
    verilog_files = glob.glob(os.path.join(design_path, "*.v"))

    if not verilog_files:
        return {"status": "error", "message": "No Verilog files found"}

    issues = []
    modules_found = []

    for vfile in verilog_files:
        with open(vfile, "r") as f:
            code = f.read()

        module_names = re.findall(r'\bmodule\s+(\w+)', code)
        modules_found.extend(module_names)

        for module in module_names:

            output_signals = re.findall(r'\boutput\s+(?:reg\s+)?(?:\[\d+:\d+\]\s+)?(\w+)', code)
            for sig in output_signals:
                assign_pattern = rf'assign\s+{sig}\s*='
                always_pattern = rf'always\s*@'
                if not re.search(assign_pattern, code) and not re.search(always_pattern, code):
                    issues.append(f"Signal '{sig}' in module '{module}' may be undriven.")

            if re.search(r'\balways\s*@', code) and not re.search(r'\breset\b|\brstn\b|\brst\b', code):
                issues.append(f"Module '{module}' has sequential logic but no reset signal detected.")

            outputs = re.findall(r'output\s+\[(\d+):(\d+)\]', code)
            inputs = re.findall(r'input\s+\[(\d+):(\d+)\]', code)
            for o_hi, o_lo in outputs:
                for i_hi, i_lo in inputs:
                    if int(o_hi) <= int(i_hi):
                        issues.append(
                            f"Module '{module}': output width [{o_hi}:{o_lo}] "
                            f"may be too narrow for input width [{i_hi}:{i_lo}] — overflow risk."
                        )

    if not issues:
        return {
            "status": "clean",
            "modules_found": modules_found,
            "message": "No issues detected."
        }

    return {
        "status": "warning",
        "modules_found": modules_found,
        "issues_detected": issues,
        "issue_count": len(issues)
    }