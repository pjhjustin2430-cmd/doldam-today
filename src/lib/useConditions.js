import { useEffect, useState } from 'react'
import { fetchAir, fetchWeather } from '../api/client'
import { walkability } from './walkability'

// 제주시(북)/서귀포시(남) 날씨 + 제주 미세먼지 → 걷기 적합도
export function useConditions(place) {
  const [state, setState] = useState({ loading: true, slots: [], air: [], error: '' })
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    Promise.allSettled([fetchWeather(place), fetchAir()]).then(([w, a]) => {
      if (!alive) return
      setState({
        loading: false,
        slots: w.value ?? [],
        air: a.value ?? [],
        error: [w, a].filter((r) => r.status === 'rejected').map((r) => r.reason.message).join(' / '),
      })
    })
    return () => { alive = false }
  }, [place])
  return { ...state, fit: walkability(state.slots, state.air) }
}

// 명소마다 데이터에 적힌 날씨 지역(제주시/서귀포시)을 따른다
export const placeOf = (spot) => spot.weather
