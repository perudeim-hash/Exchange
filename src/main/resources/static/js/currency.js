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
