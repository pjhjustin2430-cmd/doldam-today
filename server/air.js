// ③ 한국환경공단 에어코리아 — 제주 측정소 실시간 미세먼지
import { memo } from './cache.js'
import { fetchJson, toList } from './http.js'

const GRADE = { 1: '좋음', 2: '보통', 3: '나쁨', 4: '매우나쁨' }

export const getAirQuality = () => memo('air', 20 * 60e3, fetchAir)

async function fetchAir() {
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, returnType: 'json', numOfRows: '100', pageNo: '1',
    sidoName: '제주', ver: '1.0',
  })
  const data = await fetchJson(`https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?${params}`, '에어코리아')
  const list = toList(data?.response?.body?.items)
  if (!list.length) throw new Error('에어코리아: 측정소 값이 비어 있어요') // 빈 값은 캐시하지 않는다
  return list.slice(0, 8).map((s) => ({
    station: s.stationName, pm10: Number(s.pm10Value), pm25: Number(s.pm25Value),
    grade: GRADE[s.pm10Grade] ?? '정보없음', gradeNo: Number(s.pm10Grade) || 0, time: s.dataTime,
  }))
}
