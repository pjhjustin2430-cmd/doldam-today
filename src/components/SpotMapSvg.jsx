import { COAST_PATH, ISLET_PATHS, pathPoints, px } from '../lib/mapGeom'
import { elevColor } from '../lib/elevationProfile'
import { kakaoPin } from '../lib/mapLinks'
import SvgText from './SvgText'

// 명소 주변 확대 지도: 해안선 위에 명소 핀, 실측 경로(고도 색), 경로 위 안내 지점, 주변 장소(번호)를 그린다.
// places 를 주면 그 장소들이 한눈에 들어오도록 범위가 넓어진다 (번호 마커 → 카카오맵)
export default function SpotMapSvg({ spot, kind, prof, places = [], dots = [] }) {
  const line = pathPoints(spot)
  const [cx0, cy0] = px(spot.lat, spot.lng)
  const near = places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)).map((p, i) => ({ ...p, n: i + 1, xy: px(p.lat, p.lng) }))
  const all = [[cx0, cy0], ...line, ...near.map((s) => s.xy)]
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const pad = Math.max(0.35, (maxX - minX + maxY - minY) * 0.18)
  let w = Math.max(1.6, maxX - minX + pad * 2), h = Math.max(1.6 / 1.9, maxY - minY + pad * 2)
  if (w / h < 1.9) w = h * 1.9
  else h = w / 1.9
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  const vb = [cx - w / 2, cy - h / 2, w, h]
  const u = w / 100 // 화면 크기에 비례하는 단위
  const color = kind?.color ?? '#5f7f3e'
  const bar = [0.1, 0.2, 0.5, 1, 2, 5, 10].find((k) => k / w >= 0.12) ?? 10 // 축척 막대(km)

  const seg = prof && prof.samples.slice(1).map((p, i) => {
    const [x1, y1] = px(prof.samples[i].lat, prof.samples[i].lng), [x2, y2] = px(p.lat, p.lng)
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={elevColor(p.m, prof.min, prof.max)} strokeWidth={u * 1.1} strokeLinecap="round" />
  })
  const d = line.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(3)} ${y.toFixed(3)}`).join('')

  return (
    <div className="spot-map">
      <svg viewBox={vb.join(' ')} role="img" aria-label={`${spot.name} 주변 지도`}>
        <rect x={vb[0]} y={vb[1]} width={w} height={h} className="sea" />
        <path d={COAST_PATH} className="land-mini" strokeWidth={u * 0.3} />
        {ISLET_PATHS.map((p, i) => <path key={i} d={p} className="land-mini" strokeWidth={u * 0.3} />)}
        {line.length > 1 && <path d={d} fill="none" stroke="#fff" strokeWidth={u * 1.9} strokeLinecap="round" strokeLinejoin="round" />}
        {line.length > 1 && (prof ? seg : <path d={d} fill="none" stroke={color} strokeWidth={u * 1.1} strokeLinecap="round" strokeLinejoin="round" />)}
        {dots.map((p, i) => {
          const [x, y] = px(p.lat, p.lng)
          return <circle key={i} cx={x} cy={y} r={u * 0.45} fill="#fff" stroke="#3a3f44" strokeWidth={u * 0.2}><title>{p.name}</title></circle>
        })}
        {near.map((s) => (
          <a key={s.id} href={kakaoPin(s.title, s.lat, s.lng)} target="_blank" rel="noreferrer" className="spot">
            <circle cx={s.xy[0]} cy={s.xy[1]} r={u * 1.8} fill="#fff" stroke="#c8963a" strokeWidth={u * 0.6} />
            <SvgText x={s.xy[0]} y={s.xy[1] + u * 0.8} size={u * 2.3} fontWeight="800" fill="#7a5410">{s.n}</SvgText>
            <title>{s.title}</title>
          </a>
        ))}
        <circle cx={cx0} cy={cy0} r={u * 2.1} fill={color} stroke="#fff" strokeWidth={u * 0.6} />
        <SvgText x={cx0} y={cy0 + u * 0.85} size={u * 2.1} fontWeight="800" fill="#fff">돌</SvgText>
        <g>
          <line x1={vb[0] + w - u * 4 - (bar / w) * 100 * u} x2={vb[0] + w - u * 4} y1={vb[1] + h - u * 4} y2={vb[1] + h - u * 4} stroke="#3a3f44" strokeWidth={u * 0.5} />
          <SvgText x={vb[0] + w - u * 4 - ((bar / w) * 100 * u) / 2} y={vb[1] + h - u * 5.3} size={u * 2.1} fill="#3a3f44" fontWeight="700">{bar >= 1 ? `${bar}km` : `${bar * 1000}m`}</SvgText>
        </g>
      </svg>
    </div>
  )
}
