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

const NO_DECIMAL_CODES = new Set(["KRW", "JPY", "IDR", "VND"]);

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

function init() {
  renderCurrencyOptions();
  setDefaultCurrencies();
  renderRateInfo();
  renderSummary();
  renderGrid(countryRates, 0, krwRate);

  bindEvents();
  calculateAndRender();
}

function bindEvents() {
  fromAmountInput.addEventListener("input", (event) => {
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
  });

  fromCurrencySelect.addEventListener("change", calculateAndRender);
  toCurrencySelect.addEventListener("change", calculateAndRender);

  swapCurrencyBtn.addEventListener("click", () => {
    const fromCode = fromCurrencySelect.value;
    const toCode = toCurrencySelect.value;

    fromCurrencySelect.value = toCode;
    toCurrencySelect.value = fromCode;

    calculateAndRender();
  });
}

function renderCurrencyOptions() {
  const optionHtml = currencies
    .map((currency) => {
      return `
        <option value="${currency.currencyCode}">
          ${currency.countryName} - ${currency.currencyName}
        </option>
      `;
    })
    .join("");

  fromCurrencySelect.innerHTML = optionHtml;
  toCurrencySelect.innerHTML = optionHtml;
}

function setDefaultCurrencies() {
  fromCurrencySelect.value = "KRW";

  const hasUsd = currencies.some((currency) => currency.currencyCode === "USD");
  toCurrencySelect.value = hasUsd
    ? "USD"
    : currencies[1]?.currencyCode || "KRW";
}

function calculateAndRender() {
  const amount = parseNumber(fromAmountInput.value);
  const fromCurrency = findCurrency(fromCurrencySelect.value);
  const toCurrency = findCurrency(toCurrencySelect.value);

  if (!amount || amount <= 0) {
    toAmountInput.value = "";
    renderGrid(countryRates, 0, fromCurrency);
    return;
  }

  if (!fromCurrency || !toCurrency) {
    toAmountInput.value = "";
    return;
  }

  const result = convertCurrency(amount, fromCurrency, toCurrency);
  toAmountInput.value = formatCurrencyAmount(toCurrency, result);

  renderGrid(countryRates, amount, fromCurrency);
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

  return amount * (rate / unit);
}

function fromKrw(krwAmount, currency) {
  if (currency.currencyCode === "KRW") {
    return krwAmount;
  }

  const rate = Number(currency.rate);
  const unit = Number(currency.unit);

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
        <div class="alert alert-warning mb-0">
          저장된 환율 데이터가 없습니다. 관리자 API로 환율 데이터를 먼저 저장해 주세요.
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
        ? `${rate.symbol} ${formatCurrencyAmount(rate, calculatedAmount)}`
        : "-";

    const card = document.createElement("div");
    card.className = "col-12 col-md-6 col-lg-4";

    card.innerHTML = `
      <div class="card h-100 shadow-sm rate-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="card-title fw-bold mb-1">${rate.countryName}</h5>
              <p class="text-muted mb-0">
                ${rate.currencyName} (${rate.currencyCode})
              </p>
            </div>
            <span class="badge text-bg-light">${rate.region}</span>
          </div>

          <div class="border-top pt-3">
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">기준일</span>
              <span>${rate.rateDate}</span>
            </div>

            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">환율</span>
              <span class="fw-semibold">
                ${formatKrw(rate.rate)} 원
              </span>
            </div>

            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">기준 단위</span>
              <span>${rate.unit}${rate.currencyName}</span>
            </div>

            <div class="bg-light rounded-3 p-3 mt-3">
              <div class="small text-muted mb-1">입력 금액 기준</div>
              <div class="fw-semibold">
                ${fromText}
              </div>
              <div class="fw-bold text-primary mt-1">
                = ${toText}
              </div>
            </div>
          </div>

          <a href="/exchange/${rate.currencyCode}" class="btn btn-outline-primary btn-sm w-100 mt-4">
            과거 환율 보기
          </a>
        </div>
      </div>
    `;

    rateGrid.appendChild(card);
  });
}

function findCurrency(currencyCode) {
  return currencies.find((currency) => currency.currencyCode === currencyCode);
}

function parseNumber(value) {
  const onlyNumber = String(value).replace(/[^0-9]/g, "");

  if (onlyNumber === "") {
    return 0;
  }

  return Number(onlyNumber);
}

function formatCurrencyAmount(currency, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "";
  }

  const number = Number(value);
  const noDecimal = NO_DECIMAL_CODES.has(currency.currencyCode);

  const formatted = noDecimal
    ? Math.floor(number).toLocaleString("ko-KR")
    : number.toLocaleString("ko-KR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  return formatted;
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

function getLatestRateDate(rates) {
  if (!rates || rates.length === 0) {
    return "";
  }

  return rates[0].rateDate;
}

document.addEventListener("DOMContentLoaded", init);
