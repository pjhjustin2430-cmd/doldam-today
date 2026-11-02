// 공공데이터 응답을 JSON으로 안전하게 읽는 공용 함수
export async function fetchJson(url, label) {
  const text = await (await fetch(url)).text()
  try { return JSON.parse(text) }
  catch { throw new Error(`${label} 응답이 JSON이 아님: ${text.slice(0, 120)}`) }
}
export const toList = (item) => (!item ? [] : Array.isArray(item) ? item : [item])
