from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import sys

# ── Path setup ────────────────────────────────────────────
embedded_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../embedded"))
sys.path.insert(0, embedded_path)

from esp32_programs import (
    run_gpio_led_blink,
    run_sensor_reading,
    run_pwm_control,
    run_uart_communication,
    run_full_esp32_demo
)
from project_runner import list_projects, run_project, run_all_projects
from tools import (
    run_vlsi_simulation,
    analyze_vlsi_waveform,
    analyze_vlsi_design,
    generate_tb
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TestbenchPayload(BaseModel):
    filename: str
    code: str


# ── VLSI endpoints ────────────────────────────────────────
@app.get("/run_vlsi")
def run_vlsi_default():
    return run_vlsi_simulation()

@app.get("/run_vlsi/{design_name}")
def run_vlsi(design_name: str):
    return run_vlsi_simulation(design_name)

@app.get("/analyze_waveform")
def analyze_wave_default():
    return analyze_vlsi_waveform()

@app.get("/analyze_waveform/{design_name}")
def analyze_wave(design_name: str):
    return analyze_vlsi_waveform(design_name)

@app.get("/analyze_design")
def analyze_design_default():
    return analyze_vlsi_design()

@app.get("/analyze_design/{design_name}")
def analyze_design_route(design_name: str):
    return analyze_vlsi_design(design_name)

@app.get("/generate_testbench/{design_name}")
def gen_tb(design_name: str):
    return generate_tb(design_name)

@app.get("/full_report/{design_name}")
def full_report(design_name: str):
    return {
        "design":          design_name,
        "verification":    run_vlsi_simulation(design_name),
        "waveform":        analyze_vlsi_waveform(design_name),
        "design_analysis": analyze_vlsi_design(design_name)
    }

@app.get("/full_report")
def full_report_default():
    return {
        "design":          "default (vlsi folder)",
        "verification":    run_vlsi_simulation(),
        "waveform":        analyze_vlsi_waveform(),
        "design_analysis": analyze_vlsi_design()
    }

@app.post("/save_testbench/{design_name}")
def save_testbench(design_name: str, payload: TestbenchPayload):
    designs_root = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../designs")
    )
    design_path = os.path.join(designs_root, design_name)
    if not os.path.exists(design_path):
        return {"error": f"Design folder not found: {design_path}"}
    save_path = os.path.join(design_path, payload.filename)
    with open(save_path, "w") as f:
        f.write(payload.code)
    return {
        "status":   "success",
        "filename": payload.filename,
        "path":     save_path
    }


# ── ESP32 fixed programs ──────────────────────────────────
@app.get("/esp32/gpio")
def esp32_gpio():
    return run_gpio_led_blink()

@app.get("/esp32/sensor")
def esp32_sensor():
    return run_sensor_reading()

@app.get("/esp32/pwm")
def esp32_pwm():
    return run_pwm_control()

@app.get("/esp32/uart")
def esp32_uart():
    return run_uart_communication()

@app.get("/esp32/full")
def esp32_full():
    return run_full_esp32_demo()


# ── Generic embedded project endpoints ───────────────────
@app.get("/embedded/projects")
def get_projects():
    return {"projects": list_projects()}

@app.get("/embedded/run/{project_name}")
def run_embedded_project(project_name: str):
    return run_project(project_name)

@app.get("/embedded/run_all")
def run_all_embedded():
    return run_all_projects()

# ── File upload endpoints ─────────────────────────────────
@app.post("/upload/vlsi")
async def upload_vlsi(
    file: UploadFile = File(...),
    design_name: str = Form(...)
):
    designs_root = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../designs")
    )
    design_path = os.path.join(designs_root, design_name)
    os.makedirs(design_path, exist_ok=True)

    file_path = os.path.join(design_path, file.filename)
    content   = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "status":      "success",
        "design_name": design_name,
        "filename":    file.filename,
        "path":        file_path,
        "size_bytes":  len(content)
    }


@app.post("/upload/embedded")
async def upload_embedded(
    file: UploadFile = File(...)
):
    projects_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../embedded/projects")
    )
    os.makedirs(projects_path, exist_ok=True)

    file_path = os.path.join(projects_path, file.filename)
    content   = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "status":   "success",
        "filename": file.filename,
        "path":     file_path,
        "size_bytes": len(content)
    }