// 돌담 종류 배지: 종류마다 색과 아이콘이 있다
export default function KindBadge({ kind, className = '' }) {
  if (!kind) return null
  return (
    <span className={`kind-badge ${className}`} style={{ '--kc': kind.color }}>
      <i className={`bi bi-${kind.icon}`} />{kind.name}
    </span>
  )
}
