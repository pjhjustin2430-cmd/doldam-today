import { Delaunay } from 'd3-delaunay'

// 돌벽 채우기: 모양이 제각각인 돌 98개를 틈 없이 맞춰 쌓은 벽(보로노이 분할). 명소 하나 = 이웃한 돌 7개 묶음.
// 다녀온 명소의 돌은 회색 화강암색(종류 색을 살짝 섞어) 채워지고, 아직 안 간 곳은 빈 구멍으로 남는다.
export const W = 1000, H = 500
const COLS = 14, ROWS = 7
const seeded = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647

export function buildWall(n) {
  const rnd = seeded(20261103)
  const pts = []
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) pts.push([(c + 0.5 + (rnd() - 0.5) * 0.85) * (W / COLS), (r + 0.5 + (rnd() - 0.5) * 0.85) * (H / ROWS)])
  const vor = Delaunay.from(pts).voronoi([0, 0, W, H])
  const perRow = Math.ceil(n / 2) // 명소 묶음 씨앗: 위아래 2줄로 늘어놓는다
  const seeds = Array.from({ length: n }, (_, i) => [((i % perRow) + 0.5) * (W / perRow), (Math.floor(i / perRow) + 0.5) * (H / 2)])
  const cells = pts.map((p, i) => {
    const poly = vor.cellPolygon(i).slice(0, -1)
    const cx = poly.reduce((a, q) => a + q[0], 0) / poly.length, cy = poly.reduce((a, q) => a + q[1], 0) / poly.length
    let region = 0, best = Infinity
    seeds.forEach((s, k) => { const d = (s[0] - cx) ** 2 + (s[1] - cy) ** 2; if (d < best) { best = d; region = k } })
    return { poly: poly.map(([x, y]) => [cx + (x - cx) * 0.9, cy + (y - cy) * 0.9]), cx, cy, region, tone: rnd(), warm: rnd(), idx: i }
  })
  const centers = seeds.map((_, k) => {
    const m = cells.filter((c) => c.region === k)
    return m.length ? [m.reduce((a, c) => a + c.cx, 0) / m.length, m.reduce((a, c) => a + c.cy, 0) / m.length] : seeds[k]
  })
  return { cells, centers }
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`

// 칸마다 그릴 색: 채운 돌은 회색 화강암(+종류 색 16%), 빈 칸은 어두운 구멍
export function paintWall(wall, spots, kinds, visited) {
  const colorOf = (s) => hex(kinds.find((k) => k.id === s.kind)?.color ?? '#5f7f3e')
  return wall.cells.map((c) => {
    const s = spots[c.region]
    const filled = Boolean(s && visited.has(s.id))
    let fill = '#4d5256'
    if (filled) {
      const l = 118 + Math.round(c.tone * 100) // 밝은 돌·어두운 돌이 섞이게
      const base = [l + Math.round(c.warm * 10), l, l - Math.round(c.warm * 8)]
      fill = css(mix(base, colorOf(s), 0.16))
    }
    return { ...c, filled, fill }
  })
}

// 공유 이미지용: 같은 벽을 캔버스에 그린다
export function drawWall(ctx, painted, x0, y0, w, h) {
  const k = w / W
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip()
  ctx.fillStyle = '#2b2f32'; ctx.fillRect(x0, y0, w, h)
  ctx.lineJoin = 'round'
  painted.forEach((c) => {
    ctx.beginPath()
    c.poly.forEach(([x, y], i) => (i ? ctx.lineTo(x0 + x * k, y0 + y * k) : ctx.moveTo(x0 + x * k, y0 + y * k)))
    ctx.closePath()
    ctx.fillStyle = c.fill; ctx.strokeStyle = c.fill; ctx.lineWidth = 4 * k
    ctx.globalAlpha = c.filled ? 1 : 0.55
    ctx.fill(); ctx.stroke()
    ctx.globalAlpha = 1
  })
  ctx.restore()
}
