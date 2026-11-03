import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Form, ProgressBar } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import MyWallScene from '../components/MyWallScene'
import StoneFillWall from '../components/StoneFillWall'
import { buildWall, drawWall, paintWall } from '../lib/stoneWall'
import { usePageTitle } from '../lib/usePageTitle'
import { useAppStore } from '../store/useAppStore'

const LEVELS = [[0, '첫 돌을 기다려요'], [1, '돌 줍는 여행자'], [4, '담 쌓는 견습생'], [8, '돌담 숙련자'], [14, '돌담 장인']]
const levelOf = (n) => [...LEVELS].reverse().find(([min]) => n >= min)[1]

// 내 돌담: 도장을 찍으면 3D 돌담에 한 줄이 쌓인다
export default function MyWall() {
  usePageTitle('내 돌담')
  const { nickname, setNickname, favorites, loadFavorites, stamp, spots, kinds, loadSpots } = useAppStore()
  const canvas = useRef(null)
  const [view, setView] = useState('fill') // fill = 돌벽 채우기, tower = 3D 돌담
  useEffect(() => { loadSpots() }, [loadSpots])
  useEffect(() => { loadFavorites() }, [nickname, loadFavorites])
  const visited = useMemo(() => new Set(favorites.map((f) => f.item_id)), [favorites])
  const n = visited.size
  const kindOf = (s) => kinds.find((k) => k.id === s.kind)
  const me = nickname || '익명'

  function saveFill() {
    const c = document.createElement('canvas')
    c.width = 1200; c.height = 630
    const g = c.getContext('2d')
    g.fillStyle = '#14263f'; g.fillRect(0, 0, 1200, 630)
    const wall = buildWall(spots.length)
    drawWall(g, paintWall(wall, spots, kinds, visited), 0, 0, 1200, 600)
    g.fillStyle = 'rgba(20,38,63,.88)'; g.fillRect(0, 430, 1200, 200)
    const F = "'Malgun Gothic','Pretendard',sans-serif"
    g.fillStyle = '#ffffff'; g.font = `800 56px ${F}`; g.fillText(`${me}의 돌담`, 48, 508)
    g.fillStyle = '#ff9a8c'; g.font = `700 30px ${F}`; g.fillText(`${n} / ${spots.length}곳 · ${levelOf(n)}`, 50, 560)
    g.fillStyle = '#9fb3c8'; g.font = `400 24px ${F}`; g.textAlign = 'right'
    g.fillText('돌담 오늘 · doldam-today-2m16.vercel.app', 1152, 580)
    c.toBlob((b) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(b); a.download = '내-돌담.png'; a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    })
  }

  function save() {
    if (view === 'fill') return saveFill()
    if (!canvas.current) return
    const img = new Image()
    img.onload = () => {
      const W = 1200, H = 630, c = document.createElement('canvas')
      c.width = W; c.height = H
      const g = c.getContext('2d')
      g.fillStyle = '#14263f'; g.fillRect(0, 0, W, H)
      // 3D 화면을 위쪽에 가득 채우고(비율 유지, 가운데 자르기), 글씨는 아래 띠에 쓴다
      const ph = 430, s = Math.max(W / img.width, ph / img.height)
      g.save(); g.beginPath(); g.rect(0, 0, W, ph); g.clip()
      g.drawImage(img, (W - img.width * s) / 2, (ph - img.height * s) / 2, img.width * s, img.height * s)
      g.restore()
      const F = "'Malgun Gothic','Pretendard',sans-serif"
      g.fillStyle = '#ffffff'; g.font = `800 56px ${F}`; g.fillText(`${me}의 돌담`, 48, 508)
      g.fillStyle = '#ff9a8c'; g.font = `700 30px ${F}`; g.fillText(`${n} / ${spots.length}곳 · ${levelOf(n)}`, 50, 560)
      g.fillStyle = '#9fb3c8'; g.font = `400 24px ${F}`; g.textAlign = 'right'
      g.fillText('돌담 오늘 · doldam-today-2m16.vercel.app', W - 48, 580)
      c.toBlob((b) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(b); a.download = '내-돌담.png'; a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      })
    }
    img.src = canvas.current.toDataURL('image/png')
  }

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">내 돌담</div>
        <h1>다녀올 때마다 돌담이 쌓여요</h1>
        <p>명소를 한 곳 다녀오면 내 돌담에 돌 한 줄이 올라가요. 칸 하나가 명소 하나이고, 돌 색은 돌담 종류 색이에요.</p>
      </header>

      <Form.Control className="mb-3" style={{ maxWidth: 320 }} placeholder="닉네임 (비우면 '익명')" aria-label="닉네임"
        value={nickname} onChange={(e) => setNickname(e.target.value)} />

      <div className="wind-card">
        {spots.length > 0 && (view === 'fill'
          ? <StoneFillWall spots={spots} kinds={kinds} visited={visited} />
          : <MyWallScene spots={spots} kinds={kinds} visited={visited} onCanvas={(el) => { canvas.current = el }} />)}
        <div className="wind-controls">
          <button type="button" className="tool-btn" onClick={() => setView(view === 'fill' ? 'tower' : 'fill')}><i className="bi bi-arrow-repeat" />{view === 'fill' ? '3D로 보기' : '돌벽으로 보기'}</button>
          <button type="button" className="tool-btn on" onClick={save} disabled={!spots.length}><i className="bi bi-download" />이미지로 저장</button>
        </div>
      </div>

      <div className="mywall-status">
        <div><b>{n}</b> / {spots.length}곳 <span className="level">{levelOf(n)}</span></div>
        <ProgressBar now={spots.length ? (n / spots.length) * 100 : 0} className="stone-progress" aria-label="완성한 비율" />
      </div>

      <h3 className="section-title">돌 쌓으러 가기<small>다녀왔으면 눌러서 쌓아요</small></h3>
      <ol className="wall-list">
        {spots.map((s, i) => {
          const k = kindOf(s), on = visited.has(s.id)
          return (
            <li key={s.id} className={on ? 'on' : ''} style={{ '--kc': k?.color }}>
              <span className="wall-no on" style={{ '--kc': k?.color }}>{i + 1}</span>
              <Link to={`/spots/${s.id}`} className="nm">{s.name}</Link>
              {on ? <span className="done"><i className="bi bi-check2-circle" /> 쌓음</span>
                : <Button size="sm" variant="outline-primary" onClick={() => stamp(s)}>돌 쌓기</Button>}
            </li>
          )
        })}
      </ol>
    </>
  )
}
