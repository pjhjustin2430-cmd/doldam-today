import { getKinds, listSpots } from '../server/doldam.js'

// 돌담 종류(도감)와 명소 목록을 한 번에 내려준다
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600')
  res.status(200).json({ kinds: getKinds(), spots: listSpots() })
}
