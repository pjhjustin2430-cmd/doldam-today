import coast from '../data/jejuCoast.json'
import islands from '../data/jejuIslands.json'

// 위·경도 → km 좌표 (제주 중심 기준, y 는 아래로 증가). 2D SVG 지도에서 공통으로 쓴다
export const px = (lat, lng) => [(lng - 126.55) * 92.6, (33.38 - lat) * 111]

const toPath = (ring) => ring.map(([lng, lat], i) => { const [x, y] = px(lat, lng); return `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}` }).join('') + 'Z'

export const COAST_PATH = toPath(coast)
// 추자도(북위 33.9 부근)는 본섬 지도 범위 밖이라 제외
export const ISLET_PATHS = islands.filter((i) => i.ring[0][1] < 33.7).map((i) => toPath(i.ring))

// 실측 경로가 있는 명소의 선 (km 좌표)
export const pathPoints = (spot) => (spot.path ?? []).map(([lat, lng]) => px(lat, lng))
export const pathD = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(3)} ${y.toFixed(3)}`).join('')

// 섬 둘레에 명소 이름표를 겹치지 않게 배치한다 (이름표 위치 pos, 실제 위치 dot)
export function layoutLabels(spots) {
  const A = 47, B = 29, H = 4.8
  const width = (s) => s.label.length * 2.15 + 5.5 // IslandMap2D 의 이름표 폭과 같은 식
  const items = spots.map((s) => {
    const [x, y] = px(s.lat, s.lng)
    return { s, dot: [x, y], t: Math.atan2(y / 17, x / 36) }
  }).sort((a, b) => a.t - b.t)
  // 이름표 사각형이 겹치는 쌍을 타원을 따라 서로 반대 방향으로 조금씩 밀어낸다 (겹침이 없어질 때까지)
  const at = (it) => [A * Math.cos(it.t), B * Math.sin(it.t)]
  for (let k = 0; k < 4000; k++) {
    let moved = false
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j], pa = at(a), pb = at(b)
        const hit = Math.abs(pa[0] - pb[0]) < (width(a.s) + width(b.s)) / 2 + 0.8 && Math.abs(pa[1] - pb[1]) < H + 0.4
        if (!hit) continue
        const d = ((b.t - a.t + 3 * Math.PI) % (2 * Math.PI)) - Math.PI, dir = d >= 0 ? 1 : -1
        a.t -= dir * 0.01; b.t += dir * 0.01; moved = true
      }
    }
    if (!moved) break
  }
  return items.map((it) => ({ ...it, pos: [A * Math.cos(it.t), B * Math.sin(it.t)] }))
}
