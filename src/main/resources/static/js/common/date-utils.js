export function getTodayText() {
  return formatDateInputValue(new Date());
}

export function addDays(dateValue, days) {
  const date = toDate(dateValue);
  date.setDate(date.getDate() + days);

  return formatDateInputValue(date);
}

export function formatDateInputValue(dateValue) {
  const date = toDate(dateValue);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateDot(dateText) {
  if (!dateText) {
    return "-";
  }

  return String(dateText).replaceAll("-", ".");
}

function toDate(dateValue) {
  if (dateValue instanceof Date) {
    return new Date(dateValue);
  }

  if (typeof dateValue === "string") {
    return new Date(`${dateValue}T00:00:00`);
  }

  return new Date();
}