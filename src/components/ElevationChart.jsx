import { useState } from 'react'
import { elevColor } from '../lib/elevationProfile'

const W = 800, H = 190, L = 44, R = 12, T = 14, B = 30

// 고도 프로필: 가로 = 걷는 거리(km), 세로 = 고도(m). 색은 지도 위 경로 색과 같다
export default function ElevationChart({ prof }) {
  const [hover, setHover] = useState(null)
  const dist = prof.total
  const lo = Math.floor((prof.min - 2) / 5) * 5
  const hi = Math.max(lo + 10, Math.ceil((prof.max + 2) / 5) * 5)
  const x = (km) => L + (km / dist) * (W - L - R)
  const y = (m) => T + (1 - (m - lo) / (hi - lo)) * (H - T - B)
  const s = prof.samples
  const col = (m) => elevColor(m, prof.min, prof.max)
  const line = s.map((p, i) => `${i ? 'L' : 'M'}${x(p.km).toFixed(1)} ${y(p.m).toFixed(1)}`).join('')
  const area = `${line}L${x(dist)} ${y(lo)}L${x(0)} ${y(lo)}Z`
  const ticks = [lo, Math.round((lo + hi) / 2), hi]
  const kms = [0, 0.25, 0.5, 0.75, 1].map((f) => +(f * dist).toFixed(2))
  const stop = Math.max(1, Math.floor(s.length / 24))
  const exact = prof.source === 'track'

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const km = Math.min(dist, Math.max(0, ((e.clientX - r.left) / r.width * W - L) / (W - L - R) * dist))
    setHover(s.reduce((best, p) => (Math.abs(p.km - km) < Math.abs(best.km - km) ? p : best), s[0]))
  }

  return (
    <div className="elev">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="고도 프로필" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="elev-fill" x1="0" x2="1">
            {s.filter((_, i) => i % stop === 0).map((p) => <stop key={p.km} offset={`${(p.km / dist) * 100}%`} stopColor={col(p.m)} stopOpacity=".35" />)}
          </linearGradient>
          <linearGradient id="elev-line" x1="0" x2="1">
            {s.filter((_, i) => i % stop === 0).map((p) => <stop key={p.km} offset={`${(p.km / dist) * 100}%`} stopColor={col(p.m)} />)}
          </linearGradient>
        </defs>
        {ticks.map((m) => (
          <g key={m}>
            <line x1={L} x2={W - R} y1={y(m)} y2={y(m)} className="grid" />
            <text x={L - 8} y={y(m) + 4} textAnchor="end" className="axis">{m}m</text>
          </g>
        ))}
        {kms.map((k) => <text key={k} x={x(k)} y={H - 8} textAnchor={k === 0 ? 'start' : k === kms[4] ? 'end' : 'middle'} className="axis">{k}km</text>)}
        <path d={area} fill="url(#elev-fill)" />
        <path d={line} fill="none" stroke="url(#elev-line)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {hover && (
          <g>
            <line x1={x(hover.km)} x2={x(hover.km)} y1={T} y2={H - B} className="cursor" />
            <circle cx={x(hover.km)} cy={y(hover.m)} r="5" fill="#fff" stroke={col(hover.m)} strokeWidth="3" />
            <text x={Math.min(x(hover.km) + 8, W - 100)} y={T + 12} className="tip">{hover.km.toFixed(2)}km · {exact ? '' : '약 '}{Math.round(hover.m)}m</text>
          </g>
        )}
      </svg>
      <div className="elev-stats">
        <span>최고 {exact ? '' : '약 '}<b>{Math.round(prof.max)}m</b></span>
        <span>최저 {exact ? '' : '약 '}<b>{Math.round(prof.min)}m</b></span>
        <span>누적 상승 {exact ? '' : '약 '}<b>{Math.round(prof.gain)}m</b></span>
        <span className="legend"><i /> 낮음 → 높음</span>
      </div>
    </div>
  )
}
