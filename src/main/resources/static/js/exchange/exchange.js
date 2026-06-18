const currencyRates = window.__CURRENCY_RATES__ || [];
const countryRates = window.__COUNTRY_RATES__ || [];

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

const NO_DECIMAL_CODES = new Set(["KRW", "JPY", "IDR", "VND"]);

let isComposing = false;
let selectedRegion = "ALL";

const krwRate = {
  currencyCode: "KRW",
  countryName: "대한민국",
  currencyName: "원",
  symbol: "₩",
  unit: 1,
  rate: 1,
  rateDate: getLatestRateDate(currencyRates),
  source: "BASE",
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

  if (!amount || amount <= 0) {
    toAmountInput.value = "";
    renderGrid(filteredCountryRates, 0, fromCurrency);
    return;
  }

  if (!fromCurrency || !toCurrency) {
    toAmountInput.value = "";
    renderGrid(filteredCountryRates, 0, fromCurrency);
    return;
  }

  const result = convertCurrency(amount, fromCurrency, toCurrency);
  toAmountInput.value = formatCurrencyAmount(toCurrency, result);

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

  if (!latestDate) {
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
  rateSummary.textContent = `기준일: ${latestDate} / ${countryRates.length}개 통화`;
}

function renderGrid(rates, amount, fromCurrency) {
  rateGrid.innerHTML = "";

  if (!rates || rates.length === 0) {
    rateGrid.innerHTML = `
      <div class="col-12">
        <div class="no-rate-result">
          검색 결과가 없습니다. 국가명, 통화명, 통화 코드를 다시 입력해 주세요.
        </div>
      </div>
    `;
    return;
  }

  rates.forEach((rate) => {
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

    const card = document.createElement("div");
    card.className = "col-12 col-md-6 col-lg-4";

    card.innerHTML = `
      <div class="card h-100 rate-card">
        <div class="card-body">
          <div class="rate-card-top">
            <div>
              <h5 class="card-title">${escapeHtml(rate.countryName)}</h5>
              <p class="currency-name">
                ${escapeHtml(rate.currencyName)} (${escapeHtml(rate.currencyCode)})
              </p>
            </div>
            <span class="region-badge">${escapeHtml(formatRegionName(rate.region))}</span>
          </div>

          <div class="rate-info-list">
            <div class="rate-info-row">
              <span>기준일</span>
              <strong>${escapeHtml(rate.rateDate || "-")}</strong>
            </div>

            <div class="rate-info-row">
              <span>환율</span>
              <strong>${formatKrw(rate.rate)} 원</strong>
            </div>

            <div class="rate-info-row">
              <span>기준 단위</span>
              <strong>${escapeHtml(rate.unit)}${escapeHtml(rate.currencyName)}</strong>
            </div>
          </div>

          <div class="calculated-box">
            <div class="small-label">입력 금액 기준</div>
            <div class="from-text">${escapeHtml(fromText)}</div>
            <div class="to-text">= ${escapeHtml(toText)}</div>
          </div>

          <a href="/exchange/${escapeHtml(rate.currencyCode)}" class="history-link">
            과거 환율 보기
          </a>
        </div>
      </div>
    `;

    rateGrid.appendChild(card);
  });
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}