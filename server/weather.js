// ② 기상청 단기예보 — 물질(바다 작업) 나가도 되는 날인지 가늠하는 용도
import { memo } from './cache.js'
import { fetchJson, toList } from './http.js'
const BASE = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'
const GRID = { '제주시': [53, 38], '서귀포시': [52, 33] }
const SKY = { 1: '맑음', 3: '구름많음', 4: '흐림' }
const PTY = { 0: '없음', 1: '비', 2: '비/눈', 3: '눈', 4: '소나기' }

// 발표시각 02·05·08·11·14·17·20·23시, 발표 후 15분 여유
function baseDateTime() {
  const kst = new Date(Date.now() + 9 * 3600e3 - 15 * 60e3)
  let h = [23, 20, 17, 14, 11, 8, 5, 2].find((x) => x <= kst.getUTCHours())
  let day = kst
  if (h === undefined) { day = new Date(kst.getTime() - 24 * 3600e3); h = 23 }
  return { base_date: day.toISOString().slice(0, 10).replaceAll('-', ''), base_time: String(h).padStart(2, '0') + '00' }
}

export const getWeather = ({ place = '서귀포시' } = {}) => memo(`weather:${place}`, 10 * 60e3, () => fetchWeather(place))

async function fetchWeather(place) {
  const [nx, ny] = GRID[place] ?? GRID['서귀포시']
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, dataType: 'JSON', numOfRows: '300', pageNo: '1',
    nx: String(nx), ny: String(ny), ...baseDateTime(),
  })
  const data = await fetchJson(`${BASE}?${params}`, '기상청')
  const slots = {}
  for (const it of toList(data?.response?.body?.items?.item)) {
    (slots[`${it.fcstDate} ${it.fcstTime}`] ??= {})[it.category] = it.fcstValue
  }
  return Object.entries(slots).slice(0, 8).map(([time, v]) => ({
    place, time, temp: Number(v.TMP), sky: SKY[v.SKY] ?? v.SKY, rain: PTY[v.PTY] ?? v.PTY,
    pop: Number(v.POP), wind: Number(v.WSD),
  }))
}
