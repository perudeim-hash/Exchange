//calc
//
//import { renderGrid } from "./render.js";
//import { normalizeCurrencyCode } from "./currency.js";

const krwInput = document.getElementById("krwInput");
const rawRates = window.__RATES__;

let orderedRates = [];
let lastValidInput = 0;
let draggedCode = null;

/* 계산 + 상태 갱신 */
function calculateRates(krw) {
  return rawRates.map(rate => {
    let baseRate = parseFloat(rate.deal_bas_r.replace(/,/g, ""));
    const match = rate.cur_unit.match(/\((\d+)\)/);
    if (match) {
      baseRate /= parseInt(match[1], 10);
    }

    return {
      ...rate,
      calculated: krw > 0 ? krw / baseRate : null
    };
  });
}

function updateAndRender(krw) {
  orderedRates = calculateRates(krw);
  renderGrid(orderedRates, krw);
}

/* 입력 */
krwInput.addEventListener("input", e => {
  let value = e.target.value.replace(/[^0-9]/g, "");

  if (value === "") {
    e.target.value = "";
    updateAndRender(lastValidInput);
    return;
  }

  const num = parseInt(value, 10);
  lastValidInput = num;

  e.target.value = num.toLocaleString("ko-KR");
  updateAndRender(num);
});

/* 최초 렌더 */
document.addEventListener("DOMContentLoaded", () => {
  updateAndRender(0);
});

/* ---------- 드래그 정렬 ---------- */

const grid = document.getElementById("rateGrid");

grid.addEventListener("dragstart", e => {
  const card = e.target.closest(".rate-card");
  if (!card) return;

  draggedCode = card.dataset.code;
  card.classList.add("dragging");
});

grid.addEventListener("dragend", e => {
  const card = e.target.closest(".rate-card");
  if (!card) return;

  card.classList.remove("dragging");
});

grid.addEventListener("dragover", e => {
  e.preventDefault();

  const scrollMargin = 80;
  const scrollSpeed = 20;

  const y = e.clientY;
  const windowHeight = window.innerHeight;

  if(y < scrollMargin) {
  window.scrollBy(0, -scrollSpeed);
  }
    if(y > windowHeight - scrollMargin) {
    window.scrollBy(0, scrollSpeed);
    }
});

grid.addEventListener("drop", e => {
  e.preventDefault();

  if(!draggedCode) return;

  const cards = [...grid.querySelectorAll(".rate-card")];
  const dropY = e.clientY;

  let targetIndex = cards.length;

  for(let i = 0; i < cards.length; i++){
  const rect = cards[i].getBoundingClientRect();
  const middleY = rect.top + rect.height / 2;
  if(dropY < middleY) {
  targetIndex = i;
    break;

    }
  }
  reorderRatesByIndex(draggedCode, targetIndex);
  });

function reorderRatesByIndex(code, targetIndex){
    const fromIndex = orderedRates.findIndex(
    r => normalizeCurrencyCode(r.cur_unit) === code
    );

    if(fromIndex === -1) return;

    const [moved] = orderedRates.splice(fromIndex, 1);

    const insertIndex =
    fromIndex < targetIndex ? targetIndex - 1 : targetIndex;

    orderedRates.splice(insertIndex, 0, moved);

    renderGrid(orderedRates, lastValidInput);


}


function reorderRates(fromCode, toCode) {
  const fromIndex = orderedRates.findIndex(
    r => normalizeCurrencyCode(r.cur_unit) === fromCode
  );
  const toIndex = orderedRates.findIndex(
    r => normalizeCurrencyCode(r.cur_unit) === toCode
  );

  if (fromIndex === -1 || toIndex === -1) return;

  const [moved] = orderedRates.splice(fromIndex, 1);
  orderedRates.splice(toIndex, 0, moved);

  renderGrid(orderedRates, lastValidInput);
}

//render

//import {
//  currencyMeta,
//  normalizeCurrencyCode,
//  formatCurrency
//} from "./currency.js";

const grid = document.getElementById("rateGrid");

export function renderGrid(rates, krw) {
  grid.innerHTML = "";

  rates.forEach(rate => {
    const code = normalizeCurrencyCode(rate.cur_unit);

    // KRW는 결과에서 제외
    if (code === "KRW") return;

    const meta = currencyMeta[code];
    if (!meta) return; // 안전장치

    const result = krw > 0 ? rate.calculated : "-";

    const card = document.createElement("div");
    card.className = "col12 col-md-6 col-lg-4 rate-card";
    card.draggable = true;
    card.dataset.code = code;

    card.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <h5 class="fw-bold mb-1">${meta.country}</h5>
          <p class="text-muted mb-3">
            ${meta.currency} (${code})
          </p>

          <div class="d-flex justify-content-between">
            <span class="text-muted">환율</span>
            <span>${rate.deal_bas_r} 원</span>
          </div>

          <div class="d-flex justify-content-between mt-2 fw-semibold">
            <span>결과</span>
            <span class="text-primary">
              ${formatCurrency(code, result)}
            </span>
          </div>

        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}


//currentcy.js
export const currencyMeta = {
  KRW: {
    country: "대한민국",
    currency: "원",
    symbol: "₩",
    noDecimal: true
  },
  USD: {
    country: "미국",
    currency: "달러",
    symbol: "$"
  },
  JPY: {
    country: "일본",
    currency: "엔",
    symbol: "¥",
    noDecimal: true
  },
  EUR: {
    country: "유럽",
    currency: "유로",
    symbol: "€"
  },
  GBP: {
    country: "영국",
    currency: "파운드",
    symbol: "£"
  },
  AUD: {
    country: "호주",
    currency: "달러",
    symbol: "$"
  },
  CAD: {
    country: "캐나다",
    currency: "달러",
    symbol: "$"
  },
  CHF: {
    country: "스위스",
    currency: "프랑",
    symbol: "CHF"
  },
  CNY: {
    country: "중국",
    currency: "위안",
    symbol: "¥"
  },
  CNH: {
    country: "중국",
    currency: "위안",
    symbol: "¥"
  },
  HKD: {
    country: "홍콩",
    currency: "달러",
    symbol: "$"
  },
  SGD: {
    country: "싱가포르",
    currency: "달러",
    symbol: "$"
  },
  THB: {
    country: "태국",
    currency: "바트",
    symbol: "฿"
  },
  MYR: {
    country: "말레이시아",
    currency: "링깃",
    symbol: "RM"
  },
  IDR: {
    country: "인도네시아",
    currency: "루피아",
    symbol: "Rp"
  },
  SAR: {
    country: "사우디아라비아",
    currency: "리얄",
    symbol: "﷼"
  },
  AED: {
    country: "아랍에미리트",
    currency: "디르함",
    symbol: "د.إ"
  },
  BHD: {
    country: "바레인",
    currency: "디나르",
    symbol: "BD"
  },
  KWD: {
    country: "쿠웨이트",
    currency: "디나르",
    symbol: "KD"
  },
  NOK: {
    country: "노르웨이",
    currency: "크로네",
    symbol: "kr"
  },
  SEK: {
    country: "스웨덴",
    currency: "크로나",
    symbol: "kr"
  },
  DKK: {
    country: "덴마크",
    currency: "크로네",
    symbol: "kr"
  },
  NZD: {
    country: "뉴질랜드",
    currency: "달러",
    symbol: "$"
  }
};

export function normalizeCurrencyCode(curUnit) {
  return curUnit.includes("(")
    ? curUnit.split("(")[0]
    : curUnit;
}

export function formatCurrency(curUnit, value) {
  if (value === "-" || value === null || value === undefined) return "-";

  const code = normalizeCurrencyCode(curUnit);
  const meta = currencyMeta[code];

  const num = Number(value);
  if (Number.isNaN(num)) return "-";

  if(!meta) {
  return value.toLocaleString('ko-KR',{
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  }


  const formatted = meta.noDecimal
  ? Math.round(value).toLocaleString('ko-KR')
  : value.toLocaleString('ko-KR',{
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
      });

  return `${meta.symbol} ${formatted}`;

}
