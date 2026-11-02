import { findSpot } from '../server/doldam.js'
import { nearbyPlaces } from '../server/tour.js'

// /api/nearby?lat=..&lng=..&type=39&radius=5000  (또는 id=명소 id → 그 명소 주변)
export default async function handler(req, res) {
  try {
    let { lat, lng } = req.query
    if (!lat || !lng) {
      const spot = findSpot(req.query.id)
      if (!spot) return res.status(404).json({ error: '없는 명소예요' })
      ;({ lat, lng } = spot)
    }
    const data = await nearbyPlaces({
      lat, lng, contentTypeId: req.query.type ?? '', radius: Number(req.query.radius) || 3000,
      rows: Number(req.query.rows) || 8,
    })
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600') // 성공했을 때만 CDN 에 저장
    res.status(200).json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
}
