// 장소를 지도 앱/웹으로 여는 링크. 카카오맵은 좌표로 핀을 찍고, 네이버맵은 주소+이름으로 검색한다
export const kakaoPin = (name, lat, lng) => `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`
export const naverSearch = (name, addr = '') =>
  `https://map.naver.com/p/search/${encodeURIComponent(`${addr.split(' ').slice(0, 3).join(' ')} ${name}`.trim())}`
