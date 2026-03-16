import os
import sys
import glob
import importlib.util

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from esp32_simulator import ESP32Simulator


def list_projects():
    projects_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "projects"
    )
    files = glob.glob(os.path.join(projects_dir, "*.py"))
    projects = []
    for f in files:
        name = os.path.basename(f).replace(".py", "")
        # Read the docstring for description
        desc = ""
        with open(f, "r") as fp:
            content = fp.read()
            if '"""' in content:
                start = content.index('"""') + 3
                end   = content.index('"""', start)
                desc  = content[start:end].strip()
        projects.append({
            "name":        name,
            "file":        os.path.basename(f),
            "description": desc
        })
    return projects


def run_project(project_name):
    projects_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "projects"
    )
    project_file = os.path.join(projects_dir, f"{project_name}.py")

    if not os.path.exists(project_file):
        return {
            "error": f"Project '{project_name}' not found",
            "available": [p["name"] for p in list_projects()]
        }

    # Dynamically load and run the project
    spec   = importlib.util.spec_from_file_location(project_name, project_file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    if not hasattr(module, "run"):
        return {"error": f"Project '{project_name}' has no run() function"}

    esp    = ESP32Simulator()
    result = module.run(esp)

    # Always attach the full simulation log
    result["log"]         = esp.simulation_log
    result["platform"]    = "ESP32 (Virtual)"
    result["total_time_ms"] = esp.time_ms

    return result


def run_all_projects():
    projects = list_projects()
    results  = {}
    passed   = 0
    failed   = 0

    for p in projects:
        name          = p["name"]
        result        = run_project(name)
        results[name] = result
        if result.get("status") == "PASS":
            passed += 1
        else:
            failed += 1

    return {
        "platform":     "ESP32 (Virtual)",
        "total_pass":   passed,
        "total_fail":   failed,
        "total_projects": len(projects),
        "summary":      f"{passed}/{len(projects)} projects passed",
        "projects":     results
    }