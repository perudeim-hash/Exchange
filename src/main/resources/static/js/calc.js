
const rawRates = window.__RATES__;

export function calculateRates(rates,krw) {
  return rates.map(rate => {
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

