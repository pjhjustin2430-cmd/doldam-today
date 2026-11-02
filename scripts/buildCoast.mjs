// 행정경계 GeoJSON(제주특별자치도) → src/data/jejuCoast.json(본섬) + jejuIslands.json(부속섬)
// 사용: node scripts/buildCoast.mjs <skorea_provinces_geo.json 경로>
import fs from 'fs'
const g = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const j = g.features.find((f) => f.properties.code === '39')
const polys = j.geometry.type === 'Polygon' ? [j.geometry.coordinates] : j.geometry.coordinates
const rings = polys.map((p) => p[0]).sort((a, b) => b.length - a.length)

const thin = (r, max) => {
  const step = Math.max(1, Math.floor(r.length / max))
  const out = r.filter((_, i) => i % step === 0).map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)])
  const [fx, fy] = out[0], [lx, ly] = out[out.length - 1]
  if (fx !== lx || fy !== ly) out.push(out[0])
  return out
}
const center = (r) => [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length]
const NAMED = [['우도', 126.95, 33.5], ['비양도', 126.23, 33.42], ['가파도', 126.27, 33.17], ['마라도', 126.27, 33.11], ['추자도', 126.3, 33.95]]
const name = (c) => NAMED.find(([, x, y]) => Math.hypot(c[0] - x, c[1] - y) < 0.12)?.[0] ?? '섬'

fs.writeFileSync('src/data/jejuCoast.json', JSON.stringify(thin(rings[0], 2600)))
const islands = rings.slice(1).filter((r) => r.length >= 40).map((r) => {
  const c = center(r)
  return { name: name(c), ring: thin(r, 220) }
})
fs.writeFileSync('src/data/jejuIslands.json', JSON.stringify(islands))
console.log('main', rings[0].length, '→', thin(rings[0], 2600).length, '| islands', islands.map((i) => `${i.name}(${i.ring.length})`).join(' '))
