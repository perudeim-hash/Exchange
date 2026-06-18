export async function fetchJson(url, errorMessage = "요청 처리에 실패했습니다.") {
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || errorMessage);
  }

  return await response.json();
}