import { useEffect, useState } from 'react'
import { Badge, Button, Carousel, Col, ListGroup, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import DoldamMap3D from '../components/DoldamMap3D'
import InfoBadge from '../components/InfoBadge'
import KindBadge from '../components/KindBadge'
import { ErrorAlert, Loading } from '../components/Status'
import { fetchNearby } from '../api/client'
import { kakaoPin } from '../lib/mapLinks'
import { creditText } from '../lib/photoCredit'
import { placeOf, useConditions } from '../lib/useConditions'
import { pickDust } from '../lib/walkability'
import { usePageTitle } from '../lib/usePageTitle'
import { useAppStore } from '../store/useAppStore'

export default function DoldamMap() {
  usePageTitle('3D 지도')
  const { spots, kinds, selectedId, select, loadSpots, spotsLoading, spotsError, stamp } = useAppStore()
  useEffect(() => { loadSpots() }, [loadSpots])

  const spot = spots.find((s) => s.id === selectedId)
  const place = spot ? placeOf(spot) : '제주시'
  const { slots, air, fit, loading } = useConditions(place)
  const dust = pickDust(air, place) // 측정값이 비어 있는 측정소는 건너뛰고, 그 지역 값을 먼저

  // 바람 줄기: 오늘 제주시 풍속·풍향 (기상청 단기예보). 돌담 켜기 = 밭담 구역에서 바람이 느려지는 설명용 표현
  const [showWind, setShowWind] = useState(true)
  const [walls, setWalls] = useState(false)
  const north = useConditions('제주시')
  const w = north.slots[0]
  const wind = showWind && w && Number.isFinite(w.dir) && Number.isFinite(w.wind) ? { speed: w.wind, from: w.dir } : null
  const windName = w && Number.isFinite(w.dir) ? `${['북', '북동', '동', '남동', '남', '남서', '서', '북서'][Math.round(w.dir / 45) % 8]}풍` : ''

  // 명소를 고르면 주변 명소·식당을 관광공사 TourAPI에서 가져온다
  const [near, setNear] = useState({ id: null, list: [], error: '' })
  useEffect(() => {
    if (!selectedId) return
    let alive = true
    fetchNearby({ id: selectedId })
      .then((list) => alive && setNear({ id: selectedId, list, error: '' }))
      .catch((e) => alive && setNear({ id: selectedId, list: [], error: e.message }))
    return () => { alive = false }
  }, [selectedId])

  // 사진: 돌문화공원은 무장애여행정보 현장 사진, 나머지는 관광공사 TourAPI 주변 사진
  const photos = (spot?.photos ?? []).slice(0, 10).map((x) => ({ src: x.src, title: x.caption, sub: creditText(x) }))

  const pick = (id) => select(id === selectedId ? null : id)

  // 키보드: ← → 로 이웃한 명소, Esc 로 전체 보기
  useEffect(() => {
    const onKey = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || !spots.length) return
      const i = spots.findIndex((s) => s.id === selectedId)
      if (e.key === 'ArrowRight') { e.preventDefault(); select(spots[(i + 1) % spots.length].id) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); select(spots[(i <= 0 ? spots.length : i) - 1].id) }
      else if (e.key === 'Escape') select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spots, selectedId, select])

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">3D 지도</div>
        <h1>제주를 돌려 보며 돌담 고르기</h1>
        <p>드래그로 돌리고 휠로 확대하세요. 핀이나 이름표를 누르면 그곳으로 확대되고, 사진이 있는 곳은 사진도 나와요. 키보드 ← → 로 다음 명소, Esc 로 전체 보기. 오른쪽 위에서 오늘 바람을 켜고, "돌담 켜기"로 밭담 구역을 지나는 바람이 약해지는 모습을 볼 수 있어요. "근사 위치" 배지가 붙은 곳은 마을·해안 단위의 대략적인 위치예요.</p>
      </header>
      <ErrorAlert error={spotsError} />
      <Row className="g-4">
        <Col lg={8}>
          <div className="map-card">
            {spotsLoading && !spots.length ? <Loading text="불러오는 중..." /> : <DoldamMap3D spots={spots} kinds={kinds} selectedId={selectedId} onPick={pick} wind={wind} walls={walls} />}
            <div className="map-tools">
              <button type="button" className={`tool-btn ${showWind ? 'on' : ''}`} aria-pressed={showWind} onClick={() => setShowWind(!showWind)}>
                <i className="bi bi-wind" />바람 {showWind ? '끄기' : '보기'}
              </button>
              <button type="button" className={`tool-btn ${walls ? 'on' : ''}`} aria-pressed={walls} disabled={!showWind || !wind} onClick={() => setWalls(!walls)}>
                <i className="bi bi-bricks" />돌담 {walls ? '끄기' : '켜기'}
              </button>
            </div>
            {showWind && (wind ? (
              <div className="wind-badge" role="status">
                <b><i className="bi bi-arrow-up" style={{ display: 'inline-block', transform: `rotate(${(w.dir + 180) % 360}deg)` }} /> {windName} {wind.speed}m/s</b>
                <span>오늘 제주시 기준 · 줄기는 바람이 흘러가는 쪽이에요</span>
                {walls && <span className="amber">주황 줄기 = 밭담 구역을 지나 약해진 바람 (설명용 표현)</span>}
              </div>
            ) : <div className="wind-badge"><span>{north.loading ? '풍향을 불러오는 중...' : '바람 정보를 불러오지 못했어요'}</span></div>)}
            {selectedId && <button type="button" className="map-back" onClick={() => select(null)}><i className="bi bi-arrows-fullscreen me-1" />전체 보기</button>}
            {kinds.length > 0 && (
              <ul className="map-legend" aria-label="범례">
                {kinds.map((k) => <li key={k.id} style={{ '--kc': k.color }}><i className={`bi bi-${k.icon}`} />{k.name}</li>)}
              </ul>
            )}
          </div>
          <div className="chip-row" role="group" aria-label="명소 선택">
            {spots.map((s) => (
              <button key={s.id} type="button" className={`course-chip ${s.id === selectedId ? 'on' : ''}`}
                style={{ '--kc': kinds.find((k) => k.id === s.kind)?.color }} onClick={() => pick(s.id)}>{s.label}</button>
            ))}
          </div>
        </Col>
        <Col lg={4}>
          <div className="panel mb-3">
            <div className="fw-bold mb-2"><i className="bi bi-bricks me-2 text-primary" />선택한 명소</div>
            {spot ? (
              <>
                {photos.length > 0 && (
                  <Carousel className="spot-photos" interval={null} indicators={photos.length > 1} controls={photos.length > 1}>
                    {photos.map((x) => (
                      <Carousel.Item key={x.src}>
                        <img src={x.src} alt={x.title} loading="lazy" />
                        <Carousel.Caption><b>{x.title}</b><div>{x.sub}</div></Carousel.Caption>
                      </Carousel.Item>
                    ))}
                  </Carousel>
                )}
                <div className="d-flex gap-2 flex-wrap mb-2"><KindBadge kind={kinds.find((k) => k.id === spot.kind)} /><InfoBadge spot={spot} /></div>
                <div className="fs-5 fw-bold">{spot.name}</div>
                <div className="text-muted small mb-1">{spot.area}{spot.hasTrack ? ` · ${spot.dist}km · 약 ${spot.minutes}분` : ''}</div>
                <div className="small mb-3">{spot.summary}</div>
                <Button as={Link} to={`/spots/${spot.id}`} size="sm" variant="outline-primary" className="me-2">상세 보기</Button>
                <Button size="sm" variant="primary" onClick={() => stamp(spot)}><i className="bi bi-patch-check me-1" />돌담 도장</Button>
              </>
            ) : <div className="small text-muted">핀이나 아래 버튼을 눌러보세요.</div>}
          </div>
          <div className="panel mb-3">
            <div className="fw-bold mb-2"><i className="bi bi-wind me-2 text-primary" />{place} 걷기 조건</div>
            {loading ? <div className="small text-muted">확인 중...</div> : fit ? (
              <>
                <Badge bg={fit.variant} className="mb-2">{fit.label}</Badge>
                <div className="small">바람 {fit.wind}m/s · 비 {fit.pop}%{slots[0] ? ` · ${slots[0].temp}° ${slots[0].sky}` : ''}</div>
                <div className="small text-muted">미세먼지 {dust ? `${dust.grade} (PM10 ${dust.pm10})${dust.estimated ? ' · 모델 추정' : ''}` : '정보 없음'}</div>
                {fit.variant === 'danger' && <div className="small text-danger mt-1">{fit.reasons.join(' · ')}</div>}
              </>
            ) : <div className="small text-muted">예보를 불러오지 못했어요.</div>}
          </div>
          {spot && (
            <div className="panel">
              <div className="fw-bold mb-2"><i className="bi bi-geo-alt me-2 text-primary" />근처 명소·식당</div>
              {near.error ? <div className="small text-danger">{near.error}</div>
                : near.id !== selectedId ? <div className="small text-muted">불러오는 중...</div>
                : near.list.length === 0 ? <div className="small text-muted">근처 정보가 없어요.</div> : (
                  <ListGroup variant="flush" className="small">
                    {near.list.slice(0, 5).map((p) => (
                      <ListGroup.Item key={p.id} className="px-0 py-1 border-0">
                        <Badge bg="light" text="dark" className="me-1 border">{p.type}</Badge><a href={kakaoPin(p.title, p.lat, p.lng)} target="_blank" rel="noreferrer" className="text-reset">{p.title}</a>
                        <span className="text-muted"> · {p.dist}m</span>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
            </div>
          )}
        </Col>
      </Row>
    </>
  )
}
