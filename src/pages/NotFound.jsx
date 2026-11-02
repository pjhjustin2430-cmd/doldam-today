import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { usePageTitle } from '../lib/usePageTitle'

// 주소가 없을 때(404)와 화면이 깨졌을 때를 나눠서 안내한다
export default function NotFound() {
  const err = useRouteError()
  const missing = !err || (isRouteErrorResponse(err) && err.status === 404)
  usePageTitle(missing ? '길을 잃었어요' : '문제가 생겼어요')
  return (
    <div className="text-center py-5 not-found">
      <i className={`bi ${missing ? 'bi-signpost-split' : 'bi-exclamation-triangle'} display-3 text-success`} />
      <h2 className="fw-bold mt-3">{missing ? '길을 잃었어요' : '문제가 생겼어요'}</h2>
      <p className="text-muted">{missing ? '이 주소에는 돌담이 없어요. 아래에서 돌담을 찾아보세요.' : '화면을 그리다 오류가 났어요. 새로고침하면 대부분 해결돼요.'}</p>
      {!missing && err?.message && <p className="small text-muted"><code>{String(err.message).slice(0, 160)}</code></p>}
      <div className="d-flex gap-2 justify-content-center flex-wrap">
        <Link to="/" className="btn btn-primary">홈으로</Link>
        <Link to="/spots" className="btn btn-outline-primary">돌담 명소 보기</Link>
        {!missing && <button type="button" className="btn btn-outline-primary" onClick={() => window.location.reload()}>새로고침</button>}
      </div>
    </div>
  )
}
