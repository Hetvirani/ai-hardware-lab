# AI-Driven Autonomous Hardware Verification and Embedded Simulation Platform using MCP

> Automated VLSI verification and ESP32 embedded simulation platform powered by AI and Model Context Protocol architecture.

---

## What This Project Does

Traditional hardware verification requires engineers to manually write test cases, run simulations, inspect waveforms, and generate reports — all using separate tools. This platform automates the entire workflow.

Drop any Verilog design file into the system. The platform automatically:
- Generates a testbench using AI
- Compiles and runs simulation using Icarus Verilog
- Analyzes the output waveform
- Detects potential design issues
- Returns a structured verification report via REST API
- Uses Claude AI to explain results in plain English

The same platform also runs a virtual ESP32 simulator for embedded system verification.

---

## Live Demo
```
# Start everything with one command
start.bat
```

Open `http://localhost:3000` to see the dashboard.

---

## Project Architecture
```
User / Dashboard
       │
       ▼
   MCP Server (FastAPI)
       │
   ┌───┴───────────────┐
   │                   │
   ▼                   ▼
VLSI Engine        ESP32 Simulator
   │                   │
   ├── Simulation       ├── GPIO Control
   ├── TB Generator     ├── Sensor Reading
   ├── Waveform         ├── PWM Control
   └── Design Analysis  └── UART Comm
```

---

## Features

### VLSI Verification
- Automatic testbench generation from any Verilog module
- Simulation using Icarus Verilog (industry standard)
- Waveform signal analysis from VCD files
- Static design analysis — detects overflow risks, missing resets, undriven signals
- Generic engine works with any `.v` file
- Claude AI explains verification results

### ESP32 Embedded Simulation
- Virtual ESP32 hardware simulation
- GPIO control with LED blink cycles
- Temperature and voltage sensor simulation
- PWM motor and LED control
- UART serial communication with loopback testing

### Web Dashboard
- Two-tab interface — VLSI and Embedded
- Live pass/fail results with progress bars
- Signal tag display from waveform analysis
- Design warning alerts
- AI Report button — Claude analyzes your design
- AI Gen TB button — Claude writes a testbench for any design

---

## Tech Stack

| Layer | Technology |
|---|---|
| Simulation | Icarus Verilog, VVP |
| Backend | Python, FastAPI |
| AI Integration | Claude via Puter.js (no API key needed) |
| Protocol | MCP — Model Context Protocol |
| Frontend | HTML, CSS, JavaScript |
| Embedded | Python virtual ESP32 simulator |

---

## Project Structure
```
ai-hardware-lab/
│
├── mcp_server/
│   ├── server.py          # FastAPI server — all endpoints
│   └── tools.py           # MCP tool functions
│
├── vlsi/
│   ├── alu.v              # ALU design
│   ├── testbench.v        # ALU testbench
│   ├── test_generator.py  # Simulation engine
│   ├── waveform_analyzer.py
│   └── design_analyzer.py
│
├── designs/
│   ├── example_cpu/       # CPU design — 14 test cases
│   └── uart_tx/           # UART transmitter
│
├── embedded/
│   ├── esp32_simulator.py # Virtual ESP32 hardware
│   └── esp32_programs.py  # GPIO, sensor, PWM, UART programs
│
├── ai_agent/
│   ├── agent.py           # Verification report agent
│   └── tb_generator.py    # AI testbench generator
│
├── frontend/
│   ├── index.html         # Dashboard
│   ├── css/style.css
│   ├── js/app.js          # VLSI tab logic
│   ├── js/esp32.js        # ESP32 tab logic
│   └── serve.py           # Local frontend server
│
├── start.bat              # One-click startup
└── README.md
```

---

## How to Run

### Requirements
- Python 3.10+
- Icarus Verilog — https://bleyer.org/icarus/
- Git

### Setup
```bash
# Clone the repo
git clone https://github.com/Hetvirani/ai-hardware-lab.git
cd ai-hardware-lab

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install fastapi uvicorn pydantic flask

# Start everything
start.bat                    # Windows
```

## Screenshots

### VLSI Verification Dashboard
![VLSI Dashboard](screenshots/vlsi-dashboard.png)

### Simulation Output with AI Analysis
![VLSI Output](screenshots/vlsi-output.png)

### ESP32 Embedded Simulation
![ESP32 Dashboard](screenshots/esp32-dashboard.png)

### REST API Endpoints
![API Docs](screenshots/api-docs.png)


### Manual start (two terminals)

**Terminal 1 — API Server**
```bash
cd mcp_server
uvicorn server:app --reload
```

**Terminal 2 — Dashboard**
```bash
cd frontend
python serve.py
```

Open `http://localhost:3000`

---

## How to Verify Any Design

1. Create a folder inside `designs/` with your design name
2. Drop your `.v` file inside
3. Open dashboard, type your design name, click **Generate TB**
4. Click **Run Report**
5. Click **AI Report** for Claude's analysis

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /full_report/{design}` | Complete verification report |
| `GET /run_vlsi/{design}` | Run simulation only |
| `GET /analyze_waveform/{design}` | Waveform signal analysis |
| `GET /analyze_design/{design}` | Static code analysis |
| `GET /generate_testbench/{design}` | Auto-generate testbench |
| `POST /save_testbench/{design}` | Save AI-generated testbench |
| `GET /esp32/full` | Run all ESP32 programs |
| `GET /esp32/gpio` | GPIO simulation |
| `GET /esp32/sensor` | Sensor reading simulation |
| `GET /esp32/pwm` | PWM control simulation |
| `GET /esp32/uart` | UART communication simulation |

---

## Verified Designs

| Design | Tests | Result |
|---|---|---|
| ALU (4-bit adder) | 64 | ✅ All pass |
| CPU (single-cycle) | 14 | ✅ All pass |
| UART Transmitter | 4 | ✅ All pass |
| ESP32 GPIO | 5 cycles | ✅ Pass |
| ESP32 Sensors | 8 samples | ✅ Pass |
| ESP32 PWM | 9 steps | ✅ Pass |
| ESP32 UART | 8 messages | ✅ Pass |

---

## Why This Project

This platform was built to demonstrate how AI can automate the hardware verification workflow — a critical and time-consuming process in chip design. Companies like NVIDIA, Intel, and Synopsys invest heavily in verification automation. This project implements a simplified but functional version of that pipeline.

The project combines five areas rarely seen together in student work:
- AI agents and LLM integration
- VLSI digital circuit verification
- Embedded systems simulation
- Modern API architecture (MCP)
- Automated software engineering

---

## Author

Het Virani

---

## License

MIT License