const bookingLoading = document.getElementById("bookingLoading");
const bookingError = document.getElementById("bookingError");
const bookingContent = document.getElementById("bookingContent");

const bookingPageTitle = document.getElementById("bookingPageTitle");
const bookingPageDescription = document.getElementById("bookingPageDescription");
const bookingTripTypeLabel = document.getElementById("bookingTripTypeLabel");

const bookingRouteTitle = document.getElementById("bookingRouteTitle");
const bookingPassengerSummary = document.getElementById("bookingPassengerSummary");
const pricePassengerSummary = document.getElementById("pricePassengerSummary");

const bookingOutboundDateLabel = document.getElementById("bookingOutboundDateLabel");
const bookingOutboundDateText = document.getElementById("bookingOutboundDateText");
const bookingReturnDateItem = document.getElementById("bookingReturnDateItem");
const bookingReturnDateLabel = document.getElementById("bookingReturnDateLabel");
const bookingReturnDateText = document.getElementById("bookingReturnDateText");

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

const goPaymentButton = document.getElementById("goPaymentButton");
const bookingPaymentMessage = document.getElementById("bookingPaymentMessage");

const RESERVATION_API_URL = "/api/reservations";
const PAYMENT_READY_API_URL = "/api/payments/ready";

// PaymentProvider enum 값이 TOSS가 아니면 여기만 바꾸면 됨.
// 예: TOSS_PAYMENT, TOSS_PAYMENTS 등
const PAYMENT_PROVIDER = "TOSS";

let latestPaymentContext = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindEvents();
  fetchBookingDetail();
}

function bindEvents() {
  if (backToResultsBtn) {
    backToResultsBtn.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      window.location.href = "/flights/lowest-prices";
    });
  }

  if (goPaymentButton) {
    goPaymentButton.addEventListener("click", moveToPaymentPage);
  }
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
  if (bookingLoading) {
    bookingLoading.style.display = "block";
  }

  if (bookingError) {
    bookingError.style.display = "none";
  }

  if (bookingContent) {
    bookingContent.style.display = "none";
  }

  disablePaymentButton("항공권 정보 로딩 중...");
}

function renderError(message) {
  if (bookingLoading) {
    bookingLoading.style.display = "none";
  }

  if (bookingError) {
    bookingError.style.display = "block";
    bookingError.textContent = message;
  }

  if (bookingContent) {
    bookingContent.style.display = "none";
  }

  disablePaymentButton("결제 화면으로 이동");
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

  renderBookingScheduleSummary({
    outboundLabel: "출발일",
    outboundDate: getOptionDepartureDate(option),
    returnLabel: "도착일",
    returnDate: getOptionArrivalDate(option),
    showReturnDate: true,
  });

  outboundBadge.textContent = "편도";
  outboundTitle.textContent = `${originCode} → ${destinationCode}`;
  outboundFlightDetail.innerHTML = renderFlightOptionDetail("편도", option);

  outboundPriceLabel.textContent = "항공권";
  outboundPrice.textContent = `₩${formatPrice(option.totalPrice)}`;
  totalPrice.textContent = `₩${formatPrice(option.totalPrice)}`;

  returnFlightCard.style.display = "none";
  returnPriceRow.style.display = "none";
  returnPrice.textContent = "-";

  latestPaymentContext = createOneWayPaymentContext(option);
  enablePaymentButton();

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

  renderBookingScheduleSummary({
    outboundLabel: "출국일",
    outboundDate: getOptionDepartureDate(outboundOption),
    returnLabel: "귀국일",
    returnDate: getOptionDepartureDate(returnOption),
    showReturnDate: true,
  });

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

  latestPaymentContext = createRoundTripPaymentContext(data);
  enablePaymentButton();

  bookingLoading.style.display = "none";
  bookingError.style.display = "none";
  bookingContent.style.display = "grid";
}

function renderBookingScheduleSummary(config) {
  if (
    !bookingOutboundDateLabel ||
    !bookingOutboundDateText ||
    !bookingReturnDateItem ||
    !bookingReturnDateLabel ||
    !bookingReturnDateText
  ) {
    return;
  }

  bookingOutboundDateLabel.textContent = config.outboundLabel || "출국일";
  bookingOutboundDateText.textContent = formatKoreanDate(config.outboundDate);

  bookingReturnDateLabel.textContent = config.returnLabel || "귀국일";
  bookingReturnDateText.textContent = formatKoreanDate(config.returnDate);

  bookingReturnDateItem.style.display = config.showReturnDate ? "block" : "none";
}

function renderFlightOptionDetail(label, option) {
  const sortedSegments = getSortedSegments(option);
  const firstSegment = sortedSegments.length > 0 ? sortedSegments[0] : null;
  const lastSegment = sortedSegments.length > 0 ? sortedSegments[sortedSegments.length - 1] : null;

  const originCode = getOriginAirportCode(option);
  const destinationCode = getDestinationAirportCode(option);
  const segmentPathText = createSegmentPathText(option);
  const connectionText = createConnectionText(option);

  const departureDate = firstSegment ? firstSegment.departureDate : option.departureDate;
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

/* ================================
   예약 생성 → 결제 준비 → 결제 화면 이동
   ================================ */

async function moveToPaymentPage() {
  if (!latestPaymentContext) {
    showBookingPaymentMessage("항공권 정보를 불러온 뒤 결제 화면으로 이동할 수 있습니다.");
    return;
  }

  try {
    hideBookingPaymentMessage();
    disablePaymentButton("예약 정보를 생성하는 중...");

    const reservationRequest = createReservationRequest(latestPaymentContext);
    const reservation = await postJson(RESERVATION_API_URL, reservationRequest);

    const reservationId = extractReservationId(reservation);

    if (!reservationId) {
      console.log("reservation response:", reservation);
      throw new Error("예약 ID가 응답에 없습니다.");
    }

    disablePaymentButton("결제 정보를 준비하는 중...");

    const paymentReadyRequest = createPaymentReadyRequest(reservationId);
    const paymentReady = await postJson(PAYMENT_READY_API_URL, paymentReadyRequest);

    const paymentId = extractPaymentId(paymentReady);

    if (!paymentId) {
      console.log("paymentReady response:", paymentReady);
      throw new Error("결제 ID가 응답에 없습니다.");
    }

    window.location.href = `/payments/${paymentId}`;
  } catch (error) {
    console.error(error);
    enablePaymentButton();
    showBookingPaymentMessage(error.message || "결제 화면으로 이동하는 중 문제가 발생했습니다.");
  }
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "요청 처리에 실패했습니다.");
  }

  return await response.json();
}

function createReservationRequest(context) {
  return {
    tripType : context.tripType,
    outboundFlightOptionId: toNullableNumber(context.outboundFlightOptionId),
    returnFlightOptionId: toNullableNumber(context.returnFlightOptionId),

    originAirportCode: context.originAirportCode,
    originAirportName: context.originAirportName,
    originCityName: context.originCityName,

    destinationAirportCode: context.destinationAirportCode,
    destinationAirportName: context.destinationAirportName,
    destinationCityName: context.destinationCityName,

    departureDate: context.departureDate,
    returnDate: context.returnDate,

    adultCount: Number(context.adultCount || 1),
    childCount: Number(context.childCount || 0),
    infantCount: Number(context.infantCount || 0),

    totalAmount: Number(context.totalAmount || 0),

    customerName: context.customerName || "테스트 예약자",
    customerEmail: context.customerEmail || "test@example.com",
    customerPhone: context.customerPhone || "010-0000-0000",
  };
}

function createPaymentReadyRequest(reservationId) {
  return {
    reservationId: Number(reservationId),
    provider: PAYMENT_PROVIDER,
  };
}

function createOneWayPaymentContext(option) {
  const params = new URLSearchParams(window.location.search);
  const routeInfo = createRouteInfoFromOption(option);

  return {
  tripType : "ONE_WAY",
    outboundFlightOptionId: option.flightOptionId || params.get("optionId"),
    returnFlightOptionId: null,

    originAirportCode: routeInfo.originAirportCode,
    originAirportName: routeInfo.originAirportName,
    originCityName: routeInfo.originCityName,

    destinationAirportCode: routeInfo.destinationAirportCode,
    destinationAirportName: routeInfo.destinationAirportName,
    destinationCityName: routeInfo.destinationCityName,

    departureDate: getOptionDepartureDate(option),
    returnDate: null,

    adultCount: option.adultCount || params.get("adultCount") || "1",
    childCount: option.childCount || params.get("childCount") || "0",
    infantCount: option.infantCount || params.get("infantCount") || "0",

    totalAmount: option.totalPrice,

    customerName: "테스트 예약자",
    customerEmail: "test@example.com",
    customerPhone: "010-0000-0000",
  };
}

function createRoundTripPaymentContext(data) {
  const params = new URLSearchParams(window.location.search);
  const outboundOption = data.outboundOption;
  const returnOption = data.returnOption;
  const routeInfo = createRouteInfoFromOption(outboundOption);

  return {
  tripType: "ROUND_TRIP",

    outboundFlightOptionId:
      data.outboundOptionId ||
      outboundOption?.flightOptionId ||
      params.get("outboundOptionId"),

    returnFlightOptionId:
      data.returnOptionId ||
      returnOption?.flightOptionId ||
      params.get("returnOptionId"),

    originAirportCode: routeInfo.originAirportCode,
    originAirportName: routeInfo.originAirportName,
    originCityName: routeInfo.originCityName,

    destinationAirportCode: routeInfo.destinationAirportCode,
    destinationAirportName: routeInfo.destinationAirportName,
    destinationCityName: routeInfo.destinationCityName,

    departureDate: getOptionDepartureDate(outboundOption),
    returnDate: getOptionDepartureDate(returnOption),

    adultCount: data.adultCount || params.get("adultCount") || "1",
    childCount: data.childCount || params.get("childCount") || "0",
    infantCount: data.infantCount || params.get("infantCount") || "0",

    totalAmount: data.totalPrice,

    customerName: "테스트 예약자",
    customerEmail: "test@example.com",
    customerPhone: "010-0000-0000",
  };
}

function createRouteInfoFromOption(option) {
  const segments = getSortedSegments(option);
  const firstSegment = segments.length > 0 ? segments[0] : null;
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : null;

  return {
    originAirportCode:
      firstSegment?.originAirportCode ||
      option?.originAirportCode ||
      "-",

    originAirportName:
      firstSegment?.originAirportName ||
      option?.originAirportName ||
      firstSegment?.originAirportCode ||
      "-",

    originCityName:
      firstSegment?.originCityName ||
      option?.originCityName ||
      guessCityName(firstSegment?.originAirportName) ||
      firstSegment?.originAirportCode ||
      "-",

    destinationAirportCode:
      lastSegment?.destinationAirportCode ||
      option?.destinationAirportCode ||
      "-",

    destinationAirportName:
      lastSegment?.destinationAirportName ||
      option?.destinationAirportName ||
      lastSegment?.destinationAirportCode ||
      "-",

    destinationCityName:
      lastSegment?.destinationCityName ||
      option?.destinationCityName ||
      guessCityName(lastSegment?.destinationAirportName) ||
      lastSegment?.destinationAirportCode ||
      "-",
  };
}

function extractReservationId(reservation) {
  return reservation?.reservationId ||
    reservation?.id ||
    reservation?.reservation?.reservationId ||
    reservation?.reservation?.id ||
    null;
}

function extractPaymentId(paymentReady) {
  return paymentReady?.paymentId ||
    paymentReady?.id ||
    paymentReady?.payment?.paymentId ||
    paymentReady?.payment?.id ||
    null;
}

/* ================================
   항공권 데이터 유틸
   ================================ */

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

function getOptionDepartureDate(option) {
  const segments = getSortedSegments(option);

  if (segments.length > 0 && segments[0].departureDate) {
    return segments[0].departureDate;
  }

  return option?.departureDate || null;
}

function getOptionArrivalDate(option) {
  const segments = getSortedSegments(option);

  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];

    if (lastSegment.arrivalDate) {
      return lastSegment.arrivalDate;
    }
  }

  return option?.arrivalDate || null;
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

/* ================================
   버튼 / 메시지
   ================================ */

function enablePaymentButton() {
  if (!goPaymentButton) {
    return;
  }

  goPaymentButton.disabled = false;
  goPaymentButton.textContent = "결제 화면으로 이동";
}

function disablePaymentButton(text = "결제 화면으로 이동 중...") {
  if (!goPaymentButton) {
    return;
  }

  goPaymentButton.disabled = true;
  goPaymentButton.textContent = text;
}

function showBookingPaymentMessage(message) {
  if (!bookingPaymentMessage) {
    alert(message);
    return;
  }

  bookingPaymentMessage.textContent = message;
  bookingPaymentMessage.style.display = "block";
}

function hideBookingPaymentMessage() {
  if (!bookingPaymentMessage) {
    return;
  }

  bookingPaymentMessage.textContent = "";
  bookingPaymentMessage.style.display = "none";
}

/* ================================
   Format / Escape
   ================================ */

function formatKoreanDate(dateText) {
  if (!dateText) {
    return "-";
  }

  const parts = String(dateText).split("-");

  if (parts.length !== 3) {
    return formatDate(dateText);
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return formatDate(dateText);
  }

  return `${year}년 ${month}월 ${day}일`;
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

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return null;
  }

  return numberValue;
}

function guessCityName(airportName) {
  if (!airportName) {
    return null;
  }

  return String(airportName)
    .replace("국제공항", "")
    .replace("공항", "")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}