// ⑤ 제주특별자치도청 오픈API — 제주돌문화공원 전시 정보 (Jeju-OpenAPI-F06, 인증키 없음, XML)
//    전시/행사명·기간·운영시간·소개·표지 이미지·진행 상태(ING/END)
import { XMLParser } from 'fast-xml-parser'

const URL = 'http://www.jeju.go.kr/rest/JejuExhibitionService/getStoneparkExhibitionList'
const parser = new XMLParser({ parseTagValue: false })
let cache = null // 목록이 작고(약 160건) 자주 바뀌지 않아 10분 동안 메모리에 둔다

async function loadAll() {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.list
  const r = await fetch(`${URL}?page=1&pageSize=500`, { signal: AbortSignal.timeout(10000) })
  if (!r.ok) throw new Error(`제주돌문화공원 전시 API ${r.status}`)
  const api = parser.parse(await r.text())?.jejunetApi
  if (!api || api.resultCode !== '00') throw new Error(`제주돌문화공원 전시 API: ${api?.resultMsg ?? '응답 형식 오류'}`)
  const https = (u) => (u ? u.replace('http://', 'https://') : '')
  const list = [].concat(api.items?.item ?? []).map((i) => ({
    id: i.seq, title: i.title, start: i.start, end: i.end, hour: i.hour ?? '', owner: i.owner ?? '', tel: i.tel ?? '',
    intro: (i.intro ?? '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim(), status: i.stat,
    kind: i.divName ?? '', cover: https(i.cover), thumb: https(i.coverThumb),
  })).sort((a, b) => String(b.start).localeCompare(String(a.start)))
  cache = { at: Date.now(), list }
  return list
}

// status: 'ING' 진행 중 · 'END' 지난 것 · 비우면 전체. 최근 시작한 순서
export async function stoneparkExhibitions({ status = '', limit = 10 } = {}) {
  const list = await loadAll()
  return list.filter((e) => !status || e.status === status).slice(0, Math.min(Number(limit) || 10, 50))
}
