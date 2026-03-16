import os


def analyze_waveform(design_path=None):

    if design_path is None:
        design_path = os.path.dirname(os.path.abspath(__file__))

    design_path = os.path.abspath(design_path)
    vcd_file = os.path.join(design_path, "waveform.vcd")

    if not os.path.exists(vcd_file):
        return {
            "status": "error",
            "message": "waveform.vcd not found. Run simulation first."
        }

    signals = set()
    transitions = 0

    with open(vcd_file, "r") as f:
        for line in f:
            if "$var" in line:
                parts = line.split()
                if len(parts) >= 5:
                    signals.add(parts[4])
            if line.startswith("#") or line.startswith("b") or (line.strip() in ("0", "1", "x", "z")):
                transitions += 1

    return {
        "status": "success",
        "design": os.path.basename(design_path),
        "signals_detected": sorted(list(signals)),
        "signal_count": len(signals),
        "transitions_recorded": transitions
    }