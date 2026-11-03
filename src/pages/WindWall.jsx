import { useEffect, useMemo, useState } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import WindWallScene, { WALL, shelter } from '../components/WindWallScene'
import { useConditions } from '../lib/useConditions'
import { usePageTitle } from '../lib/usePageTitle'
import { useAppStore } from '../store/useAppStore'

const DIRS = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
const fmt = (v) => (Math.round(v * 10) / 10).toFixed(1)

// 바람과 돌담: 오늘 제주 바람을 돌담 모형에 불어 넣고, 담을 지나며 바람이 약해지는 모습을 보여준다
export default function WindWall() {
  usePageTitle('바람과 돌담')
  const { kinds, loadSpots } = useAppStore()
  useEffect(() => { loadSpots() }, [loadSpots])
  const north = useConditions('제주시')
  const today = north.slots[0]
  const todaySpeed = today && Number.isFinite(today.wind) ? today.wind : null
  const dirName = today && Number.isFinite(today.dir) ? `${DIRS[Math.round(today.dir / 45) % 8]}풍` : ''

  const [walls, setWalls] = useState(true)
  const [speed, setSpeed] = useState(null) // null 이면 오늘 바람을 따른다
  const v = speed ?? todaySpeed ?? 6
  const points = useMemo(() => [
    ['담 앞 3m', -3], ['담 뒤 2m', 2], ['담 뒤 6m', 6], ['담 뒤 12m', 12],
  ].map(([label, x]) => ({ label, x, ms: v * shelter(x, 0.5, walls) })), [v, walls])
  const batdam = kinds.find((k) => k.id === 'batdam')

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">바람과 돌담</div>
        <h1>돌담은 바람을 어떻게 막을까</h1>
        <p>오늘 제주 바람을 돌담 모형에 불어 넣었어요. 돌담을 지난 바람은 느려지고(주황색), 담 뒤 작물은 덜 흔들려요. 드래그로 돌려 보고, 아래에서 바람 세기를 바꾸거나 돌담을 치워 비교해 보세요.</p>
      </header>

      <div className="wind-card">
        <WindWallScene speed={v} walls={walls} />
        <div className="wind-controls">
          <button type="button" className={`tool-btn ${walls ? 'on' : ''}`} aria-pressed={walls} onClick={() => setWalls(!walls)}>
            <i className="bi bi-bricks" />{walls ? '돌담 치우기' : '돌담 쌓기'}
          </button>
        </div>
        <ul className="wind-legend" aria-label="범례">
          <li><i style={{ background: '#2e70a8' }} />센 바람</li>
          <li><i style={{ background: '#f29e29' }} />돌담에 막혀 약해진 바람</li>
        </ul>
      </div>

      <Row className="g-4 mt-1">
        <Col lg={7}>
          <div className="panel">
            <div className="d-flex justify-content-between align-items-baseline flex-wrap gap-2 mb-2">
              <label htmlFor="wind-speed" className="fw-bold mb-0"><i className="bi bi-wind me-2 text-primary" />바람 세기 <b className="ms-1">{fmt(v)}m/s</b></label>
              <span className="small text-muted">
                {todaySpeed != null ? <>오늘 제주시 {dirName} {todaySpeed}m/s (기상청 예보)</> : north.loading ? '오늘 바람을 불러오는 중...' : '오늘 바람을 불러오지 못했어요'}
                {speed != null && todaySpeed != null && <button type="button" className="btn-link-plain ms-2" onClick={() => setSpeed(null)}>오늘 바람으로</button>}
              </span>
            </div>
            <Form.Range id="wind-speed" min={1} max={15} step={0.5} value={v} onChange={(e) => setSpeed(Number(e.target.value))} />
            <div className="d-flex justify-content-between small text-muted"><span>1m/s 산들바람</span><span>9m/s 이상이면 걷기 주의</span><span>15m/s 강풍</span></div>

            <div className="wind-readout mt-3">
              {points.map((p) => (
                <div key={p.label} className={p.x > 0 && walls ? 'behind' : ''}>
                  <span>{p.label}</span>
                  <b>{fmt(p.ms)}<small>m/s</small></b>
                  <em>{p.x > 0 && walls ? `${Math.round((1 - p.ms / v) * 100)}% 약해짐` : '그대로'}</em>
                </div>
              ))}
            </div>
            <div className="small text-muted mt-2">땅에서 0.5m 높이 기준이에요(담 높이는 {WALL.h}m로 만들었어요). 숫자는 원리를 보여주기 위한 <b>설명용 모형</b>이고, 실제 감소량은 담 높이({WALL.h}m 가정)·돌 틈·바람 방향에 따라 달라요.</div>
          </div>
        </Col>
        <Col lg={5}>
          <div className="panel h-100">
            <div className="fw-bold mb-2"><i className="bi bi-question-circle me-2 text-primary" />돌담은 어떻게 바람을 이길까?</div>
            <p className="small mb-2">매끈한 벽은 바람을 정면으로 받아 벽 뒤에 거센 소용돌이가 생겨요. 크기와 모양이 제각각인 현무암을 맞물려 쌓은 제주 돌담은 울퉁불퉁한 면과 돌 사이 작은 구멍으로 바람을 흩어 속도를 늦춰요. 그래서 담도 버티고, 담 뒤의 흙과 작물도 지켜져요.</p>
            {batdam && <p className="small text-muted mb-3">{batdam.text}</p>}
            <div className="d-flex gap-2 flex-wrap">
              <Link to="/spots?kind=batdam" className="btn btn-sm btn-outline-primary"><i className="bi bi-grid-3x3 me-1" />밭담 명소 보기</Link>
              <Link to="/spots" className="btn btn-sm btn-outline-primary"><i className="bi bi-bricks me-1" />돌담 종류 알아보기</Link>
            </div>
          </div>
        </Col>
      </Row>
    </>
  )
}
