import { escapeHtml, normalizeText } from "../../common/format-utils.js";
import { airportLabel } from "./airport-service.js";

export function bindAirportAutocomplete(config) {
  const {
    type,
    input,
    badge,
    dropdown,
    getAirports,
    getSelectedAirport,
    setSelectedAirport,
    onSelected,
  } = config;

  let isComposing = false;

  input.addEventListener("compositionstart", () => {
    isComposing = true;
  });

  input.addEventListener("compositionend", () => {
    isComposing = false;
    renderAirportDropdown({
      type,
      input,
      dropdown,
      getAirports,
      setSelectedAirport,
      onSelected,
    });
  });

  input.addEventListener("input", () => {
    setSelectedAirport(null);
    renderSelectedAirport(input, badge, getSelectedAirport(), false);

    if (isComposing) {
      return;
    }

    renderAirportDropdown({
      type,
      input,
      dropdown,
      getAirports,
      setSelectedAirport,
      onSelected,
    });
  });

  input.addEventListener("focus", () => {
    renderAirportDropdown({
      type,
      input,
      dropdown,
      getAirports,
      setSelectedAirport,
      onSelected,
    });
  });
}

export function renderSelectedAirport(input, badge, airport, fillInput = true) {
  if (!airport) {
    badge.textContent = "-";

    if (fillInput) {
      input.value = "";
    }

    return;
  }

  badge.textContent = airport.airportCode;

  if (fillInput) {
    input.value = airportLabel(airport);
  }
}

export function closeAirportDropdowns(...dropdowns) {
  dropdowns.forEach((dropdown) => {
    if (dropdown) {
      dropdown.classList.remove("open");
    }
  });
}

function renderAirportDropdown(config) {
  const {
    input,
    dropdown,
    getAirports,
    setSelectedAirport,
    onSelected,
  } = config;

  const airports = getAirports();
  const keyword = normalizeText(input.value);

  const filteredAirports = filterAirports(airports, keyword).slice(0, 12);

  if (filteredAirports.length === 0) {
    dropdown.innerHTML = `
      <div class="airport-empty">
        검색 결과가 없습니다.
      </div>
    `;
    dropdown.classList.add("open");
    return;
  }

  dropdown.innerHTML = filteredAirports
    .map((airport) => {
      return `
        <button type="button" class="airport-option" data-airport-code="${escapeHtml(airport.airportCode)}">
          <span class="airport-option-icon">✈</span>

          <span class="airport-option-main">
            <span class="airport-option-title">
              ${escapeHtml(airport.cityName)} ${escapeHtml(airport.airportName)}
            </span>
            <span class="airport-option-sub">
              ${escapeHtml(airport.countryName)} · ${escapeHtml(airport.region)}
            </span>
          </span>

          <span class="airport-option-code">${escapeHtml(airport.airportCode)}</span>
        </button>
      `;
    })
    .join("");

  dropdown.querySelectorAll(".airport-option").forEach((button) => {
    button.addEventListener("click", () => {
      const airportCode = button.dataset.airportCode;
      const selectedAirport = airports.find((airport) => {
        return airport.airportCode === airportCode;
      });

      if (!selectedAirport) {
        return;
      }

      setSelectedAirport(selectedAirport);

      if (onSelected) {
        onSelected(selectedAirport);
      }

      dropdown.classList.remove("open");
    });
  });

  dropdown.classList.add("open");
}

function filterAirports(airports, keyword) {
  if (!Array.isArray(airports) || airports.length === 0) {
    return [];
  }

  if (!keyword) {
    return airports;
  }

  return airports.filter((airport) => {
    return includesAirportKeyword(airport.countryName, keyword) ||
      includesAirportKeyword(airport.countryCode, keyword) ||
      includesAirportKeyword(airport.cityName, keyword) ||
      includesAirportKeyword(airport.airportName, keyword) ||
      includesAirportKeyword(airport.airportCode, keyword) ||
      includesAirportKeyword(airport.region, keyword);
  });
}

function includesAirportKeyword(value, keyword) {
  if (!value) {
    return false;
  }

  return normalizeText(value).includes(keyword);
}