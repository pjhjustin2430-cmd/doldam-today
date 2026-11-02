import { getAirQuality } from '../server/air.js'
export default async function handler(req, res) {
  try { res.status(200).json(await getAirQuality()) }
  catch (e) { res.status(500).json({ error: e.message }) }
}
