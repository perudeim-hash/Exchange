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

    if (!region) {
      showEventStatus("대륙을 선택해 주세요.", "warning");
      return;
    }

    if (!countryCode) {
      showEventStatus("국가를 선택해 주세요.", "warning");
      return;
    }

    if (!cityName) {
      showEventStatus("도시를 선택해 주세요.", "warning");
      return;
    }

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
    showEventStatus("이벤트 데이터를 불러오지 못했습니다. 콘솔과 서버 로그를 확인해 주세요.", "danger");
  }
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
    eventMonthList.innerHTML = `
      <div class="event-empty-box">
        표시할 이벤트 데이터가 없습니다.
      </div>
    `;
    return;
  }

  const visibleMonths = monthlyEvents.filter((month) => month.eventCount > 0);

  if (visibleMonths.length === 0) {
    eventMonthList.innerHTML = `
      <div class="event-empty-box">
        해당 조건에 등록된 이벤트가 없습니다.
      </div>
    `;
    return;
  }

  visibleMonths.forEach((month) => {
    const monthCard = document.createElement("article");
    monthCard.className = "event-month-card";

    monthCard.innerHTML = `
      <div class="event-month-header">
        <h3>${month.monthLabel}</h3>
        <span class="event-count-badge">${month.eventCount}개</span>
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

  const title = document.createElement("div");
  title.className = "event-card-title";
  title.textContent = event.eventName || "이벤트명 없음";

  const meta = document.createElement("div");
  meta.className = "event-card-meta";

  const typeBadge = document.createElement("span");
  typeBadge.className = "event-type-badge";
  typeBadge.textContent = event.eventType || "EVENT";

  const areaText = document.createElement("span");
  areaText.textContent = event.eventArea || event.cityName || "-";

  meta.appendChild(typeBadge);
  meta.appendChild(areaText);

  const description = document.createElement("div");
  description.className = "event-card-description";
  description.textContent = event.description || "";

  card.appendChild(title);
  card.appendChild(meta);
  card.appendChild(description);

  if (event.eventUrl) {
    const linkWrap = document.createElement("div");
    linkWrap.className = "event-link-wrap";

    const link = document.createElement("a");
    link.className = "event-link";
    link.href = event.eventUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "참고 링크 보기";

    linkWrap.appendChild(link);
    card.appendChild(linkWrap);
  }

  return card;
}

function findRegionByCode(region) {
  return eventLocations.find((location) => location.region === region);
}

function findRegionByCountryCode(countryCode) {
  return eventLocations.find((location) =>
    (location.countries || []).some((country) => country.countryCode === countryCode)
  );
}

function findCountryByRegionAndCountryCode(region, countryCode) {
  const selectedRegion = findRegionByCode(region);

  if (!selectedRegion) {
    return null;
  }

  return (selectedRegion.countries || []).find((country) => country.countryCode === countryCode);
}

function showEventStatus(message, type) {
  eventStatusMessage.className = `alert alert-${type} event-status`;
  eventStatusMessage.textContent = message;
  eventStatusMessage.classList.remove("d-none");
}

function hideEventStatus() {
  eventStatusMessage.classList.add("d-none");
}