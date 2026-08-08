const currencyRates = window.__CURRENCY_RATES__ || [];
let countryRates = window.__COUNTRY_RATES__ || [];

const fromAmountInput = document.getElementById("fromAmount");
const toAmountInput = document.getElementById("toAmount");
const fromCurrencySelect = document.getElementById("fromCurrencySelect");
const toCurrencySelect = document.getElementById("toCurrencySelect");
const swapCurrencyBtn = document.getElementById("swapCurrencyBtn");

const rateGrid = document.getElementById("rateGrid");
const rateSummary = document.getElementById("rateSummary");
const rateInfoText = document.getElementById("rateInfoText");
const currencySearchInput = document.getElementById("currencySearchInput");
const regionFilterButtons = document.querySelectorAll(".region-filter-btn");
const converterResultMessage = document.getElementById("converterResultMessage");
const converterInsightCurrency = document.getElementById("converterInsightCurrency");
const converterInsightRate = document.getElementById("converterInsightRate");
const converterInsightBadge = document.getElementById("converterInsightBadge");
const converterInsightText = document.getElementById("converterInsightText");
const periodButtons = document.querySelectorAll(".rate-period-btn");


const NO_DECIMAL_CODES = new Set(["KRW", "JPY", "IDR", "VND"]);

let isComposing = false;
let selectedRegion = "ALL";
let selectedRange = "12m";

const krwRate = {
  countryCode: "KR",
  countryName: "대한민국",
  region: "ASIA",
  currencyCode: "KRW",
  currencyName: "원",
  symbol: "₩",
  unit: 1,
  rate: 1,
  rateDate: getLatestRateDate(currencyRates),
  source: "BASE",
  averageRate: 1,
  judgement: {
    status: "NORMAL",
    statusLabel: "기준",
    statusTitle: "기준 통화",
    statusDescription: "원화는 환율 변환의 기준 통화입니다.",
    advantagePercent: 0,
    differenceText: "기준 통화",
  },
};

const currencies = [krwRate, ...currencyRates];

document.addEventListener("DOMContentLoaded", init);

function init() {
  renderCurrencyOptions();
  setDefaultCurrencies();
  renderRateInfo();
  renderSummary();
  bindEvents();
  calculateAndRender();
}

function bindEvents() {
  fromAmountInput.addEventListener("input", handleAmountInput);

  fromCurrencySelect.addEventListener("change", calculateAndRender);
  toCurrencySelect.addEventListener("change", calculateAndRender);

  swapCurrencyBtn.addEventListener("click", swapCurrencies);

  if (currencySearchInput) {
    currencySearchInput.addEventListener("compositionstart", () => {
      isComposing = true;
    });

    currencySearchInput.addEventListener("compositionend", () => {
      isComposing = false;
      calculateAndRender();
    });

    currencySearchInput.addEventListener("input", () => {
      if (isComposing) {
        return;
      }

      calculateAndRender();
    });
   }

  regionFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedRegion = button.dataset.region || "ALL";

      regionFilterButtons.forEach((btn) => {
        btn.classList.remove("active");
      });

      button.classList.add("active");
      calculateAndRender();
    });
  });
periodButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const range = button.dataset.range || "12m";

    periodButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    selectedRange = range;

    await loadCountryRateSummaries(range);
  });
});

}


function handleAmountInput(event) {
  const onlyNumber = event.target.value.replace(/[^0-9]/g, "");

  if (onlyNumber === "") {
    event.target.value = "";
    toAmountInput.value = "";
    calculateAndRender();
    return;
  }

  const amount = Number(onlyNumber);
  event.target.value = amount.toLocaleString("ko-KR");

  calculateAndRender();
}

function swapCurrencies() {
  const fromCode = fromCurrencySelect.value;
  const toCode = toCurrencySelect.value;

  fromCurrencySelect.value = toCode;
  toCurrencySelect.value = fromCode;

  calculateAndRender();
}

function renderCurrencyOptions() {
  const optionHtml = currencies
    .map((currency) => {
      return `
        <option value="${escapeHtml(currency.currencyCode)}">
          ${escapeHtml(currency.countryName)} - ${escapeHtml(currency.currencyName)}
        </option>
      `;
    })
    .join("");

  fromCurrencySelect.innerHTML = optionHtml;
  toCurrencySelect.innerHTML = optionHtml;
}

function setDefaultCurrencies() {
  fromCurrencySelect.value = "KRW";

  const hasUsd = currencies.some((currency) => {
    return currency.currencyCode === "USD";
  });

  toCurrencySelect.value = hasUsd
    ? "USD"
    : currencies[1]?.currencyCode || "KRW";
}

function calculateAndRender() {
  const amount = parseNumber(fromAmountInput.value);
  const fromCurrency = findCurrency(fromCurrencySelect.value);
  const toCurrency = findCurrency(toCurrencySelect.value);
  const filteredCountryRates = filterCountryRates();

    if (!fromCurrency || !toCurrency) {
      toAmountInput.value = "";
      renderConverterMessage(0, fromCurrency, toCurrency, null);
      renderConverterInsight(toCurrency);
      renderGrid(filteredCountryRates, 0, fromCurrency);
      return;
    }

    if (!amount || amount <= 0) {
      toAmountInput.value = "";
      renderConverterMessage(0, fromCurrency, toCurrency, null);
      renderConverterInsight(toCurrency);
      renderGrid(filteredCountryRates, 0, fromCurrency);
      return;
    }

    const result = convertCurrency(amount, fromCurrency, toCurrency);
    toAmountInput.value = formatCurrencyAmount(toCurrency, result);

    renderConverterMessage(amount, fromCurrency, toCurrency, result);
    renderConverterInsight(toCurrency);
    renderGrid(filteredCountryRates, amount, fromCurrency);
}

function filterCountryRates() {
  if (isComposing) {
    return countryRates;
  }

  const keyword = currencySearchInput
    ? currencySearchInput.value.trim().toLowerCase()
    : "";

  return countryRates.filter((rate) => {
    const matchesRegion =
      selectedRegion === "ALL" ||
      normalizeRegion(rate.region) === selectedRegion;

    const matchesKeyword =
      keyword === "" ||
      includesKeyword(rate.countryName, keyword) ||
      includesKeyword(rate.currencyName, keyword) ||
      includesKeyword(rate.currencyCode, keyword) ||
      includesKeyword(rate.region, keyword);

    return matchesRegion && matchesKeyword;
  });
}

function convertCurrency(amount, fromCurrency, toCurrency) {
  const krwAmount = toKrw(amount, fromCurrency);
  return fromKrw(krwAmount, toCurrency);
}

function toKrw(amount, currency) {
  if (currency.currencyCode === "KRW") {
    return amount;
  }

  const rate = Number(currency.rate);
  const unit = Number(currency.unit);

  if (!rate || !unit) {
    return 0;
  }

  return amount * (rate / unit);
}

function fromKrw(krwAmount, currency) {
  if (currency.currencyCode === "KRW") {
    return krwAmount;
  }

  const rate = Number(currency.rate);
  const unit = Number(currency.unit);

  if (!rate || !unit) {
    return 0;
  }

  return (krwAmount * unit) / rate;
}

function renderRateInfo() {
  const latestDate = getLatestRateDate(currencyRates);

  if (!latestDate || latestDate === "-") {
    rateInfoText.textContent = "저장된 환율 데이터가 없습니다.";
    return;
  }

  rateInfoText.textContent = `기준일: ${latestDate}`;
}

function renderSummary() {
  if (!countryRates || countryRates.length === 0) {
    rateSummary.textContent = "저장된 환율 데이터가 없습니다.";
    return;
  }

  const latestDate = getLatestRateDate(countryRates);
  const rangeLabel = getRangeLabel(selectedRange);

  rateSummary.textContent = `기준일: ${latestDate} / ${countryRates.length}개 통화 / ${rangeLabel} 평균 기준`;
}

function renderConverterMessage(amount, fromCurrency, toCurrency, result) {
  if (!converterResultMessage) {
    return;
  }

  if (!amount || amount <= 0 || !fromCurrency || !toCurrency || result === null) {
    converterResultMessage.textContent = "금액을 입력하면 환산 결과를 알려드릴게요.";
    return;
  }

  const fromText = `${formatCurrencyAmount(fromCurrency, amount)} ${fromCurrency.currencyCode}`;
  const toText = `${formatCurrencyAmount(toCurrency, result)} ${toCurrency.currencyCode}`;

  converterResultMessage.textContent =
    `지금 환율 기준으로 ${fromText}은 약 ${toText}입니다.`;
}

function renderConverterInsight(toCurrency) {
  if (
    !converterInsightCurrency ||
    !converterInsightRate ||
    !converterInsightBadge ||
    !converterInsightText
  ) {
    return;
  }

  if (!toCurrency) {
    converterInsightCurrency.textContent = "선택 통화";
    converterInsightRate.textContent = "-";
    converterInsightBadge.textContent = "보통";
    converterInsightBadge.className = "converter-insight-badge status-normal";
    converterInsightText.textContent =
      "통화를 선택하면 현재 환율이 평균 대비 어떤 수준인지 알려드릴게요.";
    return;
  }

  const matchedCountryRate = findCountryRateByCurrencyCode(toCurrency.currencyCode);
  const targetRate = matchedCountryRate || toCurrency;
  const judgement = normalizeJudgement(targetRate.judgement || targetRate.judgment);

  converterInsightCurrency.textContent =
    `${targetRate.countryName || ""} ${targetRate.currencyName || ""} ${targetRate.currencyCode || ""}`.trim();

  converterInsightRate.textContent =
    `${formatKrw(targetRate.rate)}원`;

  converterInsightBadge.textContent = judgement.statusLabel;
  converterInsightBadge.className =
    `converter-insight-badge status-${judgement.statusKey}`;

  if (targetRate.currencyCode === "KRW") {
    converterInsightText.textContent =
      "원화는 환율 계산의 기준 통화입니다.";
    return;
  }

  const rangeLabel = getRangeLabel(selectedRange);
  const percentText = hasValidNumber(judgement.advantagePercent)
    ? formatSignedPercent(judgement.advantagePercent)
    : "-";

  converterInsightText.textContent =
    `${rangeLabel} 평균 기준 ${judgement.differenceText}입니다. \n 현재 차이는 ${percentText} 수준입니다.`;
}

function findCountryRateByCurrencyCode(currencyCode) {
  if (!currencyCode) {
    return null;
  }

  if (currencyCode === "KRW") {
    return krwRate;
  }

  return countryRates.find((rate) => {
    return rate.currencyCode === currencyCode;
  }) || null;
}



async function loadCountryRateSummaries(range) {
  try {
    setRateLoading(true);

    const response = await fetch(`/api/rates/countries/summary?range=${encodeURIComponent(range)}`);

    if (!response.ok) {
      throw new Error("국가별 환율 요약 API 호출 실패");
    }

    countryRates = await response.json();

    renderSummary();
    calculateAndRender();
  } catch (error) {
    console.error(error);
    rateSummary.textContent = "환율 정보를 불러오지 못했습니다.";
  } finally {
    setRateLoading(false);
  }
}

function setRateLoading(isLoading) {
  periodButtons.forEach((button) => {
    button.disabled = isLoading;
  });

  if (isLoading) {
    rateSummary.textContent = "선택한 기간 기준으로 환율 정보를 불러오는 중입니다.";
  }
}

function renderGrid(rates, amount, fromCurrency) {
  rateGrid.innerHTML = "";

  if (!rates || rates.length === 0) {
    renderEmptyGrid();
    return;
  }

  rates.forEach((rate) => {
    const card = createRateCard(rate, amount, fromCurrency);
    rateGrid.appendChild(card);
  });
}

function renderEmptyGrid() {
  rateGrid.innerHTML = `
    <div class="col-12">
      <div class="no-rate-result">
        검색 결과가 없습니다. 국가명, 통화명, 통화 코드를 다시 입력해 주세요.
      </div>
    </div>
  `;
}

function createRateCard(rate, amount, fromCurrency) {
  const card = document.createElement("div");
  card.className = "col-12 col-md-6 col-lg-4";
  card.innerHTML = createRateCardHtml(rate, amount, fromCurrency);
  return card;
}

function createRateCardHtml(rate, amount, fromCurrency) {
  const judgement = normalizeJudgement(rate.judgement || rate.judgment);
  const flagCode = getFlagImageCode(rate.countryCode);
const statusDescriptionHtml = formatDescriptionWithBreak(judgement.statusDescription);
  const calculatedAmount =
    amount > 0 && fromCurrency
      ? convertCurrency(amount, fromCurrency, rate)
      : null;

  const fromText =
    amount > 0 && fromCurrency
      ? `${formatCurrencyAmount(fromCurrency, amount)} ${fromCurrency.currencyCode}`
      : "-";

  const toText =
    calculatedAmount !== null
      ? `${escapeHtml(rate.symbol || "")} ${formatCurrencyAmount(rate, calculatedAmount)}`
      : "-";

  const averageRateText = hasValidNumber(rate.averageRate)
    ? `${formatKrw(rate.averageRate)} 원`
    : "-";

const rangeLabel = getRangeLabel(selectedRange);

  const advantagePercentText = hasValidNumber(judgement.advantagePercent)
    ? formatSignedPercent(judgement.advantagePercent)
    : "-";

  return `
    <div class="card h-100 rate-card rate-card-${escapeHtml(judgement.statusKey)}">
      <div class="card-body">

        <div class="rate-card-top">
          <div class="rate-country-head">
            <div class="rate-flag">
              <img
                src="https://flagcdn.com/w80/${escapeHtml(flagCode)}.png"
                alt="${escapeHtml(rate.countryName)} 국기"
                loading="lazy"
              >
            </div>

            <div>
              <h5 class="card-title">${escapeHtml(rate.countryName)}</h5>
              <p class="currency-name">
                ${escapeHtml(rate.currencyName)} (${escapeHtml(rate.currencyCode)})
              </p>
            </div>
          </div>

          <div class="rate-card-badges">
            <span class="region-badge">${escapeHtml(formatRegionName(rate.region))}</span>
            <span class="rate-judgement-badge status-${escapeHtml(judgement.statusKey)}">
              ${escapeHtml(judgement.statusLabel)}
            </span>
          </div>
        </div>

        <div class="rate-main-value">
          <span>현재 환율</span>
          <strong>${formatKrw(rate.rate)} 원</strong>
          <small>${escapeHtml(rate.rateDate || "-")}</small>
        </div>

        <div class="rate-analysis-box status-${escapeHtml(judgement.statusKey)}">
          <div class="rate-analysis-head">
            <strong>${escapeHtml(judgement.differenceText)}</strong>
            <span>${escapeHtml(advantagePercentText)}</span>
          </div>
          <p>${statusDescriptionHtml}</p>
        </div>

        <div class="rate-info-list compact">
          <div class="rate-info-row">
            <span>${escapeHtml(rangeLabel)} 평균</span>
            <strong>${escapeHtml(averageRateText)}</strong>
          </div>
        </div>

        <div class="calculated-box">
          <div class="small-label">예상 환전 금액</div>
          <div class="from-text">${escapeHtml(fromText)}</div>
          <div class="to-text">= ${escapeHtml(toText)}</div>
        </div>

        <a href="/exchange/${escapeHtml(rate.currencyCode)}" class="history-link">
          과거 환율 보기
        </a>
      </div>
    </div>
  `;
}

function normalizeJudgement(judgement) {
  if (!judgement) {
    return {
      status: "NONE",
      statusKey: "none",
      statusLabel: "데이터 없음",
      statusTitle: "판단 데이터 없음",
      statusDescription: "최근 12개월 평균 환율 데이터가 없어 비교할 수 없습니다.",
      advantagePercent: null,
      differenceText: "판단 데이터 없음",
    };
  }

  return {
    status: judgement.status || "NONE",
    statusKey: normalizeStatusKey(judgement.status),
    statusLabel: judgement.statusLabel || getStatusLabel(judgement.status),
    statusTitle: judgement.statusTitle || "-",
    statusDescription: judgement.statusDescription || "-",
    advantagePercent: judgement.advantagePercent,
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

function findCurrency(currencyCode) {
  return currencies.find((currency) => {
    return currency.currencyCode === currencyCode;
  });
}

function getLatestRateDate(rates) {
  if (!rates || rates.length === 0) {
    return "-";
  }

  const validDates = rates
    .map((rate) => rate.rateDate)
    .filter(Boolean)
    .sort();

  if (validDates.length === 0) {
    return "-";
  }

  return validDates[validDates.length - 1];
}

function parseNumber(value) {
  const onlyNumber = String(value || "").replace(/[^0-9]/g, "");

  if (!onlyNumber) {
    return 0;
  }

  return Number(onlyNumber);
}

function hasValidNumber(value) {
  const number = Number(value);
  return !Number.isNaN(number);
}

function formatCurrencyAmount(currency, amount) {
  const number = Number(amount);

  if (Number.isNaN(number)) {
    return "-";
  }

  const currencyCode = currency?.currencyCode || "";

  if (NO_DECIMAL_CODES.has(currencyCode)) {
    return Math.round(number).toLocaleString("ko-KR");
  }

  return number.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

function formatRegionName(region) {
  const normalizedRegion = normalizeRegion(region);

  switch (normalizedRegion) {
    case "ASIA":
      return "ASIA";
    case "EUROPE":
      return "EUROPE";
    case "AMERICA":
    case "NORTH_AMERICA":
      return "AMERICA";
    case "OCEANIA":
      return "OCEANIA";
    case "MIDDLE_EAST":
      return "MIDDLE EAST";
    default:
      return region || "-";
  }
}

function normalizeRegion(region) {
  if (!region) {
    return "";
  }

  return String(region).trim().toUpperCase().replaceAll(" ", "_");
}

function includesKeyword(value, keyword) {
  if (!value) {
    return false;
  }

  return String(value).toLowerCase().includes(keyword);
}

function getFlagImageCode(countryCode) {
  if (!countryCode) {
    return "un";
  }

  const normalizedCode = String(countryCode).trim().toUpperCase();

  const countryCodeMap = {
    UK: "GB",
    UAE: "AE",
  };

  const code = countryCodeMap[normalizedCode] || normalizedCode;

  if (code.length !== 2) {
    return "un";
  }

  return code.toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function formatDescriptionWithBreak(value) {
  return escapeHtml(value)
    .replace("큰 차이가 없어 ", "큰 차이가 없어<br>")
    .replace("환율이 높아 ", "환율이 높아<br>")
    .replace("환율이 낮아 ", "환율이 낮아<br>");
}
function renderSummary() {
  if (!countryRates || countryRates.length === 0) {
    rateSummary.textContent = "저장된 환율 데이터가 없습니다.";
    return;
  }

  const latestDate = getLatestRateDate(countryRates);
  const rangeLabel = getRangeLabel(selectedRange);

  rateSummary.textContent = `기준일: ${latestDate} / ${countryRates.length}개 통화 / ${rangeLabel} 평균 기준`;
}function getRangeLabel(range) {
   switch (range) {
     case "7d":
       return "최근 1주일";
     case "1m":
       return "최근 1개월";
     case "3m":
       return "최근 3개월";
     case "6m":
       return "최근 6개월";
     case "12m":
       return "최근 12개월";
     case "all":
       return "전체 기간";
     default:
       return "최근 12개월";
   }
 }