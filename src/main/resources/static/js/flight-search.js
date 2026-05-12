const AIRPORT_CACHE_KEY = "travelMoney.airports";

const originAirportInput = document.getElementById("originAirportInput");
const destinationAirportInput = document.getElementById("destinationAirportInput");
const originAirportCodeBadge = document.getElementById("originAirportCodeBadge");
const destinationAirportCodeBadge = document.getElementById("destinationAirportCodeBadge");
const originAirportDropdown = document.getElementById("originAirportDropdown");
const destinationAirportDropdown = document.getElementById("destinationAirportDropdown");

const departureDateInput = document.getElementById("departureDateInput");

const travelerPickerButton = document.getElementById("travelerPickerButton");
const travelerPopover = document.getElementById("travelerPopover");
const travelerSummaryText = document.getElementById("travelerSummaryText");
const adultMinusBtn = document.getElementById("adultMinusBtn");
const adultPlusBtn = document.getElementById("adultPlusBtn");
const adultCountText = document.getElementById("adultCountText");
const travelerApplyBtn = document.getElementById("travelerApplyBtn");

const seatClassSelect = document.getElementById("seatClassSelect");
const connectionTypeSelect = document.getElementById("connectionTypeSelect");
const sortSelect = document.getElementById("sortSelect");
const flightSearchBtn = document.getElementById("flightSearchBtn");
const swapAirportBtn = document.getElementById("swapAirportBtn");

const resultSummary = document.getElementById("resultSummary");
const flightResultGrid = document.getElementById("flightResultGrid");

let airports = [];
let adultCount = 1;

let selectedOriginAirport = null;
let selectedDestinationAirport = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  setDefaultDepartureDate();
  bindEvents();

  loadAirportsFromCache();
  await loadAirports();
}

function bindEvents() {
  flightSearchBtn.addEventListener("click", searchFlights);

  swapAirportBtn.addEventListener("click", () => {
    const origin = selectedOriginAirport;
    const destination = selectedDestinationAirport;

    selectedOriginAirport = destination;
    selectedDestinationAirport = origin;

    renderSelectedAirport("origin");
    renderSelectedAirport("destination");
  });

  originAirportInput.addEventListener("input", () => {
    selectedOriginAirport = null;
    renderSelectedAirport("origin", false);
    renderAirportDropdown("origin", originAirportInput.value);
  });

  destinationAirportInput.addEventListener("input", () => {
    selectedDestinationAirport = null;
    renderSelectedAirport("destination", false);
    renderAirportDropdown("destination", destinationAirportInput.value);
  });

  originAirportInput.addEventListener("focus", () => {
    renderAirportDropdown("origin", originAirportInput.value);
  });

  destinationAirportInput.addEventListener("focus", () => {
    renderAirportDropdown("destination", destinationAirportInput.value);
  });

  travelerPickerButton.addEventListener("click", (event) => {
    event.stopPropagation();
    travelerPopover.classList.toggle("open");
    closeAirportDropdowns();
  });

  adultMinusBtn.addEventListener("click", () => {
    if (adultCount <= 1) {
      return;
    }

    adultCount -= 1;
    renderTravelerCount();
  });

  adultPlusBtn.addEventListener("click", () => {
    if (adultCount >= 9) {
      return;
    }

    adultCount += 1;
    renderTravelerCount();
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
}

function setDefaultDepartureDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  departureDateInput.value = `${yyyy}-${mm}-${dd}`;
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
    setDefaultAirports();
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

    setDefaultAirports();
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

function setDefaultAirports() {
  if (!airports || airports.length === 0) {
    disableSearchButton("공항 없음");
    return;
  }

  selectedOriginAirport =
    airports.find((airport) => airport.airportCode === "ICN") || airports[0];

  selectedDestinationAirport =
    airports.find((airport) => airport.airportCode === "NRT") ||
    airports.find((airport) => airport.airportCode !== selectedOriginAirport.airportCode) ||
    airports[0];

  renderSelectedAirport("origin");
  renderSelectedAirport("destination");
}

function renderSelectedAirport(type, fillInput = true) {
  const airport = type === "origin" ? selectedOriginAirport : selectedDestinationAirport;
  const input = type === "origin" ? originAirportInput : destinationAirportInput;
  const badge = type === "origin" ? originAirportCodeBadge : destinationAirportCodeBadge;

  if (!airport) {
    badge.textContent = "-";
    if (!fillInput) {
      return;
    }

    input.value = "";
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

function renderTravelerCount() {
  adultCountText.textContent = adultCount;
  travelerSummaryText.textContent = `성인 ${adultCount}명`;

  adultMinusBtn.disabled = adultCount <= 1;
  adultPlusBtn.disabled = adultCount >= 9;
}

async function searchFlights() {
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
  const seatClass = seatClassSelect.value;
  const connectionType = connectionTypeSelect.value;
  const sort = sortSelect.value;

  if (origin === destination) {
    alert("출발지와 도착지는 같을 수 없습니다.");
    return;
  }

  if (!departureDate) {
    alert("가는 날을 선택해 주세요.");
    return;
  }

  const queryParams = new URLSearchParams();
  queryParams.append("origin", origin);
  queryParams.append("destination", destination);
  queryParams.append("departureDate", departureDate);

  if (seatClass) {
    queryParams.append("seatClass", seatClass);
  }

  if (connectionType) {
    queryParams.append("connectionType", connectionType);
  }

  if (sort) {
    queryParams.append("sort", sort);
  }

  renderLoading();

  try {
    const response = await fetch(`/api/flights/search?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error("항공권 검색 실패");
    }

    const data = await response.json();

    renderSearchResult(data);

  } catch (error) {
    console.error(error);
    renderError();
  }
}

function renderLoading() {
  resultSummary.textContent = "항공권을 검색하는 중입니다.";

  flightResultGrid.innerHTML = `
    <div class="loading-result">
      항공권 데이터를 불러오는 중입니다.
    </div>
  `;
}

function renderError() {
  resultSummary.textContent = "항공권 검색 중 오류가 발생했습니다.";

  flightResultGrid.innerHTML = `
    <div class="empty-result">
      항공권 데이터를 불러오지 못했습니다. 검색 조건 또는 서버 로그를 확인해 주세요.
    </div>
  `;
}

function renderSearchResult(data) {
  const options = data.options || [];

  resultSummary.textContent =
    `${data.originAirportName} (${data.originAirportCode}) → ` +
    `${data.destinationAirportName} (${data.destinationAirportCode}) · ` +
    `${data.departureDate} · ${options.length}개 항공권`;

  if (options.length === 0) {
    flightResultGrid.innerHTML = `
      <div class="empty-result">
        검색 결과가 없습니다. 다른 날짜, 노선 또는 조건으로 다시 검색해 주세요.
      </div>
    `;
    return;
  }

  flightResultGrid.innerHTML = options
    .map((option) => renderFlightOptionCard(option, data))
    .join("");
}

function renderFlightOptionCard(option, data) {
  const onePersonPrice = Number(option.price);
  const totalPrice = onePersonPrice * adultCount;

  const layoverText =
    option.connectionType === "ONE_STOP"
      ? `경유 ${option.layoverAirportName || option.layoverAirportCode || "-"}`
      : "직항";

  return `
    <article class="flight-option-card">
      <div class="airline-block">
        <h3>${option.airlineName}</h3>
        <p class="airline-meta">
          ${option.airlineTierDescription} · ${option.airlineCode}
        </p>

        <div class="badge-row">
          <span class="flight-badge">${option.seatClassDescription}</span>
          <span class="flight-badge">${option.connectionTypeDescription}</span>
        </div>
      </div>

      <div class="route-block">
        <div>
          <div class="route-time">${formatTime(option.departureTime)}</div>
          <div class="route-airport">${data.originAirportCode}</div>
        </div>

        <div class="route-center">
          <div class="duration-text">${option.totalDurationText}</div>
          <div class="route-line"></div>
          <div class="layover-text">${layoverText}</div>
        </div>

        <div>
          <div class="route-time">${formatTime(option.arrivalTime)}</div>
          <div class="route-airport">
            ${data.destinationAirportCode}
            ${option.arrivalDate !== data.departureDate ? ` · ${option.arrivalDate}` : ""}
          </div>
        </div>
      </div>

      <div class="price-block">
        <p class="price-label">1인 기준</p>
        <p class="price">₩${formatPrice(onePersonPrice)}</p>
        <div class="total-price">
          성인 ${adultCount}명 총액 ₩${formatPrice(totalPrice)}
        </div>
        <a href="#" class="select-flight-btn">선택하기</a>
      </div>
    </article>
  `;
}

function formatTime(timeText) {
  if (!timeText) {
    return "-";
  }

  return String(timeText).slice(0, 5);
}

function formatPrice(price) {
  if (Number.isNaN(Number(price))) {
    return "-";
  }

  return Number(price).toLocaleString("ko-KR");
}