import { useEffect, useRef, useState } from 'react'
import { Button, Col, Form, InputGroup, Row, Spinner } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import { usePageTitle } from '../lib/usePageTitle'
import { useAppStore } from '../store/useAppStore'

// 에이전트가 쓸 수 있는 도구 6개: 이름 → 화면에 보일 이름·출처·아이콘
const TOOLS = {
  search_doldam_spots: { label: '돌담 명소 검색', src: '제주 무장애여행정보 · 직접 정리', icon: 'search' },
  get_spot_detail: { label: '명소 상세·접근성', src: '무장애여행정보 CSV', icon: 'universal-access' },
  get_weather: { label: '날씨', src: '기상청 단기예보', icon: 'cloud-sun' },
  get_air_quality: { label: '미세먼지', src: '에어코리아', icon: 'wind' },
  find_nearby_places: { label: '주변 장소', src: '한국관광공사 TourAPI', icon: 'geo-alt' },
  get_stonepark_exhibitions: { label: '돌문화공원 전시', src: '제주특별자치도청 오픈API', icon: 'easel' },
}
const ARG_LABEL = { kind: '종류', keyword: '검색어', accessibleOnly: '무장애만', spotId: '명소', place: '지역', contentTypeId: '유형', status: '상태', limit: '건수' }
const EXAMPLES = [
  { icon: 'wind', title: '바람 센 날', q: '오늘 바람 센데 갈 만한 돌담 어디야?' },
  { icon: 'universal-access', title: '휠체어로', q: '휠체어로 걸을 수 있는 돌담길 알려줘' },
  { icon: 'cloud-rain', title: '비 오는 날', q: '내일 비 오면 돌문화공원 괜찮아?' },
  { icon: 'camera', title: '사진 찍기', q: '사진 찍기 좋은 환해장성 추천해줘' },
]

const argText = (args = {}) => Object.entries(args).map(([k, v]) => `${ARG_LABEL[k] ?? k}: ${v}`).join(' · ')

export default function Agent() {
  usePageTitle('돌담지기')
  const messages = useAppStore((s) => s.messages)
  const loading = useAppStore((s) => s.chatLoading)
  const sendMessage = useAppStore((s) => s.sendMessage)
  const clearChat = useAppStore((s) => s.clearChat)
  const [input, setInput] = useState('')
  const end = useRef(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [messages, loading])

  function send(text) {
    if (!text.trim() || loading) return
    sendMessage(text.trim())
    setInput('')
  }

  return (
    <>
      <PageHeader icon="chat-dots" title="돌담지기" subtitle="AI가 질문에 맞는 도구를 스스로 골라 호출하고, 그 결과로 답해요. 어떤 도구를 썼는지도 함께 보여 드려요." />
      <Row className="g-4">
        <Col lg={8}>
          <div className="chat-box panel" aria-live="polite">
            {messages.length === 0 && (
              <div className="agent-empty">
                <div className="agent-hello"><i className="bi bi-bricks" /><div><b>안녕하세요, 돌담지기예요.</b><br />오늘 날씨와 제주 돌담 정보를 보고 갈 만한 곳을 골라 드려요.</div></div>
                <div className="agent-examples">
                  {EXAMPLES.map((e) => (
                    <button key={e.q} type="button" className="agent-example" onClick={() => send(e.q)}>
                      <i className={`bi bi-${e.icon}`} /><b>{e.title}</b><span>{e.q}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role} ${m.error ? 'error' : ''}`}>
                {m.steps?.length > 0 && (
                  <ol className="agent-steps" aria-label="호출한 도구">
                    {m.steps.map((s, j) => {
                      const t = TOOLS[s.tool]
                      return (
                        <li key={j} className={s.error ? 'bad' : ''}>
                          <i className={`bi bi-${t?.icon ?? 'tools'}`} />
                          <span><b>{t?.label ?? s.tool}</b>{argText(s.args) && <span className="args"> ({argText(s.args)})</span>}</span>
                          <span className="res">{s.error ? `오류: ${s.error}` : `${s.count}건`}</span>
                        </li>
                      )
                    })}
                  </ol>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.error && <i className="bi bi-exclamation-triangle me-1" />}{m.text}</div>
                {m.error && <Button size="sm" variant="outline-danger" className="mt-2" disabled={loading} onClick={() => send(m.retry)}><i className="bi bi-arrow-repeat me-1" />다시 시도</Button>}
              </div>
            ))}
            {loading && <div className="msg assistant thinking"><Spinner size="sm" className="me-2" />질문에 맞는 도구를 고르고 호출하는 중...</div>}
            <div ref={end} />
          </div>
          <Form onSubmit={(e) => { e.preventDefault(); send(input) }} className="mt-3">
            <InputGroup>
              <Form.Control value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} placeholder="예: 구좌 쪽에서 걷기 좋은 밭담 알려줘" aria-label="질문 입력" />
              <Button type="submit" disabled={loading || !input.trim()} aria-label="보내기"><i className="bi bi-send" /></Button>
            </InputGroup>
            <div className="d-flex justify-content-between small text-muted mt-1">
              <span>{input.length}/500</span>
              {messages.length > 0 && <button type="button" className="btn-link-plain" onClick={clearChat}>대화 지우기</button>}
            </div>
          </Form>
        </Col>
        <Col lg={4}>
          <div className="panel">
            <div className="fw-bold mb-2"><i className="bi bi-tools me-2 text-primary" />돌담지기가 쓰는 도구 6개</div>
            <ul className="tool-list">
              {Object.entries(TOOLS).map(([k, t]) => (
                <li key={k}><i className={`bi bi-${t.icon}`} /><div><b>{t.label}</b><span>{t.src}</span></div></li>
              ))}
            </ul>
            <div className="small text-muted mt-2">답변 위에 "호출한 도구" 목록이 그대로 표시돼요.</div>
          </div>
        </Col>
      </Row>
    </>
  )
}
