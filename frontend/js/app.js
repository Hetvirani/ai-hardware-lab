const API = "http://127.0.0.1:8000";
const KNOWN_DESIGNS = [
  { name: "alu_vlsi",    endpoint: `${API}/full_report` },
  { name: "example_cpu", endpoint: `${API}/full_report/example_cpu` },
  { name: "uart_tx",     endpoint: `${API}/full_report/uart_tx` }
];

const cards = {};

// ── API status ────────────────────────────────────────────
async function checkAPIStatus() {
  const dot   = document.getElementById("status-dot");
  const label = document.getElementById("status-label");
  try {
    await fetch(`${API}/full_report`);
    dot.className     = "status-dot online";
    label.textContent = "API connected";
  } catch {
    dot.className     = "status-dot offline";
    label.textContent = "API offline — run: uvicorn server:app --reload";
  }
}

// ── Card creation ─────────────────────────────────────────
function ensureCard(name) {
  if (cards[name]) return;

  const grid  = document.getElementById("designs-grid");
  const empty = grid.querySelector(".empty-state");
  if (empty) empty.remove();

  const card = document.createElement("div");
  card.className = "design-card";
  card.id        = `card-${name}`;
  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">
        <span>📦</span>
        <span>${name}</span>
      </div>
      <span class="badge badge-gray" id="badge-${name}">Pending</span>
    </div>

    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-val green" id="val-passed-${name}">—</div>
        <div class="stat-lbl">Passed</div>
      </div>
      <div class="stat-box">
        <div class="stat-val red" id="val-failed-${name}">—</div>
        <div class="stat-lbl">Failed</div>
      </div>
      <div class="stat-box">
        <div class="stat-val blue" id="val-signals-${name}">—</div>
        <div class="stat-lbl">Signals</div>
      </div>
      <div class="stat-box">
        <div class="stat-val amber" id="val-trans-${name}">—</div>
        <div class="stat-lbl">Transitions</div>
      </div>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" id="progress-${name}"></div>
    </div>

    <div class="section-label">Files compiled</div>
    <div class="files-list" id="files-${name}"></div>

    <div class="section-label">Detected signals</div>
    <div class="signals-wrap">
      <div class="signals-list" id="signals-${name}"></div>
    </div>

    <div class="issues-wrap" id="issues-wrap-${name}" style="display:none">
      <div class="section-label">Design warnings</div>
      <div id="issues-${name}"></div>
    </div>

    <div class="card-actions">
      <button class="btn btn-primary btn-sm"   onclick="runVerify('${name}')">▶ Verify</button>
      <button class="btn btn-secondary btn-sm" onclick="runWaveform('${name}')">〜 Waveform</button>
      <button class="btn btn-amber btn-sm"     onclick="runGenTB('${name}')">✦ Gen TB</button>
      <button class="btn btn-green btn-sm"     onclick="runFullReport('${name}')">⟳ Full Report</button>
      <button class="btn btn-purple btn-sm"    onclick="runAIReport('${name}')">🤖 AI Report</button>
      <button class="btn btn-cyan btn-sm"      onclick="runAIGenTB('${name}')">✦ AI Gen TB</button>
    </div>

    <div class="output-panel" id="output-${name}"></div>
  `;
  grid.appendChild(card);
  cards[name] = true;
}

// ── Full report ───────────────────────────────────────────
async function runFullReportInput() {
  const name = document.getElementById("design-input").value.trim();
  if (!name) { alert("Enter a design name first"); return; }
  await runFullReport(name);
}

async function runFullReport(name) {
  ensureCard(name);
  setLoading(name, true);
  const ep = name === "alu_vlsi"
    ? `${API}/full_report`
    : `${API}/full_report/${name}`;
  try {
    const res  = await fetch(ep);
    const data = await res.json();
    applyVerification(name, data.verification);
    applyWaveform(name, data.waveform);
    applyDesignAnalysis(name, data.design_analysis);
    renderOutput(name, data.verification?.output || "");
    setLoading(name, false);
  } catch {
    setError(name, "Cannot reach API. Is uvicorn running?");
  }
}

// ── Individual actions ────────────────────────────────────
async function runVerify(name) {
  ensureCard(name);
  setLoading(name, true);
  const ep = name === "alu_vlsi"
    ? `${API}/run_vlsi`
    : `${API}/run_vlsi/${name}`;
  try {
    const res  = await fetch(ep);
    const data = await res.json();
    applyVerification(name, data);
    renderOutput(name, data.output || "");
    setLoading(name, false);
  } catch {
    setError(name, "Verification failed");
  }
}

async function runWaveform(name) {
  const ep = name === "alu_vlsi"
    ? `${API}/analyze_waveform`
    : `${API}/analyze_waveform/${name}`;
  try {
    const res  = await fetch(ep);
    const data = await res.json();
    applyWaveform(name, data);
    showMsg(name,
      data.status === "success"
        ? `Waveform: ${data.signal_count} signals, ${data.transitions_recorded} transitions`
        : data.message,
      data.status === "success" ? "out-info" : "out-fail"
    );
  } catch {
    setError(name, "Waveform analysis failed");
  }
}

async function runGenTB(name) {
  setLoading(name, true);
  try {
    const res  = await fetch(`${API}/generate_testbench/${name}`);
    const data = await res.json();
    setLoading(name, false);
    if (data.status === "success") {
      const files = data.generated.map(g => g.testbench_file).join(", ");
      showMsg(name, `✓ Generated: ${files}`, "out-info");
    } else {
      showMsg(name, data.error || "Generation failed", "out-fail");
    }
  } catch {
    setError(name, "TB generation failed");
  }
}

async function generateTBInput() {
  const name = document.getElementById("design-input").value.trim();
  if (!name) { alert("Enter a design name first"); return; }
  ensureCard(name);
  await runGenTB(name);
}

async function runAIReport(name) {
  ensureCard(name);
  setLoading(name, true);

  const ep = name === "alu_vlsi"
    ? `${API}/full_report`
    : `${API}/full_report/${name}`;

  let simData;
  try {
    const res = await fetch(ep);
    simData   = await res.json();
    applyVerification(name, simData.verification);
    applyWaveform(name, simData.waveform);
    applyDesignAnalysis(name, simData.design_analysis);
  } catch {
    setError(name, "Cannot reach API. Is uvicorn running?");
    return;
  }

  renderOutput(name, simData.verification?.output || "");
  setLoading(name, false);

  const panel = document.getElementById(`output-${name}`);
  const v     = simData.verification || {};

  const hr = document.createElement("hr");
  hr.className = "ai-divider";
  panel.appendChild(hr);

  const label       = document.createElement("div");
  label.className   = "out-info";
  label.textContent = "— Claude AI Analysis —";
  panel.appendChild(label);

  const thinking       = document.createElement("div");
  thinking.className   = "out-plain";
  thinking.id          = `thinking-${name}`;
  thinking.textContent = "Connecting to Claude...";
  panel.appendChild(thinking);
  panel.scrollTop = panel.scrollHeight;

  const prompt = `You are an expert VLSI verification engineer.

A hardware simulation just completed for design: ${name}
Files compiled: ${(v.files_compiled || []).join(", ")}

Simulation output:
${v.output || "No output"}

Results: ${v.passed || 0} passed, ${v.failed || 0} failed out of ${v.total_tests || 0} tests.
Waveform signals detected: ${(simData.waveform?.signals_detected || []).join(", ")}

Provide:
1. Summary of what was verified
2. What passing tests confirm about the design
3. If tests failed, what went wrong and how to fix it
4. One sentence overall verdict

Be concise and technical. No markdown. Plain paragraphs only.`;

  try {
    // Check if puter is available
    if (typeof puter === "undefined") {
      throw new Error("Puter.js not loaded. Check your internet connection.");
    }

    console.log("Calling puter.ai.chat...");

    const response = await puter.ai.chat(prompt);

    console.log("Puter response:", response);

    // Handle different response formats
    let text = "";
    if (typeof response === "string") {
      text = response;
    } else if (response?.message?.content?.[0]?.text) {
      text = response.message.content[0].text;
    } else if (response?.text) {
      text = response.text;
    } else if (response?.content) {
      text = typeof response.content === "string"
        ? response.content
        : response.content?.[0]?.text || "";
    } else {
      text = JSON.stringify(response);
    }

    document.getElementById(`thinking-${name}`)?.remove();

    if (!text || text.trim() === "") {
      const err       = document.createElement("div");
      err.className   = "out-fail";
      err.textContent = "Claude returned empty response. Check browser console for details.";
      panel.appendChild(err);
    } else {
      text.split("\n").forEach(line => {
        if (!line.trim()) return;
        const div       = document.createElement("div");
        div.className   = "out-ai";
        div.textContent = line;
        panel.appendChild(div);
      });
    }

    panel.scrollTop = panel.scrollHeight;

  } catch(e) {
    console.error("Puter AI error:", e);
    document.getElementById(`thinking-${name}`)?.remove();

    const err       = document.createElement("div");
    err.className   = "out-fail";
    err.textContent = "Error: " + (e.message || JSON.stringify(e));
    panel.appendChild(err);

    // Show login hint
    const hint       = document.createElement("div");
    hint.className   = "out-plain";
    hint.style.color = "#f59e0b";
    hint.textContent = "→ Puter.js may need you to log in. Check the popup or visit puter.com first.";
    panel.appendChild(hint);

    panel.scrollTop = panel.scrollHeight;
  }
}

// ── AI Gen TB via Puter.js ────────────────────────────────
async function runAIGenTB(name) {
  ensureCard(name);
  setLoading(name, true);

  const ep = name === "alu_vlsi"
    ? `${API}/analyze_design`
    : `${API}/analyze_design/${name}`;

  let designInfo;
  try {
    const res  = await fetch(ep);
    designInfo = await res.json();
  } catch {
    setError(name, "Cannot reach API");
    return;
  }

  setLoading(name, false);
  showMsg(name, "Claude is writing your testbench...", "out-info");

  const moduleName = (designInfo.modules_found || [name])[0];

  const prompt = `You are an expert VLSI verification engineer.

Write a complete professional Verilog testbench for module: ${moduleName}

Requirements:
1. Start with \`timescale 1ns/1ps
2. Instantiate module as: ${moduleName} uut (...)
3. Generate clock with always #5 if sequential
4. Apply proper reset sequence if reset exists
5. Write at least 8 meaningful test cases
6. Every test prints a line starting with PASS or FAIL
7. Print SUMMARY: X passed, Y failed at end
8. Include $dumpfile("waveform.vcd") and $dumpvars(0, ${moduleName}_tb)
9. Return ONLY Verilog code, no markdown, no explanation`;

  try {
    const response = await puter.ai.chat(prompt, { model: "claude-sonnet-4-5" });
    let tbCode     = response?.message?.content?.[0]?.text
                  || response?.text
                  || String(response)
                  || "";

    tbCode = tbCode.trim();
    if (tbCode.startsWith("```")) tbCode = tbCode.split("\n").slice(1).join("\n");
    if (tbCode.endsWith("```"))   tbCode = tbCode.split("\n").slice(0, -1).join("\n");
    tbCode = tbCode.trim();

    const saveRes = await fetch(`${API}/save_testbench/${name}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        filename: `${moduleName}_ai_tb.v`,
        code:     tbCode
      })
    });

    const saved = await saveRes.json();

    if (saved.status === "success") {
      showMsg(name, `✓ Claude wrote and saved: ${saved.filename}`, "out-info");
    } else {
      showMsg(name, saved.error || "Save failed", "out-fail");
    }

  } catch(e) {
    showMsg(name, "AI TB generation failed: " + e.message, "out-fail");
  }
}

// ── Data renderers ────────────────────────────────────────
function applyVerification(name, v) {
  if (!v || v.error) {
    showMsg(name, v?.error || "No data", "out-fail");
    return;
  }

  const passed = v.passed      ?? 0;
  const failed = v.failed      ?? 0;
  const total  = v.total_tests ?? 0;
  const pct    = total > 0 ? Math.round((passed / total) * 100) : 0;

  setText(`val-passed-${name}`, passed);
  setText(`val-failed-${name}`, failed);

  const bar   = document.getElementById(`progress-${name}`);
  const badge = document.getElementById(`badge-${name}`);

  bar.style.width = pct + "%";

  if (total === 0) {
    badge.className      = "badge badge-amber";
    badge.textContent    = "No tests";
    bar.style.background = "#d97706";
  } else if (failed === 0) {
    badge.className      = "badge badge-green";
    badge.textContent    = `${pct}% pass`;
    bar.style.background = "#10b981";
  } else {
    badge.className      = "badge badge-red";
    badge.textContent    = `${failed} FAIL`;
    bar.style.background = "#ef4444";
  }

  const fileList = document.getElementById(`files-${name}`);
  fileList.innerHTML = "";
  (v.files_compiled || []).forEach(f => {
    const tag       = document.createElement("span");
    tag.className   = "file-tag";
    tag.textContent = f;
    fileList.appendChild(tag);
  });
}

function applyWaveform(name, w) {
  if (!w || w.status !== "success") return;
  setText(`val-signals-${name}`, w.signal_count      ?? 0);
  setText(`val-trans-${name}`,   w.transitions_recorded ?? 0);

  const list = document.getElementById(`signals-${name}`);
  list.innerHTML = "";
  (w.signals_detected || []).forEach(sig => {
    const tag       = document.createElement("span");
    tag.className   = "signal-tag";
    tag.textContent = sig;
    list.appendChild(tag);
  });
}

function applyDesignAnalysis(name, d) {
  if (!d) return;
  const wrap = document.getElementById(`issues-wrap-${name}`);
  const list = document.getElementById(`issues-${name}`);
  list.innerHTML = "";

  if (d.issues_detected && d.issues_detected.length > 0) {
    wrap.style.display = "block";
    d.issues_detected.forEach(issue => {
      const div       = document.createElement("div");
      div.className   = "issue-item";
      div.textContent = "⚠ " + issue;
      list.appendChild(div);
    });
  } else {
    wrap.style.display = "none";
  }
}

function renderOutput(name, raw) {
  if (!raw) return;
  const panel = document.getElementById(`output-${name}`);
  panel.innerHTML = "";
  panel.classList.add("visible");

  raw.split("\n").forEach(line => {
    const div = document.createElement("div");
    if      (line.startsWith("PASS"))    div.className = "out-pass";
    else if (line.startsWith("FAIL"))    div.className = "out-fail";
    else if (line.startsWith("SUMMARY")) div.className = "out-info";
    else if (line.startsWith("VCD"))     div.className = "out-info";
    else                                 div.className = "out-plain";
    div.textContent = line;
    panel.appendChild(div);
  });

  panel.scrollTop = panel.scrollHeight;
}

// ── Helpers ───────────────────────────────────────────────
function showMsg(name, msg, cls) {
  const panel = document.getElementById(`output-${name}`);
  if (!panel) return;
  panel.innerHTML = `<div class="${cls}">${msg}</div>`;
  panel.classList.add("visible");
}

function setLoading(name, on) {
  const badge = document.getElementById(`badge-${name}`);
  if (!badge) return;
  if (on) {
    badge.className = "badge badge-purple";
    badge.innerHTML = `<span class="spinner"></span>Running`;
  }
}

function setError(name, msg) {
  const badge = document.getElementById(`badge-${name}`);
  if (badge) { badge.className = "badge badge-red"; badge.textContent = "Error"; }
  showMsg(name, msg, "out-fail");
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Boot ──────────────────────────────────────────────────
window.addEventListener("load", async () => {
  await checkAPIStatus();
  for (const d of KNOWN_DESIGNS) {
    ensureCard(d.name);
    try {
      const res  = await fetch(d.endpoint);
      const data = await res.json();
      applyVerification(d.name, data.verification);
      applyWaveform(d.name, data.waveform);
      applyDesignAnalysis(d.name, data.design_analysis);
      renderOutput(d.name, data.verification?.output || "");
    } catch { }
  }
  document.getElementById("design-input").value = "";
});

// ── File Upload ───────────────────────────────────────────
function handleDragOver(e, type) {
  e.preventDefault();
  document.getElementById(`${type}-upload-zone`).classList.add("dragover");
}

function handleDragLeave(e, type) {
  document.getElementById(`${type}-upload-zone`).classList.remove("dragover");
}

function handleDrop(e, type) {
  e.preventDefault();
  document.getElementById(`${type}-upload-zone`).classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) processUpload(file, type);
}

function handleFileSelect(e, type) {
  const file = e.target.files[0];
  if (file) processUpload(file, type);
}

async function processUpload(file, type) {
  const zone      = document.getElementById(`${type}-upload-zone`);
  const resultDiv = document.getElementById(`${type}-upload-result`);

  // Validate file type
  if (type === "vlsi" && !file.name.endsWith(".v")) {
    showUploadResult(type, `Error: Only .v files allowed. Got: ${file.name}`, "err");
    return;
  }
  if (type === "embedded" && !file.name.endsWith(".py")) {
    showUploadResult(type, `Error: Only .py files allowed. Got: ${file.name}`, "err");
    return;
  }

  zone.querySelector(".upload-title").textContent = `Uploading ${file.name}...`;
  zone.classList.remove("success", "error");

  const formData = new FormData();
  formData.append("file", file);

  try {
    let res, data;

    if (type === "vlsi") {
      const designName = document.getElementById("vlsi-upload-name").value.trim()
        || file.name.replace(".v", "");
      formData.append("design_name", designName);
      res  = await fetch(`${API}/upload/vlsi`, { method: "POST", body: formData });
      data = await res.json();

      if (data.status === "success") {
        zone.classList.add("success");
        zone.querySelector(".upload-title").textContent = `✓ ${file.name} uploaded`;
        zone.querySelector(".upload-sub").textContent   =
          `Design: ${data.design_name}  •  ${data.size_bytes} bytes`;
        showUploadResult(
          type,
          `✓ Saved to designs/${data.design_name}/${data.filename} — Click Run Report to verify`,
          "ok"
        );

        // Auto-populate the design input and load card
        document.getElementById("design-input").value = data.design_name;
        setTimeout(() => runFullReport(data.design_name), 500);

      } else {
        zone.classList.add("error");
        zone.querySelector(".upload-title").textContent = "Upload failed";
        showUploadResult(type, data.error || "Upload failed", "err");
      }

    } else {
      res  = await fetch(`${API}/upload/embedded`, { method: "POST", body: formData });
      data = await res.json();

      if (data.status === "success") {
        zone.classList.add("success");
        zone.querySelector(".upload-title").textContent = `✓ ${file.name} uploaded`;
        zone.querySelector(".upload-sub").textContent   =
          `Saved to embedded/projects  •  ${data.size_bytes} bytes`;
        showUploadResult(
          type,
          `✓ Project saved as ${data.filename} — reloading project list...`,
          "ok"
        );

        // Reload project list and run the new project
        const projectName = file.name.replace(".py", "");
        setTimeout(async () => {
          await loadEmbeddedProjects();
          await runSingleProject(projectName);
        }, 600);

      } else {
        zone.classList.add("error");
        zone.querySelector(".upload-title").textContent = "Upload failed";
        showUploadResult(type, data.error || "Upload failed", "err");
      }
    }

  } catch(e) {
    zone.classList.add("error");
    zone.querySelector(".upload-title").textContent = "Upload failed";
    showUploadResult(type, "Cannot reach API — is uvicorn running?", "err");
  }

  // Reset file input so same file can be uploaded again
  document.getElementById(`${type}-file-input`).value = "";
}

function showUploadResult(type, msg, cls) {
  const div     = document.getElementById(`${type}-upload-result`);
  div.textContent = msg;
  div.className   = `upload-result show ${cls}`;
}