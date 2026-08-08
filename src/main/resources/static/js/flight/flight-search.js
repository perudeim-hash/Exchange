import { getTodayText } from "../common/date-utils.js";
import { moveTo } from "../common/url-utils.js";
import {
  findAirportByCode,
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

let flightDatePicker = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheDom();
  initializeDateDefaults();
  initializeSearchParams();
  bindEvents();
  initializeFlightDatePicker();
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
  dom.departureDateInput.value = "";
  dom.departureDateInput.placeholder = "날짜 입력";

  dom.returnDateInput.value = "";
  dom.returnDateInput.placeholder = "날짜 입력";

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
  const requestedReturnDate = params.get("returnDate");

  if (requestedDepartureDate && requestedDepartureDate >= today) {
    dom.departureDateInput.value = requestedDepartureDate;
  }

  if (
      tripType === TRIP_TYPE.ROUND_TRIP &&
      requestedReturnDate &&
      requestedDepartureDate &&
      requestedReturnDate > requestedDepartureDate
  ) {
    dom.returnDateInput.value = requestedReturnDate;
  }

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

  dom.returnDateInput.addEventListener("click", () => {
    if (flightDatePicker) {
      flightDatePicker.open();
    }
  });

  dom.returnDateInput.addEventListener("focus", () => {
    if (flightDatePicker) {
      flightDatePicker.open();
    }
  });

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

function initializeFlightDatePicker() {
  if (!window.flatpickr) {
    console.error("Flatpickr 라이브러리가 로드되지 않았습니다.");
    return;
  }

  rebuildFlightDatePicker();
}

function rebuildFlightDatePicker() {
  if (flightDatePicker) {
    flightDatePicker.destroy();
    flightDatePicker = null;
  }

  flightDatePicker = flatpickr(dom.departureDateInput, {
    mode: selectedTripType === TRIP_TYPE.ROUND_TRIP ? "range" : "single",
    locale: "ko",
    dateFormat: "Y-m-d",
    minDate: getTodayText(),
    showMonths: 2,
    static: false,
    closeOnSelect: selectedTripType === TRIP_TYPE.ONE_WAY,
    disableMobile: true,
    monthSelectorType: "static",
    prevArrow: "‹",
    nextArrow: "›",
    defaultDate: getDefaultPickerDates(),
    onReady: (_, __, instance) => {
      addCalendarHeader(instance);
      renderDateInputs(instance.selectedDates, instance);
    },
    onOpen: (_, __, instance) => {
      addCalendarHeader(instance);
      renderDateInputs(instance.selectedDates, instance);
    },
    onChange: (selectedDates, _, instance) => {
      handleDatePickerChange(selectedDates, instance);
    },
    onValueUpdate: (selectedDates, _, instance) => {
      renderDateInputs(selectedDates, instance);
    },
  });
}

function getDefaultPickerDates() {
  const departureDate = dom.departureDateInput.value;
  const returnDate = dom.returnDateInput.value;

  if (!departureDate) {
    return [];
  }

  if (selectedTripType === TRIP_TYPE.ONE_WAY) {
    return [departureDate];
  }

  if (returnDate && returnDate > departureDate) {
    return [departureDate, returnDate];
  }

  return [departureDate];
}

function handleDatePickerChange(selectedDates, instance) {
  renderDateInputs(selectedDates, instance);

  if (selectedTripType === TRIP_TYPE.ROUND_TRIP && selectedDates.length >= 2) {
    instance.close();
  }
}

function renderDateInputs(selectedDates, instance) {
  if (!dom.departureDateInput || !dom.returnDateInput) {
    return;
  }

  if (!selectedDates || selectedDates.length === 0) {
    dom.departureDateInput.value = "";
    dom.returnDateInput.value = "";
    return;
  }

  if (selectedTripType === TRIP_TYPE.ONE_WAY) {
    dom.departureDateInput.value = instance.formatDate(selectedDates[0], "Y-m-d");
    dom.returnDateInput.value = "";
    return;
  }

  if (selectedDates.length >= 1) {
    dom.departureDateInput.value = instance.formatDate(selectedDates[0], "Y-m-d");
  } else {
    dom.departureDateInput.value = "";
  }

  if (selectedDates.length >= 2) {
    dom.returnDateInput.value = instance.formatDate(selectedDates[1], "Y-m-d");
  } else {
    dom.returnDateInput.value = "";
  }
}

function addCalendarHeader(instance) {
  const calendar = instance.calendarContainer;

  if (!calendar || calendar.querySelector(".tm-flatpickr-top")) {
    return;
  }

  const header = document.createElement("div");
  header.className = "tm-flatpickr-top";
  header.innerHTML = `
    <div>
      <strong>여행 날짜 선택</strong>
      <span>가는 날과 오는 날을 한 번에 선택하세요.</span>
    </div>
    <button type="button" class="tm-flatpickr-apply-btn">적용</button>
  `;

  const applyButton = header.querySelector(".tm-flatpickr-apply-btn");

  applyButton.addEventListener("click", () => {
    instance.close();
  });

  calendar.prepend(header);
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

  dom.returnDateField.classList.toggle("is-hidden", selectedTripType === TRIP_TYPE.ONE_WAY);

  dom.departureDateInput.value = "";
  dom.returnDateInput.value = "";

  if (flightDatePicker) {
    flightDatePicker.clear();
  }

  rebuildFlightDatePicker();
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
    alert("가는 날을 선택해 주세요.");
    dom.departureDateInput.focus();
    return;
  }

  if (departureDate < getTodayText()) {
    alert("가는 날은 오늘 이후 날짜만 선택할 수 있습니다.");
    return;
  }

  if (selectedTripType === TRIP_TYPE.ROUND_TRIP) {
    if (!returnDate) {
      alert("오는 날을 선택해 주세요.");
      dom.returnDateInput.focus();
      return;
    }

    if (returnDate <= departureDate) {
      alert("오는 날은 가는 날 이후여야 합니다.");
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
  dom.flightSearch
}

