import { calculateRates } from "./calc.js";
import { renderGrid } from "./render.js";

let orderedRates = [];
let lastValidInput = 0;

export function initInput(krwInput, rawRates) {
  orderedRates = calculateRates(rawRates, 0);
  renderGrid(orderedRates, 0);

  krwInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");

    if (value === "") {
      e.target.value = "";
      renderGrid(orderedRates, 0);
      lastValidInput = 0;
      return;
    }

    const num = parseInt(value, 10);
    lastValidInput = num;
    e.target.value = num.toLocaleString("ko-KR");
    orderedRates = calculateRates(rawRates, num);
    renderGrid(orderedRates, num);
  });
}

export function swapRates(fromIndex, toIndex) {
  const { orderedRates, lastValidInput } = getState();
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= orderedRates.length ||
    toIndex >= orderedRates.length
  )
    return;

  const temp = orderedRates[fromIndex];
  orderedRates[fromIndex] = orderedRates[toIndex];
  orderedRates[toIndex] = temp;

  setOrderedRates(orderedRates);
  renderGrid(orderedRates, lastValidInput);
}

export function setOrderedRates(rates) {
  orderedRates = rates;
}

export function getState() {
  return { orderedRates, lastValidInput };
}
