export function getCurrentParams() {
  return new URLSearchParams(window.location.search);
}

export function replaceQueryParam(key, value) {
  const url = new URL(window.location.href);

  if (value === null || value === undefined || value === "") {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, value);
  }

  window.history.replaceState({}, "", url);
}

export function moveTo(path, params) {
  const queryString = params instanceof URLSearchParams
    ? params.toString()
    : new URLSearchParams(params).toString();

  window.location.href = queryString ? `${path}?${queryString}` : path;
}