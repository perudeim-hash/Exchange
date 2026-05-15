const AIRPORT_CACHE_KEY = "travelMoney.airports";

const resultSummary = document.getElementById("resultSummary");
const flightResultGrid = document.getElementById("flightResultGrid");

const compactSearchBar = document.getElementById("compactSearchBar");
const compactRouteText = document.getElementById("compactRouteText");
const compactConditionText = document.getElementById("compactConditionText");

const resultsSearchPanel = document.getElementById("resultsSearchPanel");
const resultsSearchDim = document.getElementById("resultsSearchDim");
const closeResultsSearchPanelBtn = document.getElementById("closeResultsSearchPanelBtn");

const originAirportInput = document.getElementById("originAirportInput");
const destinationAirportInput = document.getElementById("destinationAirportInput");
const originAirportCodeBadge = document.getElementById("originAirportCodeBadge");
const destinationAirportCodeBadge = document.getElementById("destinationAirportCodeBadge");
const originAirportDropdown = document.getElementById("originAirportDropdown");
const destinationAirportDropdown = document.getElementById("destinationAirportDropdown");

const departureDateInput = document.getElementById("departureDateInput");
const returnDateInput = document.getElementById("returnDateInput");
const returnDateField = document.getElementById("returnDateField");

const travelerPickerButton = document.getElementById("travelerPickerButton");
const travelerPopover = document.getElementById("travelerPopover");
const travelerSummaryText = document.getElementById("travelerSummaryText");

const adultMinusBtn = document.getElementById("adultMinusBtn");
const adultPlusBtn = document.getElementById("adultPlusBtn");
const adultCountText = document.getElementById("adultCountText");

const childMinusBtn = document.getElementById("childMinusBtn");
const childPlusBtn = document.getElementById("childPlusBtn");
const childCountText = document.getElementById("childCountText");

const infantMinusBtn = document.getElementById("infantMinusBtn");
const infantPlusBtn = document.getElementById("infantPlusBtn");
const infantCountText = document.getElementById("infantCountText");

const travelerApplyBtn = document.getElementById("travelerApplyBtn");

const seatClassSelect = document.getElementById("seatClassSelect");
const connectionTypeSelect = document.getElementById("connectionTypeSelect");
const sortSelect = document.getElementById("sortSelect");
const resultsSearchBtn = document.getElementById("resultsSearchBtn");
const swapAirportBtn = document.getElementById("swapAirportBtn");

const resultSortSelect = document.getElementById("resultSortSelect");

const connectionFilterInputs = document.querySelectorAll("input[name='connectionFilter']");
const seatClassFilterInputs = document.querySelectorAll("input[name='seatClassFilter']");
const tripTypeButtons = document.querySelectorAll("[data-trip-type]");

let airports = [];

let selectedOriginAirport = null;
let selectedDestinationAirport = null;

let selectedTripType = "ROUND_TRIP";

let adultCount = 1;
let childCount = 0;
let infantCount = 0;

let isOriginComposing = false;
let isDestinationComposing = false;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  initializeControlsFromUrl();
  initializeDateLimits();
  bindEvents();
  renderTravelerCount();

  loadAirportsFromCache();
  await loadAirports();

  fetchFlightResults();
}

function initializeControlsFromUrl() {
  const params = getCurrentParams();
  const today = getTodayText();

  selectedTripType = params.get("tripType") === "ONE_WAY" ? "ONE_WAY" : "ROUND_TRIP";

  if (departureDateInput) {
    const requestedDepartureDate = params.get("departureDate");
    departureDateInput.value =
      requestedDepartureDate && requestedDepartureDate >= today
        ? requestedDepartureDate
        : today;
  }

  if (returnDateInput) {
    const requestedReturnDate = params.get("returnDate");
    const minimumReturnDate = addDays(departureDateInput?.value || today, 1);

    returnDateInput.value =
      requestedReturnDate && requestedReturnDate >= minimumReturnDate
        ? requestedReturnDate
        : minimumReturnDate;
  }

  renderTripTypeControls();

  adultCount = Number(params.get("adultCount") || 1);
  childCount = Number(params.get("childCount") || 0);
  infantCount = Number(params.get("infantCount") || 0);

  seatClassSelect.value = params.get("seatClass") || "";
  connectionTypeSelect.value = params.get("connectionType") || "";
  sortSelect.value = params.get("sort") || "PRICE_ASC";
  resultSortSelect.value = params.get("sort") || "PRICE_ASC";

  const connectionType = params.get("connectionType") || "";
  connectionFilterInputs.forEach((input) => {
    input.checked = input.value === connectionType;
  });

  const seatClass = params.get("seatClass") || "";
  seatClassFilterInputs.forEach((input) => {
    input.checked = input.value === seatClass;
  });
}

function initializeDateLimits() {
  const today = getTodayText();

  if (departureDateInput) {
    departureDateInput.min = today;

    if (!departureDateInput.value || departureDateInput.value < today) {
      departureDateInput.value = today;
    }
  }

  updateReturnDateLimit();
}

function bindEvents() {
  compactSearchBar.addEventListener("click", openResultsSearchPanel);
  closeResultsSearchPanelBtn.addEventListener("click", closeResultsSearchPanel);
  resultsSearchDim.addEventListener("click", closeResultsSearchPanel);

  resultsSearchBtn.addEventListener("click", moveToResultsPage);

  tripTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tripType = button.dataset.tripType;
      setTripType(tripType);
    });
  });

  if (departureDateInput) {
    departureDateInput.addEventListener("change", () => {
      normalizeDepartureDate();
      updateReturnDateLimit();
    });
  }

  if (returnDateInput) {
    returnDateInput.addEventListener("change", normalizeReturnDate);
  }

  swapAirportBtn.addEventListener("click", () => {
    const origin = selectedOriginAirport;
    const destination = selectedDestinationAirport;

    selectedOriginAirport = destination;
    selectedDestinationAirport = origin;

    renderSelectedAirport("origin");
    renderSelectedAirport("destination");
  });

  bindAirportInputEvents("origin");
  bindAirportInputEvents("destination");

  travelerPickerButton.addEventListener("click", (event) => {
    event.stopPropagation();
    travelerPopover.classList.toggle("open");
    closeAirportDropdowns();
  });

  adultMinusBtn.addEventListener("click", () => changePassengerCount("ADULT", -1));
  adultPlusBtn.addEventListener("click", () => changePassengerCount("ADULT", 1));

  childMinusBtn.addEventListener("click", () => changePassengerCount("CHILD", -1));
  childPlusBtn.addEventListener("click", () => changePassengerCount("CHILD", 1));

  infantMinusBtn.addEventListener("click", () => changePassengerCount("INFANT", -1));
  infantPlusBtn.addEventListener("click", () => changePassengerCount("INFANT", 1));

  travelerApplyBtn.addEventListener("click", () => {
    travelerPopover.classList.remove("open");
  });

  resultSortSelect.addEventListener("change", () => {
    sortSelect.value = resultSortSelect.value;
    updateParamAndReload("sort", resultSortSelect.value);
  });

  connectionFilterInputs.forEach((input) => {
    input.addEventListener("change", () => {
      connectionTypeSelect.value = input.value;
      updateParamAndReload("connectionType", input.value);
    });
  });

  seatClassFilterInputs.forEach((input) => {
    input.addEventListener("change", () => {
      seatClassSelect.value = input.value;
      updateParamAndReload("seatClass", input.value);
    });
  });

  document.addEventListener("click", (event) => {
    const clickedInsideTraveler =
      travelerPopover.contains(event.target) ||
      travelerPickerButton.contains(event.target);

    const clickedInsideAirport =
      originAirportDropdown.contains(event.target) ||
      destinationAirportDropdown.contains(event.target) ||
      originAirportInput.contains(event.target) ||
      destinationAirportInput.contains(event.target);

    if (!clickedInsideTraveler) {
      travelerPopover.classList.remove("open");
    }

    if (!clickedInsideAirport) {
      closeAirportDropdowns();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeResultsSearchPanel();
      closeAirportDropdowns();
      travelerPopover.classList.remove("open");
    }
  });
}

function bindAirportInputEvents(type) {
  const input = type === "origin" ? originAirportInput : destinationAirportInput;

  input.addEventListener("compositionstart", () => {
    if (type === "origin") {
      isOriginComposing = true;
    } else {
      isDestinationComposing = true;
    }
  });

  input.addEventListener("compositionend", () => {
    if (type === "origin") {
      isOriginComposing = false;
    } else {
      isDestinationComposing = false;
    }

    renderAirportDropdown(type, input.value);
  });

  input.addEventListener("input", () => {
    if (type === "origin") {
      selectedOriginAirport = null;
      renderSelectedAirport("origin", false);

      if (isOriginComposing) {
        return;
      }
    } else {
      selectedDestinationAirport = null;
      renderSelectedAirport("destination", false);

      if (isDestinationComposing) {
        return;
      }
    }

    renderAirportDropdown(type, input.value);
  });

  input.addEventListener("focus", () => {
    renderAirportDropdown(type, input.value);
  });
}

function openResultsSearchPanel() {
  resultsSearchPanel.classList.add("open");
  resultsSearchDim.classList.add("open");
  document.body.classList.add("search-panel-open");
}

function closeResultsSearchPanel() {
  resultsSearchPanel.classList.remove("open");
  resultsSearchDim.classList.remove("open");
  document.body.classList.remove("search-panel-open");
}

function getCurrentParams() {
  return new URLSearchParams(window.location.search);
}

function getTodayText() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function setTripType(tripType) {
  selectedTripType = tripType === "ONE_WAY" ? "ONE_WAY" : "ROUND_TRIP";
  renderTripTypeControls();
  updateReturnDateLimit();
}

function renderTripTypeControls() {
  tripTypeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tripType === selectedTripType);
  });

  if (!returnDateField) {
    return;
  }

  returnDateField.style.display = selectedTripType === "ROUND_TRIP" ? "" : "none";
}

function normalizeDepartureDate() {
  if (!departureDateInput) {
    return;
  }

  const today = getTodayText();

  if (!departureDateInput.value || departureDateInput.value < today) {
    departureDateInput.value = today;
  }
}

function updateReturnDateLimit() {
  if (!returnDateInput) {
    return;
  }

  const today = getTodayText();
  const departureDate = departureDateInput?.value || today;
  const minimumReturnDate = addDays(departureDate, 1);

  returnDateInput.min = minimumReturnDate;

  if (!returnDateInput.value || returnDateInput.value < minimumReturnDate) {
    returnDateInput.value = minimumReturnDate;
  }
}

function normalizeReturnDate() {
  if (!returnDateInput) {
    return;
  }

  const departureDate = departureDateInput?.value || getTodayText();
  const minimumReturnDate = addDays(departureDate, 1);

  if (!returnDateInput.value || returnDateInput.value < minimumReturnDate) {
    returnDateInput.value = minimumReturnDate;
  }
}

function loadAirportsFromCache() {
  try {
    const cachedAirports = sessionStorage.getItem(AIRPORT_CACHE_KEY);

    if (!cachedAirports) {
      return;
    }

    const parsedAirports = JSON.parse(cachedAirports);

    if (!Array.isArray(parsedAirports) || parsedAirports.length === 0) {
      return;
    }

    airports = parsedAirports;
    setSelectedAirportsFromUrl();
    enableSearchButton();
  } catch (error) {
    console.warn("공항 캐시를 읽지 못했습니다.", error);
  }
}

async function loadAirports() {
  try {
    const response = await fetch("/api/flights/airports");

    if (!response.ok) {
      throw new Error("공항 목록 조회 실패");
    }

    airports = await response.json();

    sessionStorage.setItem(AIRPORT_CACHE_KEY, JSON.stringify(airports));

    setSelectedAirportsFromUrl();
    enableSearchButton();
  } catch (error) {
    console.error(error);

    if (airports.length > 0) {
      return;
    }

    originAirportInput.placeholder = "공항 목록 조회 실패";
    destinationAirportInput.placeholder = "공항 목록 조회 실패";
    disableSearchButton("공항 목록 조회 실패");
  }
}

function setSelectedAirportsFromUrl() {
  if (!airports || airports.length === 0) {
    disableSearchButton("공항 없음");
    return;
  }

  const params = getCurrentParams();

  selectedOriginAirport =
    findAirportByCode(params.get("origin")) ||
    airports.find((airport) => airport.airportCode === "ICN") ||
    airports[0];

  selectedDestinationAirport =
    findAirportByCode(params.get("destination")) ||
    airports.find((airport) => airport.airportCode === "NRT") ||
    airports.find((airport) => airport.airportCode !== selectedOriginAirport.airportCode) ||
    airports[0];

  renderSelectedAirport("origin");
  renderSelectedAirport("destination");
}

function findAirportByCode(code) {
  if (!code) {
    return null;
  }

  return airports.find((airport) => airport.airportCode === code);
}

function renderSelectedAirport(type, fillInput = true) {
  const airport = type === "origin" ? selectedOriginAirport : selectedDestinationAirport;
  const input = type === "origin" ? originAirportInput : destinationAirportInput;
  const badge = type === "origin" ? originAirportCodeBadge : destinationAirportCodeBadge;

  if (!airport) {
    badge.textContent = "-";

    if (fillInput) {
      input.value = "";
    }

    return;
  }

  badge.textContent = airport.airportCode;

  if (fillInput) {
    input.value = `${airport.cityName} ${airport.airportName} (${airport.airportCode})`;
  }
}

function renderAirportDropdown(type, keyword) {
  const dropdown = type === "origin" ? originAirportDropdown : destinationAirportDropdown;
  const normalizedKeyword = normalizeText(keyword);

  const filteredAirports = filterAirports(normalizedKeyword).slice(0, 12);

  if (filteredAirports.length === 0) {
    dropdown.innerHTML = `
      <div class="airport-empty">
        검색 결과가 없습니다. 국가, 도시, 공항명 또는 공항 코드를 다시 입력해 주세요.
      </div>
    `;
    dropdown.classList.add("open");
    return;
  }

  dropdown.innerHTML = filteredAirports
    .map((airport) => {
      return `
        <button type="button" class="airport-option" data-airport-code="${airport.airportCode}">
          <span class="airport-option-icon">✈</span>

          <span class="airport-option-main">
            <span class="airport-option-title">
              ${airport.cityName} ${airport.airportName}
            </span>
            <span class="airport-option-sub">
              ${airport.countryName} · ${airport.region}
            </span>
          </span>

          <span class="airport-option-code">${airport.airportCode}</span>
        </button>
      `;
    })
    .join("");

  dropdown.querySelectorAll(".airport-option").forEach((button) => {
    button.addEventListener("click", () => {
      const airportCode = button.dataset.airportCode;
      const airport = airports.find((item) => item.airportCode === airportCode);

      if (!airport) {
        return;
      }

      if (type === "origin") {
        selectedOriginAirport = airport;
      } else {
        selectedDestinationAirport = airport;
      }

      renderSelectedAirport(type);
      closeAirportDropdowns();
    });
  });

  dropdown.classList.add("open");
}

function filterAirports(normalizedKeyword) {
  if (!airports || airports.length === 0) {
    return [];
  }

  if (!normalizedKeyword) {
    return airports;
  }

  return airports.filter((airport) => {
    return (
      includesAirportKeyword(airport.countryName, normalizedKeyword) ||
      includesAirportKeyword(airport.countryCode, normalizedKeyword) ||
      includesAirportKeyword(airport.cityName, normalizedKeyword) ||
      includesAirportKeyword(airport.airportName, normalizedKeyword) ||
      includesAirportKeyword(airport.airportCode, normalizedKeyword) ||
      includesAirportKeyword(airport.region, normalizedKeyword)
    );
  });
}

function includesAirportKeyword(value, normalizedKeyword) {
  if (!value) {
    return false;
  }

  return normalizeText(value).includes(normalizedKeyword);
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "");
}

function closeAirportDropdowns() {
  originAirportDropdown.classList.remove("open");
  destinationAirportDropdown.classList.remove("open");
}

function enableSearchButton() {
  resultsSearchBtn.disabled = false;
  resultsSearchBtn.textContent = "검색하기";
}

function disableSearchButton(text) {
  resultsSearchBtn.disabled = true;
  resultsSearchBtn.textContent = text;
}

function changePassengerCount(type, delta) {
  const nextAdultCount = type === "ADULT" ? adultCount + delta : adultCount;
  const nextChildCount = type === "CHILD" ? childCount + delta : childCount;
  const nextInfantCount = type === "INFANT" ? infantCount + delta : infantCount;

  if (nextAdultCount < 1 || nextChildCount < 0 || nextInfantCount < 0) {
    return;
  }

  if (nextAdultCount + nextChildCount + nextInfantCount > 9) {
    return;
  }

  if (nextInfantCount > nextAdultCount) {
    return;
  }

  adultCount = nextAdultCount;
  childCount = nextChildCount;
  infantCount = nextInfantCount;

  renderTravelerCount();
}

function renderTravelerCount() {
  adultCountText.textContent = adultCount;
  childCountText.textContent = childCount;
  infantCountText.textContent = infantCount;

  travelerSummaryText.textContent = createTravelerSummary();

  adultMinusBtn.disabled = adultCount <= 1;
  adultPlusBtn.disabled = getTotalPassengerCount() >= 9;

  childMinusBtn.disabled = childCount <= 0;
  childPlusBtn.disabled = getTotalPassengerCount() >= 9;

  infantMinusBtn.disabled = infantCount <= 0;
  infantPlusBtn.disabled =
    getTotalPassengerCount() >= 9 || infantCount >= adultCount;
}

function createTravelerSummary() {
  const summary = [`성인 ${adultCount}명`];

  if (childCount > 0) {
    summary.push(`소아 ${childCount}명`);
  }

  if (infantCount > 0) {
    summary.push(`유아 ${infantCount}명`);
  }

  return summary.join(", ");
}

function getTotalPassengerCount() {
  return adultCount + childCount + infantCount;
}

function moveToResultsPage() {
  if (!selectedOriginAirport) {
    alert("출발지를 검색해서 선택해 주세요.");
    originAirportInput.focus();
    return;
  }

  if (!selectedDestinationAirport) {
    alert("도착지를 검색해서 선택해 주세요.");
    destinationAirportInput.focus();
    return;
  }

  const origin = selectedOriginAirport.airportCode;
  const destination = selectedDestinationAirport.airportCode;
  const departureDate = departureDateInput?.value;
  const returnDate = returnDateInput?.value || getCurrentParams().get("returnDate");
  const today = getTodayText();

  if (origin === destination) {
    alert("출발지와 도착지는 같을 수 없습니다.");
    return;
  }

  if (!departureDate) {
    alert("가는 날을 선택해 주세요.");
    departureDateInput.focus();
    return;
  }

  if (departureDate < today) {
    alert("오늘 이전 날짜는 선택할 수 없습니다.");
    departureDateInput.value = today;
    updateReturnDateLimit();
    return;
  }

  if (selectedTripType === "ROUND_TRIP") {
    if (!returnDate) {
      alert("오는 날을 선택해 주세요.");
      returnDateInput?.focus();
      return;
    }

    if (returnDate <= departureDate) {
      alert("오는 날은 가는 날보다 늦어야 합니다.");

      if (returnDateInput) {
        returnDateInput.value = addDays(departureDate, 1);
        returnDateInput.focus();
      }

      return;
    }
  }

  const params = new URLSearchParams();
  params.append("tripType", selectedTripType);
  params.append("origin", origin);
  params.append("destination", destination);
  params.append("departureDate", departureDate);
  params.append("adultCount", adultCount);
  params.append("childCount", childCount);
  params.append("infantCount", infantCount);

  if (selectedTripType === "ROUND_TRIP") {
    params.append("returnDate", returnDate);
  }

  if (seatClassSelect.value) {
    params.append("seatClass", seatClassSelect.value);
  }

  if (connectionTypeSelect.value) {
    params.append("connectionType", connectionTypeSelect.value);
  }

  if (sortSelect.value) {
    params.append("sort", sortSelect.value);
  }

  window.location.href = `/flights/results?${params.toString()}`;
}

function updateParamAndReload(key, value) {
  const params = getCurrentParams();

  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }

  window.location.href = `/flights/results?${params.toString()}`;
}

async function fetchFlightResults() {
  const params = getCurrentParams();

  const tripType = params.get("tripType") === "ONE_WAY" ? "ONE_WAY" : "ROUND_TRIP";
  const origin = params.get("origin");
  const destination = params.get("destination");
  const departureDate = params.get("departureDate");
  const returnDate = params.get("returnDate");
  const today = getTodayText();

  selectedTripType = tripType;
  renderTripTypeControls();

  if (!origin || !destination || !departureDate) {
    renderInvalidRequest();
    return;
  }

  if (departureDate < today) {
    redirectToSearchPage();
    return;
  }

  if (tripType === "ROUND_TRIP") {
    if (!returnDate || returnDate <= departureDate) {
      redirectToSearchPage();
      return;
    }
  }

  renderLoading();

  try {
    const endpoint =
      tripType === "ROUND_TRIP"
        ? "/api/flights/search/round-trip"
        : "/api/flights/search";

    const response = await fetch(`${endpoint}?${params.toString()}`);

    if (!response.ok) {
      throw new Error("항공권 검색 실패");
    }

    const data = await response.json();

    if (tripType === "ROUND_TRIP") {
      renderRoundTripSearchResult(data);
      return;
    }

    renderOneWaySearchResult(data);
  } catch (error) {
    console.error(error);
    renderError();
  }
}

function redirectToSearchPage() {
  window.location.href = "/flights/search";
}

function renderLoading() {
  resultSummary.textContent = "항공권을 검색하는 중입니다.";

  flightResultGrid.innerHTML = `
    <div class="loading-result">
      항공권 데이터를 불러오는 중입니다.
    </div>
  `;
}

function renderInvalidRequest() {
  compactRouteText.textContent = "검색 조건이 올바르지 않습니다.";
  compactConditionText.textContent = "출발지, 도착지, 날짜를 다시 선택해 주세요.";
  resultSummary.textContent = "검색 조건이 부족합니다.";

  flightResultGrid.innerHTML = `
    <div class="empty-result">
      검색 조건이 올바르지 않습니다. 항공권 검색 화면에서 다시 검색해 주세요.
    </div>
  `;
}

function renderError() {
  resultSummary.textContent = "항공권 검색 중 오류가 발생했습니다.";

  flightResultGrid.innerHTML = `
    <div class="empty-result">
      항공권 데이터를 불러오지 못했습니다. 검색 조건 또는 서버 로그를 확인해 주세요.
    </div>
  `;
}

function renderOneWaySearchResult(data) {
  const options = data.options || [];
  const passengerText = createTravelerSummary();

  compactRouteText.textContent =
    `${data.originAirportCode} → ${data.destinationAirportCode}`;

  compactConditionText.textContent =
    `편도 · ${data.departureDate} · ${passengerText}`;

  resultSummary.textContent =
    `${data.originAirportName} (${data.originAirportCode}) → ` +
    `${data.destinationAirportName} (${data.destinationAirportCode}) · ` +
    `${data.departureDate} · ${options.length}개 항공권`;

  if (options.length === 0) {
    flightResultGrid.innerHTML = `
      <div class="empty-result">
        검색 결과가 없습니다. 다른 날짜, 노선 또는 조건으로 다시 검색해 주세요.
      </div>
    `;
    return;
  }

  flightResultGrid.innerHTML = options
    .map((option) => renderOneWayFlightOptionCard(option, data))
    .join("");
}

function renderRoundTripSearchResult(data) {
  const options = data.options || [];
  const passengerText = createTravelerSummary();

  compactRouteText.textContent =
    `${data.originAirportCode} ↔ ${data.destinationAirportCode}`;

  compactConditionText.textContent =
    `왕복 · 가는 날 ${data.departureDate} · 오는 날 ${data.returnDate} · ${passengerText}`;

  resultSummary.textContent =
    `${data.originAirportName} (${data.originAirportCode}) ↔ ` +
    `${data.destinationAirportName} (${data.destinationAirportCode}) · ` +
    `가는 날 ${data.departureDate} · 오는 날 ${data.returnDate} · ` +
    `${options.length}개 왕복 조합`;

  if (options.length === 0) {
    flightResultGrid.innerHTML = `
      <div class="empty-result">
        왕복 검색 결과가 없습니다. 다른 날짜, 노선 또는 조건으로 다시 검색해 주세요.
      </div>
    `;
    return;
  }

  flightResultGrid.innerHTML = options
    .map((option) => renderRoundTripOptionCard(option, data))
    .join("");
}

function renderOneWayFlightOptionCard(option, data) {
  const adultBasePrice = Number(option.price);
  const totalPrice = Number(option.totalPrice);
  const passengerSummary = option.passengerSummary || createTravelerSummary();

  const segmentPathText = createSegmentPathText(
    option,
    data.originAirportCode,
    data.destinationAirportCode
  );

  const connectionText = createConnectionSummary(option);

  return `
    <article class="flight-option-card">
      <div class="airline-block">
        <h3>${option.airlineName}</h3>
        <p class="airline-meta">
          ${option.airlineTierDescription} · ${option.airlineCode}
        </p>
      </div>

      <div class="route-block">
        <div>
          <div class="route-time">${formatTime(option.departureTime)}</div>
          <div class="route-airport">${data.originAirportCode}</div>
        </div>

        <div class="route-center">
          <div class="duration-text">${option.totalDurationText}</div>
          <div class="route-line"></div>
          <div class="segment-path">${segmentPathText}</div>
          <div class="layover-text">${connectionText}</div>
        </div>

        <div>
          <div class="route-time">${formatTime(option.arrivalTime)}</div>
          <div class="route-airport">
            ${data.destinationAirportCode}
            ${option.arrivalDate !== data.departureDate ? ` · ${option.arrivalDate}` : ""}
          </div>
        </div>
      </div>

      <div class="price-block">
        <p class="price-label">성인 1인 기준</p>
        <p class="price">₩${formatPrice(adultBasePrice)}</p>
        <div class="passenger-summary">${passengerSummary}</div>
        <div class="total-price">
          예상 총액 ₩${formatPrice(totalPrice)}
        </div>
        <a href="${createOneWaySelectUrl(option)}" class="select-flight-btn">선택하기</a>
      </div>
    </article>
  `;
}

function renderRoundTripOptionCard(option, data) {
  const outboundOption = option.outboundOption;
  const returnOption = option.returnOption;
  const totalPrice = Number(option.totalPrice);

  return `
    <article class="round-trip-option-card">
      <div class="round-trip-main">
        <div class="round-trip-title-row">
          <div>
            <p class="round-trip-label">왕복 항공권</p>
            <h3>${outboundOption.airlineName} / ${returnOption.airlineName}</h3>
          </div>

          <div class="round-trip-total-duration">
            총 비행 ${option.totalDurationText || "-"}
          </div>
        </div>

        <div class="compact-leg-list">
          ${renderCompactTripLeg(
            "가는 편",
            outboundOption,
            data.originAirportCode,
            data.destinationAirportCode,
            data.departureDate
          )}

          ${renderCompactTripLeg(
            "오는 편",
            returnOption,
            data.destinationAirportCode,
            data.originAirportCode,
            data.returnDate
          )}
        </div>
      </div>

      <div class="round-trip-price-block">
        <p class="price-label">왕복 예상 총액</p>
        <p class="price">₩${formatPrice(totalPrice)}</p>

        <div class="passenger-summary">
          ${outboundOption.passengerSummary || createTravelerSummary()}
        </div>

        <div class="round-trip-price-detail">
          가는 편 ₩${formatPrice(Number(outboundOption.totalPrice))}
          <br>
          오는 편 ₩${formatPrice(Number(returnOption.totalPrice))}
        </div>

        <a href="${createRoundTripSelectUrl(option)}" class="select-flight-btn">선택하기</a>
      </div>
    </article>
  `;
}

function renderCompactTripLeg(label, option, originCode, destinationCode, baseDate) {
  const segmentPathText = createSegmentPathText(option, originCode, destinationCode);
  const connectionText = createConnectionSummary(option);

  return `
    <div class="compact-trip-leg">
      <div class="compact-leg-label">${label}</div>

      <div class="compact-leg-airline">
        <strong>${option.airlineName}</strong>
        <span>${option.airlineCode}</span>
      </div>

      <div class="compact-leg-time">
        <strong>${formatTime(option.departureTime)}</strong>
        <span>${originCode}</span>
      </div>

      <div class="compact-leg-center">
        <span class="duration-text">${option.totalDurationText}</span>
        <span class="route-line"></span>
        <span class="segment-path">${segmentPathText}</span>
        <span class="layover-text">${connectionText}</span>
      </div>

      <div class="compact-leg-time">
        <strong>${formatTime(option.arrivalTime)}</strong>
        <span>
          ${destinationCode}
          ${option.arrivalDate !== baseDate ? ` · ${option.arrivalDate}` : ""}
        </span>
      </div>
    </div>
  `;
}

function getSortedSegments(option) {
  if (!Array.isArray(option.segments)) {
    return [];
  }

  return [...option.segments].sort((a, b) => {
    return Number(a.segmentOrder || 0) - Number(b.segmentOrder || 0);
  });
}

function createSegmentPathText(option, fallbackOriginCode, fallbackDestinationCode) {
  const segments = getSortedSegments(option);

  if (segments.length === 0) {
    if (option.connectionType === "ONE_STOP") {
      return `${fallbackOriginCode} → ${option.layoverAirportCode || "-"} → ${fallbackDestinationCode}`;
    }

    return `${fallbackOriginCode} → ${fallbackDestinationCode}`;
  }

  const airportCodes = [];

  airportCodes.push(segments[0].originAirportCode);

  segments.forEach((segment) => {
    airportCodes.push(segment.destinationAirportCode);
  });

  return airportCodes
    .filter(Boolean)
    .join(" → ");
}

function createConnectionSummary(option) {
  const segments = getSortedSegments(option);

  if (segments.length <= 1) {
    return "직항";
  }

  const layoverCodes = segments
    .slice(0, -1)
    .map((segment) => segment.destinationAirportCode)
    .filter(Boolean);

  if (layoverCodes.length === 0) {
    return "1회 경유";
  }

  return `${layoverCodes.length}회 경유 ${layoverCodes.join(", ")}`;
}

function createOneWaySelectUrl(option) {
  const params = getCurrentParams();

  const query = new URLSearchParams();
  query.append("optionId", option.flightOptionId);
  query.append("adultCount", params.get("adultCount") || adultCount);
  query.append("childCount", params.get("childCount") || childCount);
  query.append("infantCount", params.get("infantCount") || infantCount);

  return `/flights/booking/one-way?${query.toString()}`;
}

function createRoundTripSelectUrl(option) {
  const params = getCurrentParams();

  const query = new URLSearchParams();
  query.append("outboundOptionId", option.outboundOptionId);
  query.append("returnOptionId", option.returnOptionId);
  query.append("adultCount", params.get("adultCount") || adultCount);
  query.append("childCount", params.get("childCount") || childCount);
  query.append("infantCount", params.get("infantCount") || infantCount);

  return `/flights/booking/round-trip?${query.toString()}`;
}

function formatTime(timeText) {
  if (!timeText) {
    return "-";
  }

  return String(timeText).slice(0, 5);
}

function formatPrice(price) {
  if (Number.isNaN(Number(price))) {
    return "-";
  }

  return Number(price).toLocaleString("ko-KR");
}