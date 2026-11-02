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

// 이름표를 점 바로 옆에 둔다 (선으로 잇지 않는다). 점에서 가까운 자리부터 후보를 훑어,
// 이미 놓은 이름표·다른 점과 겹치지 않고 지도 안에 들어가는 첫 자리를 고른다.
export function layoutNear(spots, view = { x0: -58, x1: 58, y0: -36, y1: 36 }) {
  const H = 4.4, DOT = 1.9
  const width = (s) => s.label.length * 2.15 + 5.5
  const dots = spots.map((s) => ({ s, dot: px(s.lat, s.lng) }))
  const placed = [{ x0: -17, x1: 17, y0: -4.5, y1: 11 }] // 가운데 "돌담 N곳" 글자 자리는 비워 둔다
  const free = (c) => {
    if (c.x0 < view.x0 || c.x1 > view.x1 || c.y0 < view.y0 || c.y1 > view.y1) return false
    if (placed.some((p) => c.x0 < p.x1 + 0.5 && c.x1 > p.x0 - 0.5 && c.y0 < p.y1 + 0.4 && c.y1 > p.y0 - 0.4)) return false
    return !dots.some(({ dot: [dx, dy] }) => dx > c.x0 - DOT && dx < c.x1 + DOT && dy > c.y0 - DOT && dy < c.y1 + DOT)
  }
  // 점이 몰린 곳(이웃이 많은 점)부터 자리를 잡는다
  const order = [...dots].sort((a, b) => {
    const n = (p) => dots.filter((q) => Math.hypot(q.dot[0] - p.dot[0], q.dot[1] - p.dot[1]) < 14).length
    return n(b) - n(a)
  })
  const out = new Map()
  for (const it of order) {
    const [x, y] = it.dot, w = width(it.s)
    let best = null
    for (let r = 2.2; r < 30 && !best; r += 1.6) {
      const cands = [
        [x + DOT + r + w / 2, y], [x - DOT - r - w / 2, y], [x, y - DOT - r - H / 2], [x, y + DOT + r + H / 2],
        [x + (DOT + r) * 0.8 + w / 2, y - (DOT + r) * 0.8 - H / 2], [x - (DOT + r) * 0.8 - w / 2, y - (DOT + r) * 0.8 - H / 2],
        [x + (DOT + r) * 0.8 + w / 2, y + (DOT + r) * 0.8 + H / 2], [x - (DOT + r) * 0.8 - w / 2, y + (DOT + r) * 0.8 + H / 2],
      ]
      for (const [cx, cy] of cands) {
        const c = { x0: cx - w / 2, x1: cx + w / 2, y0: cy - H / 2, y1: cy + H / 2 }
        if (free(c)) { best = { c, pos: [cx, cy] }; break }
      }
    }
    if (!best) best = { c: { x0: x, x1: x + w, y0: y, y1: y + H }, pos: [x + w / 2 + DOT, y] }
    placed.push(best.c)
    out.set(it.s.id, { s: it.s, dot: it.dot, pos: best.pos })
  }
  return dots.map((d) => out.get(d.s.id))
}
