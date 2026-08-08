export function normalizePassengerCounts(adultCount, childCount, infantCount) {
  const normalizedAdultCount = Number(adultCount || 1);
  const normalizedChildCount = Number(childCount || 0);
  const normalizedInfantCount = Number(infantCount || 0);

  return {
    adultCount: Math.max(1, normalizedAdultCount),
    childCount: Math.max(0, normalizedChildCount),
    infantCount: Math.max(0, normalizedInfantCount),
  };
}

export function createPassengerSummary(data) {
  const counts = normalizePassengerCounts(
    data?.adultCount,
    data?.childCount,
    data?.infantCount
  );

  const summary = [`성인 ${counts.adultCount}명`];

  if (counts.childCount > 0) {
    summary.push(`소아 ${counts.childCount}명`);
  }

  if (counts.infantCount > 0) {
    summary.push(`유아 ${counts.infantCount}명`);
  }

  return summary.join(", ");
}

export function canChangePassengerCount(nextAdultCount, nextChildCount, nextInfantCount) {
  if (nextAdultCount < 1 || nextChildCount < 0 || nextInfantCount < 0) {
    return false;
  }

  if (nextAdultCount + nextChildCount + nextInfantCount > 9) {
    return false;
  }

  if (nextInfantCount > nextAdultCount) {
    return false;
  }

  return true;
}

export function appendPassengerParams(params, adultCount, childCount, infantCount) {
  const counts = normalizePassengerCounts(adultCount, childCount, infantCount);

  params.set("adultCount", String(counts.adultCount));
  params.set("childCount", String(counts.childCount));
  params.set("infantCount", String(counts.infantCount));
}