import { stoneparkExhibitions } from '../server/stonepark.js'

// /api/exhibitions?status=ING&limit=5  — 제주돌문화공원 전시·행사 (제주특별자치도청 오픈API)
export default async function handler(req, res) {
  try {
    res.status(200).json(await stoneparkExhibitions({ status: req.query.status ?? '', limit: req.query.limit }))
  } catch (e) { res.status(502).json({ error: e.message }) }
}
