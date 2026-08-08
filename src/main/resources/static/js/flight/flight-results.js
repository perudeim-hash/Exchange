import { fetchJson } from "../common/api.js";
import { addDays, getTodayText } from "../common/date-utils.js";
import { escapeHtml, formatPrice, formatTime } from "../common/format-utils.js";
import { getCurrentParams, moveTo } from "../common/url-utils.js";

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

import {
  createConnectionText,
  createSegmentPathText,
} from "./common/flight-option-utils.js";

import {
  FLIGHT_API,
  FLIGHT_PAGE,
  TRIP_TYPE,
} from "./common/flight-constants.js";

const dom = {};

const TIME_RANGE_LIMIT = {
  min: 0,
  max: 1439,
  minGap: 60,
};

let airports = [];

let selectedOriginAirport = null;
let selectedDestinationAirport = null;

let selectedTripType = TRIP_TYPE.ROUND_TRIP;

let adultCount = 1;
let childCount = 0;
let infantCount = 0;

let resultDatePicker = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheDom();

  initializeControlsFromUrl();
  initializeDateLimits();
  bindEvents();
  initializeResultDatePicker();
  initTimeRangeSliders();
  renderPassengerCount();

  await loadAirports();
  await fetchFlightResults();
}

/* ================================
   DOM
   ================================ */

function cacheDom() {
  dom.resultSummary = document.getElementById("resultSummary");
  dom.flightResultGrid = document.getElementById("flightResultGrid");

  dom.compactSearchBar = document.getElementById("compactSearchBar");
  dom.compactRouteText = document.getElementById("compactRouteText");
  dom.compactConditionText = document.getElementById("compactConditionText");

  dom.resultsSearchPanel = document.getElementById("resultsSearchPanel");
  dom.resultsSearchDim = document.getElementById("resultsSearchDim");
  dom.closeResultsSearchPanelBtn = document.getElementById("closeResultsSearchPanelBtn");

  dom.originAirportInput = document.getElementById("originAirportInput");
  dom.destinationAirportInput = document.getElementById("destinationAirportInput");

  dom.originAirportCodeBadge = document.getElementById("originAirportCodeBadge");
  dom.destinationAirportCodeBadge = document.getElementById("destinationAirportCodeBadge");

  dom.originAirportDropdown = document.getElementById("originAirportDropdown");
  dom.destinationAirportDropdown = document.getElementById("destinationAirportDropdown");

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

  dom.resultsSearchBtn = document.getElementById("resultsSearchBtn");
  dom.swapAirportBtn = document.getElementById("swapAirportBtn");

  dom.resultSortSelect = document.getElementById("resultSortSelect");

  dom.connectionFilterInputs = document.querySelectorAll("input[name='connectionFilter']");
  dom.seatClassFilterInputs = document.querySelectorAll("input[name='seatClassFilter']");
  dom.airlineTierFilterInputs = document.querySelectorAll("input[name='airlineTierFilter']");
  dom.tripTypeButtons = document.querySelectorAll("[data-trip-type]");

  dom.outboundTimeMin = document.getElementById("outboundTimeMin");
  dom.outboundTimeMax = document.getElementById("outboundTimeMax");
  dom.outboundTimeRangeText = document.getElementById("outboundTimeRangeText");
  dom.outboundTimeProgress = document.getElementById("outboundTimeProgress");

  dom.returnTimeMin = document.getElementById("returnTimeMin");
  dom.returnTimeMax = document.getElementById("returnTimeMax");
  dom.returnTimeRangeText = document.getElementById("returnTimeRangeText");
  dom.returnTimeProgress = document.getElementById("returnTimeProgress");

  dom.layoverAirportFilterList = document.getElementById("layoverAirportFilterList");
}

/* ================================
   Initialize
   ================================ */

function initializeControlsFromUrl() {
  const params = getCurrentParams();
  const today = getTodayText();

  selectedTripType = params.get("tripType") === TRIP_TYPE.ONE_WAY
      ? TRIP_TYPE.ONE_WAY
      : TRIP_TYPE.ROUND_TRIP;

  const requestedDepartureDate = params.get("departureDate");
  const requestedReturnDate = params.get("returnDate");

  if (dom.departureDateInput) {
    dom.departureDateInput.value =
        requestedDepartureDate && requestedDepartureDate >= today
            ? requestedDepartureDate
            : today;
  }

  if (dom.returnDateInput) {
    if (selectedTripType === TRIP_TYPE.ROUND_TRIP) {
      const departureDate = dom.departureDateInput.value || today;
      const minimumReturnDate = addDays(departureDate, 1);

      dom.returnDateInput.value =
          requestedReturnDate && requestedReturnDate >= minimumReturnDate
              ? requestedReturnDate
              : minimumReturnDate;
    } else {
      dom.returnDateInput.value = "";
    }
  }

  const passengerCounts = normalizePassengerCounts(
      params.get("adultCount"),
      params.get("childCount"),
      params.get("infantCount")
  );

  adultCount = passengerCounts.adultCount;
  childCount = passengerCounts.childCount;
  infantCount = passengerCounts.infantCount;

  dom.seatClassSelect.value = params.get("seatClass") || "";
  dom.connectionTypeSelect.value = params.get("connectionType") || "";
  dom.sortSelect.value = params.get("sort") || "PRICE_ASC";
  dom.resultSortSelect.value = params.get("sort") || "PRICE_ASC";

  syncFilterInputs();
  renderTripTypeControls();
}

function initializeDateLimits() {
  const today = getTodayText();

  if (!dom.departureDateInput.value || dom.departureDateInput.value < today) {
    dom.departureDateInput.value = today;
  }

  if (selectedTripType === TRIP_TYPE.ONE_WAY) {
    dom.returnDateInput.value = "";
  }
}

function bindEvents() {
  dom.compactSearchBar.addEventListener("click", openResultsSearchPanel);
  dom.closeResultsSearchPanelBtn.addEventListener("click", closeResultsSearchPanel);
  dom.resultsSearchDim.addEventListener("click", closeResultsSearchPanel);

  dom.resultsSearchBtn.addEventListener("click", moveToResultsPage);

  dom.tripTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setTripType(button.dataset.tripType);
    });
  });

  dom.departureDateInput.addEventListener("click", openResultDatePicker);
  dom.departureDateInput.addEventListener("focus", openResultDatePicker);

  dom.returnDateInput.addEventListener("click", openResultDatePicker);
  dom.returnDateInput.addEventListener("focus", openResultDatePicker);

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

  dom.resultSortSelect.addEventListener("change", () => {
    dom.sortSelect.value = dom.resultSortSelect.value;
    updateParamAndReload("sort", dom.resultSortSelect.value);
  });

  dom.connectionFilterInputs.forEach((input) => {
    input.addEventListener("change", () => {
      dom.connectionTypeSelect.value = input.value;
      updateParamAndReload("connectionType", input.value);
    });
  });

  dom.seatClassFilterInputs.forEach((input) => {
    input.addEventListener("change", () => {
      dom.seatClassSelect.value = input.value;
      updateParamAndReload("seatClass", input.value);
    });
  });

  dom.airlineTierFilterInputs.forEach((input) => {
    input.addEventListener("change", applyClientSideFilters);
  });

  document.addEventListener("change", handleDynamicFilterChange);
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);
}

/* ================================
   Time Range Slider
   ================================ */

function initTimeRangeSliders() {
  setupTimeRangeSlider({
    minInput: dom.outboundTimeMin,
    maxInput: dom.outboundTimeMax,
    textEl: dom.outboundTimeRangeText,
    progressEl: dom.outboundTimeProgress,
  });

  setupTimeRangeSlider({
    minInput: dom.returnTimeMin,
    maxInput: dom.returnTimeMax,
    textEl: dom.returnTimeRangeText,
    progressEl: dom.returnTimeProgress,
  });
}

function setupTimeRangeSlider({ minInput, maxInput, textEl, progressEl }) {
  if (!minInput || !maxInput || !textEl || !progressEl) {
    return;
  }

  const updateSlider = (changedInput = null) => {
    let minValue = Number(minInput.value);
    let maxValue = Number(maxInput.value);

    if (maxValue - minValue < TIME_RANGE_LIMIT.minGap) {
      if (changedInput === minInput) {
        minValue = maxValue - TIME_RANGE_LIMIT.minGap;
      } else {
        maxValue = minValue + TIME_RANGE_LIMIT.minGap;
      }
    }

    if (minValue < TIME_RANGE_LIMIT.min) {
      minValue = TIME_RANGE_LIMIT.min;
      maxValue = minValue + TIME_RANGE_LIMIT.minGap;
    }

    if (maxValue > TIME_RANGE_LIMIT.max) {
      maxValue = TIME_RANGE_LIMIT.max;
      minValue = maxValue - TIME_RANGE_LIMIT.minGap;
    }

    minInput.value = String(minValue);
    maxInput.value = String(maxValue);

    const minPercent = (minValue / TIME_RANGE_LIMIT.max) * 100;
    const maxPercent = (maxValue / TIME_RANGE_LIMIT.max) * 100;

    progressEl.style.left = `${minPercent}%`;
    progressEl.style.right = `${100 - maxPercent}%`;

    textEl.textContent =
        `${formatMinutesToKoreanTime(minValue)} - ${formatMinutesToKoreanTime(maxValue)}`;

    if (changedInput === minInput) {
      minInput.style.zIndex = "4";
      maxInput.style.zIndex = "3";
    } else if (changedInput === maxInput) {
      minInput.style.zIndex = "3";
      maxInput.style.zIndex = "4";
    }

    applyClientSideFilters();
  };

  minInput.addEventListener("input", () => updateSlider(minInput));
  maxInput.addEventListener("input", () => updateSlider(maxInput));

  updateSlider(null);
}

function formatMinutesToKoreanTime(totalMinutes) {
  const safeMinutes = Math.max(0, Math.min(1439, Number(totalMinutes) || 0));

  const hour = Math.floor(safeMinutes / 60);
  const minute = safeMinutes % 60;

  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = String(minute).padStart(2, "0");

  return `${period} ${displayHour}:${displayMinute}`;
}

function getTimeRangeValue(type) {
  const minInput = type === "return" ? dom.returnTimeMin : dom.outboundTimeMin;
  const maxInput = type === "return" ? dom.returnTimeMax : dom.outboundTimeMax;

  return {
    min: minInput ? Number(minInput.value) : TIME_RANGE_LIMIT.min,
    max: maxInput ? Number(maxInput.value) : TIME_RANGE_LIMIT.max,
  };
}

function parseTimeToMinute(timeText) {
  if (!timeText || typeof timeText !== "string") {
    return null;
  }

  const [hourText, minuteText] = timeText.split(":");

  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

function isMinuteInRange(minute, range) {
  if (minute === null || minute === undefined) {
    return true;
  }

  return minute >= range.min && minute <= range.max;
}

/* ================================
   Result Date Picker
   ================================ */

function initializeResultDatePicker() {
  if (!window.flatpickr) {
    console.error("Flatpickr 라이브러리가 로드되지 않았습니다.");
    return;
  }

  rebuildResultDatePicker();
}

function rebuildResultDatePicker() {
  if (resultDatePicker) {
    resultDatePicker.destroy();
    resultDatePicker = null;
  }

  resultDatePicker = flatpickr(dom.departureDateInput, {
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
    defaultDate: getResultPickerDefaultDates(),

    onReady: (_, __, instance) => {
      addResultCalendarHeader(instance);
      forceSplitDateInputs(instance.selectedDates, instance);
    },

    onOpen: (_, __, instance) => {
      addResultCalendarHeader(instance);
      forceSplitDateInputs(instance.selectedDates, instance);
      instance.redraw();
    },

    onChange: (selectedDates, _, instance) => {
      forceSplitDateInputs(selectedDates, instance);

      if (selectedTripType === TRIP_TYPE.ONE_WAY && selectedDates.length >= 1) {
        instance.close();
        return;
      }

      if (selectedTripType === TRIP_TYPE.ROUND_TRIP && selectedDates.length >= 2) {
        instance.close();
      }
    },

    onValueUpdate: (selectedDates, _, instance) => {
      forceSplitDateInputs(selectedDates, instance);
    },

    onClose: (selectedDates, _, instance) => {
      forceSplitDateInputs(selectedDates, instance);
    },
  });
}

function openResultDatePicker() {
  if (!resultDatePicker) {
    return;
  }

  resultDatePicker.open();
}

function getResultPickerDefaultDates() {
  const departureDate = getCleanDateValue(dom.departureDateInput.value);
  const returnDate = getCleanDateValue(dom.returnDateInput.value);

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

function forceSplitDateInputs(selectedDates, instance) {
  splitDateInputs(selectedDates, instance);

  window.setTimeout(() => {
    splitDateInputs(selectedDates, instance);
  }, 0);
}

function splitDateInputs(selectedDates, instance) {
  if (!dom.departureDateInput || !dom.returnDateInput) {
    return;
  }

  if (!selectedDates || selectedDates.length === 0) {
    dom.departureDateInput.value = "";
    dom.returnDateInput.value = "";
    return;
  }

  const departureDate = instance.formatDate(selectedDates[0], "Y-m-d");
  dom.departureDateInput.value = departureDate;

  if (selectedTripType === TRIP_TYPE.ONE_WAY) {
    dom.returnDateInput.value = "";
    return;
  }

  if (selectedDates.length >= 2) {
    const returnDate = instance.formatDate(selectedDates[1], "Y-m-d");
    dom.returnDateInput.value = returnDate;
    return;
  }

  dom.returnDateInput.value = "";
}

function syncResultDatePickerFromInputs() {
  if (!resultDatePicker) {
    return;
  }

  resultDatePicker.setDate(getResultPickerDefaultDates(), false);
  forceSplitDateInputs(resultDatePicker.selectedDates, resultDatePicker);
}

function addResultCalendarHeader(instance) {
  const calendar = instance.calendarContainer;

  if (!calendar || calendar.querySelector(".tm-flatpickr-top")) {
    return;
  }

  const header = document.createElement("div");
  header.className = "tm-flatpickr-top";
  header.innerHTML = `
    <div>
      <strong>여행 날짜 선택</strong>
      <span>날짜별 최저가를 확인하고 여행 날짜를 선택하세요.</span>
    </div>
    <button type="button" class="tm-flatpickr-apply-btn">적용</button>
  `;

  const applyButton = header.querySelector(".tm-flatpickr-apply-btn");

  applyButton.addEventListener("click", () => {
    instance.close();
  });

  calendar.prepend(header);
}

function getCleanDateValue(value) {
  if (!value) {
    return "";
  }

  return String(value).split(" ")[0].trim();
}

/* ================================
   Airport / Search Form
   ================================ */

async function loadAirports() {
  try {
    disableSearchButton("공항 목록 조회 중...");

    airports = await loadAirportsWithCache();

    setSelectedAirportsFromUrl();
    enableSearchButton();
  } catch (error) {
    console.error(error);

    dom.originAirportInput.placeholder = "공항 목록 조회 실패";
    dom.destinationAirportInput.placeholder = "공항 목록 조회 실패";

    disableSearchButton("공항 목록 조회 실패");
  }
}

function setSelectedAirportsFromUrl() {
  if (!Array.isArray(airports) || airports.length === 0) {
    disableSearchButton("공항 없음");
    return;
  }

  const params = getCurrentParams();

  selectedOriginAirport =
      findAirportByCode(airports, params.get("origin")) ||
      getDefaultOriginAirport(airports);

  selectedDestinationAirport =
      findAirportByCode(airports, params.get("destination")) ||
      getDefaultDestinationAirport(airports, selectedOriginAirport);

  renderOriginAirport();
  renderDestinationAirport();
}

function setTripType(tripType) {
  selectedTripType = tripType === TRIP_TYPE.ONE_WAY
      ? TRIP_TYPE.ONE_WAY
      : TRIP_TYPE.ROUND_TRIP;

  renderTripTypeControls();

  if (selectedTripType === TRIP_TYPE.ONE_WAY) {
    dom.returnDateInput.value = "";
  } else if (!dom.returnDateInput.value && dom.departureDateInput.value) {
    dom.returnDateInput.value = addDays(dom.departureDateInput.value, 1);
  }

  rebuildResultDatePicker();
}

function renderTripTypeControls() {
  dom.tripTypeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tripType === selectedTripType);
  });

  if (dom.returnDateField) {
    dom.returnDateField.style.display =
        selectedTripType === TRIP_TYPE.ROUND_TRIP ? "" : "none";
  }
}

function syncFilterInputs() {
  const connectionType = dom.connectionTypeSelect.value || "";
  const seatClass = dom.seatClassSelect.value || "";

  dom.connectionFilterInputs.forEach((input) => {
    input.checked = input.value === connectionType;
  });

  dom.seatClassFilterInputs.forEach((input) => {
    input.checked = input.value === seatClass;
  });
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

function openResultsSearchPanel() {
  dom.resultsSearchPanel.classList.add("open");
  dom.resultsSearchDim.classList.add("open");
  document.body.classList.add("search-panel-open");

  if (resultDatePicker) {
    resultDatePicker.redraw();
  }
}

function closeResultsSearchPanel() {
  dom.resultsSearchPanel.classList.remove("open");
  dom.resultsSearchDim.classList.remove("open");
  document.body.classList.remove("search-panel-open");
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

  closeResultsSearchPanel();
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

  const origin = selectedOriginAirport.airportCode;
  const destination = selectedDestinationAirport.airportCode;
  const departureDate = dom.departureDateInput.value;
  const returnDate = dom.returnDateInput.value;
  const today = getTodayText();

  if (origin === destination) {
    alert("출발지와 도착지는 같을 수 없습니다.");
    return;
  }

  if (!departureDate) {
    alert("가는 날을 선택해 주세요.");
    openResultDatePicker();
    return;
  }

  if (departureDate < today) {
    alert("오늘 이전 날짜는 선택할 수 없습니다.");
    dom.departureDateInput.value = today;
    syncResultDatePickerFromInputs();
    return;
  }

  if (selectedTripType === TRIP_TYPE.ROUND_TRIP) {
    if (!returnDate) {
      alert("오는 날을 선택해 주세요.");
      openResultDatePicker();
      return;
    }

    if (returnDate <= departureDate) {
      alert("오는 날은 가는 날보다 늦어야 합니다.");
      dom.returnDateInput.value = "";
      syncResultDatePickerFromInputs();
      openResultDatePicker();
      return;
    }
  }

  const params = new URLSearchParams();

  params.set("tripType", selectedTripType);
  params.set("origin", origin);
  params.set("destination", destination);
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

function updateParamAndReload(key, value) {
  const params = getCurrentParams();

  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }

  moveTo(FLIGHT_PAGE.RESULTS, params);
}

/* ================================
   Fetch / Render Results
   ================================ */

async function fetchFlightResults() {
  const params = getCurrentParams();

  const tripType = params.get("tripType") === TRIP_TYPE.ONE_WAY
      ? TRIP_TYPE.ONE_WAY
      : TRIP_TYPE.ROUND_TRIP;

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

  if (tripType === TRIP_TYPE.ROUND_TRIP) {
    if (!returnDate || returnDate <= departureDate) {
      redirectToSearchPage();
      return;
    }
  }

  renderLoading();

  try {
    const endpoint = tripType === TRIP_TYPE.ROUND_TRIP
        ? FLIGHT_API.SEARCH_ROUND_TRIP
        : FLIGHT_API.SEARCH_ONE_WAY;

    const data = await fetchJson(
        `${endpoint}?${params.toString()}`,
        "항공권 검색에 실패했습니다."
    );

    if (tripType === TRIP_TYPE.ROUND_TRIP) {
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
  window.location.href = FLIGHT_PAGE.SEARCH;
}

function renderLoading() {
  dom.resultSummary.textContent = "항공권을 검색하는 중입니다.";

  dom.flightResultGrid.innerHTML = `
    <div class="loading-result">
      항공권 데이터를 불러오는 중입니다.
    </div>
  `;
}

function renderInvalidRequest() {
  dom.compactRouteText.textContent = "검색 조건이 올바르지 않습니다.";
  dom.compactConditionText.textContent = "출발지, 도착지, 날짜를 다시 선택해 주세요.";
  dom.resultSummary.textContent = "검색 조건이 부족합니다.";

  renderEmptyFlightResult({
    title: "검색 조건이 올바르지 않습니다.",
    message: "출발지, 도착지, 날짜를 다시 선택해 주세요.",
    guide: "검색 조건 수정 버튼을 눌러 다시 검색할 수 있습니다."
  });
}

function renderError() {
  dom.resultSummary.textContent = "항공권 검색 중 오류가 발생했습니다.";

  renderEmptyFlightResult({
    title: "항공권 데이터를 불러오지 못했습니다.",
    message: "검색 조건 또는 서버 로그를 확인해 주세요.",
    guide: "검색 조건을 다시 수정하거나 잠시 후 다시 시도해 주세요."
  });
}

function renderOneWaySearchResult(data) {
  const options = data.options || [];

  const passengerText = createPassengerSummary({
    adultCount,
    childCount,
    infantCount,
  });

  dom.compactRouteText.textContent =
      `${data.originAirportCode} → ${data.destinationAirportCode}`;

  dom.compactConditionText.textContent =
      `편도 · ${data.departureDate} · ${passengerText}`;

  dom.resultSummary.textContent =
      `${data.originAirportName} (${data.originAirportCode}) → ` +
      `${data.destinationAirportName} (${data.destinationAirportCode}) · ` +
      `${data.departureDate} · ${options.length}개 항공권`;

  if (options.length === 0) {
    renderEmptyFlightResult({
      title: "검색 결과가 없습니다.",
      message: "다른 날짜, 노선 또는 조건으로 다시 검색해 주세요.",
      guide: "날짜를 하루 전후로 바꾸거나 좌석/경유 조건을 전체로 변경해 보세요."
    });
    return;
  }

  dom.flightResultGrid.innerHTML = options
      .map((option) => renderOneWayFlightOptionCard(option, data))
      .join("");

  renderLayoverAirportFiltersFromOneWay(options);
  applyClientSideFilters();
}

function renderRoundTripSearchResult(data) {
  const options = data.options || [];

  const passengerText = createPassengerSummary({
    adultCount,
    childCount,
    infantCount,
  });

  dom.compactRouteText.textContent =
      `${data.originAirportCode} ↔ ${data.destinationAirportCode}`;

  dom.compactConditionText.textContent =
      `왕복 · 가는 날 ${data.departureDate} · 오는 날 ${data.returnDate} · ${passengerText}`;

  dom.resultSummary.textContent =
      `${data.originAirportName} (${data.originAirportCode}) ↔ ` +
      `${data.destinationAirportName} (${data.destinationAirportCode}) · ` +
      `가는 날 ${data.departureDate} · 오는 날 ${data.returnDate} · ` +
      `${options.length}개 왕복 조합`;

  if (options.length === 0) {
    renderEmptyFlightResult({
      title: "왕복 검색 결과가 없습니다.",
      message: "가는 날과 오는 날 조합을 바꾸거나, 좌석/경유 조건을 전체로 변경해 보세요.",
      guide: "특정 날짜에 데이터가 없을 수 있으니 하루 전후 날짜도 함께 확인해 보세요."
    });
    return;
  }

  dom.flightResultGrid.innerHTML = options
      .map((option) => renderRoundTripOptionCard(option, data))
      .join("");

  renderLayoverAirportFiltersFromRoundTrip(options);
  applyClientSideFilters();
}

/* ================================
   Client Side Filters
   ================================ */

function handleDynamicFilterChange(event) {
  const target = event.target;

  if (!target.matches("input[name='layoverAirportFilter']")) {
    return;
  }

  handleLayoverFilterChange(target);
  applyClientSideFilters();
}

function handleLayoverFilterChange(changedInput) {
  const allInput = document.querySelector("input[name='layoverAirportFilter'][value='']");
  const checkedDetailInputs = [
    ...document.querySelectorAll("input[name='layoverAirportFilter']:not([value='']):checked")
  ];

  if (changedInput.value === "") {
    document
        .querySelectorAll("input[name='layoverAirportFilter']:not([value=''])")
        .forEach((input) => {
          input.checked = false;
        });

    changedInput.checked = true;
    return;
  }

  if (allInput && checkedDetailInputs.length > 0) {
    allInput.checked = false;
  }

  const anyChecked = document.querySelector("input[name='layoverAirportFilter']:checked");

  if (!anyChecked && allInput) {
    allInput.checked = true;
  }
}

function applyClientSideFilters() {
  const cards = [...document.querySelectorAll("[data-result-card='true']")];

  if (cards.length === 0) {
    return;
  }

  const airlineTier = getCheckedValue("airlineTierFilter");
  const layoverAirports = getCheckedValues("layoverAirportFilter");
  const outboundTimeRange = getTimeRangeValue("outbound");
  const returnTimeRange = getTimeRangeValue("return");

  cards.forEach((card) => {
    const cardAirlineTiers = splitDataList(card.dataset.airlineTiers);
    const cardLayoverAirports = splitDataList(card.dataset.layoverAirports);

    const outboundDepartureMinute = toNullableNumber(card.dataset.outboundDepartureMinute);
    const returnDepartureMinute = toNullableNumber(card.dataset.returnDepartureMinute);

    const matchesAirlineTier =
        !airlineTier || cardAirlineTiers.includes(airlineTier);

    const matchesLayover =
        layoverAirports.length === 0 ||
        layoverAirports.some((airportCode) => cardLayoverAirports.includes(airportCode));

    const matchesOutboundTime = isMinuteInRange(outboundDepartureMinute, outboundTimeRange);

    const matchesReturnTime =
        selectedTripType === TRIP_TYPE.ONE_WAY ||
        isMinuteInRange(returnDepartureMinute, returnTimeRange);

    const visible =
        matchesAirlineTier &&
        matchesLayover &&
        matchesOutboundTime &&
        matchesReturnTime;

    card.style.display = visible ? "" : "none";
  });
}

function getCheckedValue(name) {
  const checkedInput = document.querySelector(`input[name='${name}']:checked`);
  return checkedInput ? checkedInput.value : "";
}

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name='${name}']:checked`)]
      .map((input) => input.value)
      .filter(Boolean);
}

function splitDataList(value) {
  if (!value) {
    return [];
  }

  return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
}

function toNullableNumber(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return numberValue;
}

function renderLayoverAirportFiltersFromOneWay(options) {
  const layoverCodes = collectLayoverAirportCodesFromOptions(options);
  renderLayoverAirportFilterList(layoverCodes);
}

function renderLayoverAirportFiltersFromRoundTrip(options) {
  const layoverCodes = new Set();

  options.forEach((option) => {
    collectLayoverAirportCodes(option.outboundOption).forEach((code) => layoverCodes.add(code));
    collectLayoverAirportCodes(option.returnOption).forEach((code) => layoverCodes.add(code));
  });

  renderLayoverAirportFilterList([...layoverCodes].sort());
}

function collectLayoverAirportCodesFromOptions(options) {
  const layoverCodes = new Set();

  options.forEach((option) => {
    collectLayoverAirportCodes(option).forEach((code) => layoverCodes.add(code));
  });

  return [...layoverCodes].sort();
}

function renderLayoverAirportFilterList(layoverCodes) {
  if (!dom.layoverAirportFilterList) {
    return;
  }

  if (!layoverCodes || layoverCodes.length === 0) {
    dom.layoverAirportFilterList.innerHTML = `
      <span class="filter-empty-text">직항 결과만 있습니다.</span>
    `;
    return;
  }

  dom.layoverAirportFilterList.innerHTML = layoverCodes
      .map((airportCode) => `
        <label>
          <input type="checkbox" name="layoverAirportFilter" value="${escapeHtml(airportCode)}">
          ${escapeHtml(airportCode)}
        </label>
      `)
      .join("");
}

function collectLayoverAirportCodes(option) {
  if (!option) {
    return [];
  }

  const layoverCodes = new Set();

  if (option.layoverAirportCode) {
    layoverCodes.add(option.layoverAirportCode);
  }

  const segments = Array.isArray(option.segments) ? option.segments : [];

  segments.forEach((segment, index) => {
    if (index >= segments.length - 1) {
      return;
    }

    if (segment.arrivalAirportCode) {
      layoverCodes.add(segment.arrivalAirportCode);
    }

    if (segment.destinationAirportCode) {
      layoverCodes.add(segment.destinationAirportCode);
    }
  });

  return [...layoverCodes].filter(Boolean);
}

function getAirlineTierValue(option) {
  return option?.airlineTier || option?.airlineTierCode || "";
}

function getSeatClassValue(option) {
  return option?.seatClass || "";
}

function getConnectionTypeValue(option) {
  return option?.connectionType || "";
}

/* ================================
   Flight Cards
   ================================ */

function renderOneWayFlightOptionCard(option, data) {
  const adultBasePrice = Number(option.price);
  const totalPrice = Number(option.totalPrice);
  const passengerSummary = option.passengerSummary ||
      createPassengerSummary({ adultCount, childCount, infantCount });

  const segmentPathText = createSegmentPathText(option);
  const connectionText = createConnectionText(option);
  const arrivalDateSuffix = createArrivalDateSuffix(option.arrivalDate, data.departureDate);

  const airlineTier = getAirlineTierValue(option);
  const layoverAirports = collectLayoverAirportCodes(option);
  const outboundDepartureMinute = parseTimeToMinute(option.departureTime);

  return `
    <article class="flight-option-card"
             data-result-card="true"
             data-airline-tiers="${escapeHtml(airlineTier)}"
             data-layover-airports="${escapeHtml(layoverAirports.join(","))}"
             data-outbound-departure-minute="${outboundDepartureMinute ?? ""}">
      <div class="airline-block">
        <h3>${escapeHtml(option.airlineName)}</h3>
        <p class="airline-meta">
          ${escapeHtml(option.airlineTierDescription)} · ${escapeHtml(option.airlineCode)}
        </p>
      </div>

      <div class="route-block">
        <div>
          <div class="route-time">${formatTime(option.departureTime)}</div>
          <div class="route-airport">${escapeHtml(data.originAirportCode)}</div>
        </div>

        <div class="route-center">
          <div class="duration-text">${escapeHtml(option.totalDurationText)}</div>
          <div class="route-line"></div>
          <div class="segment-path">${escapeHtml(segmentPathText)}</div>
          <div class="layover-text">${escapeHtml(connectionText)}</div>
        </div>

        <div>
          <div class="route-time">
            ${formatTime(option.arrivalTime)}
            ${arrivalDateSuffix}
          </div>
          <div class="route-airport">
            ${escapeHtml(data.destinationAirportCode)}
          </div>
        </div>
      </div>

      <div class="price-block">
        <p class="price-label">성인 1인 기준</p>
        <p class="price">₩${formatPrice(adultBasePrice)}</p>
        <div class="passenger-summary">${escapeHtml(passengerSummary)}</div>
        <div class="total-price">
          예상 총액 ₩${formatPrice(totalPrice)}
        </div>
        <a href="${createOneWaySelectUrl(option)}" class="select-flight-btn">
          선택하기
        </a>
      </div>
    </article>
  `;
}

function renderRoundTripOptionCard(option, data) {
  const outboundOption = option.outboundOption;
  const returnOption = option.returnOption;
  const totalPrice = Number(option.totalPrice);

  const airlineTiers = [
    getAirlineTierValue(outboundOption),
    getAirlineTierValue(returnOption),
  ].filter(Boolean);

  const layoverAirports = [
    ...collectLayoverAirportCodes(outboundOption),
    ...collectLayoverAirportCodes(returnOption),
  ];

  const outboundDepartureMinute = parseTimeToMinute(outboundOption?.departureTime);
  const returnDepartureMinute = parseTimeToMinute(returnOption?.departureTime);

  return `
    <article class="round-trip-option-card"
             data-result-card="true"
             data-airline-tiers="${escapeHtml([...new Set(airlineTiers)].join(","))}"
             data-layover-airports="${escapeHtml([...new Set(layoverAirports)].join(","))}"
             data-outbound-departure-minute="${outboundDepartureMinute ?? ""}"
             data-return-departure-minute="${returnDepartureMinute ?? ""}">
      <div class="round-trip-main">
        <div class="round-trip-title-row">
          <div>
            <p class="round-trip-label">왕복 항공권</p>
            <h3>
              ${escapeHtml(outboundOption.airlineName)}
              /
              ${escapeHtml(returnOption.airlineName)}
            </h3>
          </div>

          <div class="round-trip-total-duration">
            총 비행 ${escapeHtml(option.totalDurationText || "-")}
          </div>
        </div>

        <div class="compact-leg-list">
          ${renderCompactTripLeg(
      "가는 편",
      outboundOption,
      data.originAirportCode,
      data.destinationAirportCode,
      getOptionDepartureDate(outboundOption) || data.departureDate
  )}

          ${renderCompactTripLeg(
      "오는 편",
      returnOption,
      data.destinationAirportCode,
      data.originAirportCode,
      getOptionDepartureDate(returnOption) || data.returnDate
  )}
        </div>
      </div>

      <div class="round-trip-price-block">
        <p class="price-label">왕복 예상 총액</p>
        <p class="price">₩${formatPrice(totalPrice)}</p>

        <div class="passenger-summary">
          ${escapeHtml(outboundOption.passengerSummary || createPassengerSummary({
    adultCount,
    childCount,
    infantCount,
  }))}
        </div>

        <div class="round-trip-price-detail">
          가는 편 ₩${formatPrice(Number(outboundOption.totalPrice))}
          <br>
          오는 편 ₩${formatPrice(Number(returnOption.totalPrice))}
        </div>

        <a href="${createRoundTripSelectUrl(option)}" class="select-flight-btn">
          선택하기
        </a>
      </div>
    </article>
  `;
}

function renderCompactTripLeg(label, option, originCode, destinationCode, baseDate) {
  const segmentPathText = createSegmentPathText(option);
  const connectionText = createConnectionText(option);
  const arrivalDateSuffix = createArrivalDateSuffix(option.arrivalDate, baseDate);

  return `
    <div class="compact-trip-leg">
      <div class="compact-leg-label">${escapeHtml(label)}</div>

      <div class="compact-leg-airline">
        <strong>${escapeHtml(option.airlineName)}</strong>
        <span>${escapeHtml(option.airlineCode)}</span>
      </div>

      <div class="compact-leg-time">
        <strong>${formatTime(option.departureTime)}</strong>
        <span>${escapeHtml(originCode)}</span>
      </div>

      <div class="compact-leg-center">
        <span class="duration-text">${escapeHtml(option.totalDurationText)}</span>
        <span class="route-line"></span>
        <span class="segment-path">${escapeHtml(segmentPathText)}</span>
        <span class="layover-text">${escapeHtml(connectionText)}</span>
      </div>

      <div class="compact-leg-time">
        <strong>
          ${formatTime(option.arrivalTime)}
          ${arrivalDateSuffix}
        </strong>
        <span>${escapeHtml(destinationCode)}</span>
      </div>
    </div>
  `;
}

function getOptionDepartureDate(option) {
  return option?.segments?.[0]?.departureDate || null;
}

function createArrivalDateSuffix(arrivalDate, baseDate) {
  if (!arrivalDate || !baseDate || arrivalDate === baseDate) {
    return "";
  }

  return `<small class="arrival-next-day">+1</small>`;
}

function createOneWaySelectUrl(option) {
  const params = getCurrentParams();

  const query = new URLSearchParams();

  query.set("optionId", option.flightOptionId);
  query.set("adultCount", params.get("adultCount") || String(adultCount));
  query.set("childCount", params.get("childCount") || String(childCount));
  query.set("infantCount", params.get("infantCount") || String(infantCount));

  return `${FLIGHT_PAGE.BOOKING_ONE_WAY}?${query.toString()}`;
}

function createRoundTripSelectUrl(option) {
  const params = getCurrentParams();

  const query = new URLSearchParams();

  query.set("outboundOptionId", option.outboundOptionId);
  query.set("returnOptionId", option.returnOptionId);
  query.set("adultCount", params.get("adultCount") || String(adultCount));
  query.set("childCount", params.get("childCount") || String(childCount));
  query.set("infantCount", params.get("infantCount") || String(infantCount));

  return `${FLIGHT_PAGE.BOOKING_ROUND_TRIP}?${query.toString()}`;
}

/* ================================
   Empty / Button
   ================================ */

function enableSearchButton() {
  dom.resultsSearchBtn.disabled = false;
  dom.resultsSearchBtn.textContent = "검색하기";
}

function disableSearchButton(text) {
  dom.resultsSearchBtn.disabled = true;
  dom.resultsSearchBtn.textContent = text;
}

function renderEmptyFlightResult(config) {
  dom.flightResultGrid.innerHTML = `
    <div class="empty-result-action">
      <strong>${escapeHtml(config.title)}</strong>
      <p>${escapeHtml(config.message)}</p>
      <span>${escapeHtml(config.guide)}</span>

      <button type="button" id="openSearchPanelFromEmptyBtn" class="empty-result-search-btn">
        검색 조건 다시 수정하기 
      </button>
    </div>
  `;

  const openSearchPanelFromEmptyBtn = document.getElementById("openSearchPanelFromEmptyBtn");

  if (openSearchPanelFromEmptyBtn) {
    openSearchPanelFromEmptyBtn.addEventListener("click", openResultsSearchPanel);
  }
}