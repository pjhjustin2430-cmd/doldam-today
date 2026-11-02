import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { ErrorAlert, Loading } from '../components/Status'
import { creditText } from '../lib/photoCredit'
import { usePageTitle } from '../lib/usePageTitle'
import { useAppStore } from '../store/useAppStore'

// 돌담 도감: 돌담 종류마다 이야기와 걸을 때 팁, 그 종류에 속한 명소를 묶어 보여준다
export default function Guide() {
  usePageTitle('돌담 도감')
  const { spots, kinds, spotsLoading, spotsError, loadSpots } = useAppStore()
  useEffect(() => { loadSpots() }, [loadSpots])

  return (
    <>
      <PageHeader icon="journal-bookmark" title="돌담 도감" subtitle="같은 돌담이라도 쌓은 이유가 달라요" />
      <ErrorAlert error={spotsError} />
      {spotsLoading && !kinds.length ? <Loading /> : (
        <div className="guide-grid">
          {kinds.map((k) => {
            const list = spots.filter((s) => s.kind === k.id)
            const photo = list.find((s) => s.photos?.length)?.photos[0]
            return (
              <article key={k.id} className="guide-card" style={{ '--kc': k.color }}>
                <div className="guide-icon"><i className={`bi bi-${k.icon}`} /></div>
                <div className="guide-body">
                  <h3>{k.name}<small>{k.gist}</small></h3>
                  {photo && <figure className="guide-photo"><img src={photo.src} alt={photo.caption} loading="lazy" /><figcaption>{photo.caption} · {creditText(photo)}</figcaption></figure>}
                  <p>{k.text}</p>
                  <div className="guide-tip"><i className="bi bi-lightbulb me-1" />{k.tip}</div>
                  <div className="guide-where">이런 곳에서 볼 수 있어요</div>
                  <div className="guide-spots">
                    {list.length ? list.map((s) => <Link key={s.id} to={`/spots/${s.id}`}>{s.name}</Link>) : <span className="text-muted small">등록된 명소가 없어요</span>}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
