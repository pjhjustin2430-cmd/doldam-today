import { useMemo, useState } from 'react'
import { COAST_PATH, ISLET_PATHS, layoutNear } from '../lib/mapGeom'

// 제주 전체 일러스트 지도: 현무암색 섬 위에 돌담 명소를 점으로 찍고, 이름표를 점 바로 옆에 겹치지 않게 둔다 (선으로 잇지 않는다)
export default function IslandMap2D({ spots, kinds, onPick, activeId }) {
  const labels = useMemo(() => layoutNear(spots), [spots])
  const color = (s) => kinds.find((k) => k.id === s.kind)?.color ?? '#888'
  const [hover, setHover] = useState(null)
  const on = hover ?? activeId

  return (
    <svg viewBox="-58 -36 116 72" className="island-map" role="img" aria-label="제주 돌담 명소 지도">
      <g className="sea-shadow" transform="translate(1.2 1.6)"><path d={COAST_PATH} />{ISLET_PATHS.map((d, i) => <path key={i} d={d} />)}</g>
      <path d={COAST_PATH} className="land" />
      {ISLET_PATHS.map((d, i) => <path key={i} d={d} className="land" />)}

      <text x="0" y="-1" textAnchor="middle" className="map-sub">바람 많은 섬이 쌓은</text>
      <text x="0" y="8" textAnchor="middle" className="map-big">돌담 {spots.length}곳</text>

      {labels.map(({ s, dot, pos }) => {
        const w = s.label.length * 2.15 + 5
        const c = color(s)
        return (
          <g key={s.id} className={`tag ${on === s.id ? 'on' : ''}`} role="button" tabIndex={0} aria-label={s.name}
            onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}
            onClick={() => onPick(s)} onKeyDown={(e) => e.key === 'Enter' && onPick(s)}>
            <circle cx={dot[0]} cy={dot[1]} r="1.15" className="dot" style={{ stroke: c }} />
            <rect x={pos[0] - w / 2} y={pos[1] - 2} width={w} height="4" rx="2" />
            <circle cx={pos[0] - w / 2 + 2} cy={pos[1]} r="0.8" fill={c} className="kc" />
            <text x={pos[0] + 1.1} y={pos[1] + 0.9} textAnchor="middle">{s.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
