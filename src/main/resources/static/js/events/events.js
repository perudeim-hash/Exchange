const regionSelect = document.getElementById("regionSelect");
const countrySelect = document.getElementById("countrySelect");
const citySelect = document.getElementById("citySelect");
const monthSelect = document.getElementById("monthSelect");
const searchEventBtn = document.getElementById("searchEventBtn");

const eventStatusMessage = document.getElementById("eventStatusMessage");
const eventSummaryArea = document.getElementById("eventSummaryArea");
const eventSummaryTitle = document.getElementById("eventSummaryTitle");
const eventSummaryInfo = document.getElementById("eventSummaryInfo");
const eventMonthList = document.getElementById("eventMonthList");

let eventLocations = [];

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  await loadEventLocations();
  applyQueryParams();
});

function bindEvents() {
  regionSelect.addEventListener("change", handleRegionChange);
  countrySelect.addEventListener("change", handleCountryChange);
  citySelect.addEventListener("change", clearEventResult);
  monthSelect.addEventListener("change", clearEventResult);
  searchEventBtn.addEventListener("click", loadEvents);
}

async function loadEventLocations() {
  try {
    showEventStatus("대륙/국가/도시 목록을 불러오는 중입니다.", "secondary");

    const response = await fetch("/api/events/locations");

    if (!response.ok) {
      throw new Error("대륙/국가/도시 목록 API 호출에 실패했습니다.");
    }

    eventLocations = await response.json();

    renderRegionOptions(eventLocations);
    resetCountrySelect();
    resetCitySelect();
    hideEventStatus();
  } catch (error) {
    console.error(error);
    showEventStatus("대륙/국가/도시 목록을 불러오지 못했습니다. 서버 로그를 확인해 주세요.", "danger");
  }
}

function renderRegionOptions(locations) {
  regionSelect.innerHTML = `<option value="">대륙을 선택하세요</option>`;

  if (!locations || locations.length === 0) {
    regionSelect.innerHTML = `<option value="">등록된 대륙이 없습니다</option>`;
    regionSelect.disabled = true;
    return;
  }

  regionSelect.disabled = false;

  locations.forEach((location) => {
    const option = document.createElement("option");
    option.value = location.region;
    option.textContent = location.regionName || location.region;
    regionSelect.appendChild(option);
  });
}

function handleRegionChange() {
  const region = regionSelect.value;

  resetCountrySelect();
  resetCitySelect();
  clearEventResult();

  if (!region) {
    return;
  }

  const selectedRegion = findRegionByCode(region);

  if (!selectedRegion) {
    return;
  }

  renderCountryOptions(selectedRegion.countries || []);
}

function renderCountryOptions(countries) {
  countrySelect.innerHTML = `<option value="">국가를 선택하세요</option>`;

  if (!countries || countries.length === 0) {
    countrySelect.innerHTML = `<option value="">등록된 국가가 없습니다</option>`;
    countrySelect.disabled = true;
    return;
  }

  countrySelect.disabled = false;

  countries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country.countryCode;
    option.textContent = country.countryName;
    countrySelect.appendChild(option);
  });
}

function handleCountryChange() {
  const region = regionSelect.value;
  const countryCode = countrySelect.value;

  resetCitySelect();
  clearEventResult();

  if (!region || !countryCode) {
    return;
  }

  const selectedCountry = findCountryByRegionAndCountryCode(region, countryCode);

  if (!selectedCountry) {
    return;
  }

  renderCityOptions(selectedCountry.cities || []);
}

function renderCityOptions(cities) {
  citySelect.innerHTML = `<option value="">도시를 선택하세요</option>`;

  if (!cities || cities.length === 0) {
    citySelect.innerHTML = `<option value="">등록된 도시가 없습니다</option>`;
    citySelect.disabled = true;
    return;
  }

  citySelect.disabled = false;

  cities.forEach((cityName) => {
    const option = document.createElement("option");
    option.value = cityName;
    option.textContent = cityName;
    citySelect.appendChild(option);
  });
}

function resetCountrySelect() {
  countrySelect.innerHTML = `<option value="">먼저 대륙을 선택하세요</option>`;
  countrySelect.disabled = true;
}

function resetCitySelect() {
  citySelect.innerHTML = `<option value="">먼저 국가를 선택하세요</option>`;
  citySelect.disabled = true;
}

function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);

  const region = params.get("region");
  const countryCode = params.get("countryCode");
  const cityName = params.get("cityName");
  const month = params.get("month");

  if (month) {
    monthSelect.value = month;
  }

  if (region) {
    regionSelect.value = region;
  }

  if (!regionSelect.value && countryCode) {
    const regionByCountry = findRegionByCountryCode(countryCode);

    if (regionByCountry) {
      regionSelect.value = regionByCountry.region;
    }
  }

  if (!regionSelect.value) {
    return;
  }

  handleRegionChange();

  if (!countryCode) {
    return;
  }

  countrySelect.value = countryCode;
  handleCountryChange();

  if (cityName) {
    citySelect.value = cityName;
  }

  if (regionSelect.value && countrySelect.value && citySelect.value) {
    loadEvents();
  }
}

async function loadEvents() {
  try {
    const region = regionSelect.value;
    const countryCode = countrySelect.value;
    const cityName = citySelect.value;
    const month = monthSelect.value;

    if (!validateSearchCondition(region, countryCode, cityName)) {
      return;
    }

    setSearchButtonLoading(true);
    showEventStatus("이벤트 데이터를 불러오는 중입니다.", "secondary");

    const url = buildEventApiUrl(region, countryCode, cityName, month);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("이벤트 API 호출에 실패했습니다.");
    }

    const data = await response.json();

    renderEventSummary(data, month);
    renderMonthlyEvents(data.monthlyEvents || []);
    updateBrowserUrl(region, countryCode, cityName, month);
    hideEventStatus();
  } catch (error) {
    console.error(error);
    showEventStatus("이벤트 데이터를 불러오지 못했습니다.", "danger");
  } finally {
    setSearchButtonLoading(false);
  }
}

function validateSearchCondition(region, countryCode, cityName) {
  if (!region) {
    showEventStatus("대륙을 선택해 주세요.", "warning");
    return false;
  }

  if (!countryCode) {
    showEventStatus("국가를 선택해 주세요.", "warning");
    return false;
  }

  if (!cityName) {
    showEventStatus("도시를 선택해 주세요.", "warning");
    return false;
  }

  return true;
}

function buildEventApiUrl(region, countryCode, cityName, month) {
  const params = new URLSearchParams();

  params.append("region", region);
  params.append("countryCode", countryCode);
  params.append("cityName", cityName);

  if (month) {
    params.append("month", month);
  }

  return `/api/events?${params.toString()}`;
}

function updateBrowserUrl(region, countryCode, cityName, month) {
  const params = new URLSearchParams();

  params.append("region", region);
  params.append("countryCode", countryCode);
  params.append("cityName", cityName);

  if (month) {
    params.append("month", month);
  }

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", nextUrl);
}

function renderEventSummary(data, selectedMonth) {
  eventSummaryArea.classList.remove("d-none");

  eventSummaryTitle.textContent = `${data.cityName} 이벤트 목록`;

  const monthText = selectedMonth ? `${selectedMonth}월` : "전체 월";
  const selectedRegion = findRegionByCode(regionSelect.value);
  const regionName = selectedRegion ? selectedRegion.regionName : regionSelect.value;

  eventSummaryInfo.textContent =
    `${regionName} / ` +
    `${data.countryName}(${data.countryCode}) / ` +
    `${monthText} / 총 ${data.totalEventCount || 0}개 이벤트`;
}

function renderMonthlyEvents(monthlyEvents) {
  eventMonthList.innerHTML = "";

  if (!monthlyEvents || monthlyEvents.length === 0) {
    eventMonthList.innerHTML = createEmptyBox("표시할 이벤트 데이터가 없습니다.");
    return;
  }

  const visibleMonths = monthlyEvents.filter((month) => {
    return Number(month.eventCount) > 0;
  });

  if (visibleMonths.length === 0) {
    eventMonthList.innerHTML = createEmptyBox("해당 조건에 등록된 이벤트가 없습니다.");
    return;
  }

  visibleMonths.forEach((month) => {
    const monthCard = document.createElement("article");
    monthCard.className = "event-month-card";

    monthCard.innerHTML = `
      <div class="event-month-header">
        <div class="event-month-title-group">
          <span class="event-month-number">${escapeHtml(month.month)}월</span>
          <div>
            <h3>${escapeHtml(month.monthLabel)}</h3>
            <p>해당 월에 등록된 여행 이벤트입니다.</p>
          </div>
        </div>

        <span class="event-count-badge">${escapeHtml(month.eventCount)}개</span>
      </div>

      <div class="event-card-list"></div>
    `;

    const list = monthCard.querySelector(".event-card-list");

    (month.events || []).forEach((event) => {
      list.appendChild(createEventCard(event));
    });

    eventMonthList.appendChild(monthCard);
  });
}

function createEventCard(event) {
  const card = document.createElement("div");
  card.className = "event-card";

  card.innerHTML = `
    <div class="event-card-top">
      <h4 class="event-card-title">${escapeHtml(event.eventName || "이벤트명 없음")}</h4>
      <span class="event-type-badge">${escapeHtml(event.eventType || "EVENT")}</span>
    </div>

    <div class="event-card-meta">
      <span class="event-meta-chip">${escapeHtml(event.eventArea || event.cityName || "-")}</span>
      <span class="event-meta-chip">${escapeHtml(event.countryName || "")}</span>
    </div>

    <div class="event-card-description">
      ${escapeHtml(event.description || "등록된 설명이 없습니다.")}
    </div>

    ${createEventLink(event)}
  `;

  return card;
}

function createEventLink(event) {
  if (!event.eventUrl) {
    return "";
  }

  return `
    <div class="event-link-wrap">
      <a class="event-link"
         href="${escapeAttribute(event.eventUrl)}"
         target="_blank"
         rel="noopener noreferrer">
        참고 링크 보기
      </a>
    </div>
  `;
}

function createEmptyBox(message) {
  return `
    <div class="event-empty-box">
      <strong>조회 결과 없음</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}

function clearEventResult() {
  eventSummaryArea.classList.add("d-none");
  eventMonthList.innerHTML = `
    <div class="event-empty-box">
      <strong>조건을 선택해 주세요.</strong>
      <span>대륙, 국가, 도시를 선택한 뒤 이벤트를 조회해 주세요.</span>
    </div>
  `;
}

function setSearchButtonLoading(isLoading) {
  searchEventBtn.disabled = isLoading;
  searchEventBtn.textContent = isLoading ? "조회 중..." : "조회하기";
}

function findRegionByCode(region) {
  return eventLocations.find((location) => {
    return location.region === region;
  });
}

function findRegionByCountryCode(countryCode) {
  return eventLocations.find((location) => {
    return (location.countries || []).some((country) => {
      return country.countryCode === countryCode;
    });
  });
}

function findCountryByRegionAndCountryCode(region, countryCode) {
  const selectedRegion = findRegionByCode(region);

  if (!selectedRegion) {
    return null;
  }

  return (selectedRegion.countries || []).find((country) => {
    return country.countryCode === countryCode;
  });
}

function showEventStatus(message, type) {
  eventStatusMessage.className = `alert alert-${type} event-status`;
  eventStatusMessage.textContent = message;
  eventStatusMessage.classList.remove("d-none");
}

function hideEventStatus() {
  eventStatusMessage.classList.add("d-none");
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