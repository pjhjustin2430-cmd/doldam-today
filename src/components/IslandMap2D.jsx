import { useEffect, useMemo, useState } from 'react'
import { COAST_PATH, ISLET_PATHS, layoutNear } from '../lib/mapGeom'

// 제주 전체 일러스트 지도: 현무암색 섬 위에 돌담 명소를 점으로 찍고, 이름표를 점 바로 옆에 겹치지 않게 둔다 (선으로 잇지 않는다)
export default function IslandMap2D({ spots, kinds, onPick, activeId }) {
  const k = useLabelScale()
  const labels = useMemo(() => layoutNear(spots, undefined, k), [spots, k])
  const color = (s) => kinds.find((k) => k.id === s.kind)?.color ?? '#888'
  const [hover, setHover] = useState(null)
  const on = hover ?? activeId

  return (
    <>
    <svg viewBox="-58 -36 116 72" className="island-map" role="img" aria-label="제주 돌담 명소 지도">
      <g className="sea-shadow" transform="translate(1.2 1.6)"><path d={COAST_PATH} />{ISLET_PATHS.map((d, i) => <path key={i} d={d} />)}</g>
      <path d={COAST_PATH} className="land" />
      {ISLET_PATHS.map((d, i) => <path key={i} d={d} className="land" />)}

      <text x="0" y="-1" textAnchor="middle" className="map-sub">바람 많은 섬이 쌓은</text>
      <text x="0" y="8" textAnchor="middle" className="map-big">돌담 {spots.length}곳</text>

      {labels.map(({ s, dot, pos }) => {
        const w = (s.label.length * 2.15 + 5) * k
        const c = color(s)
        return (
          <g key={s.id} className={`tag ${on === s.id ? 'on' : ''}`} role="button" tabIndex={0} aria-label={s.name}
            onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}
            onClick={() => onPick(s)} onKeyDown={(e) => e.key === 'Enter' && onPick(s)}>
            <circle cx={dot[0]} cy={dot[1]} r="1.3" className="dot" style={{ fill: c }} />
            <rect x={pos[0] - w / 2} y={pos[1] - 2 * k} width={w} height={4 * k} rx={2 * k} style={{ fill: c }} />
            <text x={pos[0]} y={pos[1] + 0.9 * k} textAnchor="middle" style={{ fontSize: `${2.3 * k}px` }}>{s.label}</text>
          </g>
        )
      })}
    </svg>
      <ul className="kind-legend" aria-label="돌담 종류 색">
        {kinds.filter((k) => spots.some((s) => s.kind === k.id)).map((k) => <li key={k.id}><i style={{ background: k.color }} />{k.name}</li>)}
      </ul>
    </>
  )
}

// 화면이 좁으면(휴대폰) 지도 전체가 작게 그려져서 이름표를 1.45배로 키운다
function useLabelScale() {
  const pick = () => (typeof window !== 'undefined' && window.innerWidth < 576 ? 1.45 : 1)
  const [k, setK] = useState(pick)
  useEffect(() => {
    const on = () => setK(pick())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return k
}
