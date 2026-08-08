import { getTodayText } from "./common/date-utils.js";
import { moveTo } from "./common/url-utils.js";
import {
  getDefaultDestinationAirport,
  getDefaultOriginAirport,
  loadAirportsWithCache,
} from "./flight/common/airport-service.js";
import {
  bindAirportAutocomplete,
  closeAirportDropdowns,
  renderSelectedAirport,
} from "./flight/common/airport-autocomplete.js";
import {
  canChangePassengerCount,
  createPassengerSummary,
} from "./flight/common/passenger-utils.js";
import { FLIGHT_PAGE, TRIP_TYPE } from "./flight/common/flight-constants.js";

const dom = {};

let airports = [];

let selectedOriginAirport = null;
let selectedDestinationAirport = null;
let selectedTripType = TRIP_TYPE.ROUND_TRIP;

let adultCount = 1;
let childCount = 0;
let infantCount = 0;

let flightDatePicker = null;

document.addEventListener("DOMContentLoaded", initHomeQuickSearch);

async function initHomeQuickSearch() {
  cacheDom();

  if (!dom.form) {
    return;
  }

  initializeDateDefaults();
  bindEvents();
  initializeFlightDatePicker();
  renderPassengerSummary();

  await loadAirports();
}

function cacheDom() {
  dom.form = document.getElementById("homeQuickSearchForm");

  dom.originAirportInput = document.getElementById("homeOriginAirportInput");
  dom.destinationAirportInput = document.getElementById("homeDestinationAirportInput");

  dom.originAirportCodeBadge = document.getElementById("homeOriginAirportCodeBadge");
  dom.destinationAirportCodeBadge = document.getElementById("homeDestinationAirportCodeBadge");

  dom.originAirportDropdown = document.getElementById("homeOriginAirportDropdown");
  dom.destinationAirportDropdown = document.getElementById("homeDestinationAirportDropdown");

  dom.swapAirportBtn = document.getElementById("homeSwapAirportBtn");

  dom.roundTripBtn = document.getElementById("homeRoundTripBtn");
  dom.oneWayBtn = document.getElementById("homeOneWayBtn");

  dom.departureDateInput = document.getElementById("homeDepartureDateInput");
  dom.returnDateInput = document.getElementById("homeReturnDateInput");
  dom.returnDateField = document.getElementById("homeReturnDateField");

  dom.adultCountSelect = document.getElementById("homeAdultCountSelect");
  dom.childCountSelect = document.getElementById("homeChildCountSelect");
  dom.infantCountSelect = document.getElementById("homeInfantCountSelect");

  dom.quickSummary = document.getElementById("homeQuickSummary");
  dom.searchBtn = document.getElementById("homeQuickSearchBtn");
}

function initializeDateDefaults() {
  if (dom.departureDateInput) {
    dom.departureDateInput.value = "";
    dom.departureDateInput.placeholder = "날짜 입력";
  }

  if (dom.returnDateInput) {
    dom.returnDateInput.value = "";
    dom.returnDateInput.placeholder = "날짜 입력";
  }
}

function bindEvents() {
  dom.form.addEventListener("submit", handleSubmit);

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

  dom.swapAirportBtn.addEventListener("click", swapAirports);

  dom.adultCountSelect.addEventListener("change", updatePassengerCountsFromSelects);
  dom.childCountSelect.addEventListener("change", updatePassengerCountsFromSelects);
  dom.infantCountSelect.addEventListener("change", updatePassengerCountsFromSelects);

  bindAirportAutocomplete({
    type: "home-origin",
    input: dom.originAirportInput,
    badge: dom.originAirportCodeBadge,
    dropdown: dom.originAirportDropdown,
    getAirports: () => airports,
    getSelectedAirport: () => selectedOriginAirport,
    setSelectedAirport: (airport) => {
      selectedOriginAirport = airport;
    },
    onSelected: renderOriginAirport,
  });

  bindAirportAutocomplete({
    type: "home-destination",
    input: dom.destinationAirportInput,
    badge: dom.destinationAirportCodeBadge,
    dropdown: dom.destinationAirportDropdown,
    getAirports: () => airports,
    getSelectedAirport: () => selectedDestinationAirport,
    setSelectedAirport: (airport) => {
      selectedDestinationAirport = airport;
    },
    onSelected: renderDestinationAirport,
  });

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);
}

async function loadAirports() {
  try {
    disableSearchButton("공항 목록 조회 중");

    airports = await loadAirportsWithCache();

    setDefaultAirports();
    enableSearchButton();
  } catch (error) {
    console.error(error);

    dom.originAirportInput.placeholder = "공항 목록 조회 실패";
    dom.destinationAirportInput.placeholder = "공항 목록 조회 실패";

    disableSearchButton("공항 목록 조회 실패");
  }
}

function setDefaultAirports() {
  if (!Array.isArray(airports) || airports.length === 0) {
    disableSearchButton("공항 없음");
    return;
  }

  selectedOriginAirport = getDefaultOriginAirport(airports);
  selectedDestinationAirport = getDefaultDestinationAirport(airports, selectedOriginAirport);

  renderOriginAirport();
  renderDestinationAirport();
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

  const today = getTodayText();

  flightDatePicker = flatpickr(dom.departureDateInput, {
    mode: selectedTripType === TRIP_TYPE.ROUND_TRIP ? "range" : "single",
    locale: "ko",
    dateFormat: "Y-m-d",
    minDate: today,
    showMonths: 2,
    static: false,
    closeOnSelect: selectedTripType === TRIP_TYPE.ONE_WAY,
    disableMobile: true,
    monthSelectorType: "static",
    prevArrow: "‹",
    nextArrow: "›",
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

function handleDatePickerChange(selectedDates, instance) {
  renderDateInputs(selectedDates, instance);

  if (selectedTripType === TRIP_TYPE.ONE_WAY && selectedDates.length >= 1) {
    instance.close();
    return;
  }

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
        <span>휠로 이전/다음 달을 확인하세요</span>
    </div>
    <button type="button" class="tm-flatpickr-apply-btn">적용</button>
  `;

  const applyButton = header.querySelector(".tm-flatpickr-apply-btn");

  applyButton.addEventListener("click", () => {
    instance.close();
  });

  calendar.prepend(header);
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
  renderPassengerSummary();
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

function updatePassengerCountsFromSelects() {
  const nextAdultCount = Number(dom.adultCountSelect.value);
  const nextChildCount = Number(dom.childCountSelect.value);
  const nextInfantCount = Number(dom.infantCountSelect.value);

  if (!canChangePassengerCount(nextAdultCount, nextChildCount, nextInfantCount)) {
    alert("전체 승객은 최대 9명까지 선택할 수 있고, 유아 수는 성인 수보다 많을 수 없습니다.");

    dom.adultCountSelect.value = String(adultCount);
    dom.childCountSelect.value = String(childCount);
    dom.infantCountSelect.value = String(infantCount);

    return;
  }

  adultCount = nextAdultCount;
  childCount = nextChildCount;
  infantCount = nextInfantCount;

  renderPassengerSummary();
}

function renderPassengerSummary() {
  dom.quickSummary.textContent = `${getTripTypeLabel()} · ${createPassengerSummary({
    adultCount,
    childCount,
    infantCount,
  })}`;
}

function getTripTypeLabel() {
  return selectedTripType === TRIP_TYPE.ROUND_TRIP ? "왕복" : "편도";
}

function handleSubmit(event) {
  event.preventDefault();

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

  moveTo(FLIGHT_PAGE.RESULTS, params);
}

function handleDocumentClick(event) {
  const clickedInsideAirport =
    dom.originAirportDropdown.contains(event.target) ||
    dom.destinationAirportDropdown.contains(event.target) ||
    dom.originAirportInput.contains(event.target) ||
    dom.destinationAirportInput.contains(event.target);

  if (!clickedInsideAirport) {
    closeAirportDropdowns(dom.originAirportDropdown, dom.destinationAirportDropdown);
  }
}

function handleDocumentKeydown(event) {
  if (event.key !== "Escape") {
    return;
  }

  closeAirportDropdowns(dom.originAirportDropdown, dom.destinationAirportDropdown);
}

function enableSearchButton() {
  dom.searchBtn.disabled = false;
  dom.searchBtn.textContent = "항공권 검색하기";
}

function disableSearchButton(text) {
  dom.searchBtn.disabled = true;
  dom.searchBtn.textContent = text;
}