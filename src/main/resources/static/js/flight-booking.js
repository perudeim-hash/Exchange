const bookingLoading = document.getElementById("bookingLoading");
const bookingError = document.getElementById("bookingError");
const bookingContent = document.getElementById("bookingContent");

const bookingPageTitle = document.getElementById("bookingPageTitle");
const bookingPageDescription = document.getElementById("bookingPageDescription");
const bookingTripTypeLabel = document.getElementById("bookingTripTypeLabel");

const bookingRouteTitle = document.getElementById("bookingRouteTitle");
const bookingPassengerSummary = document.getElementById("bookingPassengerSummary");
const pricePassengerSummary = document.getElementById("pricePassengerSummary");

const backToResultsBtn = document.getElementById("backToResultsBtn");

const outboundFlightCard = document.getElementById("outboundFlightCard");
const returnFlightCard = document.getElementById("returnFlightCard");

const outboundBadge = document.getElementById("outboundBadge");
const outboundTitle = document.getElementById("outboundTitle");
const returnTitle = document.getElementById("returnTitle");

const outboundFlightDetail = document.getElementById("outboundFlightDetail");
const returnFlightDetail = document.getElementById("returnFlightDetail");

const outboundPriceLabel = document.getElementById("outboundPriceLabel");
const outboundPrice = document.getElementById("outboundPrice");
const returnPriceRow = document.getElementById("returnPriceRow");
const returnPrice = document.getElementById("returnPrice");
const totalPrice = document.getElementById("totalPrice");

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindEvents();
  fetchBookingDetail();
}

function bindEvents() {
  backToResultsBtn.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/flights/lowest-prices";
  });
}

async function fetchBookingDetail() {
  const params = new URLSearchParams(window.location.search);

  if (isOneWayBookingPage()) {
    await fetchOneWayBookingDetail(params);
    return;
  }

  await fetchRoundTripBookingDetail(params);
}

function isOneWayBookingPage() {
  return window.location.pathname.includes("/flights/booking/one-way");
}

async function fetchOneWayBookingDetail(params) {
  const optionId = params.get("optionId");

  if (!optionId) {
    renderError("편도 항공권 선택 정보가 올바르지 않습니다. 다시 검색해 주세요.");
    return;
  }

  renderLoading();

  try {
    const apiParams = new URLSearchParams();
    apiParams.append("optionId", optionId);
    apiParams.append("adultCount", params.get("adultCount") || "1");
    apiParams.append("childCount", params.get("childCount") || "0");
    apiParams.append("infantCount", params.get("infantCount") || "0");

    const response = await fetch(`/api/flights/booking/one-way?${apiParams.toString()}`);

    if (!response.ok) {
      throw new Error("편도 항공권 상세 조회 실패");
    }

    const data = await response.json();

    renderOneWayBookingDetail(data);
  } catch (error) {
    console.error(error);
    renderError("편도 항공권 상세 정보를 불러오지 못했습니다. 다시 검색해 주세요.");
  }
}

async function fetchRoundTripBookingDetail(params) {
  const outboundOptionId = params.get("outboundOptionId");
  const returnOptionId = params.get("returnOptionId");

  if (!outboundOptionId || !returnOptionId) {
    renderError("왕복 항공권 선택 정보가 올바르지 않습니다. 다시 검색해 주세요.");
    return;
  }

  renderLoading();

  try {
    const apiParams = new URLSearchParams();
    apiParams.append("outboundOptionId", outboundOptionId);
    apiParams.append("returnOptionId", returnOptionId);
    apiParams.append("adultCount", params.get("adultCount") || "1");
    apiParams.append("childCount", params.get("childCount") || "0");
    apiParams.append("infantCount", params.get("infantCount") || "0");

    const response = await fetch(`/api/flights/booking/round-trip?${apiParams.toString()}`);

    if (!response.ok) {
      throw new Error("왕복 항공권 상세 조회 실패");
    }

    const data = await response.json();

    renderRoundTripBookingDetail(data);
  } catch (error) {
    console.error(error);
    renderError("왕복 항공권 상세 정보를 불러오지 못했습니다. 다시 검색해 주세요.");
  }
}

function renderLoading() {
  bookingLoading.style.display = "block";
  bookingError.style.display = "none";
  bookingContent.style.display = "none";
}

function renderError(message) {
  bookingLoading.style.display = "none";
  bookingError.style.display = "block";
  bookingContent.style.display = "none";
  bookingError.textContent = message;
}

function renderOneWayBookingDetail(option) {
  const originCode = getOriginAirportCode(option);
  const destinationCode = getDestinationAirportCode(option);

  bookingPageTitle.textContent = "선택한 편도 항공권 상세 확인";
  bookingPageDescription.textContent =
    "선택한 편도 항공권 정보, 경유 구간, 승객 수, 예상 금액을 확인합니다.";

  bookingTripTypeLabel.textContent = "선택한 편도 여행";
  bookingRouteTitle.textContent = `${originCode} → ${destinationCode} 편도 항공권`;

  bookingPassengerSummary.textContent = option.passengerSummary || createPassengerSummary(option);
  pricePassengerSummary.textContent = option.passengerSummary || createPassengerSummary(option);

  outboundBadge.textContent = "편도";
  outboundTitle.textContent = `${originCode} → ${destinationCode}`;
  outboundFlightDetail.innerHTML = renderFlightOptionDetail("편도", option);

  outboundPriceLabel.textContent = "항공권";
  outboundPrice.textContent = `₩${formatPrice(option.totalPrice)}`;
  totalPrice.textContent = `₩${formatPrice(option.totalPrice)}`;

  returnFlightCard.style.display = "none";
  returnPriceRow.style.display = "none";
  returnPrice.textContent = "-";

  bookingLoading.style.display = "none";
  bookingError.style.display = "none";
  bookingContent.style.display = "grid";
}

function renderRoundTripBookingDetail(data) {
  const outboundOption = data.outboundOption;
  const returnOption = data.returnOption;

  const outboundOriginCode = getOriginAirportCode(outboundOption);
  const outboundDestinationCode = getDestinationAirportCode(outboundOption);

  const returnOriginCode = getOriginAirportCode(returnOption);
  const returnDestinationCode = getDestinationAirportCode(returnOption);

  bookingPageTitle.textContent = "선택한 왕복 항공권 상세 확인";
  bookingPageDescription.textContent =
    "선택한 가는 편과 오는 편의 항공권 정보, 경유 구간, 승객 수, 예상 금액을 확인합니다.";

  bookingTripTypeLabel.textContent = "선택한 왕복 여행";
  bookingRouteTitle.textContent =
    `${outboundOriginCode} ↔ ${outboundDestinationCode} 왕복 항공권`;

  bookingPassengerSummary.textContent = data.passengerSummary || createPassengerSummary(data);
  pricePassengerSummary.textContent = data.passengerSummary || createPassengerSummary(data);

  outboundBadge.textContent = "가는 편";
  outboundTitle.textContent =
    `${outboundOriginCode} → ${outboundDestinationCode}`;

  returnTitle.textContent =
    `${returnOriginCode} → ${returnDestinationCode}`;

  outboundFlightDetail.innerHTML = renderFlightOptionDetail("가는 편", outboundOption);
  returnFlightDetail.innerHTML = renderFlightOptionDetail("오는 편", returnOption);

  outboundPriceLabel.textContent = "가는 편";
  outboundPrice.textContent = `₩${formatPrice(data.outboundTotalPrice)}`;
  returnPrice.textContent = `₩${formatPrice(data.returnTotalPrice)}`;
  totalPrice.textContent = `₩${formatPrice(data.totalPrice)}`;

  returnFlightCard.style.display = "block";
  returnPriceRow.style.display = "flex";

  bookingLoading.style.display = "none";
  bookingError.style.display = "none";
  bookingContent.style.display = "grid";
}

function renderFlightOptionDetail(label, option) {
  const sortedSegments = getSortedSegments(option);
  const firstSegment = sortedSegments.length > 0 ? sortedSegments[0] : null;
  const lastSegment = sortedSegments.length > 0 ? sortedSegments[sortedSegments.length - 1] : null;

  const originCode = getOriginAirportCode(option);
  const destinationCode = getDestinationAirportCode(option);
  const segmentPathText = createSegmentPathText(option);
  const connectionText = createConnectionText(option);

  const departureDate = firstSegment ? firstSegment.departureDate : null;
  const departureTime = firstSegment ? firstSegment.departureTime : option.departureTime;

  const arrivalDate = lastSegment ? lastSegment.arrivalDate : option.arrivalDate;
  const arrivalTime = lastSegment ? lastSegment.arrivalTime : option.arrivalTime;

  return `
    <div class="booking-route-overview">
      <div class="booking-route-time-block">
        <strong>${formatTime(departureTime)}</strong>
        <span>${escapeHtml(originCode)}</span>
        <small>${formatDate(departureDate)}</small>
      </div>

      <div class="booking-route-center">
        <span class="duration-text">${escapeHtml(option.totalDurationText || "-")}</span>
        <span class="route-line"></span>
        <strong class="segment-path">${escapeHtml(segmentPathText)}</strong>
        <span class="layover-text">${escapeHtml(connectionText)}</span>
      </div>

      <div class="booking-route-time-block right">
        <strong>${formatTime(arrivalTime)}</strong>
        <span>${escapeHtml(destinationCode)}</span>
        <small>${formatDate(arrivalDate)}</small>
      </div>
    </div>

    <div class="booking-info-grid">
      <div class="booking-info-item">
        <span>항공사</span>
        <strong>${escapeHtml(option.airlineName || "-")}</strong>
        <small>${escapeHtml(option.airlineCode || "")}</small>
      </div>

      <div class="booking-info-item">
        <span>항공사 등급</span>
        <strong>${escapeHtml(option.airlineTierDescription || "-")}</strong>
      </div>

      <div class="booking-info-item">
        <span>좌석 등급</span>
        <strong>${escapeHtml(option.seatClassDescription || "-")}</strong>
      </div>

      <div class="booking-info-item">
        <span>항공편 유형</span>
        <strong>${escapeHtml(option.connectionTypeDescription || "-")}</strong>
      </div>
    </div>

    <div class="booking-segment-section">
      <div class="booking-section-title">
        ${escapeHtml(label)} 상세 구간
      </div>

      <div class="booking-segment-list">
        ${renderSegments(option)}
      </div>
    </div>
  `;
}

function renderSegments(option) {
  const segments = getSortedSegments(option);

  if (segments.length === 0) {
    return `
      <div class="booking-segment-empty">
        상세 구간 정보가 없습니다.
      </div>
    `;
  }

  return segments
    .map((segment, index) => {
      const hasLayover = segment.layoverAfterText;

      return `
        <div class="booking-segment-item">
          <div class="booking-segment-order">
            ${segment.segmentOrder || index + 1}
          </div>

          <div class="booking-segment-main">
            <div class="booking-segment-route">
              <strong>
                ${escapeHtml(segment.originAirportCode || "-")}
                →
                ${escapeHtml(segment.destinationAirportCode || "-")}
              </strong>
              <span>${escapeHtml(segment.durationText || "-")}</span>
            </div>

            <div class="booking-segment-airports">
              ${escapeHtml(segment.originAirportName || "-")}
              →
              ${escapeHtml(segment.destinationAirportName || "-")}
            </div>

            <div class="booking-segment-time">
              ${formatDate(segment.departureDate)}
              ${formatTime(segment.departureTime)}
              출발
              ·
              ${formatDate(segment.arrivalDate)}
              ${formatTime(segment.arrivalTime)}
              도착
            </div>

            ${
              hasLayover
                ? `
                  <div class="booking-layover-box">
                    ${escapeHtml(segment.destinationAirportCode || "-")}에서
                    ${escapeHtml(segment.layoverAfterText)}
                    대기
                  </div>
                `
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function getSortedSegments(option) {
  if (!option || !Array.isArray(option.segments)) {
    return [];
  }

  return [...option.segments].sort((a, b) => {
    return Number(a.segmentOrder || 0) - Number(b.segmentOrder || 0);
  });
}

function getOriginAirportCode(option) {
  const segments = getSortedSegments(option);

  if (segments.length === 0) {
    return "-";
  }

  return segments[0].originAirportCode || "-";
}

function getDestinationAirportCode(option) {
  const segments = getSortedSegments(option);

  if (segments.length === 0) {
    return "-";
  }

  return segments[segments.length - 1].destinationAirportCode || "-";
}

function createSegmentPathText(option) {
  const segments = getSortedSegments(option);

  if (segments.length === 0) {
    return "-";
  }

  const airportCodes = [];

  airportCodes.push(segments[0].originAirportCode);

  segments.forEach((segment) => {
    airportCodes.push(segment.destinationAirportCode);
  });

  return airportCodes
    .filter(Boolean)
    .join(" → ");
}

function createConnectionText(option) {
  const segments = getSortedSegments(option);

  if (segments.length <= 1) {
    return "직항";
  }

  const layoverTexts = segments
    .slice(0, -1)
    .map((segment) => {
      const airportCode = segment.destinationAirportCode || "-";
      const layoverText = segment.layoverAfterText
        ? ` · 대기 ${segment.layoverAfterText}`
        : "";

      return `${airportCode}${layoverText}`;
    });

  return `경유 ${layoverTexts.join(", ")}`;
}

function createPassengerSummary(data) {
  const summary = [`성인 ${data.adultCount || 1}명`];

  if (Number(data.childCount) > 0) {
    summary.push(`소아 ${data.childCount}명`);
  }

  if (Number(data.infantCount) > 0) {
    summary.push(`유아 ${data.infantCount}명`);
  }

  return summary.join(", ");
}

function formatDate(dateText) {
  if (!dateText) {
    return "-";
  }

  return String(dateText).replaceAll("-", ".");
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}