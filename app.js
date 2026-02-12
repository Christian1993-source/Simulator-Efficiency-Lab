const trialTableBody = document.querySelector("#trialTable tbody");
const addTrialBtn = document.getElementById("addTrialBtn");
const clearTableBtn = document.getElementById("clearTableBtn");
const autoEfficiency = document.getElementById("autoEfficiency");
const ioPieChart = document.getElementById("ioPieChart");
const systemImage = document.getElementById("systemImage");
const imagePreview = document.getElementById("imagePreview");
const pdfBtn = document.getElementById("pdfBtn");
const resetBtn = document.getElementById("resetBtn");
const exampleBtn = document.getElementById("exampleBtn");

const systemName = document.getElementById("systemName");
const systemData = document.getElementById("systemData");
const conclusion = document.getElementById("conclusion");
const equationDisplay = document.getElementById("equationDisplay");
const reportLabel = document.getElementById("reportLabel");

const inputType = document.getElementById("inputType");
const inputValue = document.getElementById("inputValue");
const outputList = document.getElementById("outputList");
const addOutputBtn = document.getElementById("addOutputBtn");
const pieTitle = document.getElementById("pieTitle");

let trials = [];
let imageDataUrl = "";

function unitFor(type) {
  if (type === "power") return "W";
  return "J";
}

function calculateEfficiency(input, output) {
  if (input <= 0) return 0;
  return (output / input) * 100;
}

function updateAutoEfficiency(input, output) {
  const eff = calculateEfficiency(input, output);
  autoEfficiency.textContent = input > 0 ? `${eff.toFixed(1)} %` : "-";
}

function addOutputRow() {
  const row = document.createElement("div");
  row.className = "output-row";
  row.innerHTML = `
    <select class="out-type">
      <option value="energy">Energy</option>
      <option value="work">Work</option>
      <option value="power">Power</option>
    </select>
    <select class="out-kind">
      <option value="useful">Useful</option>
      <option value="internal">Internal Energy</option>
    </select>
    <input class="out-value" type="number" step="0.1" placeholder="Value" />
    <button type="button" class="out-remove">X</button>
  `;
  row.querySelector(".out-remove").addEventListener("click", () => {
    row.remove();
    recalcAuto();
  });
  row.querySelectorAll("select, input").forEach((el) => {
    el.addEventListener("input", recalcAuto);
  });
  outputList.appendChild(row);
}

function collectOutputs() {
  const outputs = [];
  outputList.querySelectorAll(".output-row").forEach((row) => {
    const type = row.querySelector(".out-type").value;
    const kind = row.querySelector(".out-kind").value;
    const value = parseFloat(row.querySelector(".out-value").value);
    if (!Number.isNaN(value)) {
      outputs.push({ type, kind, value });
    }
  });
  return outputs;
}

function recalcAuto() {
  const inputVal = parseFloat(inputValue.value);
  if (Number.isNaN(inputVal)) {
    autoEfficiency.textContent = "-";
    updateEquationDisplay(null, null);
    return;
  }
  const outputs = collectOutputs();
  const usefulTotal = outputs
    .filter((o) => o.kind === "useful")
    .reduce((sum, o) => sum + o.value, 0);
  updateAutoEfficiency(inputVal, usefulTotal);
  updateEquationDisplay(usefulTotal, inputVal);
}

function addTrial() {
  const inputVal = parseFloat(inputValue.value);
  if (Number.isNaN(inputVal)) {
    alert("Please enter a numeric value for Input.");
    return;
  }

  const outputs = collectOutputs();
  if (outputs.length === 0) {
    alert("Add at least one output.");
    return;
  }

  const usefulTotal = outputs
    .filter((o) => o.kind === "useful")
    .reduce((sum, o) => sum + o.value, 0);
  const internalTotal = outputs
    .filter((o) => o.kind === "internal")
    .reduce((sum, o) => sum + o.value, 0);

  const trial = {
    id: trials.length + 1,
    inputType: inputType.value,
    inputValue: inputVal,
    outputs,
    usefulTotal,
    internalTotal,
    efficiency: calculateEfficiency(inputVal, usefulTotal)
  };

  trials.push(trial);
  renderTable();
  drawPieChart();
  updateAutoEfficiency(inputVal, usefulTotal);
  updateEquationDisplay(usefulTotal, inputVal);
}

function renderTable() {
  trialTableBody.innerHTML = "";
  trials.forEach((trial) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${trial.id}</td>
      <td>${trial.inputType}</td>
      <td>${trial.inputValue.toFixed(1)} ${unitFor(trial.inputType)}</td>
      <td>${trial.outputs.map((o) => o.type).join(", ")}</td>
      <td>${trial.usefulTotal.toFixed(1)} useful / ${trial.internalTotal.toFixed(1)} internal</td>
      <td>${trial.efficiency.toFixed(1)}</td>
    `;
    trialTableBody.appendChild(row);
  });
}

function renderPieChart(canvas, opts = {}) {
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = opts.dpr ?? (window.devicePixelRatio || 1);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const width = rect.width;
  const height = rect.height;
  ctx.clearRect(0, 0, width, height);

  const bg = opts.background || "#fff9f1";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  if (trials.length === 0) {
    ctx.fillStyle = "#6c6a66";
    ctx.font = "16px Poppins";
    ctx.textAlign = "center";
    ctx.fillText("Add data to see the chart.", width / 2, height / 2);
    ctx.textAlign = "start";
    return;
  }

  const last = trials[trials.length - 1];
  const input = Math.max(last.inputValue, 0);
  const useful = Math.max(last.usefulTotal, 0);
  const losses = Math.max(input - useful, 0);
  const total = Math.max(input, 1);
  const usefulAngle = (useful / total) * Math.PI * 2;

  const centerX = width / 2;
  const centerY = height / 2 + 18;
  const radius = Math.min(width, height) * 0.33;

  // Title inside chart area
  ctx.fillStyle = "#1d1c1a";
  ctx.font = "14px Poppins";
  ctx.fillText("Output Breakdown", 20, 20);

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.fillStyle = "#1f9aa2";
  ctx.arc(centerX, centerY, radius, 0, usefulAngle);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.fillStyle = "#f28c28";
  ctx.arc(centerX, centerY, radius, usefulAngle, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#1d1c1a";
  ctx.font = "13px Poppins";
  const legendY = 44;
  ctx.fillText("Output (Useful)", 20, legendY);
  ctx.fillText("Output (Internal Energy)", 220, legendY);

  ctx.fillStyle = "#1f9aa2";
  ctx.fillRect(150, legendY - 10, 12, 12);
  ctx.fillStyle = "#f28c28";
  ctx.fillRect(445, legendY - 10, 12, 12);

  ctx.fillStyle = "#6c6a66";
  ctx.font = "12px Poppins";
  ctx.fillText(`Input: ${input.toFixed(1)} ${unitFor(last.inputType)}`, 20, height - 18);
  ctx.fillText(`Useful: ${useful.toFixed(1)}  Internal: ${losses.toFixed(1)}`, 230, height - 18);
}

function drawPieChart() {
  renderPieChart(ioPieChart);
}

function renderPieChartStatic(canvas, background = "#ffffff") {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  if (trials.length === 0) {
    ctx.fillStyle = "#6c6a66";
    ctx.font = "16px \"Times New Roman\"";
    ctx.textAlign = "center";
    ctx.fillText("Add data to see the chart.", width / 2, height / 2);
    ctx.textAlign = "start";
    return;
  }

  const last = trials[trials.length - 1];
  const input = Math.max(last.inputValue, 0);
  const useful = Math.max(last.usefulTotal, 0);
  const losses = Math.max(input - useful, 0);
  const total = Math.max(input, 1);
  const usefulAngle = (useful / total) * Math.PI * 2;

  // Border frame for a clean paper-style figure
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  const centerX = width / 2;
  const centerY = height / 2 - 6;
  const radius = Math.min(width, height) * 0.32;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.fillStyle = "#2c7fb8";
  ctx.arc(centerX, centerY, radius, 0, usefulAngle);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.fillStyle = "#fdae61";
  ctx.arc(centerX, centerY, radius, usefulAngle, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  // Legend centered under the chart
  ctx.fillStyle = "#1d1c1a";
  ctx.font = "12px \"Times New Roman\"";
  const legendY = height - 36;
  const leftX = width / 2 - 110;
  const rightX = width / 2 + 20;
  ctx.fillStyle = "#2c7fb8";
  ctx.fillRect(leftX, legendY - 9, 10, 10);
  ctx.fillStyle = "#1d1c1a";
  ctx.fillText("Useful Output", leftX + 14, legendY);
  ctx.fillStyle = "#fdae61";
  ctx.fillRect(rightX, legendY - 9, 10, 10);
  ctx.fillStyle = "#1d1c1a";
  ctx.fillText("Internal Energy", rightX + 14, legendY);

  ctx.fillStyle = "#555555";
  ctx.font = "11px \"Times New Roman\"";
  ctx.fillText(`Input: ${input.toFixed(1)} ${unitFor(last.inputType)}`, 12, height - 8);
  ctx.fillText(`Useful: ${useful.toFixed(1)} | Internal: ${losses.toFixed(1)}`, width / 2 + 20, height - 8);
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    imageDataUrl = reader.result;
    imagePreview.innerHTML = `<img src="${imageDataUrl}" alt="System image" />`;
  };
  reader.readAsDataURL(file);
}

function clearAll() {
  trials = [];
  imageDataUrl = "";
  systemName.value = "";
  systemData.value = "";
  conclusion.value = "";
  inputValue.value = "";
  autoEfficiency.textContent = "-";
  imagePreview.textContent = "Preview here";
  outputList.innerHTML = "";
  addOutputRow();
  renderTable();
  drawPieChart();
  updateEquationDisplay(null, null);
}

function loadExample() {
  systemName.value = "Light Bulb";
  systemData.value =
    "Instructions example: Input = 100 J. Useful output = 10 J of radiant light. Non-useful output = 90 J as heat.";
  conclusion.value = "The light bulb is only 10% efficient for light output, with most energy lost as heat.";
  inputType.value = "energy";
  inputValue.value = "100";

  const sampleSvg =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'>
        <rect width='100%' height='100%' fill='#fff6e9'/>
        <circle cx='240' cy='120' r='60' fill='#ffd166' stroke='#f28c28' stroke-width='6'/>
        <rect x='220' y='180' width='40' height='40' rx='6' fill='#b6b6b6'/>
        <rect x='210' y='220' width='60' height='30' rx='6' fill='#9c9c9c'/>
        <text x='240' y='60' font-size='18' text-anchor='middle' fill='#1d1c1a'>Light Bulb</text>
      </svg>`
    );
  imageDataUrl = sampleSvg;
  imagePreview.innerHTML = `<img src="${imageDataUrl}" alt="System image" />`;
  systemImage.value = "";

  outputList.innerHTML = "";
  addOutputRow();
  const row = outputList.querySelector(".output-row");
  row.querySelector(".out-type").value = "energy";
  row.querySelector(".out-kind").value = "useful";
  row.querySelector(".out-value").value = "10";

  addOutputRow();
  const rows = outputList.querySelectorAll(".output-row");
  const second = rows[1];
  second.querySelector(".out-type").value = "energy";
  second.querySelector(".out-kind").value = "internal";
  second.querySelector(".out-value").value = "90";

  recalcAuto();
  pieTitle.textContent = "Light Bulb Efficiency Pie Chart";
  updateEquationDisplay(10, 100);
}

function updateEquationDisplay(useful, input) {
  if (!equationDisplay) return;
  if (useful === null || input === null || input === 0) {
    equationDisplay.innerHTML = "\\( \\eta = \\frac{\\text{Useful Output}}{\\text{Input}} \\times 100 \\)";
  } else {
    const eta = (useful / input) * 100;
    equationDisplay.innerHTML = `\\( \\eta = \\frac{\\text{Useful Output}}{\\text{Input}} \\times 100 = \\frac{${useful.toFixed(1)}}{${input.toFixed(1)}} \\times 100 = ${eta.toFixed(1)}\\% \\)`;
  }
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([equationDisplay]);
  }
}
function generatePDF() {
  if (!systemName.value.trim()) {
    alert("Enter the system name.");
    return;
  }

  const reportWindow = window.open("", "_blank");
  drawPieChart();
  const pieDataUrl = (() => {
    const temp = document.createElement("canvas");
    temp.width = 520;
    temp.height = 260;
    renderPieChartStatic(temp, "#ffffff");
    return temp.toDataURL("image/png");
  })();
  const avgEff = trials.length
    ? (trials.reduce((sum, t) => sum + t.efficiency, 0) / trials.length).toFixed(1)
    : "-";
  const lastTrial = trials[trials.length - 1];
  const eqLine = lastTrial
    ? `\\(\\eta = \\frac{\\text{Useful Output}}{\\text{Input}} \\times 100 = \\frac{${lastTrial.usefulTotal.toFixed(1)}}{${lastTrial.inputValue.toFixed(1)}} \\times 100 = ${lastTrial.efficiency.toFixed(1)}\\%\\)`
    : `\\(\\eta = \\frac{\\text{Useful Output}}{\\text{Input}} \\times 100\\)`;

  const rows = trials
    .map(
      (t) => `
      <tr>
        <td>${t.id}</td>
        <td>${t.inputType}</td>
        <td>${t.inputValue.toFixed(1)} ${unitFor(t.inputType)}</td>
        <td>${t.outputs.map((o) => `${o.type} (${o.kind})`).join(", ")}</td>
        <td>${t.usefulTotal.toFixed(1)} useful / ${t.internalTotal.toFixed(1)} internal</td>
        <td>${t.efficiency.toFixed(1)}%</td>
      </tr>`
    )
    .join("");

  const now = new Date();
  const dateStr = now.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit"
  });

  reportWindow.document.write(`
    <html>
    <head>
      <title>Efficiency Report</title>
      <style>
        @page { size: A4; margin: 8mm; }
        body { font-family: "Times New Roman", Times, serif; margin: 0; color: #111; }
        .page { padding: 0; }
        .header { display: flex; justify-content: space-between; font-size: 17px; margin-bottom: 10px; }
        .title { text-align: center; font-weight: 700; font-size: 34px; margin: 8px 0 4px; }
        .subtitle { text-align: center; font-size: 18px; margin-bottom: 12px; }
        h2 { font-size: 18px; margin: 12px 0 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .section { margin-top: 9px; break-inside: avoid; font-size: 18px; line-height: 1.5; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #777; padding: 7px; font-size: 15px; }
        th { background: #f2f2f2; }
        .image-wrap { display: inline-block; border-radius: 50%; overflow: hidden; width: 240px; height: 240px; border: 2px solid #777; }
        .image { width: 240px; height: 240px; object-fit: cover; display: block; }
        .chart { max-width: 100%; max-height: 260px; margin-top: 8px; }
        .latex { font-size: 17px; }
        .footer { margin-top: 12px; font-size: 14px; color: #666; text-align: center; }
        .center { text-align: center; }
        @media print {
          .page { transform: scale(0.95); transform-origin: top left; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div>${dateStr}</div>
          <div>Efficiency Report</div>
        </div>
        <div class="title">${systemName.value}</div>
        <div class="subtitle">Mr. Mercado Physics Simulator – Work, Energy & Power Efficiency Lab</div>
        <div class="section">
          <h2>System Information</h2>
          <div>${systemData.value || "-"}</div>
        </div>
        <div class="section center">
          <h2>System Image</h2>
          ${imageDataUrl ? `<div class="image-wrap"><img class="image" src="${imageDataUrl}" alt="System" /></div>` : "-"}
        </div>
        <div class="section">
          <h2>Data Table</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Input Type</th>
                <th>Input Value</th>
                <th>Output Types</th>
                <th>Outputs (useful/internal)</th>
                <th>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              ${rows || "<tr><td colspan='6'>No data</td></tr>"}
            </tbody>
          </table>
        </div>
        <div class="section">
          <h2>${reportLabel ? reportLabel.value : "Efficient"}</h2>
          <div>${avgEff}%</div>
        </div>
        <div class="section">
          <h2>Efficiency Equation</h2>
          <div class="latex">${eqLine}</div>
        </div>
        <div class="section center">
          <h2>${systemName.value} Efficiency Pie Chart</h2>
          <img class="chart" src="${pieDataUrl}" alt="Pie chart" />
        </div>
        <div class="section">
          <h2>Conclusion</h2>
          <div>${conclusion.value || "-"}</div>
        </div>
        <div class="footer">Mr. Mercado Physics Simulator | © Christian Mercado Cuevas</div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
      <script>
        window.onload = () => {
          if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise().then(() => window.print());
          } else {
            window.print();
          }
        };
      </script>
    </body>
    </html>
  `);
  reportWindow.document.close();
}

addTrialBtn.addEventListener("click", addTrial);
clearTableBtn.addEventListener("click", () => {
  trials = [];
  renderTable();
  autoEfficiency.textContent = "-";
  drawPieChart();
});

addOutputBtn.addEventListener("click", () => {
  addOutputRow();
});

systemImage.addEventListener("change", handleImageUpload);
imagePreview.addEventListener("click", () => systemImage.click());
resetBtn.addEventListener("click", clearAll);
pdfBtn.addEventListener("click", generatePDF);
exampleBtn.addEventListener("click", loadExample);

inputValue.addEventListener("input", () => {
  recalcAuto();
});

systemName.addEventListener("input", () => {
  const name = systemName.value.trim() || "System";
  pieTitle.textContent = `${name} Efficiency Pie Chart`;
});

renderTable();
drawPieChart();
addOutputRow();
pieTitle.textContent = "System Efficiency Pie Chart";
updateEquationDisplay(null, null);
