import requests
import json

API_URL = "http://127.0.0.1:8000/run_vlsi"


def analyze_hardware():

    response = requests.get(API_URL)

    data = response.json()

    total = data["total_tests"]
    passed = data["passed"]
    failed = data["failed"]

    if failed == 0:

        explanation = f"""
Hardware Verification Report

Total tests executed: {total}
Passed tests: {passed}
Failed tests: {failed}

The ALU design passed all test cases successfully.
The addition logic is working correctly.
No functional bugs were detected.
"""

    else:

        explanation = f"""
Hardware Verification Report

Total tests executed: {total}
Passed tests: {passed}
Failed tests: {failed}

Some test cases failed.
This indicates a possible logic bug in the ALU implementation.
Further debugging of the Verilog design is recommended.
"""

    return explanation


if __name__ == "__main__":

    report = analyze_hardware()

    print(report)