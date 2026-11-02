// 날씨(기상청 8개 시간대)와 미세먼지(에어코리아)로 걷기 적합도를 판단한다
export function walkability(slots = [], air = []) {
  if (!slots.length) return null
  const pop = Math.max(...slots.map((s) => s.pop || 0))
  const wind = Math.max(...slots.map((s) => s.wind || 0))
  const pm = Math.max(0, ...air.map((a) => a.gradeNo || 0))
  const reasons = []
  if (pop >= 60) reasons.push(`비 ${pop}%`)
  if (wind >= 9) reasons.push(`강풍 ${wind}m/s`)
  if (pm >= 3) reasons.push('미세먼지 나쁨')
  if (reasons.length) return { label: '쉬어가요', variant: 'danger', reasons, pop, wind }
  if (pop >= 30 || wind >= 6) return { label: '주의', variant: 'warning', reasons: [`비 ${pop}%`, `바람 ${wind}m/s`], pop, wind }
  return { label: '걷기 좋아요', variant: 'success', reasons: [`비 ${pop}%`, `바람 ${wind}m/s`], pop, wind }
}

