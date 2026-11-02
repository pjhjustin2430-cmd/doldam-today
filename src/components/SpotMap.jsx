import { useState } from 'react'
import { NAVER_KEY } from '../lib/naverMaps'
import NaverSpotMap from './NaverSpotMap'
import SpotMapSvg from './SpotMapSvg'

// 명소 지도: 네이버 지도 키(VITE_NAVER_MAP_CLIENT_ID)가 있으면 네이버 지도, 없거나 인증에 실패하면 직접 그린 SVG 지도
export default function SpotMap(props) {
  const [failed, setFailed] = useState(!NAVER_KEY)
  return failed ? <SpotMapSvg {...props} /> : <NaverSpotMap {...props} onFail={() => setFailed(true)} />
}
