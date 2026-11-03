import { useMemo, useState } from 'react'
import { W, H, buildWall, paintWall } from '../lib/stoneWall'

// 내 돌담(돌벽 채우기): 명소를 다녀올 때마다 벽의 빈 구멍이 돌로 채워진다
export default function StoneFillWall({ spots, kinds, visited }) {
  const wall = useMemo(() => buildWall(spots.length || 14), [spots.length])
  const painted = useMemo(() => paintWall(wall, spots, kinds, visited), [wall, spots, kinds, visited])
  const [hover, setHover] = useState(null)
  const order = useMemo(() => { let c = 0; return spots.map((s) => (visited.has(s.id) ? c++ : 0)) }, [spots, visited])
  const colorOf = (s) => kinds.find((k) => k.id === s.kind)?.color ?? '#5f7f3e'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="stonefill" role="img" aria-label="내 돌담 돌벽">
      <rect width={W} height={H} fill="#2b2f32" />
      {painted.map((c) => (
        <polygon key={c.idx} points={c.poly.map((p) => p.join(',')).join(' ')} fill={c.fill} stroke={c.fill} strokeWidth="4" strokeLinejoin="round"
          className={`st ${c.filled ? 'on' : 'off'} ${hover === c.region ? 'hv' : ''}`}
          style={c.filled ? { animationDelay: `${order[c.region] * 0.35 + (c.idx % 7) * 0.05}s` } : undefined}
          onMouseEnter={() => setHover(c.region)} onMouseLeave={() => setHover(null)}>
          <title>{spots[c.region]?.name}</title>
        </polygon>
      ))}
      {wall.centers.map(([x, y], i) => spots[i] && (
        <g key={spots[i].id} pointerEvents="none">
          <circle cx={x} cy={y} r="17" fill={visited.has(spots[i].id) ? colorOf(spots[i]) : '#2b2f32'} stroke="#fff" strokeWidth="2.5" opacity={visited.has(spots[i].id) ? 1 : 0.85} />
          <text x={x} y={y + 5.5} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">{i + 1}</text>
        </g>
      ))}
    </svg>
  )
}
