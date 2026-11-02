import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 홈 지도: 실제 지도(OpenStreetMap) 위에 돌담 명소 번호 핀. 이름은 지도 위에 올리지 않고 아래 목록에 둬서 겹치지 않는다.
// 핀과 목록은 서로 연결된다 (목록에 마우스를 올리면 핀이 커지고, 핀을 누르면 작은 설명이 뜬다).
export default function IslandMapReal({ spots, kinds, onPick, activeId }) {
  const box = useRef(null)
  const map = useRef(null)
  const pins = useRef({})
  const [hover, setHover] = useState(null)
  const color = (s) => kinds.find((k) => k.id === s.kind)?.color ?? '#5f7f3e'
  const on = hover ?? activeId

  useEffect(() => {
    const m = L.map(box.current, { scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false, zoomControl: true, attributionControl: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(m)
    map.current = m
    const bounds = L.latLngBounds(spots.map((s) => [s.lat, s.lng]))
    const fit = () => { m.invalidateSize(); m.fitBounds(bounds, { padding: [34, 34], maxZoom: 11 }) }
    fit()
    const ro = new ResizeObserver((es) => { if (es[0].contentRect.width > 0) fit() })
    ro.observe(box.current)

    pins.current = {}
    spots.forEach((s, i) => {
      const mk = L.marker([s.lat, s.lng], {
        icon: L.divIcon({ className: '', html: `<span class="hm-pin" style="--kc:${color(s)}">${i + 1}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
        title: s.name, keyboard: true,
      }).addTo(m)
      const el = document.createElement('div')
      el.className = 'hm-pop'
      el.innerHTML = `<b></b><small></small><button type="button">자세히 보기</button>`
      el.querySelector('b').textContent = s.name
      el.querySelector('small').textContent = s.area ?? ''
      el.querySelector('button').onclick = () => onPick(s)
      mk.bindPopup(el, { closeButton: false, offset: [0, -10] })
      mk.on('mouseover', () => setHover(s.id)).on('mouseout', () => setHover(null))
      pins.current[s.id] = mk
    })
    return () => { ro.disconnect(); try { m.remove() } catch { /* 이미 정리됨 */ } map.current = null }
  }, [spots, kinds]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Object.entries(pins.current).forEach(([id, mk]) => {
      mk.getElement()?.classList.toggle('hm-on', id === on)
      mk.setZIndexOffset(id === on ? 1000 : 0)
    })
  }, [on])

  return (
    <div className="home-map">
      <div className="spot-map leaflet-wrap"><div ref={box} className="hm-box" role="application" aria-label="제주 돌담 명소 지도" /></div>
      <ol className="hm-list">
        {spots.map((s, i) => (
          <li key={s.id}>
            <button type="button" className={on === s.id ? 'on' : ''} onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(s.id)} onBlur={() => setHover(null)} onClick={() => onPick(s)}>
              <span className="hm-no" style={{ '--kc': color(s) }}>{i + 1}</span>{s.label ?? s.name}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
