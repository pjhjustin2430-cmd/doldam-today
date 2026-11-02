import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Row } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import IslandMap2D from '../components/IslandMap2D'
import KindBadge from '../components/KindBadge'
import { ping } from '../api/client'
import { isSupabaseReady, supabase } from '../lib/supabase'
import { recommend } from '../lib/recommend'
import { useConditions } from '../lib/useConditions'
import { pickDust } from '../lib/walkability'
import { usePageTitle } from '../lib/usePageTitle'
import { useAppStore } from '../store/useAppStore'

export default function Home() {
  usePageTitle()
  const { spots, kinds, loadSpots } = useAppStore()
  const navigate = useNavigate()
  const [db, setDb] = useState(isSupabaseReady
    ? { state: 'wait', msg: '확인 중...' }
    : { state: 'fail', msg: '.env.local 에 VITE_SUPABASE_URL / ANON_KEY 를 넣으세요' })
  const [api, setApi] = useState({ state: 'wait', msg: '확인 중...' })
  const south = useConditions('서귀포시')
  const north = useConditions('제주시')

  useEffect(() => {
    loadSpots()
    if (isSupabaseReady) {
      supabase.from('favorites').select('id').limit(1).then(({ error }) =>
        setDb(error ? { state: 'fail', msg: error.message } : { state: 'ok', msg: '연결 OK' }))
    }
    ping()
      .then((d) => setApi({ state: d.hasDataKey && d.hasClaudeKey ? 'ok' : 'fail', msg: `서버 OK · 공공데이터 키 ${d.hasDataKey ? '있음' : '없음'} · Claude 키 ${d.hasClaudeKey ? '있음' : '없음'}` }))
      .catch(() => setApi({ state: 'fail', msg: '서버 함수에 연결되지 않아요' }))
  }, [loadSpots])

  const today = useMemo(
    () => (spots.length ? recommend(spots, { 제주시: north.fit, 서귀포시: south.fit }) : null),
    [spots, north.fit, south.fit],
  )
  const kindOf = (s) => kinds.find((k) => k.id === s.kind)

  return (
    <>
      <section className="hero-split">
        <div className="hero-copy">
          <div className="eyebrow">제주 콘텐츠·문화 IP · 제주 돌담</div>
          <h1>바람 많은 섬이<br />쌓아 올린 돌담길</h1>
          <p className="lead">밭담, 환해장성, 방사탑, 돌염전까지. 오늘 바람과 비를 확인하고 걸어 볼 만한 돌담을 골라 드려요.</p>
          <div className="cond-row">
            <Cond title="제주시" c={north} />
            <Cond title="서귀포시" c={south} />
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Button as={Link} to="/map" variant="primary" size="lg"><i className="bi bi-badge-3d me-2" />3D 지도</Button>
            <Button as={Link} to="/agent" variant="outline-primary" size="lg"><i className="bi bi-chat-dots me-2" />돌담지기</Button>
          </div>
        </div>
        <div className="hero-map">
          {spots.length ? <IslandMap2D spots={spots} kinds={kinds} onPick={(s) => navigate(`/spots/${s.id}`)} /> : <div className="text-muted p-5">지도를 불러오는 중...</div>}
        </div>
      </section>
      <div className="wall-band" aria-hidden="true" />

      <h3 className="section-title">오늘의 추천 돌담<small>날씨에 맞춰 골라요</small></h3>
      {today ? (
        <div className="panel today">
          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
            <KindBadge kind={kindOf(today.spot)} />
            <Badge bg={today.fit.variant}>{today.spot.weather} {today.fit.label}</Badge>
            {today.spot.hasTrack && <Badge bg="dark" className="fw-normal"><i className="bi bi-universal-access me-1" />무장애 정보</Badge>}
          </div>
          <h4 className="fw-bold mb-1">{today.spot.name}</h4>
          <div className="small text-muted mb-2">{today.spot.area}</div>
          <p className="mb-2">{today.reason}</p>
          <FactChips c={today.spot.weather === '제주시' ? north : south} place={today.spot.weather} />
          <div className="d-flex gap-2 flex-wrap">
            <Button as={Link} to={`/spots/${today.spot.id}`} variant="primary">자세히 보기</Button>
            <Button variant="outline-primary" onClick={() => { useAppStore.getState().select(today.spot.id); navigate('/map') }}><i className="bi bi-badge-3d me-1" />3D 지도에서</Button>
          </div>
        </div>
      ) : <div className="panel text-muted small">{north.loading || south.loading ? '날씨를 확인하는 중...' : '예보를 불러오지 못해 추천을 만들 수 없어요.'}</div>}

      <h3 className="section-title">동작 체크</h3>
      <Row xs={1} md={3} className="g-3">
        <Col><Check title="React · 라우터" state="ok" msg="이 화면이 보이면 OK" /></Col>
        <Col><Check title="Supabase" {...db} /></Col>
        <Col><Check title="서버 함수 /api" {...api} /></Col>
      </Row>
    </>
  )
}

// 추천 근거가 된 오늘의 수치: 바람·비·기온·미세먼지
function FactChips({ c, place }) {
  const dust = pickDust(c.air, place)
  if (!c.fit) return null
  return (
    <div className="fact-chips mb-3">
      <span><i className="bi bi-wind" />바람 {c.fit.wind}m/s</span>
      <span><i className="bi bi-cloud-rain" />비 {c.fit.pop}%</span>
      {c.slots[0] && <span><i className="bi bi-thermometer-half" />{c.slots[0].temp}° {c.slots[0].sky}</span>}
      {dust && <span><i className="bi bi-emoji-neutral" />미세먼지 {dust.grade}{dust.estimated ? ' (추정)' : ''}</span>}
    </div>
  )
}

function Cond({ title, c }) {
  return (
    <div className="cond">
      <span className="small text-muted">{title}</span>
      {c.loading ? <span>확인 중</span> : c.fit
        ? <><Badge bg={c.fit.variant}>{c.fit.label}</Badge><span className="small">바람 {c.fit.wind}m/s · 비 {c.fit.pop}%</span></>
        : <span className="small">예보 없음</span>}
    </div>
  )
}

function Check({ title, state, msg }) {
  const icon = { ok: 'check-circle-fill text-success', fail: 'x-circle-fill text-danger', wait: 'hourglass-split text-muted' }[state]
  return (
    <Card className="h-100">
      <Card.Body>
        <div className="fw-bold mb-1"><i className={`bi bi-${icon} me-2`} />{title}</div>
        <div className="small text-muted">{msg}</div>
      </Card.Body>
    </Card>
  )
}
