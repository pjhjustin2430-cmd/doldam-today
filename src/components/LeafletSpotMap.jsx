import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { elevColor } from '../lib/elevationProfile'
import { kakaoPin } from '../lib/mapLinks'

// 실제 지도(OpenStreetMap, 키 필요 없음) 위에 명소 핀, 실측 경로(고도 색), 경로 위 안내 지점, 주변 장소(번호)를 올린다.
// 오른쪽 위에서 "지도 / 위성" 전환 (위성: Esri World Imagery — 밭담과 돌담이 실제로 보인다).
// NaverSpotMap 과 같은 props. 네이버 지도 키가 없을 때의 기본 지도다.
export default function LeafletSpotMap({ spot, kind, prof, places = [], dots = [] }) {
  const box = useRef(null)
  const map = useRef(null)
  const [ready, setReady] = useState(false)
  const color = kind?.color ?? '#5f7f3e'

  // 1) 지도는 명소가 바뀔 때만 새로 만든다
  useEffect(() => {
    const m = L.map(box.current, {
      scrollWheelZoom: false, // 페이지를 내리다가 지도에 걸려 멈추지 않게 (확대는 + − 버튼이나 두 손가락)
      dragging: !L.Browser.mobile, // 휴대폰에서는 한 손가락 스크롤이 페이지로 간다
      tap: false,
    }).setView([spot.lat, spot.lng], 16)
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(m)
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, maxNativeZoom: 18, attribution: '위성 © Esri, Maxar, Earthstar Geographics',
    })
    L.control.layers({ '지도': osm, '위성': sat }, {}, { position: 'topright', collapsed: false }).addTo(m)
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(m)
    map.current = m
    setReady(true)
    // 탭 안처럼 숨겨진 채 만들어진 지도는 보이는 순간 크기가 정해진다 → 크기가 바뀌면 다시 재고 표시 범위도 다시 맞춘다
    const ro = new ResizeObserver((es) => { if (es[0].contentRect.width > 0) { m.invalidateSize(); m._fit?.() } })
    ro.observe(box.current)
    return () => {
      ro.disconnect()
      try { m.remove() } catch { /* 이미 정리됨 */ }
      map.current = null
      setReady(false)
    }
  }, [spot.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 2) 지도 위 표시는 경로·고도·주변 장소가 바뀔 때마다 다시 그린다
  useEffect(() => {
    if (!ready || !map.current) return undefined
    const m = map.current
    const g = L.layerGroup().addTo(m)
    const bounds = L.latLngBounds([[spot.lat, spot.lng]])

    const path = (spot.path ?? []).map(([lat, lng]) => [lat, lng])
    path.forEach((p) => bounds.extend(p))
    if (path.length > 1) {
      L.polyline(path, { color: '#ffffff', weight: 10, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(g)
      if (prof) {
        prof.samples.slice(1).forEach((p, i) => {
          const a = prof.samples[i]
          L.polyline([[a.lat, a.lng], [p.lat, p.lng]], { color: elevColor(p.m, prof.min, prof.max), weight: 6, lineCap: 'round' }).addTo(g)
        })
      } else {
        L.polyline(path, { color, weight: 6, lineCap: 'round', lineJoin: 'round' }).addTo(g)
      }
    }

    dots.forEach((d) => L.circleMarker([d.lat, d.lng], { radius: 4.5, color: '#3a3f44', weight: 2, fillColor: '#fff', fillOpacity: 1 }).bindTooltip(d.name).addTo(g))

    places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)).forEach((p, i) => {
      bounds.extend([p.lat, p.lng])
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({ className: '', html: `<span class="nv-num">${i + 1}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] }),
        zIndexOffset: 500, title: p.title,
      }).on('click', () => window.open(kakaoPin(p.title, p.lat, p.lng), '_blank', 'noopener')).addTo(g)
    })

    L.marker([spot.lat, spot.lng], {
      icon: L.divIcon({ className: '', html: `<span class="nv-pin" style="--kc:${color}">돌</span>`, iconSize: [32, 32], iconAnchor: [16, 16] }),
      zIndexOffset: 1000, title: spot.name,
    }).addTo(g)

    const fit = () => {
      if (bounds.getSouthWest().distanceTo(bounds.getNorthEast()) > 30) m.fitBounds(bounds, { padding: [48, 48], maxZoom: 18 })
      else m.setView([spot.lat, spot.lng], 17)
    }
    m._fit = fit
    fit()

    return () => { m._fit = null; g.remove() }
  }, [ready, spot, prof, places, dots, color])

  return <div className="spot-map leaflet-wrap"><div ref={box} className="naver-box" role="application" aria-label={`${spot.name} 지도`} /></div>
}
