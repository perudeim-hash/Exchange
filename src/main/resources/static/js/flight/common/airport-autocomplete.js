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
    limit = Infinity,
  } = config;

  let isComposing = false;
  let activeIndex = -1;
  let currentFilteredAirports = [];

  input.addEventListener("compositionstart", () => {
    isComposing = true;
  });

  input.addEventListener("compositionend", () => {
    isComposing = false;
    activeIndex = 0;
    renderAirportDropdown();
  });

  input.addEventListener("input", () => {
    setSelectedAirport(null);
    renderSelectedAirport(input, badge, getSelectedAirport(), false);

    if (isComposing) {
      return;
    }

    activeIndex = 0;
    renderAirportDropdown();
  });

  input.addEventListener("focus", () => {
    activeIndex = 0;
    renderAirportDropdown();
  });

  input.addEventListener("keydown", (event) => {
    handleKeydown(event);
  });

  function handleKeydown(event) {
    const isDropdownOpen = dropdown.classList.contains("open");

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!isDropdownOpen) {
        activeIndex = 0;
        renderAirportDropdown();
        return;
      }

      moveActiveIndex(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!isDropdownOpen) {
        activeIndex = 0;
        renderAirportDropdown();
        return;
      }

      moveActiveIndex(-1);
      return;
    }

    if (event.key === "Enter") {
      if (!isDropdownOpen) {
        return;
      }

      event.preventDefault();

      if (currentFilteredAirports.length === 0) {
        return;
      }

      if (activeIndex < 0 || activeIndex >= currentFilteredAirports.length) {
        activeIndex = 0;
      }

      selectAirport(currentFilteredAirports[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      if (!isDropdownOpen) {
        return;
      }

      event.preventDefault();
      closeDropdown();
    }
  }

  function moveActiveIndex(direction) {
    if (currentFilteredAirports.length === 0) {
      return;
    }

    activeIndex += direction;

    if (activeIndex < 0) {
      activeIndex = currentFilteredAirports.length - 1;
    }

    if (activeIndex >= currentFilteredAirports.length) {
      activeIndex = 0;
    }

    updateActiveOption();
  }

  function renderAirportDropdown() {
    const airports = getAirports();
    const keyword = normalizeText(input.value);

    currentFilteredAirports = filterAirports(airports, keyword);

    if (Number.isFinite(limit)) {
      currentFilteredAirports = currentFilteredAirports.slice(0, limit);
    }

    if (currentFilteredAirports.length === 0) {
      dropdown.innerHTML = `
        <div class="airport-empty">
          검색 결과가 없습니다.
        </div>
      `;
      dropdown.classList.add("open");
      activeIndex = -1;
      return;
    }

    if (activeIndex < 0) {
      activeIndex = 0;
    }

    if (activeIndex >= currentFilteredAirports.length) {
      activeIndex = currentFilteredAirports.length - 1;
    }

    dropdown.innerHTML = currentFilteredAirports
      .map((airport, index) => {
        const isActive = index === activeIndex;

        return `
          <button type="button"
                  class="airport-option ${isActive ? "is-active" : ""}"
                  data-airport-code="${escapeHtml(airport.airportCode)}"
                  data-airport-index="${index}"
                  aria-selected="${isActive ? "true" : "false"}">
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
      button.addEventListener("mouseenter", () => {
        activeIndex = Number(button.dataset.airportIndex);
        updateActiveOption();
      });

      button.addEventListener("click", () => {
        const airportCode = button.dataset.airportCode;
        const selectedAirport = currentFilteredAirports.find((airport) => {
          return airport.airportCode === airportCode;
        });

        if (!selectedAirport) {
          return;
        }

        selectAirport(selectedAirport);
      });
    });

    dropdown.classList.add("open");
    updateActiveOption();
  }

  function updateActiveOption() {
    const optionButtons = dropdown.querySelectorAll(".airport-option");

    optionButtons.forEach((button, index) => {
      const isActive = index === activeIndex;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");

      if (isActive) {
        button.scrollIntoView({
          block: "nearest",
        });
      }
    });
  }

  function selectAirport(airport) {
    if (!airport) {
      return;
    }

    setSelectedAirport(airport);

    if (onSelected) {
      onSelected(airport);
    }

    closeDropdown();
  }

  function closeDropdown() {
    dropdown.classList.remove("open");
    activeIndex = -1;
  }
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