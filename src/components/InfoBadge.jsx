// 명소 위치·경로 정보가 얼마나 믿을 만한지 한눈에 보여주는 배지
//  - 실측 경로: 공공데이터 CSV 의 GPS 좌표
//  - 관광공사 좌표: 한국관광공사에 등록된 그 관광지의 좌표
//  - 지명 확인: 지오코딩으로 그 이름의 위치를 확인
//  - 근사 위치: 마을·해안 단위의 대략적인 위치
export function infoLevel(spot) {
  if (spot.hasTrack) return { key: 'track', label: '실측 경로', icon: 'check2-circle', hint: '공공데이터의 GPS 경로예요' }
  if (spot.coordSource === 'kto') return { key: 'kto', label: '관광공사 좌표', icon: 'patch-check', hint: '한국관광공사에 등록된 관광지의 좌표예요' }
  if (spot.approx) return { key: 'approx', label: '근사 위치', icon: 'geo-alt', hint: '마을·해안 단위의 대략적인 위치예요. 지도 앱에서 이름으로 확인하세요' }
  return { key: 'named', label: '지명 확인', icon: 'pin-map', hint: '지오코딩으로 이름의 위치를 확인했어요' }
}

export default function InfoBadge({ spot, className = '' }) {
  const l = infoLevel(spot)
  return <span className={`info-badge ${l.key} ${className}`} title={l.hint}><i className={`bi bi-${l.icon}`} />{l.label}</span>
}
