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

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheDom();

  currentTripType = getTripTypeFromUrl();

  initDefaultDates();
  bindEvents();
  updateTripTypeView();

  await loadAirports();
  applyQueryParams();
}

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
}

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
  currentTripType = tripType;

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

function initDefaultDates() {
  const today = getTodayText();

  dom.startDateInput.value = today;
  dom.endDateInput.value = addDays(today, 30);

  dom.outboundStartDateInput.value = today;
  dom.outboundEndDateInput.value = addDays(today, 30);
  dom.returnStartDateInput.value = addDays(today, 5);
  dom.returnEndDateInput.value = addDays(today, 45);
}

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
}

function handleCountryChange(type) {
  renderAirportSelect(type);
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
}

function applyInputParam(params, paramName, inputElement) {
  const value = params.get(paramName);

  if (value) {
    inputElement.value = value;
  }
}

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

  return true;
}

async function searchOneWayLowestPrices() {
  clearResults();
  showLoading("편도 최저가 항공권을 조회 중입니다...");

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
  showLoading("왕복 최저가 항공권을 조회 중입니다...");

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

function renderOneWaySummary(data) {
  dom.resultSummary.innerHTML = `
    <strong>편도 최저가</strong>
    <span>${escapeHtml(data.originAirportCode)} → ${escapeHtml(data.destinationAirportCode)}</span>
    <span>${escapeHtml(data.startDate)} ~ ${escapeHtml(data.endDate)}</span>
    <span>결과 ${data.resultCount}개</span>
  `;
}

function renderRoundTripSummary(data) {
  dom.resultSummary.innerHTML = `
    <strong>${escapeHtml(data.tripTypeDescription || "왕복 최저가")}</strong>
    <span>${escapeHtml(data.originAirportCode)} → ${escapeHtml(data.destinationAirportCode)}</span>
    <span>가는 편 ${escapeHtml(data.outboundStartDate)} ~ ${escapeHtml(data.outboundEndDate)}</span>
    <span>오는 편 ${escapeHtml(data.returnStartDate)} ~ ${escapeHtml(data.returnEndDate)}</span>
    <span>결과 ${data.resultCount}개</span>
  `;
}

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
          <span>${escapeHtml(outboundOption.passengerSummary || "")}</span>
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

function createOneWayBookingUrl(option) {
  const params = new URLSearchParams();

  params.set("optionId", option.flightOptionId);
  params.set("adultCount", option.adultCount || "1");
  params.set("childCount", option.childCount || "0");
  params.set("infantCount", option.infantCount || "0");

  return `${FLIGHT_PAGE.BOOKING_ONE_WAY}?${params.toString()}`;
}

function createRoundTripBookingUrl(option) {
  const outboundOption = option.outboundOption;
  const params = new URLSearchParams();

  params.set("outboundOptionId", option.outboundOptionId);
  params.set("returnOptionId", option.returnOptionId);
  params.set("adultCount", outboundOption.adultCount || "1");
  params.set("childCount", outboundOption.childCount || "0");
  params.set("infantCount", outboundOption.infantCount || "0");

  return `${FLIGHT_PAGE.BOOKING_ROUND_TRIP}?${params.toString()}`;
}

function createFlightLeg(label, flight) {
  const firstSegment = getFirstSegment(flight);
  const lastSegment = getLastSegment(flight);

  const originAirportCode = firstSegment ? firstSegment.originAirportCode : "-";
  const originAirportName = firstSegment ? firstSegment.originAirportName : "";

  const destinationAirportCode = lastSegment ? lastSegment.destinationAirportCode : "-";
  const destinationAirportName = lastSegment ? lastSegment.destinationAirportName : "";

  const departureDate = firstSegment ? firstSegment.departureDate : "-";
  const departureTime = firstSegment ? firstSegment.departureTime : flight.departureTime;

  const arrivalDate = lastSegment ? lastSegment.arrivalDate : flight.arrivalDate;
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

function showLoading(message) {
  dom.resultSummary.textContent = message;
  dom.resultList.innerHTML = "";
}

function showError(message) {
  dom.resultSummary.textContent = "조회 중 오류가 발생했습니다.";
  dom.resultList.innerHTML = createEmptyBox(message);
}

function clearResults() {
  dom.resultSummary.textContent =
    "조회 조건을 선택한 뒤 최저가 항공권을 조회해 주세요.";

  dom.resultList.innerHTML = "";
}

function createEmptyBox(message) {
  return `
    <div class="empty-box">
      ${escapeHtml(message)}
    </div>
  `;
}