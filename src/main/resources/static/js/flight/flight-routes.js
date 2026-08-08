import {fetchJson} from "../common/api.js";
import {getTodayText} from "../common/date-utils.js";
import {escapeHtml, formatPrice} from "../common/format-utils.js";
import {moveTo} from "../common/url-utils.js";
import {
    getAirportsByCountryAndCity,
    getCitiesByCountryCode,
    getCountriesFromAirports,
    loadAirportsWithCache,
} from "./common/airport-service.js";
import {FLIGHT_PAGE, TRIP_TYPE} from "./common/flight-constants.js";

const dom = {};

let airports = [];
let routesCache = [];
let routePriceFilter = "ALL";
let routeDatePicker = null;
let routeSearchRequestSeq = 0;
let activeRouteSearchState = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
    cacheDom();

    try {
        airports = await loadAirportsWithCache();

        initLocationSelectors();
        renderRouteFilters();
        bindEvents();
        initializeRouteDatePicker();

        await searchRoutesByCondition({
            useSelectedAirports: false,
            saveState: true
        });
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

    dom.routeStartDateInput = document.getElementById("routeStartDateInput");
    dom.routeEndDateInput = document.getElementById("routeEndDateInput");
    dom.routeTimeSlotButtons = document.getElementById("routeTimeSlotButtons");

    dom.routeSearchButton = document.getElementById("routeSearchButton");
    dom.routeResetButton = document.getElementById("routeResetButton");

    dom.routeList = document.getElementById("routeList");
    dom.routeCountText = document.getElementById("routeCountText");
    dom.routeFilterArea = document.getElementById("routeFilterArea");
}

function initLocationSelectors() {
    renderCountryOptions("origin", false);
    renderCountryOptions("destination", true);

    selectDefaultCountry("origin", "KR", "대한민국");

    renderCityOptions("origin", false);
    selectDefaultCity("origin", "서울");
    renderAirportOptions("origin");

    renderCityOptions("destination", true);
    renderAirportOptions("destination");
}

function bindEvents() {
    if (dom.routeFilterArea) {
        dom.routeFilterArea.addEventListener("click", async (event) => {
            const button = event.target.closest(".route-filter-button");

            if (!button) {
                return;
            }

            routePriceFilter = button.dataset.filter || "ALL";

            dom.routeFilterArea.querySelectorAll(".route-filter-button").forEach((filterButton) => {
                filterButton.classList.toggle("active", filterButton === button);
            });

            await searchRoutesByActiveCondition();
        });
    }

    if (dom.routeTimeSlotButtons) {
        dom.routeTimeSlotButtons.addEventListener("click", async (event) => {
            const button = event.target.closest(".route-time-slot-button");

            if (!button) {
                return;
            }

            dom.routeTimeSlotButtons.querySelectorAll(".route-time-slot-button").forEach((timeButton) => {
                timeButton.classList.toggle("active", timeButton === button);
            });

            await searchRoutesByActiveCondition();
        });
    }

    dom.originCountrySelect.addEventListener("change", () => {
        renderCityOptions("origin", false);
        renderAirportOptions("origin");
    });

    dom.originCitySelect.addEventListener("change", () => {
        renderAirportOptions("origin");
    });

    dom.destinationCountrySelect.addEventListener("change", () => {
        renderCityOptions("destination", true);
        renderAirportOptions("destination", true);
    });

    dom.destinationCitySelect.addEventListener("change", () => {
        renderAirportOptions("destination");
    });

    dom.routeEndDateInput.addEventListener("click", openRouteDatePicker);
    dom.routeEndDateInput.addEventListener("focus", openRouteDatePicker);

    dom.routeSearchButton.addEventListener("click", () => {
        searchRoutesByCondition({
            useSelectedAirports: true,
            saveState: true
        });
    });

    dom.routeResetButton.addEventListener("click", resetRouteSearch);
}

function renderCountryOptions(type, includePlaceholder = false) {
    const countrySelect = getCountrySelect(type);
    const countries = getCountriesFromAirports(airports);

    const placeholder = includePlaceholder ? `<option value="">국가 선택</option>` : "";

    countrySelect.innerHTML = placeholder + countries
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

function selectDefaultCity(type, defaultCityName) {
    const citySelect = getCitySelect(type);
    const options = Array.from(citySelect.options);

    const matchedOption = options.find((option) => {
        return option.value === defaultCityName ||
            option.textContent.trim() === defaultCityName;
    });

    if (matchedOption) {
        citySelect.value = matchedOption.value;
    }
}

function renderCityOptions(type, includePlaceholder = false) {
    const countrySelect = getCountrySelect(type);
    const citySelect = getCitySelect(type);

    const selectedCountryCode = countrySelect.value;

    if (!selectedCountryCode) {
        citySelect.innerHTML = '<option value="">도시 선택</option>';
        return;
    }

    const cities = getCitiesByCountryCode(airports, selectedCountryCode);
    const placeholder = includePlaceholder ? '<option value="">도시 선택</option>' : "";

    citySelect.innerHTML = placeholder + cities
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

    if (!selectedCountryCode || !selectedCityName) {
        airportList.innerHTML = '<p class="airport-empty">국가와 도시를 선택해 주세요.</p>';
        return;
    }

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

function initializeRouteDatePicker() {
    if (!window.flatpickr) {
        console.error("Flatpickr 라이브러리가 로드되지 않았습니다.");
        return;
    }

    rebuildRouteDatePicker();
}

function rebuildRouteDatePicker() {
    if (routeDatePicker) {
        routeDatePicker.destroy();
        routeDatePicker = null;
    }

    const today = getTodayText();
    const defaultStartDate = today;
    const defaultEndDate = addDays(today, 14);

    routeDatePicker = flatpickr(dom.routeStartDateInput, {
        mode: "range",
        locale: "ko",
        dateFormat: "Y-m-d",
        minDate: today,
        showMonths: 2,
        static: false,
        closeOnSelect: false,
        disableMobile: true,
        monthSelectorType: "static",
        prevArrow: "‹",
        nextArrow: "›",
        defaultDate: [defaultStartDate, defaultEndDate],
        onReady: (_, __, instance) => {
            addCalendarHeader(instance);
            renderRouteDateInputs(instance.selectedDates, instance);
            setRouteDateRange(defaultStartDate, defaultEndDate);
        },
        onOpen: (_, __, instance) => {
            addCalendarHeader(instance);
            renderRouteDateInputs(instance.selectedDates, instance);
        },
        onChange:  (selectedDates, _, instance) => {
             handleRouteDatePickerChange(selectedDates, instance);
        },
        onValueUpdate: (selectedDates, _, instance) => {
            renderRouteDateInputs(selectedDates, instance);
        },
    });
}

async function handleRouteDatePickerChange(selectedDates, instance) {
    renderRouteDateInputs(selectedDates, instance);

    if (selectedDates.length >= 2) {
        const startDate = instance.formatDate(selectedDates[0], "Y-m-d");
        const endDate = instance.formatDate(selectedDates[1], "Y-m-d");

        setRouteDateRange(startDate, endDate);

        instance.close();
    }
}

function renderRouteDateInputs(selectedDates, instance) {
    if (!dom.routeStartDateInput || !dom.routeEndDateInput) {
        return;
    }

    if (!selectedDates || selectedDates.length === 0) {
        dom.routeStartDateInput.value = "";
        dom.routeEndDateInput.value = "";
        return;
    }

    if (selectedDates.length >= 1) {
        dom.routeStartDateInput.value = instance.formatDate(selectedDates[0], "Y-m-d");
    } else {
        dom.routeStartDateInput.value = "";
    }

    if (selectedDates.length >= 2) {
        dom.routeEndDateInput.value = instance.formatDate(selectedDates[1], "Y-m-d");
    } else {
        dom.routeEndDateInput.value = "";
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
            <strong>항공권 날짜 선택</strong>
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


function openRouteDatePicker() {
    if (routeDatePicker) {
        routeDatePicker.open();
    }
}

function addDays(baseDateText, days) {
    const date = new Date(`${baseDateText}T00:00:00`);
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

async function searchRoutesByCondition(options = {}) {
    const {
        useSelectedAirports = true,
        saveState = true,
        state = null
    } = options;

    const startDate = state?.startDate || dom.routeStartDateInput?.value;
    const endDate = state?.endDate || dom.routeEndDateInput?.value;
    const departureTimeSlot = getSelectedDepartureTimeSlot();

    if (!startDate || !endDate) {
        dom.routeCountText.textContent = "출발 기간을 선택해 주세요.";
        dom.routeList.innerHTML = `<p class="route-empty">출발 시작일과 종료일을 선택해 주세요.</p>`;
        return;
    }

    const originAirportCode = state
        ? state.originAirportCode
        : useSelectedAirports
            ? getSelectedAirportCode("origin")
            : null;

    const destinationAirportCode = state
        ? state.destinationAirportCode
        : useSelectedAirports
            ? getSelectedAirportCode("destination")
            : null;

    if (originAirportCode && destinationAirportCode && originAirportCode === destinationAirportCode) {
        alert("출발 공항과 도착 공항은 같을 수 없습니다.");
        return;
    }

    if (saveState) {
        activeRouteSearchState = {
            startDate,
            endDate,
            originAirportCode,
            destinationAirportCode,
            useSelectedAirports
        };
    }

    const currentSeq = ++routeSearchRequestSeq;

    try {
        dom.routeCountText.textContent = "노선을 불러오는 중입니다. 잠시만 기다려 주세요.";
        dom.routeList.innerHTML = `
    <p class="route-empty">
        노선을 조회하는 중입니다. 데이터가 많으면 시간이 조금 걸릴 수 있습니다.
    </p>
`;

        const params = new URLSearchParams();

        params.set("startDate", startDate);
        params.set("endDate", endDate);
        params.set("departureTimeSlot", departureTimeSlot || "ALL");

        if (originAirportCode) {
            params.set("origin", originAirportCode);
        }

        if (destinationAirportCode) {
            params.set("destination", destinationAirportCode);
        }

        if (routePriceFilter === "DIRECT") {
            params.set("connectionType", "DIRECT");
        }

        if (routePriceFilter === "LAYOVER") {
            params.set("connectionType", "ONE_STOP");
        }

        const routes = await fetchJson(
            `/api/flights/routes/search?${params.toString()}`,
            "조건에 맞는 노선을 불러오지 못했습니다."
        );

        if (currentSeq !== routeSearchRequestSeq) {
            return;
        }

        routesCache = routes;
        renderRoutes(getFilteredRoutes());

    } catch (error) {
        console.error(error);
        renderRouteError("조건에 맞는 노선 검색 중 오류가 발생했습니다.");
    }
}

async function searchRoutesByActiveCondition() {
    if (!activeRouteSearchState) {
        await searchRoutesByCondition({
            useSelectedAirports: false,
            saveState: true
        });
        return;
    }

    await searchRoutesByCondition({
        state: activeRouteSearchState,
        saveState: false
    });
}

async function resetRouteSearch() {
    routePriceFilter = "ALL";

    if (dom.routeFilterArea) {
        dom.routeFilterArea.querySelectorAll(".route-filter-button").forEach((button) => {
            button.classList.toggle("active", button.dataset.filter === "ALL");
        });
    }

    if (dom.routeTimeSlotButtons) {
        dom.routeTimeSlotButtons.querySelectorAll(".route-time-slot-button").forEach((button) => {
            button.classList.toggle("active", button.dataset.timeSlot === "ALL");
        });
    }

    const today = getTodayText();
    const defaultEndDate = addDays(today, 14);

    setRouteDateRange(today, defaultEndDate);

    activeRouteSearchState = null;

    await searchRoutesByCondition({
        useSelectedAirports: false,
        saveState: true
    });
}

function setRouteDateRange(startDate, endDate) {
    if (routeDatePicker) {
        routeDatePicker.setDate([startDate, endDate], false);
    }

    syncRouteDateInputValues(startDate, endDate);

    requestAnimationFrame(() => {
        syncRouteDateInputValues(startDate, endDate);
    });
}
function syncRouteDateInputValues(startDate, endDate) {
    dom.routeStartDateInput.value = startDate;
    dom.routeEndDateInput.value = endDate;
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
    const displayPriceInfo = getDisplayPriceInfo(route);

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
                    <span>${escapeHtml(displayPriceInfo.label)}</span>
                    <strong>${formatFlightPrice(displayPriceInfo.price)}</strong>
                    <em>${formatDepartureDateTime(displayPriceInfo.departureDate, displayPriceInfo.departureTime)}</em>
                </div>

                <div>
                    <span>최단 소요시간</span>
                    <strong>${escapeHtml(route.minDurationText || "-")}</strong>
                </div>

                <div>
                    <span>직항 최저가</span>
                    <strong>${formatFlightPrice(route.directMinPrice)}</strong>
                    <em>${formatDepartureDateTime(route.directMinPriceDepartureDate, route.directMinPriceDepartureTime)}</em>
                </div>

                <div>
                    <span>경유 최저가</span>
                    <strong>${formatFlightPrice(route.layoverMinPrice)}</strong>
                    <em>${formatDepartureDateTime(route.layoverMinPriceDepartureDate, route.layoverMinPriceDepartureTime)}</em>
                </div>
            </div>

            <div class="route-actions">
                <button type="button"
                        class="route-search-link"
                        data-origin="${escapeHtml(route.originAirportCode)}"
                        data-destination="${escapeHtml(route.destinationAirportCode)}"
                        data-departure-date="${escapeHtml(displayPriceInfo.departureDate || "")}">
                    항공권 검색
                </button>

                <button type="button"
                        class="route-lowest-link"
                        data-origin="${escapeHtml(route.originAirportCode)}"
                        data-destination="${escapeHtml(route.destinationAirportCode)}"
                        data-departure-date="${escapeHtml(displayPriceInfo.departureDate || "")}">
                    최저가 조회
                </button>
            </div>
        </article>
    `;
}

function bindRouteActionButtons() {
    dom.routeList.querySelectorAll(".route-search-link").forEach((button) => {
        button.addEventListener("click", () => {
            moveToFlightSearch(
                button.dataset.origin,
                button.dataset.destination,
                button.dataset.departureDate
            );
        });
    });

    dom.routeList.querySelectorAll(".route-lowest-link").forEach((button) => {
        button.addEventListener("click", () => {
            moveToLowestPrices(
                button.dataset.origin,
                button.dataset.destination,
                button.dataset.departureDate
            );
        });
    });
}

function moveToFlightSearch(origin, destination, departureDate) {
    const params = new URLSearchParams();

    params.set("tripType", TRIP_TYPE.ONE_WAY);
    params.set("origin", origin);
    params.set("destination", destination);

    if (departureDate) {
        params.set("departureDate", departureDate);
    }

    moveTo(FLIGHT_PAGE.SEARCH, params);
}

function moveToLowestPrices(origin, destination, departureDate) {
    const params = new URLSearchParams();

    params.set("tripType", TRIP_TYPE.ONE_WAY);
    params.set("origin", origin);
    params.set("destination", destination);

    if (departureDate) {
        params.set("departureDate", departureDate);
    }

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

function getSelectedDepartureTimeSlot() {
    const activeButton = document.querySelector(".route-time-slot-button.active");

    if (!activeButton) {
        return "ALL";
    }

    return activeButton.dataset.timeSlot || "ALL";
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

function formatDepartureDateTime(departureDate, departureTime) {
    if (!departureDate) {
        return "출발일 정보 없음";
    }

    const formattedDate = formatKoreanDate(departureDate);

    if (!departureTime) {
        return `${formattedDate} 출발`;
    }

    return `${formattedDate} ${formatTime(departureTime)} 출발`;
}

function formatKoreanDate(dateText) {
    const parts = dateText.split("-");

    if (parts.length !== 3) {
        return dateText;
    }

    const month = Number(parts[1]);
    const day = Number(parts[2]);

    return `${month}월 ${day}일`;
}

function formatTime(timeText) {
    if (!timeText) {
        return "";
    }

    return timeText.slice(0, 5);
}

function renderRouteError(message) {
    dom.routeCountText.textContent = message;
    dom.routeList.innerHTML = `<p class="route-error">${escapeHtml(message)}</p>`;
}

function renderRouteFilters() {
    if (!dom.routeFilterArea) {
        return;
    }

    dom.routeFilterArea.innerHTML = `
        <button type="button" class="route-filter-button active" data-filter="ALL">
            전체
        </button>
        <button type="button" class="route-filter-button" data-filter="DIRECT">
            직항 최저가
        </button>
        <button type="button" class="route-filter-button" data-filter="LAYOVER">
            경유 최저가
        </button>
    `;
}

function getFilteredRoutes() {
    if (routePriceFilter === "DIRECT") {
        return routesCache
            .filter((route) => route.directMinPrice !== null)
            .sort((route1, route2) => Number(route1.directMinPrice) - Number(route2.directMinPrice));
    }

    if (routePriceFilter === "LAYOVER") {
        return routesCache
            .filter((route) => route.layoverMinPrice !== null)
            .sort((route1, route2) => Number(route1.layoverMinPrice) - Number(route2.layoverMinPrice));
    }

    return routesCache
        .slice()
        .sort((route1, route2) => Number(route1.minPrice || 999999999) - Number(route2.minPrice || 999999999));
}

function getDisplayPriceInfo(route) {
    if (routePriceFilter === "DIRECT") {
        return {
            label: "직항 최저가",
            price: route.directMinPrice,
            departureDate: route.directMinPriceDepartureDate,
            departureTime: route.directMinPriceDepartureTime
        };
    }

    if (routePriceFilter === "LAYOVER") {
        return {
            label: "경유 최저가",
            price: route.layoverMinPrice,
            departureDate: route.layoverMinPriceDepartureDate,
            departureTime: route.layoverMinPriceDepartureTime
        };
    }

    return {
        label: "선택 조건 최저가",
        price: route.minPrice,
        departureDate: route.minPriceDepartureDate,
        departureTime: route.minPriceDepartureTime
    };
}