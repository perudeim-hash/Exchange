import {
  currencyMeta,
  normalizeCurrencyCode,
  formatCurrency
} from "./currency.js";
import { swapRates } from "./input.js";


const grid = document.getElementById("rateGrid");

export function renderGrid(rates, krw) {
  grid.innerHTML = "";

  rates.forEach((rate, index) => {
    const code = normalizeCurrencyCode(rate.cur_unit);
    if (code === "KRW") return;
    const meta = currencyMeta[code];
    if (!meta) return; // 안전장치

    const result = krw > 0 ? rate.calculated : "-";
    const card = document.createElement("div");
    card.className = "col12 col-md-6 col-lg-4 rate-card";
    card.dataset.index = index;

     card.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body position-relative">
                        <div class="position-absolute top-0 end-0 m-2 d-flex gap-1 order-controls">
                          <button class="order-btn move-up" ${index === 0 ? "disabled" : ""} aria-label="위로 이동">
                            ▲
                          </button>
                          <button class="order-btn move-down" ${index === rates.length - 1 ? "disabled" : ""} aria-label="아래로 이동">
                            ▼
                          </button>
                        </div>

                        <h5 class="card-title">${meta.country}</h5>
                        <p class="card-text">${meta.currency} (${code})</p>
                        <p>환율: ${rate.deal_bas_r} 원</p>
                        <p>결과: ${formatCurrency(code, result)}</p>
                    </div>
                </div>
            `;

    const upBtn = card.querySelector(".move-up");
    const downBtn = card.querySelector(".move-down");

    upBtn?.addEventListener("click", e => {
      e.stopPropagation();
      swapRates(index, index - 1);
    });

    downBtn?.addEventListener("click", e => {
      e.stopPropagation();
      swapRates(index, index + 1);
    });

    grid.appendChild(card);
  });
}