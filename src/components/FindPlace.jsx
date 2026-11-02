// 찾아가기
//  - 카카오맵: 좌표를 도착지로 바로 지정하는 길찾기 주소(map.kakao.com/link/to/이름,위도,경도) — 이름 검색이 아니라서 지도에 그 이름이 없어도 연결된다
//  - 네이버지도: 이름 검색. 지도에 실제로 있는 이름(spot.mapQuery)으로 찾는다
// 위치가 근사인 명소는 도착 지점이 조금 다를 수 있다고 알려 준다.
export default function FindPlace({ title, spot }) {
  const query = encodeURIComponent(spot.mapQuery ?? spot.name)
  const kakao = `https://map.kakao.com/link/to/${encodeURIComponent(spot.name)},${spot.lat},${spot.lng}`
  const naver = `https://map.naver.com/p/search/${query}`
  return (
    <div className="find-place">
      <h4>{title}</h4>
      <div className="find-box">
        <a href={kakao} target="_blank" rel="noreferrer" className="find-link">
          <span className="logo kakao"><i className="bi bi-geo-alt-fill" /></span>
          <span>카카오맵<small>길찾기 (도착지 바로 지정)</small></span>
        </a>
        <a href={naver} target="_blank" rel="noreferrer" className="find-link">
          <span className="logo naver">N</span>
          <span>네이버지도<small>{spot.mapQuery ?? spot.name} 검색</small></span>
        </a>
      </div>
      <div className="find-note">
        ※ 카카오맵은 좌표로 도착지가 정해져요.
        {spot.approx && ' 이곳은 위치가 마을·해안 단위의 근사라 도착 지점이 조금 다를 수 있어요.'}
      </div>
    </div>
  )
}
