const AIRPORT_CACHE_KEY = "travelMoney.airports";

const originAirportInput = document.getElementById("originAirportInput");
const destinationAirportInput = document.getElementById("destinationAirportInput");
const originAirportCodeBadge = document.getElementById("originAirportCodeBadge");
const destinationAirportCodeBadge = document.getElementById("destinationAirportCodeBadge");
const originAirportDropdown = document.getElementById("originAirportDropdown");
const destinationAirportDropdown = document.getElementById("destinationAirportDropdown");

const roundTripBtn = document.getElementById("roundTripBtn");
const oneWayBtn = document.getElementById("oneWayBtn");

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
const flightSearchBtn = document.getElementById("flightSearchBtn");
const swapAirportBtn = document.getElementById("swapAirportBtn");

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
  initializeDateDefaults();
  loadSearchParams();
  bindEvents();
  renderTravelerCount();

  loadAirportsFromCache();
  await loadAirports();
}

function bindEvents() {
  roundTripBtn.addEventListener("click", () => {
    setTripType("ROUND_TRIP");
  });

  oneWayBtn.addEventListener("click", () => {
    setTripType("ONE_WAY");
  });

  departureDateInput.addEventListener("change", () => {
    normalizeDepartureDate();
    updateReturnDateLimit();
  });

  returnDateInput.addEventListener("change", () => {
    normalizeReturnDate();
  });

  flightSearchBtn.addEventListener("click", moveToResultsPage);

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

  adultMinusBtn.addEventListener("click", () => {
    changePassengerCount("ADULT", -1);
  });

  adultPlusBtn.addEventListener("click", () => {
    changePassengerCount("ADULT", 1);
  });

  childMinusBtn.addEventListener("click", () => {
    changePassengerCount("CHILD", -1);
  });

  childPlusBtn.addEventListener("click", () => {
    changePassengerCount("CHILD", 1);
  });

  infantMinusBtn.addEventListener("click", () => {
    changePassengerCount("INFANT", -1);
  });

  infantPlusBtn.addEventListener("click", () => {
    changePassengerCount("INFANT", 1);
  });

  travelerApplyBtn.addEventListener("click", () => {
    travelerPopover.classList.remove("open");
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

function initializeDateDefaults() {
  const today = getTodayText();

  departureDateInput.min = today;
  departureDateInput.value = today;

  returnDateInput.min = today;
  returnDateInput.value = addDays(today, 1);

  setTripType("ROUND_TRIP");
}

function loadSearchParams() {
  const params = new URLSearchParams(window.location.search);
  const today = getTodayText();

  const tripType = params.get("tripType") === "ONE_WAY" ? "ONE_WAY" : "ROUND_TRIP";
  setTripType(tripType);

  const requestedDepartureDate = params.get("departureDate");

  if (requestedDepartureDate && requestedDepartureDate >= today) {
    departureDateInput.value = requestedDepartureDate;
  } else {
    departureDateInput.value = today;
  }

  departureDateInput.min = today;

  if (tripType === "ROUND_TRIP") {
    const requestedReturnDate = params.get("returnDate");

    if (requestedReturnDate && requestedReturnDate >= departureDateInput.value) {
      returnDateInput.value = requestedReturnDate;
    } else {
      returnDateInput.value = addDays(departureDateInput.value, 1);
    }
  }

  updateReturnDateLimit();

  if (params.get("seatClass")) {
    seatClassSelect.value = params.get("seatClass");
  }

  if (params.get("connectionType")) {
    connectionTypeSelect.value = params.get("connectionType");
  }

  if (params.get("sort")) {
    sortSelect.value = params.get("sort");
  }

  adultCount = Number(params.get("adultCount") || 1);
  childCount = Number(params.get("childCount") || 0);
  infantCount = Number(params.get("infantCount") || 0);

  renderTravelerCount();
}

function setTripType(tripType) {
  selectedTripType = tripType === "ONE_WAY" ? "ONE_WAY" : "ROUND_TRIP";

  roundTripBtn.classList.toggle("active", selectedTripType === "ROUND_TRIP");
  oneWayBtn.classList.toggle("active", selectedTripType === "ONE_WAY");

  if (selectedTripType === "ROUND_TRIP") {
    returnDateField.style.display = "";
    updateReturnDateLimit();
    return;
  }

  returnDateField.style.display = "none";
}

function normalizeDepartureDate() {
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
  const departureDate = departureDateInput.value || today;
  const minimumReturnDate = addDays(departureDate, 1);

  returnDateInput.min = minimumReturnDate;

  if (!returnDateInput.value || returnDateInput.value < minimumReturnDate) {
    returnDateInput.value = minimumReturnDate;
  }
}

function normalizeReturnDate() {
  const departureDate = departureDateInput.value || getTodayText();
  const minimumReturnDate = addDays(departureDate, 1);

  if (!returnDateInput.value || returnDateInput.value < departureDate) {
    returnDateInput.value = departureDate;
  }
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
    setDefaultAirportsFromParamsOrDefault();
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

    setDefaultAirportsFromParamsOrDefault();
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

function setDefaultAirportsFromParamsOrDefault() {
  if (!airports || airports.length === 0) {
    disableSearchButton("공항 없음");
    return;
  }

  const params = new URLSearchParams(window.location.search);

  const originCode = params.get("origin");
  const destinationCode = params.get("destination");

  selectedOriginAirport =
    findAirportByCode(originCode) ||
    airports.find((airport) => airport.airportCode === "ICN") ||
    airports[0];

  selectedDestinationAirport =
    findAirportByCode(destinationCode) ||
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
  flightSearchBtn.disabled = false;
  flightSearchBtn.textContent = "검색하기";
}

function disableSearchButton(text) {
  flightSearchBtn.disabled = true;
  flightSearchBtn.textContent = text;
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
  const departureDate = departureDateInput.value;
  const returnDate = returnDateInput.value;
  const seatClass = seatClassSelect.value;
  const connectionType = connectionTypeSelect.value;
  const sort = sortSelect.value;
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
      returnDateInput.focus();
      return;
    }

    if (returnDate <= departureDate) {
      alert("오는 날은 가는 날보다 빠를 수 없습니다.");
      returnDateInput.value = departureDate;
      returnDateInput.focus();
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

  if (seatClass) {
    params.append("seatClass", seatClass);
  }

  if (connectionType) {
    params.append("connectionType", connectionType);
  }

  if (sort) {
    params.append("sort", sort);
  }

  window.location.href = `/flights/results?${params.toString()}`;
}