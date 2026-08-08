import { fetchJson } from "../../common/api.js";
import { AIRPORT_CACHE_KEY, FLIGHT_API } from "./flight-constants.js";

export async function loadAirportsWithCache() {
  const cachedAirports = getAirportsFromCache();

  if (cachedAirports.length > 0) {
    return cachedAirports;
  }

  const airports = await fetchJson(
    FLIGHT_API.AIRPORTS,
    "공항 목록을 불러오지 못했습니다."
  );

  saveAirportsToCache(airports);

  return airports;
}

export function getAirportsFromCache() {
  try {
    const cachedValue = sessionStorage.getItem(AIRPORT_CACHE_KEY);

    if (!cachedValue) {
      return [];
    }

    const parsedAirports = JSON.parse(cachedValue);

    if (!Array.isArray(parsedAirports)) {
      return [];
    }

    return parsedAirports;
  } catch (error) {
    console.warn("공항 캐시를 읽지 못했습니다.", error);
    return [];
  }
}

export function saveAirportsToCache(airports) {
  try {
    if (!Array.isArray(airports)) {
      return;
    }

    sessionStorage.setItem(AIRPORT_CACHE_KEY, JSON.stringify(airports));
  } catch (error) {
    console.warn("공항 캐시를 저장하지 못했습니다.", error);
  }
}

export function findAirportByCode(airports, airportCode) {
  if (!airportCode || !Array.isArray(airports)) {
    return null;
  }

  return airports.find((airport) => {
    return airport.airportCode === String(airportCode).toUpperCase();
  }) || null;
}

export function getDefaultOriginAirport(airports) {
  if (!Array.isArray(airports) || airports.length === 0) {
    return null;
  }

  return findAirportByCode(airports, "ICN") || airports[0];
}

export function getDefaultDestinationAirport(airports, originAirport) {
  if (!Array.isArray(airports) || airports.length === 0) {
    return null;
  }

  return findAirportByCode(airports, "NRT") ||
    airports.find((airport) => {
      return !originAirport || airport.airportCode !== originAirport.airportCode;
    }) ||
    airports[0];
}

export function getCountriesFromAirports(airports) {
  const countryMap = new Map();

  airports.forEach((airport) => {
    if (!airport.countryCode) {
      return;
    }

    if (!countryMap.has(airport.countryCode)) {
      countryMap.set(airport.countryCode, {
        countryCode: airport.countryCode,
        countryName: airport.countryName,
        region: airport.region,
      });
    }
  });

  return [...countryMap.values()].sort((a, b) => {
    return a.countryName.localeCompare(b.countryName, "ko");
  });
}

export function getCitiesByCountryCode(airports, countryCode) {
  return airports
    .filter((airport) => airport.countryCode === countryCode)
    .map((airport) => airport.cityName)
    .filter((cityName, index, array) => {
      return cityName && array.indexOf(cityName) === index;
    })
    .sort((a, b) => a.localeCompare(b, "ko"));
}

export function getAirportsByCountryAndCity(airports, countryCode, cityName) {
  return airports
    .filter((airport) => {
      return airport.countryCode === countryCode &&
        airport.cityName === cityName;
    })
    .sort((a, b) => {
      return airportLabel(a).localeCompare(airportLabel(b), "ko");
    });
}

export function airportLabel(airport) {
  if (!airport) {
    return "";
  }

  return `${airport.cityName} ${airport.airportName} (${airport.airportCode})`;
}