import { useEffect, useRef, useState } from 'react'
import { elevColor } from '../lib/elevationProfile'
import { loadNaverMaps } from '../lib/naverMaps'
import { naverSearch } from '../lib/mapLinks'

// 네이버 지도 버전의 명소 지도: 실제 지도(일반·위성)에 명소 핀, 실측 경로(고도 색), 경로 위 안내 지점, 주변 장소(번호)를 올린다.
// SpotMapSvg 와 같은 props 를 받는다. 키가 없거나 인증에 실패하면 onFail 로 SVG 지도로 바꾼다.
export default function NaverSpotMap({ spot, kind, prof, places = [], dots = [], onFail }) {
  const box = useRef(null)
  const map = useRef(null)
  const [ready, setReady] = useState(false)
  const color = kind?.color ?? '#5f7f3e'

  // 1) 지도는 명소가 바뀔 때만 새로 만든다
  useEffect(() => {
    let dead = false
    const fail = () => !dead && onFail()
    window.addEventListener('naver-auth-failed', fail)
    loadNaverMaps().then((maps) => {
      if (dead || !box.current) return
      map.current = new maps.Map(box.current, {
        center: new maps.LatLng(spot.lat, spot.lng), zoom: 16,
        mapTypeControl: true, scaleControl: true, zoomControl: true, mapDataControl: false,
        zoomControlOptions: { position: maps.Position.TOP_RIGHT },
      })
      setReady(true)
    }).catch(fail)
    return () => {
      dead = true
      window.removeEventListener('naver-auth-failed', fail)
      try { map.current?.destroy?.() } catch { /* 인증에 실패한 지도는 내부가 덜 만들어져 있어 정리 중 오류가 난다 */ }
      map.current = null
      setReady(false)
    }
  }, [spot.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 2) 지도 위 표시는 경로·고도·주변 장소가 바뀔 때마다 다시 그린다
  useEffect(() => {
    if (!ready || !map.current) return undefined
    const maps = window.naver.maps
    const m = map.current
    const items = []
    const add = (o) => { items.push(o); return o }
    const clear = () => items.forEach((o) => { try { (o.setMap ? o.setMap(null) : maps.Event.removeListener(o)) } catch { /* 이미 지워진 표시 */ } })
    try {
    const ll = (lat, lng) => new maps.LatLng(lat, lng)
    const bounds = new maps.LatLngBounds()
    bounds.extend(ll(spot.lat, spot.lng))

    const path = (spot.path ?? []).map(([lat, lng]) => ll(lat, lng))
    path.forEach((p) => bounds.extend(p))
    if (path.length > 1) {
      add(new maps.Polyline({ map: m, path, strokeColor: '#ffffff', strokeWeight: 10, strokeOpacity: 0.95, strokeLineCap: 'round', strokeLineJoin: 'round' }))
      if (prof) {
        prof.samples.slice(1).forEach((p, i) => {
          const a = prof.samples[i]
          add(new maps.Polyline({ map: m, path: [ll(a.lat, a.lng), ll(p.lat, p.lng)], strokeColor: elevColor(p.m, prof.min, prof.max), strokeWeight: 6, strokeLineCap: 'round' }))
        })
      } else {
        add(new maps.Polyline({ map: m, path, strokeColor: color, strokeWeight: 6, strokeLineCap: 'round', strokeLineJoin: 'round' }))
      }
    }

    dots.forEach((d) => add(new maps.Marker({
      map: m, position: ll(d.lat, d.lng), title: d.name, clickable: false,
      icon: { content: '<span class="nv-dot"></span>', anchor: new maps.Point(5, 5) },
    })))

    places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)).forEach((p, i) => {
      const pos = ll(p.lat, p.lng)
      bounds.extend(pos)
      const mk = add(new maps.Marker({
        map: m, position: pos, title: p.title, zIndex: 50,
        icon: { content: `<span class="nv-num">${i + 1}</span>`, anchor: new maps.Point(13, 13) },
      }))
      add(maps.Event.addListener(mk, 'click', () => window.open(naverSearch(p.title, p.addr), '_blank', 'noopener')))
    })

    add(new maps.Marker({
      map: m, position: ll(spot.lat, spot.lng), title: spot.name, zIndex: 100,
      icon: { content: `<span class="nv-pin" style="--kc:${color}">돌</span>`, anchor: new maps.Point(16, 16) },
    }))

    if (path.length > 1 || places.length) m.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
    else { m.setCenter(ll(spot.lat, spot.lng)); m.setZoom(16) }

    } catch {
      // 키가 틀렸거나 허용 도메인이 아니면 지도 객체가 덜 만들어져 여기서 오류가 난다 → SVG 지도로 돌아간다
      clear()
      onFail()
      return undefined
    }
    return clear
  }, [ready, spot, prof, places, dots, color]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="spot-map naver-map"><div ref={box} className="naver-box" role="application" aria-label={`${spot.name} 네이버 지도`} /></div>
}
