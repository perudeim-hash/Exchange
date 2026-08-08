import { fetchJson } from "../common/api.js";
import { addDays, getTodayText } from "../common/date-utils.js";
import { escapeHtml, formatPrice, formatTime } from "../common/format-utils.js";
import { replaceQueryParam } from "../common/url-utils.js";

import {
  findAirportByCode,
  loadAirportsWithCache,
} from "./common/airport-service.js";

import {
  FLIGHT_API,
  FLIGHT_PAGE,
  REGION_LABELS,
  TRIP_TYPE,
} from "./common/flight-constants.js";

import {
  appendPassengerParams,
} from "./common/passenger-utils.js";

import {
  getFirstSegment,
  getLastSegment,
  getSortedSegments,
} from "./common/flight-option-utils.js";

const dom = {};

let airports = [];
let currentTripType = TRIP_TYPE.ONE_WAY;

let oneWayDatePicker = null;
let outboundDatePicker = null;
let returnDatePicker = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheDom();

  currentTripType = getTripTypeFromUrl();

  initDefaultDates();
  bindEvents();
  initializeLowestDatePickers();
  updateTripTypeView();
  clearResults();

  await loadAirports();

  applyQueryParams();
  syncLowestDatePickersFromInputs();
}

/* ================================
   DOM
   ================================ */

function cacheDom() {
  dom.oneWayTripButton = document.getElementById("oneWayTripButton");
  dom.roundTripTripButton = document.getElementById("roundTripTripButton");

  dom.originRegionSelect = document.getElementById("originRegionSelect");
  dom.originCountrySelect = document.getElementById("originCountrySelect");
  dom.originAirportSelect = document.getElementById("originAirportSelect");

  dom.destinationRegionSelect = document.getElementById("destinationRegionSelect");
  dom.destinationCountrySelect = document.getElementById("destinationCountrySelect");
  dom.destinationAirportSelect = document.getElementById("destinationAirportSelect");

  dom.oneWayDateArea = document.getElementById("oneWayDateArea");
  dom.roundTripDateArea = document.getElementById("roundTripDateArea");

  dom.startDateInput = document.getElementById("startDateInput");
  dom.endDateInput = document.getElementById("endDateInput");

  dom.outboundStartDateInput = document.getElementById("outboundStartDateInput");
  dom.outboundEndDateInput = document.getElementById("outboundEndDateInput");
  dom.returnStartDateInput = document.getElementById("returnStartDateInput");
  dom.returnEndDateInput = document.getElementById("returnEndDateInput");

  dom.connectionTypeSelect = document.getElementById("connectionTypeSelect");
  dom.seatClassSelect = document.getElementById("seatClassSelect");

  dom.adultCountInput = document.getElementById("adultCountInput");
  dom.childCountInput = document.getElementById("childCountInput");
  dom.infantCountInput = document.getElementById("infantCountInput");

  dom.limitSelect = document.getElementById("limitSelect");
  dom.searchButton = document.getElementById("searchButton");

  dom.resultSummary = document.getElementById("resultSummary");
  dom.resultList = document.getElementById("resultList");

  dom.lowestGuideCard = document.getElementById("lowestGuideCard");
  dom.lowestSummaryCards = document.getElementById("lowestSummaryCards");

  dom.lowestBestPriceText = document.getElementById("lowestBestPriceText");
  dom.lowestBestDateText = document.getElementById("lowestBestDateText");

  dom.lowestDirectPriceText = document.getElementById("lowestDirectPriceText");
  dom.lowestDirectMetaText = document.getElementById("lowestDirectMetaText");

  dom.lowestLayoverPriceText = document.getElementById("lowestLayoverPriceText");
  dom.lowestLayoverMetaText = document.getElementById("lowestLayoverMetaText");

  dom.lowestResultCountText = document.getElementById("lowestResultCountText");
  dom.lowestResultMetaText = document.getElementById("lowestResultMetaText");
}

/* ================================
   Init / Events
   ================================ */

function bindEvents() {
  dom.oneWayTripButton.addEventListener("click", () => {
    changeTripType(TRIP_TYPE.ONE_WAY);
  });

  dom.roundTripTripButton.addEventListener("click", () => {
    changeTripType(TRIP_TYPE.ROUND_TRIP);
  });

  dom.originRegionSelect.addEventListener("change", () => {
    handleRegionChange("origin");
  });

  dom.originCountrySelect.addEventListener("change", () => {
    handleCountryChange("origin");
  });

  dom.destinationRegionSelect.addEventListener("change", () => {
    handleRegionChange("destination");
  });

  dom.destinationCountrySelect.addEventListener("change", () => {
    handleCountryChange("destination");
  });

  dom.searchButton.addEventListener("click", searchLowestPrices);
  bindLowestDateInputEvents();
}

function getTripTypeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tripType = params.get("tripType");

  if (tripType === TRIP_TYPE.ROUND_TRIP) {
    return TRIP_TYPE.ROUND_TRIP;
  }

  return TRIP_TYPE.ONE_WAY;
}

function changeTripType(tripType) {
  currentTripType = tripType === TRIP_TYPE.ROUND_TRIP
      ? TRIP_TYPE.ROUND_TRIP
      : TRIP_TYPE.ONE_WAY;

  updateTripTypeView();
  replaceQueryParam("tripType", currentTripType);
  clearResults();
}

function updateTripTypeView() {
  const isOneWay = currentTripType === TRIP_TYPE.ONE_WAY;

  dom.oneWayTripButton.classList.toggle("active", isOneWay);
  dom.roundTripTripButton.classList.toggle("active", !isOneWay);

  dom.oneWayDateArea.style.display = isOneWay ? "grid" : "none";
  dom.roundTripDateArea.style.display = isOneWay ? "none" : "grid";

  dom.searchButton.textContent = isOneWay
      ? "편도 최저가 조회"
      : "왕복 최저가 조회";
}



/* ================================
   Date
   ================================ */

function initDefaultDates() {
  const today = getTodayText();
  const outboundEndDate = addDays(today, 30);

  // 편도 조회 기간
  dom.startDateInput.value = today;
  dom.endDateInput.value = addDays(today, 30);

  // 왕복 출국 조회 기간
  dom.outboundStartDateInput.value = today;
  dom.outboundEndDateInput.value = outboundEndDate;

  // 왕복 귀국 조회 기간
  dom.returnStartDateInput.value =
      addDays(outboundEndDate, 1);

  dom.returnEndDateInput.value =
      addDays(today, 45);
}

function bindLowestDateInputEvents() {
  bindDatePickerOpenEvent(
      dom.endDateInput,
      () => oneWayDatePicker
  );

  bindDatePickerOpenEvent(
      dom.outboundEndDateInput,
      () => outboundDatePicker
  );

  bindDatePickerOpenEvent(
      dom.returnEndDateInput,
      () => returnDatePicker
  );
}

function bindDatePickerOpenEvent(input, getPicker) {
  if (!input) {
    return;
  }

  const openPicker = () => {
    getPicker()?.open();
  };

  input.addEventListener("click", openPicker);
  input.addEventListener("focus", openPicker);
}

function initializeLowestDatePickers() {
  if (!window.flatpickr) {
    console.error("Flatpickr 라이브러리가 로드되지 않았습니다.");
    return;
  }

  rebuildLowestDatePickers();
}

function rebuildLowestDatePickers() {
  destroyLowestDatePickers();

  oneWayDatePicker = createLowestRangePicker({
    startInput: dom.startDateInput,
    endInput: dom.endDateInput,
    minDate: getTodayText(),
    title: "편도 조회 기간 선택",
    description:
        "조회 시작일과 종료일을 같은 달력에서 차례대로 선택하세요.",
  });

  outboundDatePicker = createLowestRangePicker({
    startInput: dom.outboundStartDateInput,
    endInput: dom.outboundEndDateInput,
    minDate: getTodayText(),
    title: "출국 조회 기간 선택",
    description:
        "출국 시작일과 종료일을 같은 달력에서 차례대로 선택하세요.",

    onRangeComplete: () => {
      updateReturnDatePickerRange();

      setTimeout(() => {
        returnDatePicker?.open();
      }, 120);
    },
  });

  returnDatePicker = createLowestRangePicker({
    startInput: dom.returnStartDateInput,
    endInput: dom.returnEndDateInput,
    minDate: getReturnStartMinDate(),
    title: "귀국 조회 기간 선택",
    description:
        "귀국 시작일과 종료일을 같은 달력에서 차례대로 선택하세요.",
  });
}

function createLowestRangePicker({
                                   startInput,
                                   endInput,
                                   minDate,
                                   title,
                                   description,
                                   onRangeComplete = null,
                                 }) {
  return flatpickr(startInput, {
    mode: "range",
    locale: "ko",
    dateFormat: "Y-m-d",
    minDate,
    showMonths: 2,
    static: false,
    closeOnSelect: false,
    disableMobile: true,
    monthSelectorType: "static",
    prevArrow: "‹",
    nextArrow: "›",

    defaultDate: getLowestRangeDefaultDates(
        startInput,
        endInput
    ),

    onReady: (_, __, instance) => {
      addLowestCalendarHeader(
          instance,
          title,
          description
      );

      renderLowestRangeInputs(
          startInput,
          endInput,
          instance.selectedDates,
          instance
      );
    },

    onOpen: (_, __, instance) => {
      addLowestCalendarHeader(
          instance,
          title,
          description
      );

      renderLowestRangeInputs(
          startInput,
          endInput,
          instance.selectedDates,
          instance
      );
    },

    onChange: (selectedDates, _, instance) => {
      renderLowestRangeInputs(
          startInput,
          endInput,
          selectedDates,
          instance
      );

      if (selectedDates.length >= 2) {
        onRangeComplete?.();
        instance.close();
      }
    },

    onValueUpdate: (selectedDates, _, instance) => {
      renderLowestRangeInputs(
          startInput,
          endInput,
          selectedDates,
          instance
      );
    },
  });
}

function getLowestRangeDefaultDates(
    startInput,
    endInput
) {
  const startDate = startInput?.value || "";
  const endDate = endInput?.value || "";

  if (!startDate) {
    return [];
  }

  if (endDate && endDate >= startDate) {
    return [startDate, endDate];
  }

  return [startDate];
}

function renderLowestRangeInputs(
    startInput,
    endInput,
    selectedDates,
    instance
) {
  if (!startInput || !endInput) {
    return;
  }

  if (!selectedDates || selectedDates.length === 0) {
    startInput.value = "";
    endInput.value = "";
    return;
  }

  startInput.value =
      instance.formatDate(selectedDates[0], "Y-m-d");

  if (selectedDates.length >= 2) {
    endInput.value =
        instance.formatDate(selectedDates[1], "Y-m-d");
    return;
  }

  endInput.value = "";
}

function destroyLowestDatePickers() {
  [
    oneWayDatePicker,
    outboundDatePicker,
    returnDatePicker,
  ].forEach((picker) => {
    picker?.destroy();
  });

  oneWayDatePicker = null;
  outboundDatePicker = null;
  returnDatePicker = null;
}

function getReturnStartMinDate() {
  if (dom.outboundEndDateInput.value) {
    return addDays(
        dom.outboundEndDateInput.value,
        1
    );
  }

  if (dom.outboundStartDateInput.value) {
    return addDays(
        dom.outboundStartDateInput.value,
        1
    );
  }

  return getTodayText();
}

function updateReturnDatePickerRange() {
  if (!returnDatePicker) {
    return;
  }

  const minimumReturnDate =
      getReturnStartMinDate();

  const currentReturnStartDate =
      dom.returnStartDateInput.value;

  returnDatePicker.set(
      "minDate",
      minimumReturnDate
  );

  if (
      currentReturnStartDate &&
      currentReturnStartDate < minimumReturnDate
  ) {
    dom.returnStartDateInput.value = "";
    dom.returnEndDateInput.value = "";

    returnDatePicker.clear();
    return;
  }

  const defaultDates =
      getLowestRangeDefaultDates(
          dom.returnStartDateInput,
          dom.returnEndDateInput
      );

  returnDatePicker.setDate(defaultDates, false);

  renderLowestRangeInputs(
      dom.returnStartDateInput,
      dom.returnEndDateInput,
      returnDatePicker.selectedDates,
      returnDatePicker
  );
}

function syncLowestDatePickersFromInputs() {
  syncLowestRangePicker(
      oneWayDatePicker,
      dom.startDateInput,
      dom.endDateInput
  );

  syncLowestRangePicker(
      outboundDatePicker,
      dom.outboundStartDateInput,
      dom.outboundEndDateInput
  );

  updateReturnDatePickerRange();

  syncLowestRangePicker(
      returnDatePicker,
      dom.returnStartDateInput,
      dom.returnEndDateInput
  );
}

function syncLowestRangePicker(
    picker,
    startInput,
    endInput
) {
  if (!picker) {
    return;
  }

  picker.setDate(
      getLowestRangeDefaultDates(
          startInput,
          endInput
      ),
      false
  );

  renderLowestRangeInputs(
      startInput,
      endInput,
      picker.selectedDates,
      picker
  );
}

function addLowestCalendarHeader(
    instance,
    title,
    description
) {
  const calendar = instance.calendarContainer;

  if (
      !calendar ||
      calendar.querySelector(".tm-flatpickr-top")
  ) {
    return;
  }

  const header = document.createElement("div");
  header.className = "tm-flatpickr-top";

  header.innerHTML = `
    <div>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(description)}</span>
    </div>

    <button
      type="button"
      class="tm-flatpickr-apply-btn">
      적용
    </button>
  `;

  const applyButton =
      header.querySelector(".tm-flatpickr-apply-btn");

  applyButton.addEventListener("click", () => {
    instance.close();
  });

  calendar.prepend(header);
}
/* ================================
   Airport
   ================================ */

async function loadAirports() {
  try {
    airports = await loadAirportsWithCache();

    renderRegionSelect("origin");
    renderRegionSelect("destination");

    setAirportByCode("origin", "ICN");
    setAirportByCode("destination", "NRT");
  } catch (error) {
    console.error(error);
    showError(error.message);
  }
}

function renderRegionSelect(type) {
  const regionSelect = getRegionSelect(type);

  const regions = [...new Set(airports.map((airport) => airport.region))]
      .filter(Boolean)
      .sort();

  regionSelect.innerHTML = `<option value="">대륙 선택</option>`;

  regions.forEach((region) => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = REGION_LABELS[region] || region;
    regionSelect.appendChild(option);
  });
}

function handleRegionChange(type) {
  renderCountrySelect(type);
  renderAirportSelect(type);
  clearResults();
}

function handleCountryChange(type) {
  renderAirportSelect(type);
  clearResults();
}

function renderCountrySelect(type) {
  const regionSelect = getRegionSelect(type);
  const countrySelect = getCountrySelect(type);

  const selectedRegion = regionSelect.value;

  countrySelect.innerHTML = `<option value="">나라 선택</option>`;

  if (!selectedRegion) {
    renderAirportSelect(type);
    return;
  }

  const countries = airports
      .filter((airport) => airport.region === selectedRegion)
      .reduce((map, airport) => {
        if (!map.has(airport.countryCode)) {
          map.set(airport.countryCode, airport.countryName);
        }

        return map;
      }, new Map());

  [...countries.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "ko"))
      .forEach(([countryCode, countryName]) => {
        const option = document.createElement("option");
        option.value = countryCode;
        option.textContent = countryName;
        countrySelect.appendChild(option);
      });

  renderAirportSelect(type);
}

function renderAirportSelect(type) {
  const regionSelect = getRegionSelect(type);
  const countrySelect = getCountrySelect(type);
  const airportSelect = getAirportSelect(type);

  const selectedRegion = regionSelect.value;
  const selectedCountryCode = countrySelect.value;

  airportSelect.innerHTML = `<option value="">공항 선택</option>`;

  if (!selectedRegion || !selectedCountryCode) {
    return;
  }

  airports
      .filter((airport) => {
        return airport.region === selectedRegion &&
            airport.countryCode === selectedCountryCode;
      })
      .sort((a, b) => a.airportName.localeCompare(b.airportName, "ko"))
      .forEach((airport) => {
        const option = document.createElement("option");
        option.value = airport.airportCode;
        option.textContent = `${airport.cityName} - ${airport.airportName} (${airport.airportCode})`;
        airportSelect.appendChild(option);
      });
}

function setAirportByCode(type, airportCode) {
  const airport = findAirportByCode(airports, airportCode);

  if (!airport) {
    return;
  }

  const regionSelect = getRegionSelect(type);
  const countrySelect = getCountrySelect(type);
  const airportSelect = getAirportSelect(type);

  regionSelect.value = airport.region;

  renderCountrySelect(type);

  countrySelect.value = airport.countryCode;

  renderAirportSelect(type);

  airportSelect.value = airport.airportCode;
}

function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);

  const origin = params.get("origin");
  const destination = params.get("destination");

  if (origin) {
    setAirportByCode("origin", origin);
  }

  if (destination) {
    setAirportByCode("destination", destination);
  }

  applyInputParam(params, "startDate", dom.startDateInput);
  applyInputParam(params, "endDate", dom.endDateInput);

  applyInputParam(params, "outboundStartDate", dom.outboundStartDateInput);
  applyInputParam(params, "outboundEndDate", dom.outboundEndDateInput);
  applyInputParam(params, "returnStartDate", dom.returnStartDateInput);
  applyInputParam(params, "returnEndDate", dom.returnEndDateInput);

  applyInputParam(params, "connectionType", dom.connectionTypeSelect);
  applyInputParam(params, "seatClass", dom.seatClassSelect);
  applyInputParam(params, "adultCount", dom.adultCountInput);
  applyInputParam(params, "childCount", dom.childCountInput);
  applyInputParam(params, "infantCount", dom.infantCountInput);
  applyInputParam(params, "limit", dom.limitSelect);
}

function applyInputParam(params, paramName, inputElement) {
  const value = params.get(paramName);

  if (value) {
    inputElement.value = value;
  }
}

/* ================================
   Search
   ================================ */

async function searchLowestPrices() {
  if (!validateSearchCondition()) {
    return;
  }

  if (currentTripType === TRIP_TYPE.ROUND_TRIP) {
    await searchRoundTripLowestPrices();
    return;
  }

  await searchOneWayLowestPrices();
}

function validateSearchCondition() {
  const origin = getSelectedAirportCode("origin");
  const destination = getSelectedAirportCode("destination");

  if (!origin) {
    alert("출발 공항을 선택해 주세요.");
    return false;
  }

  if (!destination) {
    alert("도착 공항을 선택해 주세요.");
    return false;
  }

  if (origin === destination) {
    alert("출발 공항과 도착 공항은 같을 수 없습니다.");
    return false;
  }

  if (!validatePassengerCount()) {
    return false;
  }

  if (currentTripType === TRIP_TYPE.ONE_WAY) {
    return validateOneWayDates();
  }

  return validateRoundTripDates();
}

function validatePassengerCount() {
  const adultCount = Number(dom.adultCountInput.value || 0);
  const childCount = Number(dom.childCountInput.value || 0);
  const infantCount = Number(dom.infantCountInput.value || 0);
  const totalCount = adultCount + childCount + infantCount;

  if (adultCount < 1) {
    alert("성인은 최소 1명 이상이어야 합니다.");
    return false;
  }

  if (childCount < 0 || infantCount < 0) {
    alert("아동과 유아 수는 0명 이상이어야 합니다.");
    return false;
  }

  if (totalCount > 9) {
    alert("전체 승객은 최대 9명까지 선택할 수 있습니다.");
    return false;
  }

  if (infantCount > adultCount) {
    alert("유아 수는 성인 수보다 많을 수 없습니다.");
    return false;
  }

  return true;
}

function validateOneWayDates() {
  const startDate = dom.startDateInput.value;
  const endDate = dom.endDateInput.value;
  const today = getTodayText();

  if (!startDate || !endDate) {
    alert("조회 시작일과 종료일을 선택해 주세요.");
    return false;
  }

  if (startDate < today) {
    alert("조회 시작일은 오늘 이후 날짜만 선택할 수 있습니다.");
    return false;
  }

  if (endDate < startDate) {
    alert("조회 종료일은 시작일 이후여야 합니다.");
    return false;
  }

  return true;
}

function validateRoundTripDates() {
  const outboundStartDate = dom.outboundStartDateInput.value;
  const outboundEndDate = dom.outboundEndDateInput.value;
  const returnStartDate = dom.returnStartDateInput.value;
  const returnEndDate = dom.returnEndDateInput.value;
  const today = getTodayText();

  if (!outboundStartDate || !outboundEndDate || !returnStartDate || !returnEndDate) {
    alert("출국/귀국 조회 기간을 모두 선택해 주세요.");
    return false;
  }

  if (outboundStartDate < today) {
    alert("출국 시작일은 오늘 이후 날짜만 선택할 수 있습니다.");
    return false;
  }

  if (outboundEndDate < outboundStartDate) {
    alert("출국 종료일은 출국 시작일 이후여야 합니다.");
    return false;
  }

  if (returnStartDate <= outboundStartDate) {
    alert("귀국 시작일은 출국 시작일 이후여야 합니다.");
    return false;
  }

  if (returnEndDate < returnStartDate) {
    alert("귀국 종료일은 귀국 시작일 이후여야 합니다.");
    return false;
  }

  return true;
}

async function searchOneWayLowestPrices() {
  clearResults();
  showLoading("편도 최저가 항공권을 조회 중입니다.");

  try {
    const params = buildOneWaySearchParams();

    const data = await fetchJson(
        `${FLIGHT_API.LOWEST_ONE_WAY}?${params.toString()}`,
        "편도 최저가 조회에 실패했습니다."
    );

    renderOneWaySummary(data);
    renderOneWayOptions(data.options || []);
  } catch (error) {
    console.error(error);
    showError(error.message);
  }
}

async function searchRoundTripLowestPrices() {
  clearResults();
  showLoading("왕복 최저가 항공권을 조회 중입니다.");

  try {
    const params = buildRoundTripSearchParams();

    const data = await fetchJson(
        `${FLIGHT_API.LOWEST_ROUND_TRIP}?${params.toString()}`,
        "왕복 최저가 조회에 실패했습니다."
    );

    renderRoundTripSummary(data);
    renderRoundTripOptions(data.options || []);
  } catch (error) {
    console.error(error);
    showError(error.message);
  }
}

function buildOneWaySearchParams() {
  const params = new URLSearchParams();

  params.set("origin", getSelectedAirportCode("origin"));
  params.set("destination", getSelectedAirportCode("destination"));
  params.set("startDate", dom.startDateInput.value);
  params.set("endDate", dom.endDateInput.value);

  appendCommonSearchParams(params);

  return params;
}

function buildRoundTripSearchParams() {
  const params = new URLSearchParams();

  params.set("origin", getSelectedAirportCode("origin"));
  params.set("destination", getSelectedAirportCode("destination"));
  params.set("outboundStartDate", dom.outboundStartDateInput.value);
  params.set("outboundEndDate", dom.outboundEndDateInput.value);
  params.set("returnStartDate", dom.returnStartDateInput.value);
  params.set("returnEndDate", dom.returnEndDateInput.value);

  appendCommonSearchParams(params);

  return params;
}

function appendCommonSearchParams(params) {
  const connectionType = dom.connectionTypeSelect.value;
  const seatClass = dom.seatClassSelect.value;

  if (connectionType) {
    params.set("connectionType", connectionType);
  }

  if (seatClass) {
    params.set("seatClass", seatClass);
  }

  appendPassengerParams(
      params,
      dom.adultCountInput.value || "1",
      dom.childCountInput.value || "0",
      dom.infantCountInput.value || "0"
  );

  params.set("limit", dom.limitSelect.value || "30");
}

/* ================================
   Summary
   ================================ */

function renderOneWaySummary(data) {
  const options = data.options || [];

  renderLowestSummaryCards({
    origin: data.originAirportCode,
    destination: data.destinationAirportCode,
    periodText: `${data.startDate} ~ ${data.endDate}`,
    options,
  });

  dom.resultSummary.innerHTML = `
    <strong>편도 최저가</strong>
    <span>${escapeHtml(data.originAirportCode)} → ${escapeHtml(data.destinationAirportCode)}</span>
    <span>${escapeHtml(data.startDate)} ~ ${escapeHtml(data.endDate)}</span>
    <span>결과 ${escapeHtml(data.resultCount ?? options.length)}개</span>
  `;
}

function renderRoundTripSummary(data) {
  const options = data.options || [];

  renderLowestSummaryCards({
    origin: data.originAirportCode,
    destination: data.destinationAirportCode,
    periodText: `출국 ${data.outboundStartDate} ~ ${data.outboundEndDate}`,
    returnPeriodText: `귀국 ${data.returnStartDate} ~ ${data.returnEndDate}`,
    options,
  });

  dom.resultSummary.innerHTML = `
    <strong>${escapeHtml(data.tripTypeDescription || "왕복 최저가")}</strong>
    <span>${escapeHtml(data.originAirportCode)} → ${escapeHtml(data.destinationAirportCode)}</span>
    <span>가는 편 ${escapeHtml(data.outboundStartDate)} ~ ${escapeHtml(data.outboundEndDate)}</span>
    <span>오는 편 ${escapeHtml(data.returnStartDate)} ~ ${escapeHtml(data.returnEndDate)}</span>
    <span>결과 ${escapeHtml(data.resultCount ?? options.length)}개</span>
  `;
}

function renderLowestSummaryCards({ origin, destination, periodText, returnPeriodText = "", options }) {
  if (dom.lowestGuideCard) {
    dom.lowestGuideCard.style.display = "none";
  }

  if (dom.lowestSummaryCards) {
    dom.lowestSummaryCards.classList.remove("lowest-summary-hidden");
  }

  const safeOptions = Array.isArray(options) ? options : [];
  const bestOption = safeOptions[0];

  dom.lowestBestPriceText.textContent = bestOption
      ? `${formatPrice(bestOption.totalPrice)}원`
      : "-";

  dom.lowestBestDateText.textContent = bestOption
      ? createBestDateText(bestOption)
      : "조회된 항공권이 없습니다.";

  const directOption = findSummaryOptionByConnectionType(safeOptions, "DIRECT");
  const layoverOption = findSummaryOptionByConnectionType(safeOptions, "ONE_STOP");

  dom.lowestDirectPriceText.textContent = directOption
      ? `${formatPrice(directOption.totalPrice)}원`
      : "-";

  dom.lowestDirectMetaText.textContent = directOption
      ? createBestDateText(directOption)
      : "직항 후보가 없습니다.";

  dom.lowestLayoverPriceText.textContent = layoverOption
      ? `${formatPrice(layoverOption.totalPrice)}원`
      : "-";

  dom.lowestLayoverMetaText.textContent = layoverOption
      ? createBestDateText(layoverOption)
      : "경유 후보가 없습니다.";

  dom.lowestResultCountText.textContent = `${safeOptions.length}개`;
  dom.lowestResultMetaText.textContent = returnPeriodText
      ? `${origin} → ${destination} · ${periodText} · ${returnPeriodText}`
      : `${origin} → ${destination} · ${periodText}`;
}

function findSummaryOptionByConnectionType(options, connectionType) {
  return options.find((option) => {
    if (option.outboundOption || option.returnOption) {
      return option.outboundOption?.connectionType === connectionType ||
          option.returnOption?.connectionType === connectionType;
    }

    return option.connectionType === connectionType;
  });
}

function createBestDateText(option) {
  if (option.outboundOption || option.returnOption) {
    const outboundFirstSegment = getFirstSegment(option.outboundOption);
    const returnFirstSegment = getFirstSegment(option.returnOption);

    const outboundDate = outboundFirstSegment?.departureDate || option.outboundOption?.departureDate;
    const returnDate = returnFirstSegment?.departureDate || option.returnOption?.departureDate;

    if (outboundDate && returnDate) {
      return `${outboundDate} 출국 · ${returnDate} 귀국`;
    }

    if (outboundDate) {
      return `${outboundDate} 출국`;
    }
  }

  const firstSegment = getFirstSegment(option);

  if (firstSegment) {
    return `${firstSegment.departureDate} ${formatTime(firstSegment.departureTime)} 출발`;
  }

  if (option.departureDate) {
    return `${option.departureDate} ${formatTime(option.departureTime)} 출발`;
  }

  return "출발 정보 확인 필요";
}

/* ================================
   Render Options
   ================================ */

function renderOneWayOptions(options) {
  if (options.length === 0) {
    dom.resultList.innerHTML = createEmptyBox("조회된 편도 항공권이 없습니다.");
    return;
  }

  dom.resultList.innerHTML = options
      .map((option, index) => createOneWayCard(option, index))
      .join("");
}

function renderRoundTripOptions(options) {
  if (options.length === 0) {
    dom.resultList.innerHTML = createEmptyBox("조회된 왕복 항공권이 없습니다.");
    return;
  }

  dom.resultList.innerHTML = options
      .map((option, index) => createRoundTripCard(option, index))
      .join("");
}

function createOneWayCard(option, index) {
  const bookingUrl = createOneWayBookingUrl(option);

  return `
    <article class="flight-card one-way-card">
      <div class="card-rank">TOP ${index + 1}</div>

      <div class="card-content">
        <div class="price-box">
          <span class="price-label">편도 총액</span>
          <strong>${formatPrice(option.totalPrice)}원</strong>
          <span>${escapeHtml(option.passengerSummary || "")}</span>
          <span>${escapeHtml(option.totalDurationText || "")}</span>
        </div>

        <div class="flight-detail">
          ${createFlightLeg("편도", option)}
        </div>
      </div>

      <div class="card-actions">
        <a class="detail-button" href="${bookingUrl}">
          편도 선택하기
        </a>
      </div>
    </article>
  `;
}

function createRoundTripCard(option, index) {
  const outboundOption = option.outboundOption;
  const returnOption = option.returnOption;

  const bookingUrl = createRoundTripBookingUrl(option);

  return `
    <article class="flight-card round-trip-card">
      <div class="card-rank">TOP ${index + 1}</div>

      <div class="card-content round-trip-content">
        <div class="price-box">
          <span class="price-label">왕복 총액</span>
          <strong>${formatPrice(option.totalPrice)}원</strong>
          <span>${escapeHtml(outboundOption?.passengerSummary || "")}</span>
          <span>총 비행 ${escapeHtml(option.totalDurationText || "")}</span>
        </div>

        <div class="round-trip-legs">
          ${createFlightLeg("가는 편", outboundOption)}
          ${createFlightLeg("오는 편", returnOption)}
        </div>
      </div>

      <div class="card-actions">
        <a class="booking-button" href="${bookingUrl}">
          왕복 선택하기
        </a>
      </div>
    </article>
  `;
}

function createFlightLeg(label, flight) {
  if (!flight) {
    return `
      <div class="flight-leg">
        <div class="leg-header">
          <span class="leg-label">${escapeHtml(label)}</span>
          <span class="airline">항공편 정보 없음</span>
        </div>
      </div>
    `;
  }

  const firstSegment = getFirstSegment(flight);
  const lastSegment = getLastSegment(flight);

  const originAirportCode = firstSegment ? firstSegment.originAirportCode : flight.originAirportCode || "-";
  const originAirportName = firstSegment ? firstSegment.originAirportName : flight.originAirportName || "";

  const destinationAirportCode = lastSegment ? lastSegment.destinationAirportCode : flight.destinationAirportCode || "-";
  const destinationAirportName = lastSegment ? lastSegment.destinationAirportName : flight.destinationAirportName || "";

  const departureDate = firstSegment ? firstSegment.departureDate : flight.departureDate || "-";
  const departureTime = firstSegment ? firstSegment.departureTime : flight.departureTime;

  const arrivalDate = lastSegment ? lastSegment.arrivalDate : flight.arrivalDate || "-";
  const arrivalTime = lastSegment ? lastSegment.arrivalTime : flight.arrivalTime;

  return `
    <div class="flight-leg">
      <div class="leg-header">
        <span class="leg-label">${escapeHtml(label)}</span>
        <span class="airline">
          ${escapeHtml(flight.airlineName || "")}
          ·
          ${escapeHtml(flight.connectionTypeDescription || "")}
        </span>
      </div>

      <div class="route-line">
        <div class="airport">
          <strong>${escapeHtml(originAirportCode)}</strong>
          <span>${escapeHtml(originAirportName)}</span>
        </div>

        <div class="route-arrow">→</div>

        <div class="airport">
          <strong>${escapeHtml(destinationAirportCode)}</strong>
          <span>${escapeHtml(destinationAirportName)}</span>
        </div>
      </div>

      <div class="time-line">
        <span>출발 ${escapeHtml(departureDate)} ${formatTime(departureTime)}</span>
        <span>도착 ${escapeHtml(arrivalDate)} ${formatTime(arrivalTime)}</span>
      </div>

      <div class="meta-line">
        <span>${escapeHtml(flight.seatClassDescription || "")}</span>
        <span>${escapeHtml(flight.totalDurationText || "")}</span>
        <span>${formatPrice(flight.totalPrice)}원</span>
      </div>

      ${createSegmentList(flight)}
    </div>
  `;
}

function createSegmentList(flight) {
  const segments = getSortedSegments(flight);

  if (segments.length <= 1) {
    return "";
  }

  const segmentItems = segments
      .map((segment) => {
        return `
        <li>
          ${escapeHtml(segment.originAirportCode)}
          →
          ${escapeHtml(segment.destinationAirportCode)}
          /
          ${escapeHtml(segment.durationText || "")}
        </li>
      `;
      })
      .join("");

  return `
    <ul class="segment-list">
      ${segmentItems}
    </ul>
  `;
}

/* ================================
   Booking URL
   ================================ */

function createOneWayBookingUrl(option) {
  const params = new URLSearchParams();

  params.set("optionId", option.flightOptionId);
  params.set("adultCount", option.adultCount || dom.adultCountInput.value || "1");
  params.set("childCount", option.childCount || dom.childCountInput.value || "0");
  params.set("infantCount", option.infantCount || dom.infantCountInput.value || "0");

  return `${FLIGHT_PAGE.BOOKING_ONE_WAY}?${params.toString()}`;
}

function createRoundTripBookingUrl(option) {
  const outboundOption = option.outboundOption || {};
  const params = new URLSearchParams();

  params.set("outboundOptionId", option.outboundOptionId);
  params.set("returnOptionId", option.returnOptionId);
  params.set("adultCount", outboundOption.adultCount || dom.adultCountInput.value || "1");
  params.set("childCount", outboundOption.childCount || dom.childCountInput.value || "0");
  params.set("infantCount", outboundOption.infantCount || dom.infantCountInput.value || "0");

  return `${FLIGHT_PAGE.BOOKING_ROUND_TRIP}?${params.toString()}`;
}

/* ================================
   Getter
   ================================ */

function getRegionSelect(type) {
  return type === "origin"
      ? dom.originRegionSelect
      : dom.destinationRegionSelect;
}

function getCountrySelect(type) {
  return type === "origin"
      ? dom.originCountrySelect
      : dom.destinationCountrySelect;
}

function getAirportSelect(type) {
  return type === "origin"
      ? dom.originAirportSelect
      : dom.destinationAirportSelect;
}

function getSelectedAirportCode(type) {
  return getAirportSelect(type).value;
}

/* ================================
   State
   ================================ */

function showLoading(message) {
  if (dom.lowestGuideCard) {
    dom.lowestGuideCard.style.display = "none";
  }

  if (dom.lowestSummaryCards) {
    dom.lowestSummaryCards.classList.add("lowest-summary-hidden");
  }

  dom.resultSummary.textContent = message;

  dom.resultList.innerHTML = `
    <div class="lowest-empty-state">
      <strong>최저가 항공권을 조회하고 있습니다.</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function showError(message) {
  if (dom.lowestGuideCard) {
    dom.lowestGuideCard.style.display = "none";
  }

  if (dom.lowestSummaryCards) {
    dom.lowestSummaryCards.classList.add("lowest-summary-hidden");
  }

  dom.resultSummary.textContent = "조회 중 오류가 발생했습니다.";
  dom.resultList.innerHTML = createEmptyBox(message);
}

function clearResults() {
  if (dom.lowestGuideCard) {
    dom.lowestGuideCard.style.display = "";
  }

  if (dom.lowestSummaryCards) {
    dom.lowestSummaryCards.classList.add("lowest-summary-hidden");
  }

  dom.resultSummary.textContent =
      "조회 조건을 선택한 뒤 최저가 항공권을 조회해 주세요.";

  dom.resultList.innerHTML = `
    <div class="lowest-empty-state">
      <strong>아직 조회된 항공권이 없습니다.</strong>
      <p>왼쪽에서 노선과 기간을 선택한 뒤 최저가 조회를 눌러 주세요.</p>
    </div>
  `;
}

function createEmptyBox(message) {
  return `
    <div class="empty-box">
      ${escapeHtml(message)}
    </div>
  `;
}