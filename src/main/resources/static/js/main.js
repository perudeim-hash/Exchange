import { initInput } from "./input.js";

import { renderGrid } from "./render.js";
import { calculateRates } from "./calc.js";


const rawRates = window.__RATES__;
const krwInput = document.getElementById("krwInput");
const grid = document.getElementById("rateGrid");


initInput(krwInput, rawRates);
initDrag(grid);