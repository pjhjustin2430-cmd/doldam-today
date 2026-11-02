import { useEffect, useState } from 'react'
import { Badge } from 'react-bootstrap'
import { fetchExhibitions } from '../api/client'
import { ErrorAlert, Loading } from './Status'

const period = (e) => (e.start === e.end ? e.start : `${e.start} ~ ${e.end}`)

// 제주돌문화공원 전시·행사 (제주특별자치도청 오픈API): 지금 열리는 전시를 크게, 지난 전시는 목록으로
export default function Exhibitions() {
  const [state, setState] = useState({ loading: true, now: [], past: [], error: '' })
  useEffect(() => {
    let alive = true
    fetchExhibitions('', 60)
      .then((list) => alive && setState({ loading: false, now: list.filter((e) => e.status === 'ING'), past: list.filter((e) => e.status !== 'ING').slice(0, 6), error: '' }))
      .catch((e) => alive && setState({ loading: false, now: [], past: [], error: e.message }))
    return () => { alive = false }
  }, [])

  return (
    <>
      <h3 className="section-title">돌문화공원 전시·행사<small>제주특별자치도청 오픈API · 지금 열리는 것</small></h3>
      {state.loading ? <Loading /> : (
        <>
          <ErrorAlert error={state.error} />
          {!state.error && state.now.length === 0 && <div className="panel text-muted small">지금 진행 중인 전시·행사가 없어요.</div>}
          {state.now.map((e) => (
            <div key={e.id} className="expo-now">
              {e.cover && <img src={e.cover} alt={e.title} loading="lazy" />}
              <div>
                <Badge bg="success" className="mb-2">진행 중</Badge>
                <h4>{e.title}</h4>
                <div className="small text-muted"><i className="bi bi-calendar3 me-1" />{period(e)}{e.hour && ` · ${e.hour}`}</div>
                {e.owner && <div className="small text-muted"><i className="bi bi-building me-1" />{e.owner}{e.tel && ` · ${e.tel}`}</div>}
                {e.intro && <p className="small mt-2 mb-0" style={{ whiteSpace: 'pre-line' }}>{e.intro}</p>}
              </div>
            </div>
          ))}
          {state.past.length > 0 && (
            <ul className="expo-past">
              {state.past.map((e) => (
                <li key={e.id}><span className="d">{period(e)}</span><span className="t">{e.title}</span></li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
