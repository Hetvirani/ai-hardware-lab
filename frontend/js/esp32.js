const ESP32_API = "http://127.0.0.1:8000";

let loadedProjects = [];

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  event.target.classList.add("active");
}

// ── Load all projects dynamically ────────────────────────
async function loadEmbeddedProjects() {
  try {
    const res  = await fetch(`${ESP32_API}/embedded/projects`);
    const data = await res.json();
    loadedProjects = data.projects || [];
    renderProjectCards(loadedProjects);
  } catch(e) {
    document.getElementById("esp32-grid").innerHTML =
      `<div class="empty-state"><div class="icon">⚠️</div><p>Cannot reach API</p></div>`;
  }
}

function renderProjectCards(projects) {
  const grid = document.getElementById("esp32-grid");
  grid.innerHTML = "";

  projects.forEach(p => {
    const descLines = p.description.split("\n").filter(l => l.trim());
    const title     = descLines.find(l => l.startsWith("Project:"))?.replace("Project:", "").trim() || p.name;
    const desc      = descLines.find(l => l.startsWith("Description:"))?.replace("Description:", "").trim() || "";

    const card = document.createElement("div");
    card.className = "esp32-card";
    card.id        = `proj-card-${p.name}`;
    card.innerHTML = `
      <div class="esp32-card-header">
        <div class="esp32-card-title">
          <span>${getProjectIcon(p.name)}</span>
          <span>${title}</span>
        </div>
        <span class="badge badge-gray" id="proj-badge-${p.name}">Idle</span>
      </div>

      <div class="proj-desc" id="proj-desc-${p.name}">${desc}</div>

      <div class="proj-stats" id="proj-stats-${p.name}" style="display:none">
        <div class="proj-stat-row">
          <span class="proj-stat-label">Status</span>
          <span class="proj-stat-val" id="proj-status-${p.name}">—</span>
        </div>
        <div class="proj-stat-row">
          <span class="proj-stat-label">Runtime</span>
          <span class="proj-stat-val" id="proj-time-${p.name}">—</span>
        </div>
        <div class="proj-stat-row">
          <span class="proj-stat-label">Platform</span>
          <span class="proj-stat-val">ESP32 Virtual</span>
        </div>
      </div>

      <div class="uart-monitor" id="proj-uart-${p.name}" style="margin-bottom:12px;display:none"></div>

      <div class="card-actions">
        <button class="btn btn-primary btn-sm"   onclick="runSingleProject('${p.name}')">▶ Run</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleLog('${p.name}')">📋 Log</button>
      </div>

      <div class="output-panel" id="proj-out-${p.name}"></div>
    `;
    grid.appendChild(card);
  });
}

function getProjectIcon(name) {
  const icons = {
    blink_led:           "💡",
    temperature_monitor: "🌡",
    motor_control:       "⚙",
    smart_sensor:        "📡",
  };
  return icons[name] || "📦";
}

// ── Run single project ────────────────────────────────────
async function runSingleProject(name) {
  setProjBadge(name, "running");

  try {
    const res  = await fetch(`${ESP32_API}/embedded/run/${name}`);
    const data = await res.json();
    renderProjectResult(name, data);
  } catch(e) {
    setProjBadge(name, "FAIL");
    showProjOutput(name, ["Error: Cannot reach API"]);
  }
}

function renderProjectResult(name, data) {
  const status = data.status || "FAIL";
  setProjBadge(name, status);

  // Show stats panel
  const statsEl = document.getElementById(`proj-stats-${name}`);
  if (statsEl) statsEl.style.display = "block";

  const statusEl = document.getElementById(`proj-status-${name}`);
  if (statusEl) {
    statusEl.textContent = status;
    statusEl.style.color = status === "PASS" ? "#16a34a" : "#dc2626";
  }

  const timeEl = document.getElementById(`proj-time-${name}`);
  if (timeEl) timeEl.textContent = `${data.total_time_ms || 0}ms simulated`;

  // Show UART monitor with last 6 log entries
  const uartEl = document.getElementById(`proj-uart-${name}`);
  if (uartEl && data.log) {
    uartEl.style.display = "block";
    uartEl.innerHTML = "";

    // Show key log lines — filter to Serial.println only
    const serialLines = data.log
      .filter(l => l.includes("Serial.println"))
      .map(l => {
        const match = l.match(/Serial\.println → (.+)/);
        return match ? match[1] : l;
      })
      .slice(-8);

    serialLines.forEach(line => {
      const div       = document.createElement("div");
      div.style.color = line.includes("ALERT") ? "#dc2626"
                      : line.includes("PASS")  ? "#16a34a"
                      : "#16a34a";
      div.textContent = `> ${line}`;
      uartEl.appendChild(div);
    });
  }

  // Render specific visualizations per project type
  renderProjectVisualization(name, data);
}

function renderProjectVisualization(name, data) {
  if (name === "blink_led" && data.results) {
    renderBlinkViz(name, data);
  } else if (name === "temperature_monitor" && data.readings) {
    renderTempViz(name, data);
  } else if (name === "motor_control" && data.results) {
    renderMotorViz(name, data);
  } else if (name === "smart_sensor" && data.data) {
    renderSmartSensorViz(name, data);
  }
}

function renderBlinkViz(name, data) {
  const card  = document.getElementById(`proj-card-${name}`);
  let vizDiv  = document.getElementById(`viz-${name}`);
  if (!vizDiv) {
    vizDiv    = document.createElement("div");
    vizDiv.id = `viz-${name}`;
    vizDiv.style.cssText = "margin-bottom:12px;";
    card.querySelector(".card-actions").before(vizDiv);
  }

  const blocks = data.results.map(r =>
    `<div class="cycle-block ${r.state === 'ON' ? 'on' : 'off'}"
          title="Cycle ${r.cycle}: ${r.state} @ ${r.time_ms}ms"></div>`
  ).join("");

  vizDiv.innerHTML = `
    <div class="section-label">GPIO2 LED cycles</div>
    <div class="cycle-bar">${blocks}</div>
  `;
}

function renderTempViz(name, data) {
  const card  = document.getElementById(`proj-card-${name}`);
  let vizDiv  = document.getElementById(`viz-${name}`);
  if (!vizDiv) {
    vizDiv    = document.createElement("div");
    vizDiv.id = `viz-${name}`;
    vizDiv.style.cssText = "margin-bottom:12px;";
    card.querySelector(".card-actions").before(vizDiv);
  }

  const temps  = data.readings.map(r => r.temperature);
  const minT   = Math.min(...temps);
  const maxT   = Math.max(...temps);
  const range  = maxT - minT || 1;

  const bars = temps.map((t, i) => {
    const h     = 20 + ((t - minT) / range) * 80;
    const alert = data.readings[i].alert;
    const color = alert ? "#dc2626" : "#6366f1";
    return `<div class="temp-bar" style="height:${h}%;background:${color}"
                 title="Sample ${i+1}: ${t}°C${alert ? ' ALERT' : ''}"></div>`;
  }).join("");

  vizDiv.innerHTML = `
    <div class="section-label">Temperature readings (red = alert)</div>
    <div class="temp-chart">${bars}</div>
    <div style="display:flex;gap:16px;margin-top:6px;font-size:11px;color:#64748b">
      <span>avg ${data.stats.avg}°C</span>
      <span>min ${data.stats.min}°C</span>
      <span>max ${data.stats.max}°C</span>
      <span style="color:#dc2626">${data.alerts} alerts</span>
    </div>
  `;
}

function renderMotorViz(name, data) {
  const card  = document.getElementById(`proj-card-${name}`);
  let vizDiv  = document.getElementById(`viz-${name}`);
  if (!vizDiv) {
    vizDiv    = document.createElement("div");
    vizDiv.id = `viz-${name}`;
    vizDiv.style.cssText = "margin-bottom:12px;";
    card.querySelector(".card-actions").before(vizDiv);
  }

  const fwd = data.results.filter(r => r.direction === "FORWARD");
  const rev = data.results.filter(r => r.direction === "REVERSE");
  const lastFwd = fwd[fwd.length - 1]?.speed_pct || 0;
  const lastRev = rev[rev.length - 1]?.speed_pct || 0;

  vizDiv.innerHTML = `
    <div class="section-label">Motor PWM</div>
    <div class="pwm-channel" style="margin-bottom:8px">
      <div class="pwm-label">Forward</div>
      <div class="pwm-bar-wrap">
        <div class="pwm-bar" style="width:${lastFwd}%;background:#6366f1"></div>
      </div>
      <div class="pwm-pct">${lastFwd}%</div>
    </div>
    <div class="pwm-channel">
      <div class="pwm-label">Reverse</div>
      <div class="pwm-bar-wrap">
        <div class="pwm-bar" style="width:${lastRev}%;background:#f59e0b"></div>
      </div>
      <div class="pwm-pct">${lastRev}%</div>
    </div>
    <div style="font-size:11px;color:#64748b;margin-top:6px">
      ${fwd.length} forward steps  •  ${rev.length} reverse steps
    </div>
  `;
}

function renderSmartSensorViz(name, data) {
  const card  = document.getElementById(`proj-card-${name}`);
  let vizDiv  = document.getElementById(`viz-${name}`);
  if (!vizDiv) {
    vizDiv    = document.createElement("div");
    vizDiv.id = `viz-${name}`;
    vizDiv.style.cssText = "margin-bottom:12px;";
    card.querySelector(".card-actions").before(vizDiv);
  }

  vizDiv.innerHTML = `
    <div class="sensor-row" style="margin-bottom:8px">
      <div class="sensor-box">
        <div class="sensor-val">${data.stats.avg_temp}°C</div>
        <div class="sensor-lbl">Avg Temp</div>
      </div>
      <div class="sensor-box">
        <div class="sensor-val" style="color:#dc2626">${data.alerts}</div>
        <div class="sensor-lbl">Alerts</div>
      </div>
      <div class="sensor-box">
        <div class="sensor-val" style="color:#4f46e5">${data.packets_sent}</div>
        <div class="sensor-lbl">Packets TX</div>
      </div>
    </div>
    <div style="font-size:11px;color:#64748b">
      Device: ${data.device_id}  •  Errors: ${data.errors}
    </div>
  `;
}

// ── Run all projects ──────────────────────────────────────
async function runESP32Full() {
  try {
    const res  = await fetch(`${ESP32_API}/embedded/run_all`);
    const data = await res.json();

    // Update top counters
    const passEl = document.querySelector("#esp32-pass-count .esp32-val");
    const failEl = document.querySelector("#esp32-fail-count .esp32-val");
    const progEl = document.getElementById("esp32-programs-count");
    if (passEl) passEl.textContent = data.total_pass;
    if (failEl) failEl.textContent = data.total_fail;
    if (progEl) progEl.textContent = data.total_projects;

    // Render each project result
    Object.entries(data.projects).forEach(([name, result]) => {
      renderProjectResult(name, result);
    });

  } catch(e) {
    console.error("ESP32 full run failed:", e);
  }
}

// ── Toggle log ────────────────────────────────────────────
function toggleLog(name) {
  const panel = document.getElementById(`proj-out-${name}`);
  if (!panel) return;
  if (panel.classList.contains("visible")) {
    panel.classList.remove("visible");
  } else {
    panel.classList.add("visible");
  }
}

function showProjOutput(name, lines) {
  const panel = document.getElementById(`proj-out-${name}`);
  if (!panel) return;
  panel.innerHTML = "";
  panel.classList.add("visible");
  lines.forEach(line => {
    const div       = document.createElement("div");
    div.className   = line.includes("PASS")  ? "out-pass"
                    : line.includes("FAIL")  ? "out-fail"
                    : line.includes("ALERT") ? "out-fail"
                    : "out-plain";
    div.textContent = line;
    panel.appendChild(div);
  });
}

// ── Badge helpers ─────────────────────────────────────────
function setProjBadge(name, status) {
  const badge = document.getElementById(`proj-badge-${name}`);
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

function resetESP32() {
  loadedProjects.forEach(p => {
    setProjBadge(p.name, "idle");
    const out  = document.getElementById(`proj-out-${p.name}`);
    const uart = document.getElementById(`proj-uart-${p.name}`);
    const viz  = document.getElementById(`viz-${p.name}`);
    const stats = document.getElementById(`proj-stats-${p.name}`);
    if (out)   { out.innerHTML  = ""; out.classList.remove("visible"); }
    if (uart)  { uart.innerHTML = ""; uart.style.display = "none"; }
    if (viz)   viz.innerHTML   = "";
    if (stats) stats.style.display = "none";
  });

  const passEl = document.querySelector("#esp32-pass-count .esp32-val");
  const failEl = document.querySelector("#esp32-fail-count .esp32-val");
  if (passEl) passEl.textContent = "—";
  if (failEl) failEl.textContent = "—";
}

// ── Boot ──────────────────────────────────────────────────
window.addEventListener("load", async () => {
  await loadEmbeddedProjects();
  await runESP32Full();
});