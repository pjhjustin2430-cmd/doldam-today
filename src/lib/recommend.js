// 오늘의 추천 돌담: 기상청 예보(비·바람)와 에어코리아 미세먼지로 얻은 걷기 적합도(fit)를 지역별로 받아 점수를 매긴다.
// 바닷바람을 그대로 맞는 곳(환해장성·돌염전·진성·섬)은 바람이 센 날 점수를 깎고, 실내 전시가 있는 돌문화공원은 비 오는 날 올린다.
const EXPOSED = new Set(['hwanhae', 'salt', 'jinseong'])

export function recommend(spots, fits) {
  const today = new Date()
  const seed = today.getFullYear() * 400 + today.getMonth() * 31 + today.getDate() // 같은 날에는 같은 결과
  const scored = spots.map((s, i) => {
    const fit = fits[s.weather]
    if (!fit) return { s, score: -99 }
    const base = { success: 3, warning: 1, danger: -2 }[fit.variant] ?? 0
    const exposed = EXPOSED.has(s.kind) || s.island
    let score = base
    if (exposed && fit.wind >= 6) score -= 3
    if (exposed && fit.pop >= 30) score -= 1
    if (s.kind === 'park' && (fit.pop >= 30 || fit.variant === 'danger')) score += 3
    if (s.hasTrack) score += 0.3
    return { s, fit, score: score + ((seed * 7 + i * 13) % 10) / 10 } // 비슷한 점수끼리는 날짜로 돌려가며
  }).sort((a, b) => b.score - a.score)
  const top = scored[0]
  if (!top || top.score < -50) return null

  const { s, fit } = top
  const exposed = EXPOSED.has(s.kind) || s.island
  let reason
  if (fit.variant === 'danger') reason = `${s.weather}은 ${fit.reasons.join('·')}라 야외는 쉬어가는 날이에요. 그래도 간다면 실내 전시가 있는 이곳이 가장 무난해요.`
  else if (s.kind === 'park' && fit.pop >= 30) reason = `비 올 확률이 ${fit.pop}%예요. 박물관과 실내 전시가 있어서 비가 와도 둘러볼 수 있어요.`
  else if (!exposed && fit.wind >= 6) reason = `바람이 ${fit.wind}m/s로 센 편이에요. 바다 쪽 돌담은 피하고, 바람을 막아 주는 이런 곳이 좋아요.`
  else reason = `${s.weather} 비 ${fit.pop}% · 바람 ${fit.wind}m/s로 ${fit.label}. 오늘은 이곳을 걸어 보세요.`
  return { spot: s, fit, reason }
}
