const km = (a, b) => Math.hypot((a[0] - b[0]) * 111, (a[1] - b[1]) * 92.6)

// 낮음(청록) → 중간(이끼) → 높음(황토) → 가장 높음(벽돌색). 구간 안에서의 상대 높이로 색을 정한다
const STOPS = [[47, 154, 160], [143, 168, 74], [200, 150, 58], [181, 72, 47]]
export function elevColor(m, min, max) {
  const t = max - min < 1 ? 0 : Math.min(1, Math.max(0, (m - min) / (max - min))) * (STOPS.length - 1)
  const k = Math.min(STOPS.length - 2, Math.floor(t)), f = t - k
  return `rgb(${STOPS[k].map((v, i) => Math.round(v + (STOPS[k + 1][i] - v) * f)).join(',')})`
}

// 경로를 거리 기준으로 n개 지점으로 나눈다 (lat, lng, 누적 km)
function sample(path, n) {
  const cum = [0]
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + km(path[i - 1], path[i]))
  const total = cum[cum.length - 1] || 1
  return Array.from({ length: n }, (_, s) => {
    const d = (s / (n - 1)) * total
    let i = 1
    while (i < cum.length - 1 && cum[i] < d) i++
    const span = cum[i] - cum[i - 1] || 1, t = Math.min(1, Math.max(0, (d - cum[i - 1]) / span))
    return { lat: path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, lng: path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t, km: d }
  })
}

// 3점 이동평균 + 최고·최저·누적 상승 계산
function summarize(points, source) {
  const n = points.length
  const samples = points.map((p, i) => ({ ...p, m: (points[Math.max(0, i - 1)].m + p.m + points[Math.min(n - 1, i + 1)].m) / 3 }))
  let gain = 0
  for (let i = 1; i < n; i++) gain += Math.max(0, samples[i].m - samples[i - 1].m)
  const ms = samples.map((s) => s.m)
  return { samples, min: Math.min(...ms), max: Math.max(...ms), gain, total: samples[n - 1].km, source }
}

// 경로 파일(CSV)에 고도가 들어 있는 명소(돌문화공원): 실측 고도 그대로 사용
export function trackProfile(spot) {
  const pts = spot.path.map((p) => ({ lat: p[0], lng: p[1], m: p[2], km: 0 }))
  for (let i = 1; i < pts.length; i++) pts[i].km = pts[i - 1].km + km([pts[i - 1].lat, pts[i - 1].lng], [pts[i].lat, pts[i].lng])
  return summarize(pts, 'track')
}

// 고도가 없는 경로(감수굴밭담길): Open-Meteo Elevation API(Copernicus DEM 90m)에서 받는다. 키 불필요, 한 번에 최대 100개 좌표
export async function demProfile(spot) {
  const pts = sample(spot.path, 40)
  const q = new URLSearchParams({ latitude: pts.map((p) => p.lat.toFixed(5)).join(','), longitude: pts.map((p) => p.lng.toFixed(5)).join(',') })
  const r = await fetch(`https://api.open-meteo.com/v1/elevation?${q}`)
  if (!r.ok) throw new Error(`고도 API ${r.status}`)
  const { elevation: ms } = await r.json()
  if (!Array.isArray(ms) || ms.length !== pts.length) throw new Error('고도 응답 형식이 달라요')
  return summarize(pts.map((p, i) => ({ ...p, m: Math.max(0, ms[i]) })), 'dem')
}

export const loadProfile = (spot) => (spot.path?.[0]?.length === 3 ? Promise.resolve(trackProfile(spot)) : demProfile(spot))
