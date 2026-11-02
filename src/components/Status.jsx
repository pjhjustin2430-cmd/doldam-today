import { Alert, Spinner } from 'react-bootstrap'

export function Loading({ text = '불러오는 중...' }) {
  return <div className="text-center py-5 text-muted"><Spinner animation="border" size="sm" className="me-2" />{text}</div>
}
export function ErrorAlert({ error }) {
  if (!error) return null
  return <Alert variant="danger"><i className="bi bi-exclamation-triangle me-2" />{String(error)}</Alert>
}
export function Empty({ text = '결과가 없어요' }) {
  return <div className="text-center py-5 text-muted"><i className="bi bi-inbox fs-2 d-block mb-2" />{text}</div>
}

// 카드 목록이 불러와지는 동안 보여주는 뼈대 화면
export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: count }, (_, i) => (
        <div className="col" key={i}><div className="skeleton-card"><div className="sk sk-head" /><div className="sk sk-line w60" /><div className="sk sk-line w90" /><div className="sk sk-line w40" /></div></div>
      ))}
    </div>
  )
}
