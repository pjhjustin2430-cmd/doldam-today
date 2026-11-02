// ③ 한국환경공단 에어코리아 — 제주 측정소 실시간 미세먼지 (실측)
//    호출 한도 초과나 장애로 실패하면 Open-Meteo 대기질(CAMS 모델 추정값, 키 없음)로 대신한다.
//    대체 값에는 estimated: true 가 붙어서 화면과 에이전트가 "모델 추정"이라고 밝힌다.
import { memo } from './cache.js'
import { fetchJson, toList } from './http.js'

const GRADE = { 1: '좋음', 2: '보통', 3: '나쁨', 4: '매우나쁨' }
const pm10Grade = (v) => (v <= 30 ? 1 : v <= 80 ? 2 : v <= 150 ? 3 : 4) // 환경부 PM10 등급 기준

let primaryDownUntil = 0 // 에어코리아가 막혀 있으면 한동안 다시 부르지 않는다 (한도를 더 쓰지 않으려고)

export const getAirQuality = () => memo('air', 20 * 60e3, async () => {
  if (Date.now() >= primaryDownUntil) {
    try { return await fetchAirKorea() } catch (e) {
      primaryDownUntil = Date.now() + (/LIMITED_NUMBER/.test(e.message) ? 60 : 5) * 60e3 // 한도 초과는 1시간, 그 밖의 오류는 5분
    }
  }
  return fetchOpenMeteo()
})

async function fetchAirKorea() {
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
    source: '에어코리아', estimated: false,
  }))
}

// Open-Meteo 대기질: 제주시·서귀포시 두 지점의 현재 PM10·PM2.5 (모델 추정)
const PLACES = [['제주시', 33.5, 126.53], ['서귀포시', 33.25, 126.56]]
async function fetchOpenMeteo() {
  const q = new URLSearchParams({
    latitude: PLACES.map((p) => p[1]).join(','), longitude: PLACES.map((p) => p[2]).join(','),
    current: 'pm10,pm2_5', timezone: 'Asia/Seoul',
  })
  const r = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}`, { signal: AbortSignal.timeout(10000) })
  if (!r.ok) throw new Error(`미세먼지: 에어코리아가 막혀 있고 Open-Meteo 도 ${r.status} 를 돌려줬어요`)
  const out = [].concat(await r.json()).map((d, i) => {
    const pm10 = Number(d.current?.pm10), pm25 = Number(d.current?.pm2_5)
    if (!Number.isFinite(pm10)) return null
    const g = pm10Grade(pm10)
    return {
      station: `${PLACES[i][0]} (모델 추정)`, pm10: Math.round(pm10), pm25: Number.isFinite(pm25) ? Math.round(pm25) : null,
      grade: GRADE[g], gradeNo: g, time: String(d.current.time).replace('T', ' '), source: 'Open-Meteo(CAMS 모델)', estimated: true,
    }
  }).filter(Boolean)
  if (!out.length) throw new Error('미세먼지: 에어코리아가 막혀 있고 Open-Meteo 값도 비어 있어요')
  return out
}
