import { useEffect, useMemo } from 'react'
import { Col, Form, ProgressBar, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import ItemCard from '../components/ItemCard'
import { Empty, Loading } from '../components/Status'
import { usePageTitle } from '../lib/usePageTitle'
import { useAppStore } from '../store/useAppStore'

export default function My() {
  usePageTitle('내 돌담 수첩')
  const { nickname, setNickname, favorites, favLoading, loadFavorites, removeFavorite, spots, kinds, loadSpots } = useAppStore()
  useEffect(() => { loadFavorites() }, [nickname, loadFavorites])
  useEffect(() => { loadSpots() }, [loadSpots])
  const visited = useMemo(() => new Set(favorites.map((f) => f.item_id)), [favorites])
  const todo = spots.filter((s) => !visited.has(s.id))

  return (
    <>
      <PageHeader icon="patch-check" title="내 돌담 수첩" subtitle={`도장 ${favorites.length}개 · Supabase에 저장되어 새로고침해도 남아요`} />
      <Form.Control className="mb-3" style={{ maxWidth: 320 }} placeholder="닉네임 (비우면 '익명')" aria-label="닉네임"
        value={nickname} onChange={(e) => setNickname(e.target.value)} />
      {spots.length > 0 && (
        <div className="mb-4" style={{ maxWidth: 320 }}>
          <div className="d-flex justify-content-between small mb-1"><b>다녀온 돌담</b><span>{visited.size} / {spots.length}곳</span></div>
          <ProgressBar now={(visited.size / spots.length) * 100} className="stone-progress" aria-label="다녀온 비율" />
        </div>
      )}
      {favLoading ? <Loading /> : favorites.length === 0 ? <Empty text="아직 찍은 도장이 없어요. 아래에서 가고 싶은 돌담을 골라 보세요." /> : (
        <Row xs={1} sm={2} lg={3} className="g-3">
          {favorites.map((f) => (
            <Col key={f.id}>
              <ItemCard title={f.title} badge="다녀옴" subtitle={new Date(f.created_at).toLocaleDateString('ko-KR')}
                onRemove={() => removeFavorite(f.id)} />
            </Col>
          ))}
        </Row>
      )}

      {todo.length > 0 && (
        <>
          <h3 className="section-title">아직 안 가 본 곳<small>{todo.length}곳 · 누르면 상세로 가요</small></h3>
          <Row xs={2} md={3} lg={4} className="g-3">
            {todo.map((s) => {
              const k = kinds.find((x) => x.id === s.kind)
              return (
                <Col key={s.id}>
                  <Link to={`/spots/${s.id}`} className="todo-card" style={{ '--kc': k?.color }}>
                    <i className={`bi bi-${k?.icon ?? 'bricks'}`} />
                    <b>{s.name}</b>
                    <span>{k?.name}</span>
                  </Link>
                </Col>
              )
            })}
          </Row>
        </>
      )}
    </>
  )
}
