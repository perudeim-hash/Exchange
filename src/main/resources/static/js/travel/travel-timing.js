const searchBtn = document.getElementById("searchBtn");

const originCountrySelect = document.getElementById("originCountrySelect");
const originCitySelect = document.getElementById("originCitySelect");
const originAirportArea = document.getElementById("originAirportArea");

const destinationCountrySelect = document.getElementById("destinationCountrySelect");
const destinationCitySelect = document.getElementById("destinationCitySelect");
const destinationAirportArea = document.getElementById("destinationAirportArea");

const statusMessage = document.getElementById("statusMessage");
const summaryArea = document.getElementById("summaryArea");
const summaryTitle = document.getElementById("summaryTitle");
const summaryInfo = document.getElementById("summaryInfo");

const recommendedMonthsEl = document.getElementById("recommendedMonths");
const expensiveMonthsEl = document.getElementById("expensiveMonths");
const monthlyAnalysisBody = document.getElementById("monthlyAnalysisBody");

const monthDetailArea = document.getElementById("monthDetailArea");
const monthDetailTitle = document.getElementById("monthDetailTitle");
const cheapDateList = document.getElementById("cheapDateList");
const expensiveDateList = document.getElementById("expensiveDateList");
const eventList = document.getElementById("eventList");

let airportList = [];
let airportLocationGroups = [];
let latestRecommendationData = null;
let latestMonthlyAnalyses = [];

const DEFAULT_ORIGIN_AIRPORT_CODE = "ICN";
const DEFAULT_DESTINATION_AIRPORT_CODE = "NRT";

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  await loadAirportLocations();
  applyQueryParams();
});

function bindEvents() {
  originCountrySelect.addEventListener("change", () => handleCountryChange("origin"));
  originCitySelect.addEventListener("change", () => handleCityChange("origin"));

  destinationCountrySelect.addEventListener("change", () => handleCountryChange("destination"));
  destinationCitySelect.addEventListener("change", () => handleCityChange("destination"));

  searchBtn.addEventListener("click", loadRecommendation);
}

async function loadAirportLocations() {
  try {
    showStatus("공항 목록을 불러오는 중입니다.", "secondary");

    const response = await fetch("/api/flights/airports");

    if (!response.ok) {
      throw new Error("공항 목록 API 호출에 실패했습니다.");
    }

    airportList = await response.json();
    airportLocationGroups = buildAirportLocationGroups(airportList);

    renderCountryOptions("origin");
    renderCountryOptions("destination");
    resetCitySelect("origin");
    resetCitySelect("destination");
    resetAirportArea("origin", "먼저 도시를 선택해 주세요.");
    resetAirportArea("destination", "먼저 도시를 선택해 주세요.");

    hideStatus();
  } catch (error) {
    console.error(error);
    showStatus("공항 목록을 불러오지 못했습니다. 서버 로그를 확인해 주세요.", "danger");
  }
}

function buildAirportLocationGroups(airports) {
  const countryMap = new Map();

  airports.forEach((airport) => {
    if (!airport.countryCode || !airport.countryName || !airport.cityName || !airport.airportCode) {
      return;
    }

    if (!countryMap.has(airport.countryCode)) {
      countryMap.set(airport.countryCode, {
        countryCode: airport.countryCode,
        countryName: airport.countryName,
        region: airport.region,
        cities: [],
      });
    }

    const country = countryMap.get(airport.countryCode);
    let city = country.cities.find((item) => item.cityName === airport.cityName);

    if (!city) {
      city = {
        cityName: airport.cityName,
        airports: [],
      };
      country.cities.push(city);
    }

    const existsAirport = city.airports.some((item) => item.airportCode === airport.airportCode);

    if (!existsAirport) {
      city.airports.push({
        airportCode: airport.airportCode,
        airportName: airport.airportName,
        cityName: airport.cityName,
        countryCode: airport.countryCode,
        countryName: airport.countryName,
        region: airport.region,
      });
    }
  });

  return Array.from(countryMap.values())
    .sort((a, b) => a.countryName.localeCompare(b.countryName, "ko"))
    .map((country) => {
      country.cities.sort((a, b) => a.cityName.localeCompare(b.cityName, "ko"));
      return country;
    });
}

function renderCountryOptions(type) {
  const countrySelect = getCountrySelect(type);
  countrySelect.innerHTML = `<option value="">국가를 선택하세요</option>`;

  airportLocationGroups.forEach((country) => {
    const option = document.createElement("option");
    option.value = country.countryCode;
    option.textContent = country.countryName;
    countrySelect.appendChild(option);
  });

  countrySelect.disabled = airportLocationGroups.length === 0;
}

function handleCountryChange(type) {
  resetCitySelect(type);
  resetAirportArea(type, "먼저 도시를 선택해 주세요.");

  const countryCode = getCountrySelect(type).value;

  if (!countryCode) {
    return;
  }

  const country = findCountryByCode(countryCode);

  if (!country) {
    return;
  }

  renderCityOptions(type, country.cities || []);
}

function renderCityOptions(type, cities) {
  const citySelect = getCitySelect(type);
  citySelect.innerHTML = `<option value="">도시를 선택하세요</option>`;

  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city.cityName;
    option.textContent = city.cityName;
    citySelect.appendChild(option);
  });

  citySelect.disabled = cities.length === 0;
}

function handleCityChange(type) {
  const countryCode = getCountrySelect(type).value;
  const cityName = getCitySelect(type).value;

  if (!countryCode || !cityName) {
    resetAirportArea(type, "먼저 도시를 선택해 주세요.");
    return;
  }

  const city = findCityByCountryCodeAndCityName(countryCode, cityName);

  if (!city) {
    resetAirportArea(type, "등록된 공항이 없습니다.");
    return;
  }

  renderAirportOptions(type, city.airports || []);
}

function renderAirportOptions(type, airports) {
  const airportArea = getAirportArea(type);
  airportArea.innerHTML = "";

  if (!airports || airports.length === 0) {
    resetAirportArea(type, "등록된 공항이 없습니다.");
    return;
  }

  airports.forEach((airport, index) => {
    const wrapper = document.createElement("label");
    wrapper.className = "timing-airport-option";

    const checked = index === 0 ? "checked" : "";

    wrapper.innerHTML = `
      <input type="radio" name="${type}AirportCode" value="${escapeAttribute(airport.airportCode)}" ${checked}>
      <div>
        <strong>${escapeHtml(airport.airportName)}</strong>
        <span>${escapeHtml(airport.cityName)} · ${escapeHtml(airport.airportCode)}</span>
      </div>
    `;

    airportArea.appendChild(wrapper);
  });
}

function resetCitySelect(type) {
  const citySelect = getCitySelect(type);
  citySelect.innerHTML = `<option value="">먼저 국가를 선택하세요</option>`;
  citySelect.disabled = true;
}

function resetAirportArea(type, message) {
  const airportArea = getAirportArea(type);
  airportArea.innerHTML = `<div class="timing-empty-text">${escapeHtml(message)}</div>`;
}

function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);

  const originAirportCode = params.get("origin") || DEFAULT_ORIGIN_AIRPORT_CODE;
  const destinationAirportCode = params.get("destination") || DEFAULT_DESTINATION_AIRPORT_CODE;

  setInputValue("startDate", params.get("startDate"));
  setInputValue("endDate", params.get("endDate"));
  setInputValue("stayDays", params.get("stayDays"));
  setInputValue("connectionType", params.get("connectionType"));
  setInputValue("seatClass", params.get("seatClass"));
  setInputValue("adultCount", params.get("adultCount"));
  setInputValue("childCount", params.get("childCount"));
  setInputValue("infantCount", params.get("infantCount"));

  selectAirportByCode("origin", originAirportCode);
  selectAirportByCode("destination", destinationAirportCode);
}

function setInputValue(id, value) {
  if (!value) {
    return;
  }

  const element = document.getElementById(id);

  if (element) {
    element.value = value;
  }
}

function selectAirportByCode(type, airportCode) {
  const airport = findAirportByCode(airportCode);

  if (!airport) {
    return;
  }

  const countrySelect = getCountrySelect(type);
  const citySelect = getCitySelect(type);

  countrySelect.value = airport.countryCode;
  handleCountryChange(type);

  citySelect.value = airport.cityName;
  handleCityChange(type);

  const radio = document.querySelector(`input[name="${type}AirportCode"][value="${airport.airportCode}"]`);

  if (radio) {
    radio.checked = true;
  }
}

async function loadRecommendation() {
  try {
    const originAirportCode = getSelectedAirportCode("origin");
    const destinationAirportCode = getSelectedAirportCode("destination");

    if (!validateSearchCondition(originAirportCode, destinationAirportCode)) {
      return;
    }

    setSearchLoading(true);
    showStatus("추천 분석 데이터를 불러오는 중입니다.", "secondary");

    const url = buildRecommendationUrl(originAirportCode, destinationAirportCode);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("추천 분석 API 호출에 실패했습니다.");
    }

    const data = await response.json();

    latestRecommendationData = data;
    latestMonthlyAnalyses = data.monthlyAnalyses || [];

    renderSummary(data);
    renderMonthCards(recommendedMonthsEl, data.recommendedMonths || [], "recommended");
    renderMonthCards(expensiveMonthsEl, data.expensiveMonths || [], "expensive");
    renderMonthlyTable(latestMonthlyAnalyses);
    renderDefaultMonthDetail(latestMonthlyAnalyses);
    updateBrowserUrl(originAirportCode, destinationAirportCode);

    hideStatus();
    scrollToResult();
  } catch (error) {
    console.error(error);
    showStatus("추천 분석 데이터를 불러오지 못했습니다. 콘솔과 서버 로그를 확인해 주세요.", "danger");
  } finally {
    setSearchLoading(false);
  }
}

function validateSearchCondition(originAirportCode, destinationAirportCode) {
  if (!originAirportCode) {
    showStatus("출발 공항을 선택해 주세요.", "warning");
    return false;
  }

  if (!destinationAirportCode) {
    showStatus("도착 공항을 선택해 주세요.", "warning");
    return false;
  }

  if (originAirportCode === destinationAirportCode) {
    showStatus("출발 공항과 도착 공항은 같을 수 없습니다.", "warning");
    return false;
  }

  if (!getValue("startDate")) {
    showStatus("분석 시작일을 선택해 주세요.", "warning");
    return false;
  }

  if (!getValue("endDate")) {
    showStatus("분석 종료일을 선택해 주세요.", "warning");
    return false;
  }

  if (getValue("endDate") < getValue("startDate")) {
    showStatus("분석 종료일은 시작일 이후여야 합니다.", "warning");
    return false;
  }

  if (Number(getValue("stayDays")) < 1) {
    showStatus("체류일은 1일 이상이어야 합니다.", "warning");
    return false;
  }

  return true;
}

function buildRecommendationUrl(originAirportCode, destinationAirportCode) {
  const params = new URLSearchParams();

  appendParam(params, "origin", originAirportCode);
  appendParam(params, "destination", destinationAirportCode);
  appendParam(params, "startDate", getValue("startDate"));
  appendParam(params, "endDate", getValue("endDate"));
  appendParam(params, "stayDays", getValue("stayDays"));
  appendParam(params, "connectionType", getValue("connectionType"));
  appendParam(params, "seatClass", getValue("seatClass"));
  appendParam(params, "adultCount", getValue("adultCount"));
  appendParam(params, "childCount", getValue("childCount"));
  appendParam(params, "infantCount", getValue("infantCount"));

  return `/api/recommendations/travel-timing?${params.toString()}`;
}

function updateBrowserUrl(originAirportCode, destinationAirportCode) {
  const params = new URLSearchParams();

  appendParam(params, "origin", originAirportCode);
  appendParam(params, "destination", destinationAirportCode);
  appendParam(params, "startDate", getValue("startDate"));
  appendParam(params, "endDate", getValue("endDate"));
  appendParam(params, "stayDays", getValue("stayDays"));
  appendParam(params, "connectionType", getValue("connectionType"));
  appendParam(params, "seatClass", getValue("seatClass"));
  appendParam(params, "adultCount", getValue("adultCount"));
  appendParam(params, "childCount", getValue("childCount"));
  appendParam(params, "infantCount", getValue("infantCount"));

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", nextUrl);
}

function appendParam(params, name, value) {
  if (value !== null && value !== undefined && value !== "") {
    params.append(name, value);
  }
}

function getValue(id) {
  return document.getElementById(id).value;
}

function renderSummary(data) {
  summaryArea.classList.remove("d-none");

  const originAirport = findAirportByCode(data.originAirportCode);
  const destinationAirport = findAirportByCode(data.destinationAirportCode);

  const originText = originAirport
    ? `${originAirport.countryName} ${originAirport.cityName}(${originAirport.airportCode})`
    : data.originAirportCode;

  const destinationText = destinationAirport
    ? `${destinationAirport.countryName} ${destinationAirport.cityName}(${destinationAirport.airportCode})`
    : data.destinationAirportCode;

  summaryTitle.textContent = `${data.cityName} 여행 시기 추천 분석`;
  summaryInfo.textContent =
    `${originText} → ${destinationText} / ` +
    `${data.countryName}(${data.countryCode}) / ` +
    `${data.startDate} ~ ${data.endDate} / ` +
    `${data.stayDays ?? "-"}일 체류 기준`;
}

function renderMonthCards(container, months, type) {
  container.innerHTML = "";

  if (months.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="empty-box">
          <strong>표시할 데이터가 없습니다.</strong>
          <span>다른 조건으로 다시 조회해 주세요.</span>
        </div>
      </div>
    `;
    return;
  }

  months.forEach((month, index) => {
    const col = document.createElement("div");
    col.className = "col-lg-4 col-md-6";

    col.innerHTML = `
      <article class="result-month-card ${type === "recommended" ? "recommended-card" : "caution-card"}">
        <div class="result-month-card-header">
          <div>
            <span class="rank-label">${type === "recommended" ? `BEST ${index + 1}` : `주의 ${index + 1}`}</span>
            <h3>${escapeHtml(month.monthLabel)}</h3>
          </div>
          <span class="grade-badge ${getGradeClass(month.grade)}">${escapeHtml(month.grade)}</span>
        </div>

        <div class="score-line">
          <strong>${escapeHtml(month.totalScore)}</strong>
          <span>/ 100점</span>
        </div>

        <div class="score-breakdown">
          <div class="score-mini-box">
            <span>항공권</span>
            <strong>${escapeHtml(month.score.flightScore)} / 80점</strong>
          </div>
          <div class="score-mini-box">
            <span>환율</span>
            <strong>${escapeHtml(month.score.exchangeScore)} / 20점</strong>
          </div>
        </div>

        <ul class="month-card-list">
          <li>
            <span>최저 왕복</span>
            <strong>${formatPrice(month.minRoundTripPrice)}</strong>
          </li>
          <li>
            <span>TOP5 평균</span>
            <strong>${formatPrice(month.cheapTop5AveragePrice)}</strong>
          </li>
          <li>
            <span>평균 환율</span>
            <strong>${formatRate(month.averageRate)}</strong>
          </li>
          <li>
            <span>이벤트</span>
            <strong>${escapeHtml(month.eventCount || 0)}개</strong>
          </li>
        </ul>

        <div class="event-preview">
          <div class="event-preview-title">주요 이벤트</div>
          ${renderEventNames(month.events)}
        </div>

        <button type="button" class="btn btn-outline-primary month-detail-button" data-month="${escapeAttribute(month.month)}">
          상세 보기
        </button>
      </article>
    `;

    const button = col.querySelector(".month-detail-button");
    button.addEventListener("click", () => {
      renderMonthDetail(month);
      scrollToDetail();
    });

    container.appendChild(col);
  });
}

function renderMonthlyTable(months) {
  monthlyAnalysisBody.innerHTML = "";

  if (months.length === 0) {
    monthlyAnalysisBody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted py-4">
          월별 분석 데이터가 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  months.forEach((month) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>${escapeHtml(month.monthLabel)}</strong></td>
      <td>
        <strong>${escapeHtml(month.totalScore)}</strong>점
        <div class="score-detail-text">${escapeHtml(month.grade)}</div>
      </td>
      <td>
        ${escapeHtml(month.score.flightScore)} / 80
        <div class="score-detail-text">
          TOP5 ${escapeHtml(month.score.flightCheapDateScore)} /
          최저가 ${escapeHtml(month.score.flightMinPriceScore)} /
          안정성 ${escapeHtml(month.score.flightStabilityScore)}
        </div>
      </td>
      <td>
        ${escapeHtml(month.score.exchangeScore)} / 20
        <div class="score-detail-text">
          평균 ${escapeHtml(month.score.exchangeAverageRateScore)} /
          데이터 ${escapeHtml(month.score.exchangeDataCountScore)}
        </div>
      </td>
      <td>${formatPrice(month.minRoundTripPrice)}</td>
      <td>${formatPrice(month.cheapTop5AveragePrice)}</td>
      <td>${formatRate(month.averageRate)}</td>
      <td>${escapeHtml(month.eventCount || 0)}개</td>
      <td>${escapeHtml(month.cheapestWeekdayName || "-")}</td>
      <td>${escapeHtml(month.expensiveWeekdayName || "-")}</td>
    `;

    tr.addEventListener("click", () => {
      renderMonthDetail(month);
      scrollToDetail();
    });

    monthlyAnalysisBody.appendChild(tr);
  });
}

function renderDefaultMonthDetail(months) {
  if (!months || months.length === 0) {
    monthDetailArea.classList.add("d-none");
    return;
  }

  renderMonthDetail(months[0]);
}

function renderMonthDetail(month) {
  monthDetailArea.classList.remove("d-none");
  monthDetailTitle.textContent = `${month.monthLabel} 상세 정보`;

  renderDateList(cheapDateList, month.cheapestDates || []);
  renderDateList(expensiveDateList, month.expensiveDates || []);
  renderEventList(eventList, month.events || [], month);
}

function renderDateList(container, dates) {
  container.innerHTML = "";

  if (dates.length === 0) {
    container.innerHTML = `<div class="empty-text">표시할 날짜 데이터가 없습니다.</div>`;
    return;
  }

  dates.forEach((date) => {
    const item = document.createElement("div");
    item.className = "date-item";

    item.innerHTML = `
      <div class="date-item-title">
        ${escapeHtml(date.departureDate)} 출발 → ${escapeHtml(date.returnDate)} 귀국
      </div>
      <div class="date-item-meta">
        ${escapeHtml(date.dayOfWeekName)} 출발 / 왕복 ${formatPrice(date.totalPrice)}
        <br>
        출국 ${formatPrice(date.outboundPrice)} + 귀국 ${formatPrice(date.returnPrice)}
      </div>
    `;

    container.appendChild(item);
  });
}

function renderEventList(container, events, month) {
  container.innerHTML = "";

  const safeEvents = events || [];
  const previewEvents = safeEvents.slice(0, 3);

  if (previewEvents.length === 0) {
    container.innerHTML = `<div class="empty-text">이 달에 등록된 이벤트가 없습니다.</div>`;
  } else {
    previewEvents.forEach((event) => {
      const item = document.createElement("div");
      item.className = "event-item";

      item.innerHTML = `
        <div class="event-item-title">${escapeHtml(event.eventName || "이벤트명 없음")}</div>
        <div class="event-item-meta">
          ${escapeHtml(event.eventType || "EVENT")} / ${escapeHtml(event.eventArea || event.cityName || "-")}
        </div>
        <div class="event-item-description">
          ${escapeHtml(event.description || "")}
        </div>
      `;

      container.appendChild(item);
    });
  }

  const fullEventUrl = createFullEventPageUrl(month);

  if (fullEventUrl) {
    const buttonWrap = document.createElement("div");
    buttonWrap.className = "event-more-button-wrap";

    buttonWrap.innerHTML = `
      <a href="${escapeAttribute(fullEventUrl)}" class="btn btn-outline-primary event-more-button">
        이 달 이벤트 전체 보기
      </a>
    `;

    container.appendChild(buttonWrap);
  }
}

function renderEventNames(events) {
  if (!events || events.length === 0) {
    return `<span class="text-muted small">등록된 이벤트 없음</span>`;
  }

  const topEvents = events.slice(0, 3);

  return `
    <ul>
      ${topEvents.map((event) => `<li>${escapeHtml(event.eventName)}</li>`).join("")}
    </ul>
  `;
}

function showStatus(message, type) {
  statusMessage.className = `alert alert-${type} recommendation-status`;
  statusMessage.textContent = message;
  statusMessage.classList.remove("d-none");
}

function hideStatus() {
  statusMessage.classList.add("d-none");
}

function setSearchLoading(isLoading) {
  searchBtn.disabled = isLoading;
  searchBtn.textContent = isLoading ? "분석 중..." : "추천 분석 조회";
}

function getGradeClass(grade) {
  if (grade === "매우 추천") {
    return "grade-excellent";
  }

  if (grade === "추천") {
    return "grade-good";
  }

  if (grade === "보통") {
    return "grade-normal";
  }

  if (grade === "비용 주의") {
    return "grade-warning";
  }

  return "grade-bad";
}

function scrollToResult() {
  if (!summaryArea) {
    return;
  }

  summaryArea.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function scrollToDetail() {
  if (!monthDetailArea) {
    return;
  }

  monthDetailArea.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function formatPrice(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "-";
  }

  return `${number.toLocaleString("ko-KR")}원`;
}

function formatRate(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "-";
  }

  return `${number.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}원`;
}

function createFullEventPageUrl(month) {
  if (
    !latestRecommendationData ||
    !latestRecommendationData.countryCode ||
    !latestRecommendationData.cityName ||
    !month ||
    !month.month
  ) {
    return null;
  }

  const monthValue = extractMonthValue(month.month);

  if (!monthValue) {
    return null;
  }

  const destinationAirport = findAirportByCode(latestRecommendationData.destinationAirportCode);

  const params = new URLSearchParams();

  if (destinationAirport && destinationAirport.region) {
    params.append("region", destinationAirport.region);
  }

  params.append("countryCode", latestRecommendationData.countryCode);
  params.append("cityName", latestRecommendationData.cityName);
  params.append("month", monthValue);

  return `/events?${params.toString()}`;
}

function extractMonthValue(month) {
  if (!month) {
    return null;
  }

  const parts = String(month).split("-");

  if (parts.length !== 2) {
    return null;
  }

  return Number(parts[1]);
}

function getSelectedAirportCode(type) {
  const selected = document.querySelector(`input[name="${type}AirportCode"]:checked`);
  return selected ? selected.value : "";
}

function getCountrySelect(type) {
  return type === "origin" ? originCountrySelect : destinationCountrySelect;
}

function getCitySelect(type) {
  return type === "origin" ? originCitySelect : destinationCitySelect;
}

function getAirportArea(type) {
  return type === "origin" ? originAirportArea : destinationAirportArea;
}

function findCountryByCode(countryCode) {
  return airportLocationGroups.find((country) => country.countryCode === countryCode);
}

function findCityByCountryCodeAndCityName(countryCode, cityName) {
  const country = findCountryByCode(countryCode);

  if (!country) {
    return null;
  }

  return country.cities.find((city) => city.cityName === cityName);
}

function findAirportByCode(airportCode) {
  return airportList.find((airport) => airport.airportCode === airportCode);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}