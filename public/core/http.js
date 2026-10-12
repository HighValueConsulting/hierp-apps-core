export async function requestJson(url, options = {}) {
  const response = await fetch(url, { cache: "no-store", ...options });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("서버 응답 형식을 확인하지 못했습니다.");
  }
  if (!response.ok)
    throw new Error(result.message || `조회 실패 (${response.status})`);
  return result;
}
export function postJson(url, input, signal) {
  return requestJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
}
