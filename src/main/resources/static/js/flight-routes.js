document.addEventListener("DOMContentLoaded", () => {
    const originCountrySelect = document.getElementById("originCountrySelect");
    const originCitySelect = document.getElementById("originCitySelect");
    const originAirportList = document.getElementById("originAirportList");

    const destinationCountrySelect = document.getElementById("destinationCountrySelect");
    const destinationCitySelect = document.getElementById("destinationCitySelect");
    const destinationAirportList = document.getElementById("destinationAirportList");

    const routeSearchButton = document.getElementById("routeSearchButton");
    const routeResetButton = document.getElementById("routeResetButton");

    const routeList = document.getElementById("routeList");
    const routeCountText = document.getElementById("routeCountText");

    let airports = [];

    init();

    async function init() {
        try {
            airports = await fetchAirports();

            initLocationSelectors();
            bindEvents();

            loadRoutes();
        } catch (error) {
            console.error(error);
            routeCountText.textContent = "공항 정보를 불러오지 못했습니다.";
            routeList.innerHTML = `<p class="route-error">공항 정보 조회 중 오류가 발생했습니다.</p>`;
        }
    }

    async function fetchAirports() {
        const response = await fetch("/api/flights/airports");

        if (!response.ok) {
            throw new Error("공항 정보를 불러오지 못했습니다.");
        }

        return await response.json();
    }

    function initLocationSelectors() {
        renderCountryOptions(originCountrySelect);
        renderCountryOptions(destinationCountrySelect);

        selectDefaultCountry(originCountrySelect, "KR", "대한민국");
        selectDefaultCountry(destinationCountrySelect, "JP", "일본");

        renderCityOptions("origin");
        renderCityOptions("destination");

        renderAirportOptions("origin");
        renderAirportOptions("destination");
    }

    function bindEvents() {
        originCountrySelect.addEventListener("change", () => {
            renderCityOptions("origin");
            renderAirportOptions("origin");
        });

        originCitySelect.addEventListener("change", () => {
            renderAirportOptions("origin");
        });

        destinationCountrySelect.addEventListener("change", () => {
            renderCityOptions("destination");
            renderAirportOptions("destination");
        });

        destinationCitySelect.addEventListener("change", () => {
            renderAirportOptions("destination");
        });

        routeSearchButton.addEventListener("click", () => {
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

            loadRouteDetail(originAirportCode, destinationAirportCode);
        });

        routeResetButton.addEventListener("click", () => {
            loadRoutes();
        });
    }

    function renderCountryOptions(selectElement) {
        const countries = getCountries();

        selectElement.innerHTML = countries.map(country => `
            <option value="${escapeHtml(country.countryCode)}">
                ${escapeHtml(country.countryName)}
            </option>
        `).join("");
    }

    function renderCityOptions(type) {
        const countrySelect = getCountrySelect(type);
        const citySelect = getCitySelect(type);

        const selectedCountryCode = countrySelect.value;

        const cities = airports
            .filter(airport => getCountryCode(airport) === selectedCountryCode)
            .map(airport => getCityName(airport))
            .filter((cityName, index, array) => cityName && array.indexOf(cityName) === index);

        citySelect.innerHTML = cities.map(cityName => `
            <option value="${escapeHtml(cityName)}">
                ${escapeHtml(cityName)}
            </option>
        `).join("");
    }

    function renderAirportOptions(type) {
        const countrySelect = getCountrySelect(type);
        const citySelect = getCitySelect(type);
        const airportList = getAirportList(type);

        const selectedCountryCode = countrySelect.value;
        const selectedCityName = citySelect.value;

        const filteredAirports = airports.filter(airport =>
            getCountryCode(airport) === selectedCountryCode &&
            getCityName(airport) === selectedCityName
        );

        if (filteredAirports.length === 0) {
            airportList.innerHTML = `<p class="airport-empty">선택 가능한 공항이 없습니다.</p>`;
            return;
        }

        airportList.innerHTML = filteredAirports.map((airport, index) => {
            const airportCode = getAirportCode(airport);
            const airportName = getAirportName(airport);
            const inputName = type === "origin" ? "originAirport" : "destinationAirport";

            return `
                <label class="airport-radio-item">
                    <input type="radio"
                           name="${inputName}"
                           value="${escapeHtml(airportCode)}"
                           ${index === 0 ? "checked" : ""}>
                    <span>${escapeHtml(airportName)} ${escapeHtml(airportCode)}</span>
                </label>
            `;
        }).join("");
    }

    async function loadRoutes() {
        try {
            routeCountText.textContent = "노선 정보를 불러오는 중입니다.";
            routeList.innerHTML = "";

            const response = await fetch("/api/flights/routes");

            if (!response.ok) {
                throw new Error("노선 목록을 불러오지 못했습니다.");
            }

            const routes = await response.json();
            renderRoutes(routes);
        } catch (error) {
            console.error(error);
            routeCountText.textContent = "노선 정보를 불러오지 못했습니다.";
            routeList.innerHTML = `<p class="route-error">노선 목록 조회 중 오류가 발생했습니다.</p>`;
        }
    }

    async function loadRouteDetail(origin, destination) {
        try {
            routeCountText.textContent = "노선 정보를 검색하는 중입니다.";
            routeList.innerHTML = "";

            const query = new URLSearchParams({
                origin: origin,
                destination: destination
            });

            const response = await fetch(`/api/flights/routes/detail?${query.toString()}`);

            if (!response.ok) {
                throw new Error("해당 노선을 찾을 수 없습니다.");
            }

            const route = await response.json();
            renderRoutes([route]);
        } catch (error) {
            console.error(error);
            routeCountText.textContent = "검색 결과가 없습니다.";
            routeList.innerHTML = `<p class="route-error">해당 노선을 찾을 수 없습니다.</p>`;
        }
    }

    function renderRoutes(routes) {
        if (!routes || routes.length === 0) {
            routeCountText.textContent = "조회된 노선이 없습니다.";
            routeList.innerHTML = `<p class="route-empty">조회된 노선이 없습니다.</p>`;
            return;
        }

        routeCountText.textContent = `총 ${routes.length}개의 노선이 조회되었습니다.`;
        routeList.innerHTML = routes.map(route => createRouteCard(route)).join("");
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
                        <strong>${formatPrice(route.minPrice)}</strong>
                    </div>
                    <div>
                        <span>최단 소요시간</span>
                        <strong>${route.minDurationText || "-"}</strong>
                    </div>
                    <div>
                        <span>직항 최저가</span>
                        <strong>${formatPrice(route.directMinPrice)}</strong>
                    </div>
                    <div>
                        <span>경유 최저가</span>
                        <strong>${formatPrice(route.layoverMinPrice)}</strong>
                    </div>
                </div>

                <div class="route-actions">
                    <button type="button"
                            data-origin="${escapeHtml(route.originAirportCode)}"
                            data-destination="${escapeHtml(route.destinationAirportCode)}"
                            onclick="moveToFlightSearch(this)">
                        항공권 검색하기
                    </button>
                </div>
            </article>
        `;
    }

    function getCountries() {
        const countryMap = new Map();

        airports.forEach(airport => {
            const countryCode = getCountryCode(airport);
            const countryName = getCountryName(airport);

            if (!countryCode || !countryName) {
                return;
            }

            if (!countryMap.has(countryCode)) {
                countryMap.set(countryCode, {
                    countryCode: countryCode,
                    countryName: countryName
                });
            }
        });

        return Array.from(countryMap.values());
    }

    function selectDefaultCountry(selectElement, defaultCountryCode, defaultCountryName) {
        const options = Array.from(selectElement.options);

        const matchedOption = options.find(option =>
            option.value === defaultCountryCode ||
            option.textContent.trim() === defaultCountryName
        );

        if (matchedOption) {
            selectElement.value = matchedOption.value;
        }
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
        return type === "origin" ? originCountrySelect : destinationCountrySelect;
    }

    function getCitySelect(type) {
        return type === "origin" ? originCitySelect : destinationCitySelect;
    }

    function getAirportList(type) {
        return type === "origin" ? originAirportList : destinationAirportList;
    }

    function getAirportCode(airport) {
        return airport.airportCode || airport.code;
    }

    function getAirportName(airport) {
        return airport.airportName || airport.name;
    }

    function getCityName(airport) {
        return airport.cityName;
    }

    function getCountryCode(airport) {
        return airport.countryCode || airport.country?.code;
    }

    function getCountryName(airport) {
        return airport.countryName || airport.country?.name;
    }

    function formatPrice(price) {
        if (price === null || price === undefined) {
            return "-";
        }

        return Number(price).toLocaleString("ko-KR") + "원";
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
});

function moveToFlightSearch(button) {
    const origin = button.dataset.origin;
    const destination = button.dataset.destination;

    const query = new URLSearchParams({
        origin: origin,
        destination: destination
    });

    location.href = `/flights/search?${query.toString()}`;
}