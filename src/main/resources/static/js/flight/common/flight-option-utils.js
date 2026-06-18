export function getSortedSegments(option) {
  if (!option || !Array.isArray(option.segments)) {
    return [];
  }

  return [...option.segments].sort((a, b) => {
    return Number(a.segmentOrder || 0) - Number(b.segmentOrder || 0);
  });
}

export function getFirstSegment(option) {
  const segments = getSortedSegments(option);

  if (segments.length === 0) {
    return null;
  }

  return segments[0];
}

export function getLastSegment(option) {
  const segments = getSortedSegments(option);

  if (segments.length === 0) {
    return null;
  }

  return segments[segments.length - 1];
}

export function getOriginAirportCode(option) {
  const firstSegment = getFirstSegment(option);

  if (!firstSegment) {
    return "-";
  }

  return firstSegment.originAirportCode || "-";
}

export function getDestinationAirportCode(option) {
  const lastSegment = getLastSegment(option);

  if (!lastSegment) {
    return "-";
  }

  return lastSegment.destinationAirportCode || "-";
}

export function getDepartureDate(option) {
  const firstSegment = getFirstSegment(option);

  if (firstSegment && firstSegment.departureDate) {
    return firstSegment.departureDate;
  }

  return option?.departureDate || "-";
}

export function getDepartureTime(option) {
  const firstSegment = getFirstSegment(option);

  if (firstSegment && firstSegment.departureTime) {
    return firstSegment.departureTime;
  }

  return option?.departureTime || "-";
}

export function getArrivalDate(option) {
  const lastSegment = getLastSegment(option);

  if (lastSegment && lastSegment.arrivalDate) {
    return lastSegment.arrivalDate;
  }

  return option?.arrivalDate || "-";
}

export function getArrivalTime(option) {
  const lastSegment = getLastSegment(option);

  if (lastSegment && lastSegment.arrivalTime) {
    return lastSegment.arrivalTime;
  }

  return option?.arrivalTime || "-";
}

export function createSegmentPathText(option) {
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

export function createConnectionText(option) {
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