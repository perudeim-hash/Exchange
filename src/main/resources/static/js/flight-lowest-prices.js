const AIRPORT_API_URL = '/api/flights/airports';
const ONE_WAY_LOWEST_PRICE_API_URL = '/api/flights/lowest-prices';
const ROUND_TRIP_LOWEST_PRICE_API_URL = '/api/flights/lowest-prices/round-trip';

const TRIP_TYPE = {
    ONE_WAY: 'ONE_WAY',
    ROUND_TRIP: 'ROUND_TRIP'
};

const REGION_LABELS = {
    ASIA: '아시아',
    EUROPE: '유럽',
    AMERICA: '아메리카',
    OCEANIA: '오세아니아',
    MIDDLE_EAST: '중동'
};

let airports = [];
let currentTripType = TRIP_TYPE.ONE_WAY;

document.addEventListener('DOMContentLoaded', async () => {
    currentTripType = getTripTypeFromUrl();

    initDefaultDates();
    bindEvents();
    updateTripTypeView();

    await loadAirports();
    applyQueryParams();
});

function bindEvents() {
    document.getElementById('oneWayTripButton')
        .addEventListener('click', () => changeTripType(TRIP_TYPE.ONE_WAY));

    document.getElementById('roundTripTripButton')
        .addEventListener('click', () => changeTripType(TRIP_TYPE.ROUND_TRIP));

    document.getElementById('originRegionSelect')
        .addEventListener('change', () => handleRegionChange('origin'));

    document.getElementById('originCountrySelect')
        .addEventListener('change', () => handleCountryChange('origin'));

    document.getElementById('destinationRegionSelect')
        .addEventListener('change', () => handleRegionChange('destination'));

    document.getElementById('destinationCountrySelect')
        .addEventListener('change', () => handleCountryChange('destination'));

    document.getElementById('searchButton')
        .addEventListener('click', searchLowestPrices);
}

function getTripTypeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const tripType = params.get('tripType');

    if (tripType === TRIP_TYPE.ROUND_TRIP) {
        return TRIP_TYPE.ROUND_TRIP;
    }

    return TRIP_TYPE.ONE_WAY;
}

function changeTripType(tripType) {
    currentTripType = tripType;
    updateTripTypeView();
    updateTripTypeQueryParam();
    clearResults();
}

function updateTripTypeView() {
    const oneWayButton = document.getElementById('oneWayTripButton');
    const roundTripButton = document.getElementById('roundTripTripButton');

    const oneWayDateArea = document.getElementById('oneWayDateArea');
    const roundTripDateArea = document.getElementById('roundTripDateArea');

    if (currentTripType === TRIP_TYPE.ONE_WAY) {
        oneWayButton.classList.add('active');
        roundTripButton.classList.remove('active');

        oneWayDateArea.style.display = 'grid';
        roundTripDateArea.style.display = 'none';

        document.getElementById('searchButton').textContent = '편도 최저가 조회';
        return;
    }

    oneWayButton.classList.remove('active');
    roundTripButton.classList.add('active');

    oneWayDateArea.style.display = 'none';
    roundTripDateArea.style.display = 'grid';

    document.getElementById('searchButton').textContent = '왕복 최저가 조회';
}

function updateTripTypeQueryParam() {
    const url = new URL(window.location.href);
    url.searchParams.set('tripType', currentTripType);
    window.history.replaceState({}, '', url);
}

function initDefaultDates() {
    const today = new Date();

    setInputValue('startDateInput', formatDate(today));
    setInputValue('endDateInput', formatDate(addDays(today, 30)));

    setInputValue('outboundStartDateInput', formatDate(today));
    setInputValue('outboundEndDateInput', formatDate(addDays(today, 30)));
    setInputValue('returnStartDateInput', formatDate(addDays(today, 5)));
    setInputValue('returnEndDateInput', formatDate(addDays(today, 45)));
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

async function loadAirports() {
    try {
        const response = await fetch(AIRPORT_API_URL);

        if (!response.ok) {
            throw new Error('공항 목록을 불러오지 못했습니다.');
        }

        airports = await response.json();

        renderRegionSelect('origin');
        renderRegionSelect('destination');

        setAirportByCode('origin', 'ICN');
        setAirportByCode('destination', 'NRT');
    } catch (error) {
        console.error(error);
        showError(error.message);
    }
}

function renderRegionSelect(type) {
    const regionSelect = getElement(type, 'RegionSelect');

    const regions = [...new Set(airports.map(airport => airport.region))]
        .filter(Boolean)
        .sort();

    regionSelect.innerHTML = '<option value="">대륙 선택</option>';

    regions.forEach(region => {
        const option = document.createElement('option');
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
    const regionSelect = getElement(type, 'RegionSelect');
    const countrySelect = getElement(type, 'CountrySelect');

    const selectedRegion = regionSelect.value;

    countrySelect.innerHTML = '<option value="">나라 선택</option>';

    if (!selectedRegion) {
        renderAirportSelect(type);
        return;
    }

    const countries = airports
        .filter(airport => airport.region === selectedRegion)
        .reduce((map, airport) => {
            if (!map.has(airport.countryCode)) {
                map.set(airport.countryCode, airport.countryName);
            }
            return map;
        }, new Map());

    [...countries.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], 'ko'))
        .forEach(([countryCode, countryName]) => {
            const option = document.createElement('option');
            option.value = countryCode;
            option.textContent = countryName;
            countrySelect.appendChild(option);
        });

    renderAirportSelect(type);
}

function renderAirportSelect(type) {
    const regionSelect = getElement(type, 'RegionSelect');
    const countrySelect = getElement(type, 'CountrySelect');
    const airportSelect = getElement(type, 'AirportSelect');

    const selectedRegion = regionSelect.value;
    const selectedCountry = countrySelect.value;

    airportSelect.innerHTML = '<option value="">공항 선택</option>';

    if (!selectedRegion || !selectedCountry) {
        return;
    }

    airports
        .filter(airport =>
            airport.region === selectedRegion &&
            airport.countryCode === selectedCountry
        )
        .sort((a, b) => a.airportName.localeCompare(b.airportName, 'ko'))
        .forEach(airport => {
            const option = document.createElement('option');
            option.value = airport.airportCode;
            option.textContent = `${airport.cityName} - ${airport.airportName} (${airport.airportCode})`;
            airportSelect.appendChild(option);
        });
}

function setAirportByCode(type, airportCode) {
    if (!airportCode) {
        return;
    }

    const airport = airports.find(item => item.airportCode === airportCode.toUpperCase());

    if (!airport) {
        return;
    }

    const regionSelect = getElement(type, 'RegionSelect');
    const countrySelect = getElement(type, 'CountrySelect');
    const airportSelect = getElement(type, 'AirportSelect');

    regionSelect.value = airport.region;

    renderCountrySelect(type);
    countrySelect.value = airport.countryCode;

    renderAirportSelect(type);
    airportSelect.value = airport.airportCode;
}

function getElement(type, suffix) {
    return document.getElementById(`${type}${suffix}`);
}

function applyQueryParams() {
    const params = new URLSearchParams(window.location.search);

    const origin = params.get('origin');
    const destination = params.get('destination');

    if (origin) {
        setAirportByCode('origin', origin);
    }

    if (destination) {
        setAirportByCode('destination', destination);
    }

    if (params.get('startDate')) {
        setInputValue('startDateInput', params.get('startDate'));
    }

    if (params.get('endDate')) {
        setInputValue('endDateInput', params.get('endDate'));
    }

    if (params.get('outboundStartDate')) {
        setInputValue('outboundStartDateInput', params.get('outboundStartDate'));
    }

    if (params.get('outboundEndDate')) {
        setInputValue('outboundEndDateInput', params.get('outboundEndDate'));
    }

    if (params.get('returnStartDate')) {
        setInputValue('returnStartDateInput', params.get('returnStartDate'));
    }

    if (params.get('returnEndDate')) {
        setInputValue('returnEndDateInput', params.get('returnEndDate'));
    }
}

async function searchLowestPrices() {
    if (currentTripType === TRIP_TYPE.ROUND_TRIP) {
        await searchRoundTripLowestPrices();
        return;
    }

    await searchOneWayLowestPrices();
}

async function searchOneWayLowestPrices() {
    clearResults();
    showLoading('편도 최저가 항공권을 조회 중입니다...');

    try {
        const params = buildOneWaySearchParams();
        const response = await fetch(`${ONE_WAY_LOWEST_PRICE_API_URL}?${params.toString()}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || '편도 최저가 조회에 실패했습니다.');
        }

        const data = await response.json();

        renderOneWaySummary(data);
        renderOneWayOptions(data.options || []);
    } catch (error) {
        console.error(error);
        showError(error.message);
    }
}

async function searchRoundTripLowestPrices() {
    clearResults();
    showLoading('왕복 최저가 항공권을 조회 중입니다...');

    try {
        const params = buildRoundTripSearchParams();
        const response = await fetch(`${ROUND_TRIP_LOWEST_PRICE_API_URL}?${params.toString()}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || '왕복 최저가 조회에 실패했습니다.');
        }

        const data = await response.json();

        renderRoundTripSummary(data);
        renderRoundTripOptions(data.options || []);
    } catch (error) {
        console.error(error);
        showError(error.message);
    }
}

function buildOneWaySearchParams() {
    const params = new URLSearchParams();

    params.set('origin', getSelectedAirportCode('origin'));
    params.set('destination', getSelectedAirportCode('destination'));
    params.set('startDate', getInputValue('startDateInput'));
    params.set('endDate', getInputValue('endDateInput'));

    appendCommonSearchParams(params);

    return params;
}

function buildRoundTripSearchParams() {
    const params = new URLSearchParams();

    params.set('origin', getSelectedAirportCode('origin'));
    params.set('destination', getSelectedAirportCode('destination'));
    params.set('outboundStartDate', getInputValue('outboundStartDateInput'));
    params.set('outboundEndDate', getInputValue('outboundEndDateInput'));
    params.set('returnStartDate', getInputValue('returnStartDateInput'));
    params.set('returnEndDate', getInputValue('returnEndDateInput'));

    appendCommonSearchParams(params);

    return params;
}

function appendCommonSearchParams(params) {
    const connectionType = getInputValue('connectionTypeSelect');
    const seatClass = getInputValue('seatClassSelect');

    if (connectionType) {
        params.set('connectionType', connectionType);
    }

    if (seatClass) {
        params.set('seatClass', seatClass);
    }

    params.set('adultCount', getInputValue('adultCountInput') || '1');
    params.set('childCount', getInputValue('childCountInput') || '0');
    params.set('infantCount', getInputValue('infantCountInput') || '0');
    params.set('limit', getInputValue('limitSelect') || '30');
}

function getSelectedAirportCode(type) {
    return getElement(type, 'AirportSelect').value;
}

function getInputValue(id) {
    const element = document.getElementById(id);

    if (!element) {
        return '';
    }

    return element.value.trim();
}

function setInputValue(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.value = value;
    }
}

function renderOneWaySummary(data) {
    const resultSummary = document.getElementById('resultSummary');

    resultSummary.innerHTML = `
        <strong>편도 최저가</strong>
        <span>${escapeHtml(data.originAirportCode)} → ${escapeHtml(data.destinationAirportCode)}</span>
        <span>${escapeHtml(data.startDate)} ~ ${escapeHtml(data.endDate)}</span>
        <span>결과 ${data.resultCount}개</span>
    `;
}

function renderRoundTripSummary(data) {
    const resultSummary = document.getElementById('resultSummary');

    resultSummary.innerHTML = `
        <strong>${escapeHtml(data.tripTypeDescription || '왕복 최저가')}</strong>
        <span>${escapeHtml(data.originAirportCode)} → ${escapeHtml(data.destinationAirportCode)}</span>
        <span>가는 편 ${escapeHtml(data.outboundStartDate)} ~ ${escapeHtml(data.outboundEndDate)}</span>
        <span>오는 편 ${escapeHtml(data.returnStartDate)} ~ ${escapeHtml(data.returnEndDate)}</span>
        <span>결과 ${data.resultCount}개</span>
    `;
}

function renderOneWayOptions(options) {
    const resultList = document.getElementById('resultList');

    if (options.length === 0) {
        resultList.innerHTML = createEmptyBox('조회된 편도 항공권이 없습니다.');
        return;
    }

    resultList.innerHTML = options
        .map((option, index) => createOneWayCard(option, index))
        .join('');
}

function renderRoundTripOptions(options) {
    const resultList = document.getElementById('resultList');

    if (options.length === 0) {
        resultList.innerHTML = createEmptyBox('조회된 왕복 항공권이 없습니다.');
        return;
    }

    resultList.innerHTML = options
        .map((option, index) => createRoundTripCard(option, index))
        .join('');
}

function createOneWayCard(option, index) {
    const bookingUrl =
        `/flights/booking/one-way?optionId=${option.flightOptionId}` +
        `&adultCount=${option.adultCount}` +
        `&childCount=${option.childCount}` +
        `&infantCount=${option.infantCount}`;

    return `
        <article class="flight-card one-way-card">
            <div class="card-rank">TOP ${index + 1}</div>

            <div class="card-content">
                <div class="price-box">
                    <span class="price-label">편도 총액</span>
                    <strong>${formatPrice(option.totalPrice)}원</strong>
                    <span>${escapeHtml(option.passengerSummary || '')}</span>
                    <span>${escapeHtml(option.totalDurationText || '')}</span>
                </div>

                <div class="flight-detail">
                    ${createFlightLeg('편도', option)}
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
    const outbound = option.outboundOption;
    const returns = option.returnOption;

    const bookingUrl =
        `/flights/booking/round-trip?outboundOptionId=${option.outboundOptionId}` +
        `&returnOptionId=${option.returnOptionId}` +
        `&adultCount=${outbound.adultCount}` +
        `&childCount=${outbound.childCount}` +
        `&infantCount=${outbound.infantCount}`;

    return `
        <article class="flight-card round-trip-card">
            <div class="card-rank">TOP ${index + 1}</div>

            <div class="card-content round-trip-content">
                <div class="price-box">
                    <span class="price-label">왕복 총액</span>
                    <strong>${formatPrice(option.totalPrice)}원</strong>
                    <span>${escapeHtml(outbound.passengerSummary || '')}</span>
                    <span>총 비행 ${escapeHtml(option.totalDurationText || '')}</span>
                </div>

                <div class="round-trip-legs">
                    ${createFlightLeg('가는 편', outbound)}
                    ${createFlightLeg('오는 편', returns)}
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
    const firstSegment = getFirstSegment(flight);
    const lastSegment = getLastSegment(flight);

    const originAirportCode = firstSegment ? firstSegment.originAirportCode : '-';
    const originAirportName = firstSegment ? firstSegment.originAirportName : '';

    const destinationAirportCode = lastSegment ? lastSegment.destinationAirportCode : '-';
    const destinationAirportName = lastSegment ? lastSegment.destinationAirportName : '';

    const departureDate = firstSegment ? firstSegment.departureDate : '-';
    const departureTime = firstSegment ? firstSegment.departureTime : flight.departureTime;

    const arrivalDate = lastSegment ? lastSegment.arrivalDate : flight.arrivalDate;
    const arrivalTime = lastSegment ? lastSegment.arrivalTime : flight.arrivalTime;

    return `
        <div class="flight-leg">
            <div class="leg-header">
                <span class="leg-label">${escapeHtml(label)}</span>
                <span class="airline">
                    ${escapeHtml(flight.airlineName || '')}
                    ·
                    ${escapeHtml(flight.connectionTypeDescription || '')}
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
                <span>${escapeHtml(flight.seatClassDescription || '')}</span>
                <span>${escapeHtml(flight.totalDurationText || '')}</span>
                <span>${formatPrice(flight.totalPrice)}원</span>
            </div>

            ${createSegmentList(flight)}
        </div>
    `;
}

function createSegmentList(flight) {
    if (!flight.segments || flight.segments.length <= 1) {
        return '';
    }

    const segmentItems = flight.segments
        .map(segment => `
            <li>
                ${escapeHtml(segment.originAirportCode)}
                →
                ${escapeHtml(segment.destinationAirportCode)}
                /
                ${escapeHtml(segment.durationText || '')}
            </li>
        `)
        .join('');

    return `
        <ul class="segment-list">
            ${segmentItems}
        </ul>
    `;
}

function getFirstSegment(flight) {
    if (!flight.segments || flight.segments.length === 0) {
        return null;
    }

    return flight.segments[0];
}

function getLastSegment(flight) {
    if (!flight.segments || flight.segments.length === 0) {
        return null;
    }

    return flight.segments[flight.segments.length - 1];
}

function showLoading(message) {
    document.getElementById('resultSummary').textContent = message;
    document.getElementById('resultList').innerHTML = '';
}

function showError(message) {
    document.getElementById('resultSummary').textContent = '조회 중 오류가 발생했습니다.';
    document.getElementById('resultList').innerHTML = createEmptyBox(message);
}

function clearResults() {
    document.getElementById('resultSummary').textContent =
        '조회 조건을 선택한 뒤 최저가 항공권을 조회해 주세요.';

    document.getElementById('resultList').innerHTML = '';
}

function createEmptyBox(message) {
    return `
        <div class="empty-box">
            ${escapeHtml(message)}
        </div>
    `;
}

function formatPrice(value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    return Number(value).toLocaleString('ko-KR');
}

function formatTime(value) {
    if (!value) {
        return '-';
    }

    return String(value).substring(0, 5);
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}