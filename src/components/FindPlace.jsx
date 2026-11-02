// 찾아가기: 지명으로 카카오맵·네이버맵 검색 페이지(또는 앱)를 연다. 위치가 근사인 곳도 있어서 지명 검색이 더 정확하다.
export default function FindPlace({ title, name }) {
  const q = encodeURIComponent(`제주 ${name.split('·')[0]}`)
  return (
    <div className="find-place">
      <h4>{title}</h4>
      <div className="find-box">
        <a href={`https://map.kakao.com/link/search/${q}`} target="_blank" rel="noreferrer" className="find-link">
          <span className="logo kakao"><i className="bi bi-geo-alt-fill" /></span>
          <span>다음/카카오맵</span>
        </a>
        <a href={`https://map.naver.com/p/search/${q}`} target="_blank" rel="noreferrer" className="find-link">
          <span className="logo naver">N</span>
          <span>네이버맵</span>
        </a>
      </div>
      <div className="find-note">※ 누르면 해당 지도 페이지/앱으로 이동해요 · 검색어: {name.split('·')[0]}</div>
    </div>
  )
}
