import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import InfoBadge from '../components/InfoBadge'
import KindBadge from '../components/KindBadge'
import PageHeader from '../components/PageHeader'
import { Empty, ErrorAlert, SkeletonGrid } from '../components/Status'
import { creditText } from '../lib/photoCredit'
import { usePageTitle } from '../lib/usePageTitle'
import { useAppStore } from '../store/useAppStore'

// 돌담 명소 목록: 이름 검색 + 종류 + 무장애 정보 여부로 거른다
export default function Spots() {
  usePageTitle('돌담 명소')
  const { spots, kinds, spotsLoading, spotsError, loadSpots, select, stamp } = useAppStore()
  const navigate = useNavigate()
  const [kind, setKind] = useState('')
  const [onlyTrack, setOnlyTrack] = useState(false)
  const [q, setQ] = useState('')
  useEffect(() => { loadSpots() }, [loadSpots])

  const shown = useMemo(() => {
    const word = q.trim()
    return spots.filter((s) => (!kind || s.kind === kind) && (!onlyTrack || s.hasTrack)
      && (!word || `${s.name} ${s.area} ${s.summary}`.includes(word)))
  }, [spots, kind, onlyTrack, q])

  return (
    <>
      <PageHeader icon="bricks" title="돌담 명소" subtitle="밭담부터 돌염전까지 — 종류별로 골라보세요" />
      <Form.Control className="mb-3 spot-search" type="search" placeholder="명소·지역 검색 (예: 구좌, 환해장성)" aria-label="명소 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chip-row mb-3" role="group" aria-label="돌담 종류">
        <button type="button" className={`course-chip ${kind === '' ? 'on' : ''}`} onClick={() => setKind('')}>전체</button>
        {kinds.map((k) => (
          <button key={k.id} type="button" className={`course-chip ${kind === k.id ? 'on' : ''}`} style={{ '--kc': k.color }} onClick={() => setKind(kind === k.id ? '' : k.id)}>
            <i className={`bi bi-${k.icon} me-1`} />{k.name}
          </button>
        ))}
        <button type="button" className={`course-chip ${onlyTrack ? 'on' : ''}`} onClick={() => setOnlyTrack(!onlyTrack)}>
          <i className="bi bi-universal-access me-1" />무장애 정보 있음
        </button>
      </div>
      <div className="small text-muted mb-3" aria-live="polite">{spotsLoading ? '불러오는 중...' : `${shown.length}곳`}</div>
      <ErrorAlert error={spotsError} />
      {spotsLoading && !spots.length ? <SkeletonGrid /> : shown.length === 0 ? <Empty text="조건에 맞는 돌담이 없어요. 검색어나 종류를 바꿔 보세요." /> : (
        <Row xs={1} sm={2} lg={3} className="g-3">
          {shown.map((s) => {
            const k = kinds.find((x) => x.id === s.kind)
            return (
              <Col key={s.id}>
                <Card className="h-100 spot-card" style={{ '--kc': k?.color }}>
                  <div className="spot-card-head" style={s.photos?.[0] ? { backgroundImage: `linear-gradient(0deg, rgba(0,0,0,.35), rgba(0,0,0,0)), url(${s.photos[0].src})` } : undefined}>
                    {!s.photos?.[0] && <i className={`bi bi-${k?.icon ?? 'bricks'}`} aria-hidden="true" />}
                    <InfoBadge spot={s} className="on-head" />
                    {s.photos?.[0] && <small className="head-credit">{creditText(s.photos[0])}</small>}
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex gap-2 align-items-center mb-2 flex-wrap">
                      <KindBadge kind={k} />
                      {s.hasTrack && <span className="small text-muted"><i className="bi bi-universal-access" /> 무장애</span>}
                    </div>
                    <Card.Title className="fs-6 fw-bold"><Link to={`/spots/${s.id}`} className="stretched-link text-reset text-decoration-none">{s.name}</Link></Card.Title>
                    <div className="small text-muted mb-1">{s.area}{s.hasTrack ? ` · ${s.dist}km · 약 ${s.minutes}분` : ''}</div>
                    <Card.Text className="small flex-grow-1">{s.summary}</Card.Text>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="outline-primary" className="position-relative" style={{ zIndex: 2 }} onClick={() => { select(s.id); navigate('/map') }}><i className="bi bi-map me-1" />지도에서 보기</Button>
                      <Button size="sm" variant="outline-primary" className="position-relative" style={{ zIndex: 2 }} onClick={() => stamp(s)}><i className="bi bi-patch-check me-1" />도장</Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </>
  )
}
