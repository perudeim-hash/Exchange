const currencyCode = window.__CURRENCY_CODE__;

const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");
const limitSelect = document.getElementById("limitSelect");
const searchBtn = document.getElementById("searchBtn");
const quickRangeButtons = document.querySelectorAll(".quick-range-btn");

const chartSummary = document.getElementById("chartSummary");
const historyTableBody = document.getElementById("historyTableBody");

const latestRateEl = document.getElementById("latestRate");
const latestRateDateEl = document.getElementById("latestRateDate");

const periodAverageRateEl = document.getElementById("periodAverageRate");
const periodAverageTextEl = document.getElementById("periodAverageText");
const differencePercentEl = document.getElementById("differencePercent");
const differenceTextEl = document.getElementById("differenceText");
const differenceMetricCard = document.getElementById("differenceMetricCard");

const minRateValueEl = document.getElementById("minRateValue");
const minRateDateEl = document.getElementById("minRateDate");
const maxRateValueEl = document.getElementById("maxRateValue");
const maxRateDateEl = document.getElementById("maxRateDate");

const decisionCard = document.getElementById("decisionCard");
const decisionBadge = document.getElementById("decisionBadge");
const decisionDate = document.getElementById("decisionDate");
const decisionTitle = document.getElementById("decisionTitle");
const decisionDescription = document.getElementById("decisionDescription");
const currentRateValue = document.getElementById("currentRateValue");
const decisionAverageRate = document.getElementById("decisionAverageRate");

const chartCanvas = document.getElementById("rateChart");

const lowestMonthEl = document.getElementById("lowestMonth");
const lowestMonthRateEl = document.getElementById("lowestMonthRate");
const highestMonthEl = document.getElementById("highestMonth");
const highestMonthRateEl = document.getElementById("highestMonthRate");
const monthlyAverageTableBody = document.getElementById("monthlyAverageTableBody");
const monthlyJudgementGrid = document.getElementById("monthlyJudgementGrid");

let rateChart = null;
let periodDatePicker = null;

let selectedFromDate = "";
let selectedToDate = "";

document.addEventListener("DOMContentLoaded", init);

function init() {
  initializePeriodDatePicker();
  bindEvents();
  applyQuickRange("12m");
  updateQuickButtonStyle("12m");
  loadHistory();
}

function bindEvents() {
  searchBtn.addEventListener("click", () => {
    clearQuickButtonStyle();
    loadHistory();
  });

  quickRangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const range = button.dataset.range;

      applyQuickRange(range);
      updateQuickButtonStyle(range);
      loadHistory();
    });
  });

  toDateInput.addEventListener("click", () => {
    if (periodDatePicker) {
      periodDatePicker.open();
    }
  });
}

function initializePeriodDatePicker() {
  if (!window.flatpickr) {
    console.error("Flatpickr 라이브러리가 로드되지 않았습니다.");
    return;
  }

  periodDatePicker = flatpickr(fromDateInput, {
    mode: "range",
    locale: "ko",
    dateFormat: "Y-m-d",
    showMonths: 2,
    disableMobile: true,
    monthSelectorType: "static",
    prevArrow: "‹",
    nextArrow: "›",
    onReady: (_, __, instance) => {
      addExchangeCalendarHeader(instance);
      renderPeriodDateInputs(instance.selectedDates, instance);
    },
    onOpen: (_, __, instance) => {
      addExchangeCalendarHeader(instance);
      renderPeriodDateInputs(instance.selectedDates, instance);
    },
    onChange: (selectedDates, _, instance) => {
      renderPeriodDateInputs(selectedDates, instance);
    },
    onValueUpdate: (selectedDates, _, instance) => {
      renderPeriodDateInputs(selectedDates, instance);
    },
  });
}

function addExchangeCalendarHeader(instance) {
  const calendar = instance.calendarContainer;

  if (!calendar || calendar.querySelector(".exchange-flatpickr-top")) {
    return;
  }

  const header = document.createElement("div");
  header.className = "exchange-flatpickr-top";
  header.innerHTML = `
    <div>
      <strong>기준 기간 선택</strong>
      <span>시작일과 종료일을 선택하세요</span>
    </div>
    <button type="button" class="exchange-flatpickr-apply-btn">적용</button>
  `;

  const applyButton = header.querySelector(".exchange-flatpickr-apply-btn");

  applyButton.addEventListener("click", () => {
    instance.close();
  });

  calendar.prepend(header);
}


function renderPeriodDateInputs(selectedDates, instance) {
  if (!selectedDates || selectedDates.length === 0) {
    setSelectedPeriodDates("", "");
    return;
  }

  const fromText = selectedDates.length >= 1
    ? instance.formatDate(selectedDates[0], "Y-m-d")
    : "";

  const toText = selectedDates.length >= 2
    ? instance.formatDate(selectedDates[1], "Y-m-d")
    : "";

  setSelectedPeriodDates(fromText, toText);

  setTimeout(() => {
    setSelectedPeriodDates(fromText, toText);
  }, 0);
}

function applyQuickRange(range) {
  if (range === "all") {
    setSelectedPeriodDates("", "");

    if (periodDatePicker) {
      periodDatePicker.clear();
    }

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

  const fromText = formatDate(fromDate);
  const toText = formatDate(toDate);

  setSelectedPeriodDates(fromText, toText);

  if (periodDatePicker) {
    periodDatePicker.setDate([fromText, toText], false);

    setTimeout(() => {
      setSelectedPeriodDates(fromText, toText);
    }, 0);
  }
}

function setSelectedPeriodDates(from, to) {
  selectedFromDate = from || "";
  selectedToDate = to || "";

  fromDateInput.value = selectedFromDate;
  toDateInput.value = selectedToDate;
}

function extractDateValue(value, position) {
  if (!value) {
    return "";
  }

  const text = String(value).trim();

  if (!text.includes("~")) {
    return text;
  }

  const parts = text.split("~").map((part) => part.trim());

  if (position === "end") {
    return parts[1] || "";
  }

  return parts[0] || "";
}

function updateQuickButtonStyle(activeRange) {
  quickRangeButtons.forEach((button) => {
    const isActive = button.dataset.range === activeRange;
    button.classList.toggle("active", isActive);
  });
}

function clearQuickButtonStyle() {
  quickRangeButtons.forEach((button) => {
    button.classList.remove("active");
  });
}

async function loadHistory() {
  try {
    setLoading();

    const url = buildHistoryUrl();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("환율 데이터를 불러오지 못했습니다.");
    }

    const analysis = await response.json();

    if (!analysis || !analysis.histories || analysis.histories.length === 0) {
      renderEmpty();
      return;
    }

    const viewModel = createExchangeViewModel(analysis);

    renderDecision(viewModel);
    renderSummary(viewModel);
    renderChart(viewModel);
    renderMonthlyAnalysis(viewModel);
    renderTable(viewModel);
  } catch (error) {
    console.error(error);
    renderError();
  }
}

function buildHistoryUrl() {
  const params = new URLSearchParams();

  const from = selectedFromDate || extractDateValue(fromDateInput.value, "start");
  const to = selectedToDate || extractDateValue(toDateInput.value, "end");
  const limit = limitSelect.value;

  if (from && to) {
    params.append("from", from);
    params.append("to", to);
  }

  if (limit) {
    params.append("limit", limit);
  }

  const baseUrl = `/api/rates/history/${currencyCode}/analysis`;
  const queryString = params.toString();

  if (!queryString) {
    return baseUrl;
  }

  return `${baseUrl}?${queryString}`;
}

function createExchangeViewModel(analysis) {
  const histories = [...(analysis.histories || [])]
    .filter((item) => item && item.rateDate && item.rate !== null && item.rate !== undefined)
    .sort((a, b) => String(a.rateDate).localeCompare(String(b.rateDate)));

  const chartItems = [...(analysis.chartPoints || [])]
    .filter((item) => item && item.rateDate && item.rate !== null && item.rate !== undefined)
    .sort((a, b) => String(a.rateDate).localeCompare(String(b.rateDate)))
    .map((item) => {
      return {
        ...item,
        rate: Number(item.rate),
        advantagePercent: Number(item.advantagePercent),
        statusKey: normalizeStatusKey(item.status),
        statusLabel: item.statusLabel || getStatusLabel(item.status),
      };
    });

  const monthlyJudgements = [...(analysis.monthlyJudgements || [])]
    .filter((item) => item && item.month)
    .map((item) => {
      return {
        ...item,
        averageRate: Number(item.averageRate),
        advantagePercent: Number(item.advantagePercent),
        statusKey: normalizeStatusKey(item.status),
        statusLabel: item.statusLabel || getStatusLabel(item.status),
        summaryText: item.summaryText || "-",
      };
    });

  const currentJudgement = normalizeJudgement(analysis.currentJudgement);

  const latestRate = Number(analysis.latestRate?.rate ?? histories[histories.length - 1]?.rate);
  const latestDate = analysis.latestRate?.rateDate ?? histories[histories.length - 1]?.rateDate ?? "-";

  const minRate = Number(analysis.minRate?.rate);
  const maxRate = Number(analysis.maxRate?.rate);

  const minDate = analysis.minRate?.rateDate ?? "-";
  const maxDate = analysis.maxRate?.rateDate ?? "-";

  const periodAverage = Number(analysis.periodAverageRate);

  return {
    raw: analysis,
    histories,
    chartItems,
    monthlyJudgements,
    periodAverage,
    latestRate,
    latestDate,
    minRate,
    maxRate,
    minDate,
    maxDate,
    currentJudgement,
    fromDate: analysis.fromDate || fromDateInput.value || "-",
    toDate: analysis.toDate || toDateInput.value || "-",
    totalCount: analysis.totalCount || histories.length,
  };
}

function normalizeJudgement(judgement) {
  if (!judgement) {
    return {
      status: "NONE",
      statusKey: "none",
      statusLabel: "데이터 없음",
      statusTitle: "판단할 환율 데이터가 없습니다",
      statusDescription: "선택한 기간에 저장된 환율 데이터가 없습니다.",
      advantagePercent: 0,
      differenceText: "-",
    };
  }

  return {
    status: judgement.status || "NONE",
    statusKey: normalizeStatusKey(judgement.status),
    statusLabel: judgement.statusLabel || getStatusLabel(judgement.status),
    statusTitle: judgement.statusTitle || "-",
    statusDescription: judgement.statusDescription || "-",
    advantagePercent: Number(judgement.advantagePercent ?? 0),
    differenceText: judgement.differenceText || "-",
  };
}

function normalizeStatusKey(status) {
  const value = String(status || "NONE").toUpperCase();

  if (value === "GOOD") {
    return "good";
  }

  if (value === "BAD") {
    return "bad";
  }

  if (value === "NORMAL") {
    return "normal";
  }

  return "none";
}

function getStatusLabel(status) {
  const value = String(status || "NONE").toUpperCase();

  if (value === "GOOD") {
    return "추천";
  }

  if (value === "BAD") {
    return "비추천";
  }

  if (value === "NORMAL") {
    return "보통";
  }

  return "데이터 없음";
}

function setLoading() {
  chartSummary.textContent = "환율 데이터를 불러오는 중입니다.";

  decisionBadge.textContent = "분석 중";
  decisionBadge.className = "exchange-decision-badge status-normal";
  decisionTitle.textContent = "환율 데이터를 불러오는 중";
  decisionDescription.textContent = "선택한 기간의 평균 환율과 현재 환율을 비교합니다.";
  currentRateValue.textContent = "-";
  decisionAverageRate.textContent = "-";
  decisionDate.textContent = "-";
}

function renderDecision(viewModel) {
  const judgement = viewModel.currentJudgement;

  decisionCard.className = `exchange-decision-card status-${judgement.statusKey}`;
  decisionBadge.className = `exchange-decision-badge status-${judgement.statusKey}`;
  decisionBadge.textContent = judgement.statusLabel;

  decisionDate.textContent = viewModel.latestDate;
  decisionTitle.textContent = judgement.statusTitle;
  decisionDescription.textContent = judgement.statusDescription;
  currentRateValue.textContent = `${formatKrw(viewModel.latestRate)} 원`;
  decisionAverageRate.textContent = `${formatKrw(viewModel.periodAverage)} 원`;
}

function renderSummary(viewModel) {
  const judgement = viewModel.currentJudgement;

  chartSummary.textContent =
    `${viewModel.fromDate} ~ ${viewModel.toDate} / 기준 평균 ${formatKrw(viewModel.periodAverage)}원 / 총 ${viewModel.totalCount}건`;

  latestRateDateEl.textContent = viewModel.latestDate;
  latestRateEl.textContent = `${formatKrw(viewModel.latestRate)} 원`;

  periodAverageRateEl.textContent = `${formatKrw(viewModel.periodAverage)} 원`;
  periodAverageTextEl.textContent = `${viewModel.fromDate} ~ ${viewModel.toDate}`;

  differencePercentEl.textContent = formatSignedPercent(judgement.advantagePercent);
  differenceTextEl.textContent = judgement.differenceText;
  differenceMetricCard.className = `exchange-metric-card status-${judgement.statusKey}`;

  minRateValueEl.textContent = `${formatKrw(viewModel.minRate)} 원`;
  minRateDateEl.textContent = viewModel.minDate;

  maxRateValueEl.textContent = `${formatKrw(viewModel.maxRate)} 원`;
  maxRateDateEl.textContent = viewModel.maxDate;
}

function renderChart(viewModel) {
  const labels = viewModel.chartItems.map((item) => formatShortDate(item.rateDate));
  const advantageData = viewModel.chartItems.map((item) => Number(item.advantagePercent.toFixed(2)));
  const zeroLineData = viewModel.chartItems.map(() => 0);

  if (rateChart) {
    rateChart.destroy();
  }

  const pointColors = viewModel.chartItems.map((item) => {
    return getChartColorByStatus(item.statusKey);
  });

  rateChart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "평균선",
          data: zeroLineData,
          borderColor: "#94a3b8",
          borderDash: [6, 6],
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0,
        },
        {
          label: "여행 유리도",
          data: advantageData,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.08)",
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 3,
          tension: 0.32,
          fill: {
            target: "origin",
            above: "rgba(37, 99, 235, 0.10)",
            below: "rgba(251, 146, 60, 0.12)",
          },
          segment: {
            borderColor: (context) => {
              const index = context.p1DataIndex;
              const item = viewModel.chartItems[index];

              return getChartColorByStatus(item?.statusKey);
            },
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        tooltip: {
          padding: 12,
          backgroundColor: "#0f172a",
          titleColor: "#ffffff",
          bodyColor: "#e5e7eb",
          callbacks: {
            title: (items) => {
              const index = items[0].dataIndex;
              return viewModel.chartItems[index]?.rateDate || "";
            },
            label: (context) => {
              if (context.dataset.label === "평균선") {
                return `기준 평균: ${formatKrw(viewModel.periodAverage)} 원`;
              }

              const item = viewModel.chartItems[context.dataIndex];

              return [
                `환율: ${formatKrw(item.rate)} 원`,
                `평균 대비: ${formatSignedPercent(item.advantagePercent)}`,
                `판단: ${item.statusLabel}`,
              ];
            },
          },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            maxTicksLimit: 8,
            color: "#64748b",
            font: {
              size: 12,
              weight: "700",
            },
          },
        },
        y: {
          beginAtZero: false,
          grid: {
            color: (context) => {
              if (context.tick.value === 0) {
                return "#94a3b8";
              }

              return "rgba(226, 232, 240, 0.8)";
            },
          },
          ticks: {
            color: "#64748b",
            font: {
              size: 12,
              weight: "700",
            },
            callback: (value) => {
              const number = Number(value);
            if(Number.isNaN(number)){
                  return "-";
            }
            if(Math.abs(number) < 0.05){
                return "0.0%";
            }

            const formatted = Math.abs(number).toFixed(1);

              if (number > 0) {
                return `+${formatted}%`;
              }

              return `-${formatted}%`;
            },
          },
        },
      },
    },
  });
}

function getChartColorByStatus(statusKey) {
  if (statusKey === "good") {
    return "#2563eb";
  }

  if (statusKey === "bad") {
    return "#fb923c";
  }

  return "#64748b";
}

function renderMonthlyAnalysis(viewModel) {
  const monthlyJudgements = viewModel.monthlyJudgements || [];

  if (monthlyJudgements.length === 0) {
    renderEmptyMonthlyAnalysis();
    return;
  }

  const sortedByAverage = [...monthlyJudgements].sort((a, b) => {
    return Number(a.averageRate) - Number(b.averageRate);
  });

  const lowestMonth = sortedByAverage[0];
  const highestMonth = sortedByAverage[sortedByAverage.length - 1];

  renderMonthSummaryItem(lowestMonthEl, lowestMonthRateEl, lowestMonth);
  renderMonthSummaryItem(highestMonthEl, highestMonthRateEl, highestMonth);

  renderMonthlyJudgementCards(monthlyJudgements);
  renderMonthlyAverageTable(monthlyJudgements);
}

function renderMonthSummaryItem(monthElement, rateElement, monthlyJudgement) {
  if (!monthlyJudgement) {
    monthElement.textContent = "-";
    rateElement.textContent = "-";
    return;
  }

  monthElement.textContent = formatMonthLabel(monthlyJudgement.month);
  rateElement.textContent =
    `평균 ${formatKrw(monthlyJudgement.averageRate)} 원 · ${escapeHtml(monthlyJudgement.summaryText)}`;
}

function renderMonthlyJudgementCards(monthlyJudgements) {
  monthlyJudgementGrid.innerHTML = "";

  monthlyJudgements.forEach((item) => {
    const card = document.createElement("article");
    card.className = `exchange-month-card status-${item.statusKey}`;

    card.innerHTML = `
      <div class="exchange-month-card-top">
        <span>${escapeHtml(formatMonthLabel(item.month))}</span>
        <strong>${escapeHtml(item.statusLabel)}</strong>
      </div>

      <div class="exchange-month-card-rate">
        ${formatKrw(item.averageRate)} 원
      </div>

      <p>
        ${escapeHtml(item.summaryText)}
      </p>
    `;

    monthlyJudgementGrid.appendChild(card);
  });
}

function renderMonthlyAverageTable(monthlyJudgements) {
  monthlyAverageTableBody.innerHTML = "";

  monthlyJudgements.forEach((item) => {
    const tr = document.createElement("tr");
    tr.className = `exchange-row-${item.statusKey}`;

    tr.innerHTML = `
      <td>${escapeHtml(formatMonthLabel(item.month))}</td>
      <td class="text-end fw-semibold">${formatKrw(item.averageRate)} 원</td>
      <td class="text-end">${escapeHtml(formatSignedPercent(item.advantagePercent))}</td>
      <td class="text-end">${escapeHtml(item.count)}건</td>
    `;

    monthlyAverageTableBody.appendChild(tr);
  });
}

function renderEmptyMonthlyAnalysis() {
  lowestMonthEl.textContent = "-";
  lowestMonthRateEl.textContent = "-";
  highestMonthEl.textContent = "-";
  highestMonthRateEl.textContent = "-";

  monthlyJudgementGrid.innerHTML = `
    <div class="exchange-empty-card">
      월별 평균 환율 데이터가 없습니다.
    </div>
  `;

  monthlyAverageTableBody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center text-muted">
        월별 평균 환율 데이터가 없습니다.
      </td>
    </tr>
  `;
}

function renderTable(viewModel) {
  historyTableBody.innerHTML = "";

  const reversedHistory = [...viewModel.chartItems].reverse();

  reversedHistory.forEach((item) => {
    const tr = document.createElement("tr");
    tr.className = `exchange-row-${item.statusKey}`;

    tr.innerHTML = `
      <td>${escapeHtml(item.rateDate)}</td>
      <td>${escapeHtml(currencyCode)}</td>
      <td class="text-end fw-semibold">${formatKrw(item.rate)} 원</td>
      <td class="text-end">${escapeHtml(formatSignedPercent(item.advantagePercent))}</td>
      <td class="text-end">
        <span class="exchange-table-status status-${escapeHtml(item.statusKey)}">
          ${escapeHtml(item.statusLabel)}
        </span>
      </td>
    `;

    historyTableBody.appendChild(tr);
  });
}

function renderEmpty() {
  chartSummary.textContent = "저장된 환율 데이터가 없습니다.";

  decisionBadge.textContent = "데이터 없음";
  decisionBadge.className = "exchange-decision-badge status-none";
  decisionTitle.textContent = "저장된 환율 데이터 없음";
  decisionDescription.textContent = "선택한 기간에 저장된 환율 데이터가 없습니다.";
  currentRateValue.textContent = "-";
  decisionAverageRate.textContent = "-";
  decisionDate.textContent = "-";

  latestRateEl.textContent = "-";
  latestRateDateEl.textContent = "-";
  periodAverageRateEl.textContent = "-";
  periodAverageTextEl.textContent = "-";
  differencePercentEl.textContent = "-";
  differenceTextEl.textContent = "-";
  minRateValueEl.textContent = "-";
  minRateDateEl.textContent = "-";
  maxRateValueEl.textContent = "-";
  maxRateDateEl.textContent = "-";

  renderEmptyMonthlyAnalysis();

  historyTableBody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center text-muted">
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

  decisionBadge.textContent = "오류";
  decisionBadge.className = "exchange-decision-badge status-bad";
  decisionTitle.textContent = "환율 데이터 조회 실패";
  decisionDescription.textContent = "잠시 후 다시 조회해 주세요.";
  currentRateValue.textContent = "-";
  decisionAverageRate.textContent = "-";
  decisionDate.textContent = "-";

  latestRateEl.textContent = "-";
  latestRateDateEl.textContent = "-";
  periodAverageRateEl.textContent = "-";
  periodAverageTextEl.textContent = "-";
  differencePercentEl.textContent = "-";
  differenceTextEl.textContent = "-";
  minRateValueEl.textContent = "-";
  minRateDateEl.textContent = "-";
  maxRateValueEl.textContent = "-";
  maxRateDateEl.textContent = "-";

  renderEmptyMonthlyAnalysis();

  historyTableBody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center text-danger">
        환율 데이터를 불러오지 못했습니다.
      </td>
    </tr>
  `;

  if (rateChart) {
    rateChart.destroy();
    rateChart = null;
  }
}

function formatMonthLabel(month) {
  if (!month) {
    return "-";
  }

  const [year, monthValue] = String(month).split("-");

  if (!year || !monthValue) {
    return month;
  }

  return `${year}년 ${Number(monthValue)}월`;
}

function formatShortDate(dateText) {
  if (!dateText) {
    return "-";
  }

  const parts = String(dateText).split("-");

  if (parts.length !== 3) {
    return dateText;
  }

  return `${Number(parts[1])}/${Number(parts[2])}`;
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

function formatSignedPercent(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "-";
  }

  if (Math.abs(number) < 0.05) {
    return "0.0%";
  }

  const formatted = Math.abs(number).toFixed(1);

  if (number > 0) {
    return `+${formatted}%`;
  }

  return `-${formatted}%`;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}