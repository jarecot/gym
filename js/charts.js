/* =========================================================================
   CHARTS.JS — helpers de Chart.js con el tema visual de la app
   ========================================================================= */

const CHART_COLORS = ['#c1502e', '#5c6bc0', '#4c9a6a', '#c9a24b', '#8b6bc7', '#8c97a8'];

const CHART_AVAILABLE = typeof Chart !== 'undefined';

if (CHART_AVAILABLE) {
  Chart.defaults.color = '#9aa3af';
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.borderColor = '#2c313a';
}

let _charts = {};

function destroyChart(id) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

function showChartFallback(canvasId, message) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const wrap = ctx.parentElement;
  if (wrap && !wrap.querySelector('.chart-fallback')) {
    const div = document.createElement('div');
    div.className = 'chart-fallback card__hint';
    div.textContent = message;
    ctx.style.display = 'none';
    wrap.appendChild(div);
  }
}

function renderWeightChart(canvasId, series) {
  // series: [{label, data: [{x: isoDate, y: weight}], color}]
  if (!CHART_AVAILABLE) { showChartFallback(canvasId, 'Las gráficas requieren conexión a internet (Chart.js no cargó).'); return; }
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  _charts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: series.map((s, i) => ({
        label: s.label,
        data: s.data,
        borderColor: s.color || CHART_COLORS[i % CHART_COLORS.length],
        backgroundColor: (s.color || CHART_COLORS[i % CHART_COLORS.length]) + '22',
        tension: 0.3,
        fill: series.length === 1,
        pointRadius: 3,
        pointBackgroundColor: s.color || CHART_COLORS[i % CHART_COLORS.length],
      })),
    },
    options: {
      responsive: true,
      plugins: { legend: { display: series.length > 1, labels: { boxWidth: 10, font: { size: 11 } } } },
      scales: {
        x: { type: 'time', time: { unit: 'week' }, grid: { color: '#22262e' } },
        y: { grid: { color: '#22262e' } },
      },
    },
  });
}

function renderBarChart(canvasId, labels, data, colors) {
  if (!CHART_AVAILABLE) { showChartFallback(canvasId, 'Las gráficas requieren conexión a internet (Chart.js no cargó).'); return; }
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  _charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors || CHART_COLORS, borderRadius: 6, maxBarThickness: 42 }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, max: 100, grid: { color: '#22262e' } },
      },
    },
  });
}

function renderGroupedBarChart(canvasId, labels, datasets) {
  if (!CHART_AVAILABLE) { showChartFallback(canvasId, 'Las gráficas requieren conexión a internet (Chart.js no cargó).'); return; }
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  _charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map((d, i) => ({ label: d.label, data: d.data, backgroundColor: d.color || CHART_COLORS[i % CHART_COLORS.length], borderRadius: 5, maxBarThickness: 28 })),
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true, max: 100, grid: { color: '#22262e' } } },
    },
  });
}

window.CHARTS = { renderWeightChart, renderBarChart, renderGroupedBarChart, CHART_COLORS };
