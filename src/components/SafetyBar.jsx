import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useConditions } from '../lib/useConditions'

// 오늘의 걷기 안내 바: 기상청 + 에어코리아로 제주시(북)·서귀포시(남)를 한 줄로 알려준다
export default function SafetyBar() {
  const [open, setOpen] = useState(true)
  const north = useConditions('제주시')
  const south = useConditions('서귀포시')
  if (!open || north.loading || south.loading) return null
  const fits = [['제주시', north.fit], ['서귀포시', south.fit]].filter(([, f]) => f)
  if (!fits.length) return null
  const worst = fits.some(([, f]) => f.variant === 'danger') ? 'danger' : fits.some(([, f]) => f.variant === 'warning') ? 'warn' : 'ok'
  const icon = { danger: 'exclamation-triangle-fill', warn: 'cloud-drizzle', ok: 'check2-circle' }[worst]
  return (
    <div className={`safety ${worst === 'ok' ? 'ok' : worst === 'warn' ? 'warn' : ''} mb-3`} role="status">
      <span className="icon"><i className={`bi bi-${icon}`} /></span>
      <span>
        <b className="me-2">오늘 걷기 안내</b>
        {fits.map(([place, f]) => `${place} ${f.label}`).join(' · ')}
        {worst === 'danger' && ' — 무리하지 마세요'}
        <Link to="/wind" className="ms-2 text-white text-decoration-underline">바람과 돌담 보기</Link>
      </span>
      <button type="button" aria-label="닫기" onClick={() => setOpen(false)}>×</button>
    </div>
  )
}
