document.addEventListener('DOMContentLoaded', () => {
    initDefaultDates();
    bindEvents();
});

function bindEvents() {
    const searchButton = document.getElementById('searchButton');
    searchButton.addEventListener('click', searchRoundTripLowestPrices);
}

function initDefaultDates() {
    const today = new Date();

    const outboundStartDate = addDays(today, 0);
    const outboundEndDate = addDays(today, 30);
    const returnStartDate = addDays(today, 5);
    const returnEndDate = addDays(today, 45);

    document.getElementById('outboundStartDateInput').value = formatDate(outboundStartDate);
    document.getElementById('outboundEndDateInput').value = formatDate(outboundEndDate);
    document.getElementById('returnStartDateInput').value = formatDate(returnStartDate);
    document.getElementById('returnEndDateInput').value = formatDate(returnEndDate);
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

async function searchRoundTripLowestPrices() {
    const resultList = document.getElementById('resultList');
    const resultSummary = document.getElementById('resultSummary');

    resultSummary.textContent = '왕복 최저가 항공권을 조회 중입니다...';
    resultList.innerHTML = '';

    const params = buildSearchParams();

    try {
        const response = await fetch(`/api/flights/lowest-prices/round-trip?${params.toString()}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || '왕복 최저가 조회에 실패했습니다.');
        }

        const data = await response.json();

        renderSummary(data);
        renderRoundTripOptions(data.options || []);
    } catch (error) {
        console.error(error);
        resultSummary.textContent = '조회 중 오류가 발생했습니다.';
        resultList.innerHTML = `
            <div class="empty-box">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}

function buildSearchParams() {
    const params = new URLSearchParams();

    params.set('origin', getInputValue('originInput'));
    params.set('destination', getInputValue('destinationInput'));
    params.set('outboundStartDate', getInputValue('outboundStartDateInput'));
    params.set('outboundEndDate', getInputValue('outboundEndDateInput'));
    params.set('returnStartDate', getInputValue('returnStartDateInput'));
    params.set('returnEndDate', getInputValue('returnEndDateInput'));
    params.set('adultCount', getInputValue('adultCountInput'));
    params.set('childCount', getInputValue('childCountInput'));
    params.set('infantCount', getInputValue('infantCountInput'));
    params.set('limit', getInputValue('limitSelect'));

    return params;
}

function getInputValue(id) {
    return document.getElementById(id).value.trim();
}

function renderSummary(data) {
    const resultSummary = document.getElementById('resultSummary');

    resultSummary.innerHTML = `
        <strong>${data.tripTypeDescription || '왕복 최저가'}</strong>
        <span>${data.originAirportCode} → ${data.destinationAirportCode}</span>
        <span>결과 ${data.resultCount}개</span>
        <span>가는 편 ${data.outboundStartDate} ~ ${data.outboundEndDate}</span>
        <span>오는 편 ${data.returnStartDate} ~ ${data.returnEndDate}</span>
    `;
}

function renderRoundTripOptions(options) {
    const resultList = document.getElementById('resultList');

    if (options.length === 0) {
        resultList.innerHTML = `
            <div class="empty-box">
                조회된 왕복 항공권이 없습니다.
            </div>
        `;
        return;
    }

    resultList.innerHTML = options
        .map((option, index) => createRoundTripCard(option, index))
        .join('');
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
        <article class="round-trip-card">
            <div class="card-rank">TOP ${index + 1}</div>

            <div class="card-main">
                <div class="price-box">
                    <span class="price-label">왕복 총액</span>
                    <strong>${formatPrice(option.totalPrice)}원</strong>
                    <span class="duration">총 비행 ${option.totalDurationText || '-'}</span>
                    <span class="passenger">${escapeHtml(outbound.passengerSummary || '')}</span>
                </div>

                <div class="flight-pair">
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
    const firstSegment = flight.segments && flight.segments.length > 0 ? flight.segments[0] : null;

    const originCode = firstSegment ? firstSegment.originAirportCode : '-';
    const originName = firstSegment ? firstSegment.originAirportName : '';
    const destinationCode = firstSegment ? firstSegment.destinationAirportCode : '-';
    const destinationName = firstSegment ? firstSegment.destinationAirportName : '';

    const departureDate = firstSegment ? firstSegment.departureDate : '-';
    const departureTime = firstSegment ? firstSegment.departureTime : flight.departureTime;
    const arrivalDate = flight.arrivalDate || '-';
    const arrivalTime = flight.arrivalTime || '-';

    return `
        <div class="flight-leg">
            <div class="leg-header">
                <span class="leg-label">${label}</span>
                <span class="airline">${escapeHtml(flight.airlineName)} · ${escapeHtml(flight.connectionTypeDescription)}</span>
            </div>

            <div class="route-line">
                <div class="airport">
                    <strong>${escapeHtml(originCode)}</strong>
                    <span>${escapeHtml(originName)}</span>
                </div>

                <div class="arrow">→</div>

                <div class="airport">
                    <strong>${escapeHtml(destinationCode)}</strong>
                    <span>${escapeHtml(destinationName)}</span>
                </div>
            </div>

            <div class="time-line">
                <span>출발 ${departureDate} ${formatTime(departureTime)}</span>
                <span>도착 ${arrivalDate} ${formatTime(arrivalTime)}</span>
            </div>

            <div class="meta-line">
                <span>${escapeHtml(flight.seatClassDescription)}</span>
                <span>${escapeHtml(flight.totalDurationText)}</span>
                <span>${formatPrice(flight.totalPrice)}원</span>
            </div>
        </div>
    `;
}

function formatPrice(value) {
    if (value === null || value === undefined) {
        return '-';
    }

    return Number(value).toLocaleString('ko-KR');
}

function formatTime(value) {
    if (!value) {
        return '-';
    }

    return value.substring(0, 5);
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