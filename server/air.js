// ③ 한국환경공단 에어코리아 — 제주 측정소 실시간 미세먼지
import { fetchJson, toList } from './http.js'

const GRADE = { 1: '좋음', 2: '보통', 3: '나쁨', 4: '매우나쁨' }

export async function getAirQuality() {
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, returnType: 'json', numOfRows: '100', pageNo: '1',
    sidoName: '제주', ver: '1.0',
  })
  const data = await fetchJson(`https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?${params}`, '에어코리아')
  return toList(data?.response?.body?.items).slice(0, 8).map((s) => ({
    station: s.stationName, pm10: Number(s.pm10Value), pm25: Number(s.pm25Value),
    grade: GRADE[s.pm10Grade] ?? '정보없음', gradeNo: Number(s.pm10Grade) || 0, time: s.dataTime,
  }))
}
