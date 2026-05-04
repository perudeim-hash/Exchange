const currencyCode = window.__CURRENCY_CODE__;

const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");
const limitSelect = document.getElementById("limitSelect");
const searchBtn = document.getElementById("searchBtn");
const quickRangeButtons = document.querySelectorAll(".quick-range-btn");

const chartSummary = document.getElementById("chartSummary");
const historyTableBody = document.getElementById("historyTableBody");

const latestRateEl = document.getElementById("latestRate");
const maxRateEl = document.getElementById("maxRate");
const minRateEl = document.getElementById("minRate");

const latestRateDateEl = document.getElementById("latestRateDate");
const maxRateDateEl = document.getElementById("maxRateDate");
const minRateDateEl = document.getElementById("minRateDate");

const chartCanvas = document.getElementById("rateChart");

const lowestMonthEl = document.getElementById("lowestMonth");
const lowestMonthRateEl = document.getElementById("lowestMonthRate");
const highestMonthEl = document.getElementById("highestMonth");
const highestMonthRateEl = document.getElementById("highestMonthRate");
const monthlyAverageTableBody = document.getElementById(
  "monthlyAverageTableBody",
);

let rateChart = null;

function init() {
  bindEvents();
  loadHistory();
}

function bindEvents() {
  searchBtn.addEventListener("click", () => {
    loadHistory();
  });

  quickRangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const range = button.dataset.range;
      applyQuickRange(range);
      updateQuickButtonStyle(button);
      loadHistory();
    });
  });
}

function applyQuickRange(range) {
  if (range === "all") {
    fromDateInput.value = "";
    toDateInput.value = "";
    return;
  }

  const toDate = new Date();
  const fromDate = new Date();

  if (range === "7d") {
    fromDate.setDate(fromDate.getDate() - 7);
  }

  if (range === "1m") {
    fromDate.setMonth(fromDate.getMonth() - 1);
  }

  if (range === "3m") {
    fromDate.setMonth(fromDate.getMonth() - 3);
  }

  if (range === "6m") {
    fromDate.setMonth(fromDate.getMonth() - 6);
  }

  if (range === "12m") {
    fromDate.setMonth(fromDate.getMonth() - 12);
  }

  fromDateInput.value = formatDate(fromDate);
  toDateInput.value = formatDate(toDate);
}

function updateQuickButtonStyle(activeButton) {
  quickRangeButtons.forEach((button) => {
    button.classList.remove("btn-primary");
    button.classList.add("btn-outline-primary");
  });

  activeButton.classList.remove("btn-outline-primary");
  activeButton.classList.add("btn-primary");
}

async function loadHistory() {
  try {
    chartSummary.textContent = "데이터를 불러오는 중입니다.";

    const url = buildHistoryUrl();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("환율 데이터를 불러오지 못했습니다.");
    }

    const history = await response.json();

    if (!history || history.length === 0) {
      renderEmpty();
      return;
    }

    renderSummary(history);
    renderChart(history);
    renderMonthlyAnalysis(history);
    renderTable(history);
  } catch (error) {
    console.error(error);
    renderError();
  }
}

function buildHistoryUrl() {
  const params = new URLSearchParams();

  const from = fromDateInput.value;
  const to = toDateInput.value;
  const limit = limitSelect.value;

  if (from && to) {
    params.append("from", from);
    params.append("to", to);
  }

  if (limit) {
    params.append("limit", limit);
  }

  const queryString = params.toString();

  if (!queryString) {
    return `/api/rates/history/${currencyCode}`;
  }

  return `/api/rates/history/${currencyCode}?${queryString}`;
}

function renderSummary(history) {
  const latest = history[history.length - 1];

  const maxItem = history.reduce((max, current) =>
    Number(current.rate) > Number(max.rate) ? current : max,
  );

  const minItem = history.reduce((min, current) =>
    Number(current.rate) < Number(min.rate) ? current : min,
  );

  chartSummary.textContent = `${history[0].rateDate} ~ ${latest.rateDate} / 총 ${history.length}건`;

  latestRateDateEl.textContent = latest.rateDate;
  latestRateEl.textContent = `${formatKrw(latest.rate)} 원`;

  maxRateDateEl.textContent = maxItem.rateDate;
  maxRateEl.textContent = `${formatKrw(maxItem.rate)} 원`;

  minRateDateEl.textContent = minItem.rateDate;
  minRateEl.textContent = `${formatKrw(minItem.rate)} 원`;
}

function renderChart(history) {
  const labels = history.map((item) => item.rateDate);
  const data = history.map((item) => Number(item.rate));

  if (rateChart) {
    rateChart.destroy();
  }

  rateChart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${currencyCode} 환율`,
          data,
          tension: 0.25,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `환율: ${formatKrw(context.raw)} 원`,
          },
        },
        legend: {
          display: true,
        },
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 8,
          },
        },
        y: {
          ticks: {
            callback: (value) => `${Number(value).toLocaleString("ko-KR")}원`,
          },
        },
      },
    },
  });
}

function renderMonthlyAnalysis(history) {
  const monthlyAverages = calculateMonthlyAverages(history);

  if (!monthlyAverages || monthlyAverages.length === 0) {
    renderEmptyMonthlyAnalysis();
    return;
  }

  const lowest = monthlyAverages.reduce((min, current) =>
    current.averageRate < min.averageRate ? current : min,
  );

  const highest = monthlyAverages.reduce((max, current) =>
    current.averageRate > max.averageRate ? current : max,
  );

  lowestMonthEl.textContent = formatMonthLabel(lowest.month);
  lowestMonthRateEl.textContent = `평균 환율 ${formatKrw(lowest.averageRate)} 원`;

  highestMonthEl.textContent = formatMonthLabel(highest.month);
  highestMonthRateEl.textContent = `평균 환율 ${formatKrw(highest.averageRate)} 원`;

  renderMonthlyAverageTable(monthlyAverages);
}

function calculateMonthlyAverages(history) {
  const monthlyMap = new Map();

  history.forEach((item) => {
    const month = item.rateDate.substring(0, 7);
    const rate = Number(item.rate);

    if (Number.isNaN(rate)) {
      return;
    }

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, {
        month,
        sum: 0,
        count: 0,
      });
    }

    const monthlyData = monthlyMap.get(month);
    monthlyData.sum += rate;
    monthlyData.count += 1;
  });

  return Array.from(monthlyMap.values())
    .map((item) => {
      return {
        month: item.month,
        averageRate: item.sum / item.count,
        count: item.count,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}

function renderMonthlyAverageTable(monthlyAverages) {
  monthlyAverageTableBody.innerHTML = "";

  monthlyAverages.forEach((item) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${formatMonthLabel(item.month)}</td>
      <td class="text-end fw-semibold">${formatKrw(item.averageRate)} 원</td>
      <td class="text-end">${item.count}건</td>
    `;

    monthlyAverageTableBody.appendChild(tr);
  });
}

function renderEmptyMonthlyAnalysis() {
  lowestMonthEl.textContent = "-";
  lowestMonthRateEl.textContent = "-";
  highestMonthEl.textContent = "-";
  highestMonthRateEl.textContent = "-";

  monthlyAverageTableBody.innerHTML = `
    <tr>
      <td colspan="3" class="text-center text-muted">
        월별 평균 환율 데이터가 없습니다.
      </td>
    </tr>
  `;
}

function formatMonthLabel(month) {
  const [year, monthValue] = month.split("-");
  return `${year}년 ${Number(monthValue)}월`;
}

function renderTable(history) {
  historyTableBody.innerHTML = "";

  const reversedHistory = [...history].reverse();

  reversedHistory.forEach((item) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.rateDate}</td>
      <td>${item.currencyCode}</td>
      <td class="text-end fw-semibold">${formatKrw(item.rate)} 원</td>
    `;

    historyTableBody.appendChild(tr);
  });
}

function renderEmpty() {
  chartSummary.textContent = "저장된 환율 데이터가 없습니다.";
  latestRateEl.textContent = "-";
  maxRateEl.textContent = "-";
  minRateEl.textContent = "-";

  latestRateDateEl.textContent = "-";
  maxRateDateEl.textContent = "-";
  minRateDateEl.textContent = "-";
  renderEmptyMonthlyAnalysis();

  historyTableBody.innerHTML = `
    <tr>
      <td colspan="3" class="text-center text-muted">
        저장된 환율 데이터가 없습니다.
      </td>
    </tr>
  `;

  if (rateChart) {
    rateChart.destroy();
    rateChart = null;
  }
}

function renderError() {
  chartSummary.textContent = "환율 데이터를 불러오는 중 오류가 발생했습니다.";
  latestRateEl.textContent = "-";
  maxRateEl.textContent = "-";
  minRateEl.textContent = "-";

  latestRateDateEl.textContent = "-";
  maxRateDateEl.textContent = "-";
  minRateDateEl.textContent = "-";
  renderEmptyMonthlyAnalysis();
  historyTableBody.innerHTML = `
    <tr>
      <td colspan="3" class="text-center text-danger">
        환율 데이터를 불러오지 못했습니다.
      </td>
    </tr>
  `;
}

function formatKrw(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "-";
  }

  return number.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

document.addEventListener("DOMContentLoaded", init);
