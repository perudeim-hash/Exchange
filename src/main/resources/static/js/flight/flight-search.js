import { addDays, getTodayText } from "../common/date-utils.js";
import { moveTo } from "../common/url-utils.js";
import {
  findAirportByCode,
  getDefaultDestinationAirport,
  getDefaultOriginAirport,
  loadAirportsWithCache,
} from "./common/airport-service.js";
import {
  bindAirportAutocomplete,
  closeAirportDropdowns,
  renderSelectedAirport,
} from "./common/airport-autocomplete.js";
import {
  canChangePassengerCount,
  createPassengerSummary,
  normalizePassengerCounts,
} from "./common/passenger-utils.js";
import { FLIGHT_PAGE, TRIP_TYPE } from "./common/flight-constants.js";

const dom = {};

let airports = [];
let selectedOriginAirport = null;
let selectedDestinationAirport = null;

let selectedTripType = TRIP_TYPE.ROUND_TRIP;

let adultCount = 1;
let childCount = 0;
let infantCount = 0;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheDom();
  initializeDateDefaults();
  initializeSearchParams();
  bindEvents();
  renderPassengerCount();

  await loadAirports();
}

function cacheDom() {
  dom.originAirportInput = document.getElementById("originAirportInput");
  dom.destinationAirportInput = document.getElementById("destinationAirportInput");

  dom.originAirportCodeBadge = document.getElementById("originAirportCodeBadge");
  dom.destinationAirportCodeBadge = document.getElementById("destinationAirportCodeBadge");

  dom.originAirportDropdown = document.getElementById("originAirportDropdown");
  dom.destinationAirportDropdown = document.getElementById("destinationAirportDropdown");

  dom.roundTripBtn = document.getElementById("roundTripBtn");
  dom.oneWayBtn = document.getElementById("oneWayBtn");

  dom.departureDateInput = document.getElementById("departureDateInput");
  dom.returnDateInput = document.getElementById("returnDateInput");
  dom.returnDateField = document.getElementById("returnDateField");

  dom.travelerPickerButton = document.getElementById("travelerPickerButton");
  dom.travelerPopover = document.getElementById("travelerPopover");
  dom.travelerSummaryText = document.getElementById("travelerSummaryText");

  dom.adultMinusBtn = document.getElementById("adultMinusBtn");
  dom.adultPlusBtn = document.getElementById("adultPlusBtn");
  dom.adultCountText = document.getElementById("adultCountText");

  dom.childMinusBtn = document.getElementById("childMinusBtn");
  dom.childPlusBtn = document.getElementById("childPlusBtn");
  dom.childCountText = document.getElementById("childCountText");

  dom.infantMinusBtn = document.getElementById("infantMinusBtn");
  dom.infantPlusBtn = document.getElementById("infantPlusBtn");
  dom.infantCountText = document.getElementById("infantCountText");

  dom.travelerApplyBtn = document.getElementById("travelerApplyBtn");

  dom.seatClassSelect = document.getElementById("seatClassSelect");
  dom.connectionTypeSelect = document.getElementById("connectionTypeSelect");
  dom.sortSelect = document.getElementById("sortSelect");

  dom.flightSearchBtn = document.getElementById("flightSearchBtn");
  dom.swapAirportBtn = document.getElementById("swapAirportBtn");
}

function initializeDateDefaults() {
  const today = getTodayText();

  dom.departureDateInput.min = today;
  dom.departureDateInput.value = today;

  dom.returnDateInput.min = addDays(today, 1);
  dom.returnDateInput.value = addDays(today, 1);

  setTripType(TRIP_TYPE.ROUND_TRIP);
}

function initializeSearchParams() {
  const params = new URLSearchParams(window.location.search);
  const today = getTodayText();

  const tripType = params.get("tripType") === TRIP_TYPE.ONE_WAY
    ? TRIP_TYPE.ONE_WAY
    : TRIP_TYPE.ROUND_TRIP;

  setTripType(tripType);

  const requestedDepartureDate = params.get("departureDate");

  dom.departureDateInput.value =
    requestedDepartureDate && requestedDepartureDate >= today
      ? requestedDepartureDate
      : today;

  dom.departureDateInput.min = today;

  if (tripType === TRIP_TYPE.ROUND_TRIP) {
    const requestedReturnDate = params.get("returnDate");
    const minimumReturnDate = addDays(dom.departureDateInput.value, 1);

    dom.returnDateInput.value =
      requestedReturnDate && requestedReturnDate >= minimumReturnDate
        ? requestedReturnDate
        : minimumReturnDate;
  }

  updateReturnDateLimit();

  if (params.get("seatClass")) {
    dom.seatClassSelect.value = params.get("seatClass");
  }

  if (params.get("connectionType")) {
    dom.connectionTypeSelect.value = params.get("connectionType");
  }

  if (params.get("sort")) {
    dom.sortSelect.value = params.get("sort");
  }

  const passengerCounts = normalizePassengerCounts(
    params.get("adultCount"),
    params.get("childCount"),
    params.get("infantCount")
  );

  adultCount = passengerCounts.adultCount;
  childCount = passengerCounts.childCount;
  infantCount = passengerCounts.infantCount;
}

function bindEvents() {
  dom.roundTripBtn.addEventListener("click", () => {
    setTripType(TRIP_TYPE.ROUND_TRIP);
  });

  dom.oneWayBtn.addEventListener("click", () => {
    setTripType(TRIP_TYPE.ONE_WAY);
  });

  dom.departureDateInput.addEventListener("change", () => {
    normalizeDepartureDate();
    updateReturnDateLimit();
  });

  dom.returnDateInput.addEventListener("change", normalizeReturnDate);

  dom.flightSearchBtn.addEventListener("click", moveToResultsPage);

  dom.swapAirportBtn.addEventListener("click", swapAirports);

  bindAirportAutocomplete({
    type: "origin",
    input: dom.originAirportInput,
    badge: dom.originAirportCodeBadge,
    dropdown: dom.originAirportDropdown,
    getAirports: () => airports,
    getSelectedAirport: () => selectedOriginAirport,
    setSelectedAirport: (airport) => {
      selectedOriginAirport = airport;
    },
    onSelected: () => {
      renderOriginAirport();
    },
  });

  bindAirportAutocomplete({
    type: "destination",
    input: dom.destinationAirportInput,
    badge: dom.destinationAirportCodeBadge,
    dropdown: dom.destinationAirportDropdown,
    getAirports: () => airports,
    getSelectedAirport: () => selectedDestinationAirport,
    setSelectedAirport: (airport) => {
      selectedDestinationAirport = airport;
    },
    onSelected: () => {
      renderDestinationAirport();
    },
  });

  dom.travelerPickerButton.addEventListener("click", (event) => {
    event.stopPropagation();
    dom.travelerPopover.classList.toggle("open");
    closeAllAirportDropdowns();
  });

  dom.adultMinusBtn.addEventListener("click", () => changePassengerCount("ADULT", -1));
  dom.adultPlusBtn.addEventListener("click", () => changePassengerCount("ADULT", 1));

  dom.childMinusBtn.addEventListener("click", () => changePassengerCount("CHILD", -1));
  dom.childPlusBtn.addEventListener("click", () => changePassengerCount("CHILD", 1));

  dom.infantMinusBtn.addEventListener("click", () => changePassengerCount("INFANT", -1));
  dom.infantPlusBtn.addEventListener("click", () => changePassengerCount("INFANT", 1));

  dom.travelerApplyBtn.addEventListener("click", () => {
    dom.travelerPopover.classList.remove("open");
  });

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);
}

async function loadAirports() {
  try {
    disableSearchButton("공항 목록 조회 중...");

    airports = await loadAirportsWithCache();

    setDefaultAirportsFromParamsOrDefault();
    enableSearchButton();
  } catch (error) {
    console.error(error);

    dom.originAirportInput.placeholder = "공항 목록 조회 실패";
    dom.destinationAirportInput.placeholder = "공항 목록 조회 실패";

    disableSearchButton("공항 목록 조회 실패");
  }
}

function setDefaultAirportsFromParamsOrDefault() {
  if (!Array.isArray(airports) || airports.length === 0) {
    disableSearchButton("공항 없음");
    return;
  }

  const params = new URLSearchParams(window.location.search);

  const originParam = params.get("origin");
  const destinationParam = params.get("destination");

  selectedOriginAirport = originParam
    ? findAirportByCode(airports, originParam)
    : null;

  selectedDestinationAirport = destinationParam
    ? findAirportByCode(airports, destinationParam)
    : null;

  renderOriginAirport();
  renderDestinationAirport();

  enableSearchButton();
}

function setTripType(tripType) {
  selectedTripType = tripType === TRIP_TYPE.ONE_WAY
    ? TRIP_TYPE.ONE_WAY
    : TRIP_TYPE.ROUND_TRIP;

  dom.roundTripBtn.classList.toggle("active", selectedTripType === TRIP_TYPE.ROUND_TRIP);
  dom.oneWayBtn.classList.toggle("active", selectedTripType === TRIP_TYPE.ONE_WAY);

  dom.returnDateField.style.display =
    selectedTripType === TRIP_TYPE.ROUND_TRIP ? "" : "none";

  if (selectedTripType === TRIP_TYPE.ROUND_TRIP) {
    updateReturnDateLimit();
  }
}

function normalizeDepartureDate() {
  const today = getTodayText();

  if (!dom.departureDateInput.value || dom.departureDateInput.value < today) {
    dom.departureDateInput.value = today;
  }
}

function updateReturnDateLimit() {
  const departureDate = dom.departureDateInput.value || getTodayText();
  const minimumReturnDate = addDays(departureDate, 1);

  dom.returnDateInput.min = minimumReturnDate;

  if (!dom.returnDateInput.value || dom.returnDateInput.value < minimumReturnDate) {
    dom.returnDateInput.value = minimumReturnDate;
  }
}

function normalizeReturnDate() {
  const departureDate = dom.departureDateInput.value || getTodayText();
  const minimumReturnDate = addDays(departureDate, 1);

  if (!dom.returnDateInput.value || dom.returnDateInput.value < minimumReturnDate) {
    dom.returnDateInput.value = minimumReturnDate;
  }
}

function swapAirports() {
  const origin = selectedOriginAirport;

  selectedOriginAirport = selectedDestinationAirport;
  selectedDestinationAirport = origin;

  renderOriginAirport();
  renderDestinationAirport();
}

function renderOriginAirport(fillInput = true) {
  renderSelectedAirport(
    dom.originAirportInput,
    dom.originAirportCodeBadge,
    selectedOriginAirport,
    fillInput
  );
}

function renderDestinationAirport(fillInput = true) {
  renderSelectedAirport(
    dom.destinationAirportInput,
    dom.destinationAirportCodeBadge,
    selectedDestinationAirport,
    fillInput
  );
}

function closeAllAirportDropdowns() {
  closeAirportDropdowns(dom.originAirportDropdown, dom.destinationAirportDropdown);
}

function handleDocumentClick(event) {
  const clickedInsideTraveler =
    dom.travelerPopover.contains(event.target) ||
    dom.travelerPickerButton.contains(event.target);

  const clickedInsideAirport =
    dom.originAirportDropdown.contains(event.target) ||
    dom.destinationAirportDropdown.contains(event.target) ||
    dom.originAirportInput.contains(event.target) ||
    dom.destinationAirportInput.contains(event.target);

  if (!clickedInsideTraveler) {
    dom.travelerPopover.classList.remove("open");
  }

  if (!clickedInsideAirport) {
    closeAllAirportDropdowns();
  }
}

function handleDocumentKeydown(event) {
  if (event.key !== "Escape") {
    return;
  }

  closeAllAirportDropdowns();
  dom.travelerPopover.classList.remove("open");
}

function changePassengerCount(type, delta) {
  const nextAdultCount = type === "ADULT" ? adultCount + delta : adultCount;
  const nextChildCount = type === "CHILD" ? childCount + delta : childCount;
  const nextInfantCount = type === "INFANT" ? infantCount + delta : infantCount;

  if (!canChangePassengerCount(nextAdultCount, nextChildCount, nextInfantCount)) {
    return;
  }

  adultCount = nextAdultCount;
  childCount = nextChildCount;
  infantCount = nextInfantCount;

  renderPassengerCount();
}

function renderPassengerCount() {
  dom.adultCountText.textContent = adultCount;
  dom.childCountText.textContent = childCount;
  dom.infantCountText.textContent = infantCount;

  dom.travelerSummaryText.textContent = createPassengerSummary({
    adultCount,
    childCount,
    infantCount,
  });

  const totalPassengerCount = adultCount + childCount + infantCount;

  dom.adultMinusBtn.disabled = adultCount <= 1;
  dom.adultPlusBtn.disabled = totalPassengerCount >= 9;

  dom.childMinusBtn.disabled = childCount <= 0;
  dom.childPlusBtn.disabled = totalPassengerCount >= 9;

  dom.infantMinusBtn.disabled = infantCount <= 0;
  dom.infantPlusBtn.disabled = totalPassengerCount >= 9 || infantCount >= adultCount;
}

function moveToResultsPage() {
  if (!selectedOriginAirport) {
    alert("출발지를 검색해서 선택해 주세요.");
    dom.originAirportInput.focus();
    return;
  }

  if (!selectedDestinationAirport) {
    alert("도착지를 검색해서 선택해 주세요.");
    dom.destinationAirportInput.focus();
    return;
  }

  if (selectedOriginAirport.airportCode === selectedDestinationAirport.airportCode) {
    alert("출발지와 도착지는 같을 수 없습니다.");
    return;
  }

  const departureDate = dom.departureDateInput.value;
  const returnDate = dom.returnDateInput.value;

  if (!departureDate) {
    alert("출발일을 선택해 주세요.");
    dom.departureDateInput.focus();
    return;
  }

  if (departureDate < getTodayText()) {
    alert("출발일은 오늘 이후 날짜만 선택할 수 있습니다.");
    dom.departureDateInput.value = getTodayText();
    return;
  }

  if (selectedTripType === TRIP_TYPE.ROUND_TRIP) {
    if (!returnDate) {
      alert("오는 날짜를 선택해 주세요.");
      dom.returnDateInput.focus();
      return;
    }

    if (returnDate <= departureDate) {
      alert("오는 날짜는 출발일 이후여야 합니다.");
      dom.returnDateInput.value = addDays(departureDate, 1);
      dom.returnDateInput.focus();
      return;
    }
  }

  const params = new URLSearchParams();

  params.set("tripType", selectedTripType);
  params.set("origin", selectedOriginAirport.airportCode);
  params.set("destination", selectedDestinationAirport.airportCode);
  params.set("departureDate", departureDate);
  params.set("adultCount", String(adultCount));
  params.set("childCount", String(childCount));
  params.set("infantCount", String(infantCount));

  if (selectedTripType === TRIP_TYPE.ROUND_TRIP) {
    params.set("returnDate", returnDate);
  }

  if (dom.seatClassSelect.value) {
    params.set("seatClass", dom.seatClassSelect.value);
  }

  if (dom.connectionTypeSelect.value) {
    params.set("connectionType", dom.connectionTypeSelect.value);
  }

  if (dom.sortSelect.value) {
    params.set("sort", dom.sortSelect.value);
  }

  moveTo(FLIGHT_PAGE.RESULTS, params);
}

function enableSearchButton() {
  dom.flightSearchBtn.disabled = false;
  dom.flightSearchBtn.textContent = "검색하기";
}

function disableSearchButton(text) {
  dom.flightSearchBtn.disabled = true;
  dom.flightSearchBtn.textContent = text;
}