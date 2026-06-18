import { fetchJson } from "../common/api.js";
import { escapeHtml, formatPrice } from "../common/format-utils.js";
import { moveTo } from "../common/url-utils.js";
import {
  getAirportsByCountryAndCity,
  getCitiesByCountryCode,
  getCountriesFromAirports,
  loadAirportsWithCache,
} from "./common/airport-service.js";
import { FLIGHT_API, FLIGHT_PAGE, TRIP_TYPE } from "./common/flight-constants.js";

const dom = {};

let airports = [];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheDom();

  try {
    airports = await loadAirportsWithCache();

    initLocationSelectors();
    bindEvents();

    await loadRoutes();
  } catch (error) {
    console.error(error);
    renderRouteError("공항 정보를 불러오지 못했습니다.");
  }
}

function cacheDom() {
  dom.originCountrySelect = document.getElementById("originCountrySelect");
  dom.originCitySelect = document.getElementById("originCitySelect");
  dom.originAirportList = document.getElementById("originAirportList");

  dom.destinationCountrySelect = document.getElementById("destinationCountrySelect");
  dom.destinationCitySelect = document.getElementById("destinationCitySelect");
  dom.destinationAirportList = document.getElementById("destinationAirportList");

  dom.routeSearchButton = document.getElementById("routeSearchButton");
  dom.routeResetButton = document.getElementById("routeResetButton");

  dom.routeList = document.getElementById("routeList");
  dom.routeCountText = document.getElementById("routeCountText");
}

function initLocationSelectors() {
  renderCountryOptions("origin");
  renderCountryOptions("destination");

  selectDefaultCountry("origin", "KR", "대한민국");
  selectDefaultCountry("destination", "JP", "일본");

  renderCityOptions("origin");
  renderCityOptions("destination");

  renderAirportOptions("origin");
  renderAirportOptions("destination");
}

function bindEvents() {
  dom.originCountrySelect.addEventListener("change", () => {
    renderCityOptions("origin");
    renderAirportOptions("origin");
  });

  dom.originCitySelect.addEventListener("change", () => {
    renderAirportOptions("origin");
  });

  dom.destinationCountrySelect.addEventListener("change", () => {
    renderCityOptions("destination");
    renderAirportOptions("destination");
  });

  dom.destinationCitySelect.addEventListener("change", () => {
    renderAirportOptions("destination");
  });

  dom.routeSearchButton.addEventListener("click", searchRouteDetail);

  dom.routeResetButton.addEventListener("click", loadRoutes);
}

function renderCountryOptions(type) {
  const countrySelect = getCountrySelect(type);
  const countries = getCountriesFromAirports(airports);

  countrySelect.innerHTML = countries
    .map((country) => {
      return `
        <option value="${escapeHtml(country.countryCode)}">
          ${escapeHtml(country.countryName)}
        </option>
      `;
    })
    .join("");
}

function selectDefaultCountry(type, defaultCountryCode, defaultCountryName) {
  const countrySelect = getCountrySelect(type);
  const options = Array.from(countrySelect.options);

  const matchedOption = options.find((option) => {
    return option.value === defaultCountryCode ||
      option.textContent.trim() === defaultCountryName;
  });

  if (matchedOption) {
    countrySelect.value = matchedOption.value;
  }
}

function renderCityOptions(type) {
  const countrySelect = getCountrySelect(type);
  const citySelect = getCitySelect(type);

  const selectedCountryCode = countrySelect.value;
  const cities = getCitiesByCountryCode(airports, selectedCountryCode);

  citySelect.innerHTML = cities
    .map((cityName) => {
      return `
        <option value="${escapeHtml(cityName)}">
          ${escapeHtml(cityName)}
        </option>
      `;
    })
    .join("");
}

function renderAirportOptions(type) {
  const countrySelect = getCountrySelect(type);
  const citySelect = getCitySelect(type);
  const airportList = getAirportList(type);

  const selectedCountryCode = countrySelect.value;
  const selectedCityName = citySelect.value;

  const filteredAirports = getAirportsByCountryAndCity(
    airports,
    selectedCountryCode,
    selectedCityName
  );

  if (filteredAirports.length === 0) {
    airportList.innerHTML = `<p class="airport-empty">선택 가능한 공항이 없습니다.</p>`;
    return;
  }

  const inputName = type === "origin" ? "originAirport" : "destinationAirport";

  airportList.innerHTML = filteredAirports
    .map((airport, index) => {
      return `
        <label class="airport-radio-item">
          <input type="radio"
                 name="${inputName}"
                 value="${escapeHtml(airport.airportCode)}"
                 ${index === 0 ? "checked" : ""}>
          <span>
            ${escapeHtml(airport.airportName)}
            ${escapeHtml(airport.airportCode)}
          </span>
        </label>
      `;
    })
    .join("");
}

async function loadRoutes() {
  try {
    dom.routeCountText.textContent = "노선 정보를 불러오는 중입니다.";
    dom.routeList.innerHTML = "";

    const routes = await fetchJson(
      FLIGHT_API.ROUTES,
      "노선 목록을 불러오지 못했습니다."
    );

    renderRoutes(routes);
  } catch (error) {
    console.error(error);
    renderRouteError("노선 목록 조회 중 오류가 발생했습니다.");
  }
}

async function searchRouteDetail() {
  const originAirportCode = getSelectedAirportCode("origin");
  const destinationAirportCode = getSelectedAirportCode("destination");

  if (!originAirportCode || !destinationAirportCode) {
    alert("출발 공항과 도착 공항을 선택해 주세요.");
    return;
  }

  if (originAirportCode === destinationAirportCode) {
    alert("출발 공항과 도착 공항은 같을 수 없습니다.");
    return;
  }

  await loadRouteDetail(originAirportCode, destinationAirportCode);
}

async function loadRouteDetail(origin, destination) {
  try {
    dom.routeCountText.textContent = "노선 정보를 검색하는 중입니다.";
    dom.routeList.innerHTML = "";

    const params = new URLSearchParams();
    params.set("origin", origin);
    params.set("destination", destination);

    const route = await fetchJson(
      `${FLIGHT_API.ROUTE_DETAIL}?${params.toString()}`,
      "해당 노선을 찾을 수 없습니다."
    );

    renderRoutes([route]);
  } catch (error) {
    console.error(error);
    dom.routeCountText.textContent = "검색 결과가 없습니다.";
    dom.routeList.innerHTML = `<p class="route-error">해당 노선을 찾을 수 없습니다.</p>`;
  }
}

function renderRoutes(routes) {
  if (!Array.isArray(routes) || routes.length === 0) {
    dom.routeCountText.textContent = "조회된 노선이 없습니다.";
    dom.routeList.innerHTML = `<p class="route-empty">조회된 노선이 없습니다.</p>`;
    return;
  }

  dom.routeCountText.textContent = `총 ${routes.length}개의 노선이 조회되었습니다.`;
  dom.routeList.innerHTML = routes
    .map((route) => createRouteCard(route))
    .join("");

  bindRouteActionButtons();
}

function createRouteCard(route) {
  return `
    <article class="route-card">
      <div class="route-card-header">
        <div>
          <p class="route-code">
            ${escapeHtml(route.originAirportCode)}
            →
            ${escapeHtml(route.destinationAirportCode)}
          </p>
          <h3>
            ${escapeHtml(route.originCityName)}
            →
            ${escapeHtml(route.destinationCityName)}
          </h3>
        </div>

        <div class="route-badges">
          ${route.hasDirect ? `<span class="route-badge">직항 가능</span>` : ""}
          ${route.hasLayover ? `<span class="route-badge">경유 가능</span>` : ""}
        </div>
      </div>

      <div class="route-airports">
        <p>
          <strong>출발</strong>
          ${escapeHtml(route.originAirportName)}
          (${escapeHtml(route.originAirportCode)})
        </p>
        <p>
          <strong>도착</strong>
          ${escapeHtml(route.destinationAirportName)}
          (${escapeHtml(route.destinationAirportCode)})
        </p>
      </div>

      <div class="route-stats">
        <div>
          <span>최저가</span>
          <strong>${formatFlightPrice(route.minPrice)}</strong>
        </div>
        <div>
          <span>최단 소요시간</span>
          <strong>${escapeHtml(route.minDurationText || "-")}</strong>
        </div>
        <div>
          <span>직항 최저가</span>
          <strong>${formatFlightPrice(route.directMinPrice)}</strong>
        </div>
        <div>
          <span>경유 최저가</span>
          <strong>${formatFlightPrice(route.layoverMinPrice)}</strong>
        </div>
      </div>

      <div class="route-actions">
        <button type="button"
                class="route-search-link"
                data-origin="${escapeHtml(route.originAirportCode)}"
                data-destination="${escapeHtml(route.destinationAirportCode)}">
          항공권 검색하기
        </button>

        <button type="button"
                class="route-lowest-link"
                data-origin="${escapeHtml(route.originAirportCode)}"
                data-destination="${escapeHtml(route.destinationAirportCode)}">
          최저가 보기
        </button>
      </div>
    </article>
  `;
}

function bindRouteActionButtons() {
  dom.routeList.querySelectorAll(".route-search-link").forEach((button) => {
    button.addEventListener("click", () => {
      moveToFlightSearch(button.dataset.origin, button.dataset.destination);
    });
  });

  dom.routeList.querySelectorAll(".route-lowest-link").forEach((button) => {
    button.addEventListener("click", () => {
      moveToLowestPrices(button.dataset.origin, button.dataset.destination);
    });
  });
}

function moveToFlightSearch(origin, destination) {
  const params = new URLSearchParams();

  params.set("tripType", TRIP_TYPE.ROUND_TRIP);
  params.set("origin", origin);
  params.set("destination", destination);

  moveTo(FLIGHT_PAGE.SEARCH, params);
}

function moveToLowestPrices(origin, destination) {
  const params = new URLSearchParams();

  params.set("tripType", TRIP_TYPE.ROUND_TRIP);
  params.set("origin", origin);
  params.set("destination", destination);

  moveTo(FLIGHT_PAGE.LOWEST_PRICES, params);
}

function getSelectedAirportCode(type) {
  const inputName = type === "origin" ? "originAirport" : "destinationAirport";
  const checkedAirport = document.querySelector(`input[name="${inputName}"]:checked`);

  if (!checkedAirport) {
    return null;
  }

  return checkedAirport.value;
}

function getCountrySelect(type) {
  return type === "origin"
    ? dom.originCountrySelect
    : dom.destinationCountrySelect;
}

function getCitySelect(type) {
  return type === "origin"
    ? dom.originCitySelect
    : dom.destinationCitySelect;
}

function getAirportList(type) {
  return type === "origin"
    ? dom.originAirportList
    : dom.destinationAirportList;
}

function formatFlightPrice(price) {
  const formattedPrice = formatPrice(price);

  if (formattedPrice === "-") {
    return "-";
  }

  return `${formattedPrice}원`;
}

function renderRouteError(message) {
  dom.routeCountText.textContent = message;
  dom.routeList.innerHTML = `<p class="route-error">${escapeHtml(message)}</p>`;
}