// ① 제주 돌담 명소 데이터 — 무장애여행정보 CSV(감수굴밭담길·돌문화공원) + 직접 정리한 대표 명소
//    scripts/buildDoldam.mjs 가 만든 server/data/doldamSpots.json 을 읽는다.
import data from './data/doldamSpots.json' with { type: 'json' }

export const getKinds = () => data.kinds
export const listSpots = () => data.spots
export const findSpot = (id) => data.spots.find((s) => s.id === id)
