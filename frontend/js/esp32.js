const ESP32_API = "http://127.0.0.1:8000";

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  event.target.classList.add("active");
}

function setESP32Badge(id, status) {
  const badge = document.getElementById(`esp32-badge-${id}`);
  if (!badge) return;
  if (status === "PASS") {
    badge.className   = "badge badge-green";
    badge.textContent = "PASS";
  } else if (status === "FAIL") {
    badge.className   = "badge badge-red";
    badge.textContent = "FAIL";
  } else if (status === "running") {
    badge.className = "badge badge-purple";
    badge.innerHTML = `<span class="spinner"></span>Running`;
  } else {
    badge.className   = "badge badge-gray";
    badge.textContent = "Idle";
  }
}

function showESP32Output(id, log) {
  const panel = document.getElementById(`esp32-out-${id}`);
  if (!panel) return;
  panel.innerHTML = "";
  panel.classList.add("visible");
  (log || []).slice(-12).forEach(line => {
    const div       = document.createElement("div");
    div.className   = line.includes("PASS") ? "out-pass"
                    : line.includes("FAIL") ? "out-fail"
                    : "out-plain";
    div.textContent = line;
    panel.appendChild(div);
  });
  panel.scrollTop = panel.scrollHeight;
}

// ── GPIO ────────────────────────────────────────────────
async function runESP32GPIO() {
  setESP32Badge("gpio", "running");
  try {
    const res  = await fetch(`${ESP32_API}/esp32/gpio`);
    const data = await res.json();

    setESP32Badge("gpio", data.status);

    // Animate LED cycles
    const bar = document.getElementById("cycle-bar");
    bar.innerHTML = "";
    data.results.forEach(r => {
      const block       = document.createElement("div");
      block.className   = `cycle-block ${r.state === "ON" ? "on" : "off"}`;
      block.title       = `Cycle ${r.cycle}: ${r.state} @ ${r.time_ms}ms`;
      bar.appendChild(block);
    });

    // Flash GPIO2 light to last state
    const lastState = data.results[data.results.length - 1]?.state;
    const light     = document.getElementById("pin-light-2");
    if (light) {
      light.className = `pin-light ${lastState === "ON" ? "on" : "off"}`;
    }

    showESP32Output("gpio", data.log);
  } catch(e) {
    setESP32Badge("gpio", "FAIL");
  }
}

// ── Sensor ──────────────────────────────────────────────
async function runESP32Sensor() {
  setESP32Badge("sensor", "running");
  try {
    const res  = await fetch(`${ESP32_API}/esp32/sensor`);
    const data = await res.json();

    setESP32Badge("sensor", data.status);

    const last = data.readings[data.readings.length - 1];
    document.getElementById("sensor-temp").textContent = last.temperature + "°C";
    document.getElementById("sensor-volt").textContent = last.voltage + "V";
    document.getElementById("sensor-avg").textContent  = data.stats.avg_temp + "°C";

    // Draw temperature bar chart
    const chart  = document.getElementById("temp-chart");
    chart.innerHTML = "";
    const temps  = data.readings.map(r => r.temperature);
    const minT   = Math.min(...temps);
    const maxT   = Math.max(...temps);
    const range  = maxT - minT || 1;

    temps.forEach(t => {
      const bar       = document.createElement("div");
      bar.className   = "temp-bar";
      const heightPct = 20 + ((t - minT) / range) * 80;
      bar.style.height = heightPct + "%";
      bar.title        = t + "°C";
      chart.appendChild(bar);
    });

    showESP32Output("sensor", data.log);
  } catch(e) {
    setESP32Badge("sensor", "FAIL");
  }
}

// ── PWM ─────────────────────────────────────────────────
async function runESP32PWM() {
  setESP32Badge("pwm", "running");
  try {
    const res  = await fetch(`${ESP32_API}/esp32/pwm`);
    const data = await res.json();

    setESP32Badge("pwm", data.status);

    // Animate PWM bars through each step
    let i = 0;
    const steps    = data.steps;
    const interval = setInterval(() => {
      if (i >= steps.length) { clearInterval(interval); return; }
      const step = steps[i];
      const pct  = step.duty_percent;

      const motorBar = document.getElementById("pwm-motor");
      const ledBar   = document.getElementById("pwm-led");
      const motorPct = document.getElementById("pwm-motor-pct");
      const ledPct   = document.getElementById("pwm-led-pct");

      if (motorBar) motorBar.style.width = pct + "%";
      if (ledBar)   ledBar.style.width   = pct + "%";
      if (motorPct) motorPct.textContent  = pct + "%";
      if (ledPct)   ledPct.textContent    = pct + "%";

      i++;
    }, 300);

    showESP32Output("pwm", data.log);
  } catch(e) {
    setESP32Badge("pwm", "FAIL");
  }
}

// ── UART ────────────────────────────────────────────────
async function runESP32UART() {
  setESP32Badge("uart", "running");
  try {
    const res  = await fetch(`${ESP32_API}/esp32/uart`);
    const data = await res.json();

    setESP32Badge("uart", data.status);

    document.getElementById("uart-sent").textContent = data.messages_sent;
    document.getElementById("uart-recv").textContent = data.messages_received;

    // Fill UART monitor
    const monitor   = document.getElementById("uart-monitor");
    monitor.innerHTML = "";
    data.sent.forEach(msg => {
      const line       = document.createElement("div");
      line.textContent = `TX → ${msg.message}`;
      monitor.appendChild(line);
    });
    data.received.forEach(msg => {
      const line       = document.createElement("div");
      line.style.color = "#818cf8";
      line.textContent = `RX ← ${msg.message}`;
      monitor.appendChild(line);
    });
    monitor.scrollTop = monitor.scrollHeight;

    showESP32Output("uart", data.log);
  } catch(e) {
    setESP32Badge("uart", "FAIL");
  }
}

// ── Full run ─────────────────────────────────────────────
async function runESP32Full() {
  try {
    const res  = await fetch(`${ESP32_API}/esp32/full`);
    const data = await res.json();

    // Update top counters
    const passEl = document.querySelector("#esp32-pass-count .esp32-val");
    const failEl = document.querySelector("#esp32-fail-count .esp32-val");
    if (passEl) passEl.textContent = data.total_pass;
    if (failEl) failEl.textContent = data.total_fail;

    // Render each program
    renderGPIOResult(data.programs.gpio);
    renderSensorResult(data.programs.sensor);
    renderPWMResult(data.programs.pwm);
    renderUARTResult(data.programs.uart);

  } catch(e) {
    console.error("ESP32 full run failed:", e);
  }
}

function renderGPIOResult(data) {
  setESP32Badge("gpio", data.status);
  const bar = document.getElementById("cycle-bar");
  if (!bar) return;
  bar.innerHTML = "";
  data.results.forEach(r => {
    const block     = document.createElement("div");
    block.className = `cycle-block ${r.state === "ON" ? "on" : "off"}`;
    block.title     = `Cycle ${r.cycle}: ${r.state}`;
    bar.appendChild(block);
  });
  showESP32Output("gpio", data.log);
}

function renderSensorResult(data) {
  setESP32Badge("sensor", data.status);
  const last = data.readings[data.readings.length - 1];
  document.getElementById("sensor-temp").textContent = last.temperature + "°C";
  document.getElementById("sensor-volt").textContent = last.voltage + "V";
  document.getElementById("sensor-avg").textContent  = data.stats.avg_temp + "°C";

  const chart = document.getElementById("temp-chart");
  if (!chart) return;
  chart.innerHTML = "";
  const temps  = data.readings.map(r => r.temperature);
  const minT   = Math.min(...temps);
  const maxT   = Math.max(...temps);
  const range  = maxT - minT || 1;
  temps.forEach(t => {
    const bar       = document.createElement("div");
    bar.className   = "temp-bar";
    bar.style.height = (20 + ((t - minT) / range) * 80) + "%";
    bar.title        = t + "°C";
    chart.appendChild(bar);
  });
  showESP32Output("sensor", data.log);
}

function renderPWMResult(data) {
  setESP32Badge("pwm", data.status);
  const last = data.steps[data.steps.length - 1];
  const motorBar = document.getElementById("pwm-motor");
  const ledBar   = document.getElementById("pwm-led");
  if (motorBar) motorBar.style.width = last.duty_percent + "%";
  if (ledBar)   ledBar.style.width   = last.duty_percent + "%";
  document.getElementById("pwm-motor-pct").textContent = last.duty_percent + "%";
  document.getElementById("pwm-led-pct").textContent   = last.duty_percent + "%";
  showESP32Output("pwm", data.log);
}

function renderUARTResult(data) {
  setESP32Badge("uart", data.status);
  document.getElementById("uart-sent").textContent = data.messages_sent;
  document.getElementById("uart-recv").textContent = data.messages_received;

  const monitor = document.getElementById("uart-monitor");
  if (!monitor) return;
  monitor.innerHTML = "";
  data.sent.forEach(msg => {
    const line       = document.createElement("div");
    line.textContent = `TX → ${msg.message}`;
    monitor.appendChild(line);
  });
  data.received.forEach(msg => {
    const line       = document.createElement("div");
    line.style.color = "#818cf8";
    line.textContent = `RX ← ${msg.message}`;
    monitor.appendChild(line);
  });
  monitor.scrollTop = monitor.scrollHeight;
  showESP32Output("uart", data.log);
}

function resetESP32() {
  ["gpio", "sensor", "pwm", "uart"].forEach(id => {
    setESP32Badge(id, "idle");
    const panel = document.getElementById(`esp32-out-${id}`);
    if (panel) { panel.innerHTML = ""; panel.classList.remove("visible"); }
  });

  const light = document.getElementById("pin-light-2");
  if (light) light.className = "pin-light off";

  const bar = document.getElementById("cycle-bar");
  if (bar) bar.innerHTML = "";

  const chart = document.getElementById("temp-chart");
  if (chart) chart.innerHTML = "";

  const monitor = document.getElementById("uart-monitor");
  if (monitor) monitor.innerHTML = "";

  ["pwm-motor", "pwm-led"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.width = "0%";
  });

  ["sensor-temp", "sensor-volt", "sensor-avg"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "—";
  });

  const passEl = document.querySelector("#esp32-pass-count .esp32-val");
  const failEl = document.querySelector("#esp32-fail-count .esp32-val");
  if (passEl) passEl.textContent = "—";
  if (failEl) failEl.textContent = "—";
}

// Auto-run on ESP32 tab load
window.addEventListener("load", () => {
  runESP32Full();
});