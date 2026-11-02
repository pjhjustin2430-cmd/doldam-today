// 공공데이터 응답을 JSON으로 안전하게 읽는 공용 함수
export async function fetchJson(url, label) {
  const text = await (await fetch(url)).text()
  let data
  try { data = JSON.parse(text) }
  catch { throw new Error(`${label} 응답이 JSON이 아님: ${text.slice(0, 120)}`) }
  const bad = data?.OpenAPI_ServiceResponse?.cmmMsgHeader // 공공데이터포털 공통 오류 형식
  if (bad) throw new Error(`${label}: ${bad.errMsg}${bad.returnAuthMsg ? ' (' + bad.returnAuthMsg + ')' : ''}`)
  return data
}
export const toList = (item) => (!item ? [] : Array.isArray(item) ? item : [item])
