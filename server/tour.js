// ③ 한국관광공사 TourAPI(KorService2) — 좌표 주변의 관광지·숙박·식당
import { fetchJson, toList } from './http.js'

const TYPE = { 12: '관광지', 14: '문화시설', 15: '축제·행사', 32: '숙박', 39: '음식점' }

export async function nearbyPlaces({ lat, lng, radius = 3000, contentTypeId = '', rows = 8 } = {}) {
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, MobileOS: 'ETC', MobileApp: 'DoldamToday', _type: 'json',
    numOfRows: String(rows), pageNo: '1', mapX: String(lng), mapY: String(lat), radius: String(radius), arrange: 'E',
  })
  if (contentTypeId) params.set('contentTypeId', String(contentTypeId))
  const data = await fetchJson(`https://apis.data.go.kr/B551011/KorService2/locationBasedList2?${params}`, 'TourAPI')
  const header = data?.response?.header
  if (header && header.resultCode !== '0000') throw new Error(`TourAPI: ${header.resultMsg}`)
  return toList(data?.response?.body?.items?.item).map((p) => ({
    id: p.contentid, title: p.title, addr: p.addr1, type: TYPE[p.contenttypeid] ?? '장소',
    dist: Math.round(Number(p.dist)), lat: Number(p.mapy), lng: Number(p.mapx), image: p.firstimage ? p.firstimage.replace('http://', 'https://') : '',
  }))
}
