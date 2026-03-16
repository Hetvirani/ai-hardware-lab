import re
from run_simulation import run_verilog

def verify_alu():

    output = run_verilog()

    match = re.search(r'\d+', output)

    if match:
        actual = int(match.group())
    else:
        actual = None

    expected = 7

    if actual == expected:
        status = "PASS"
        message = "ALU addition working correctly"
    else:
        status = "FAIL"
        message = "Possible logic error detected"

    return {
        "expected": expected,
        "actual": actual,
        "status": status,
        "message": message
    }