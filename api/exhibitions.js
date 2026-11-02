import { stoneparkExhibitions } from '../server/stonepark.js'

// /api/exhibitions?status=ING&limit=5  — 제주돌문화공원 전시·행사 (제주특별자치도청 오픈API)
export default async function handler(req, res) {
  try {
    const data = await stoneparkExhibitions({ status: req.query.status ?? '', limit: req.query.limit })
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600') // 성공했을 때만 CDN 에 저장
    res.status(200).json(data)
  } catch (e) { res.status(502).json({ error: e.message }) }
}
