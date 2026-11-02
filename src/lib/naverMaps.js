// 네이버 지도 JavaScript API v3 (Dynamic Map) 로더. 키는 NCP 콘솔의 Maps 애플리케이션 Client ID 이고,
// 브라우저에 공개되는 값이라 VITE_ 로 둔다 (콘솔에서 허용 도메인으로 제한한다).
export const NAVER_KEY = import.meta.env.VITE_NAVER_MAP_CLIENT_ID

let loading = null

export function loadNaverMaps() {
  if (!NAVER_KEY) return Promise.reject(new Error('네이버 지도 키가 없어요'))
  if (window.naver?.maps) return Promise.resolve(window.naver.maps)
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      // 키가 틀렸거나 허용 도메인이 아니면 스크립트가 불러진 뒤에 이 함수가 호출된다
      window.navermap_authFailure = () => window.dispatchEvent(new Event('naver-auth-failed'))
      const s = document.createElement('script')
      s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(NAVER_KEY)}`
      s.async = true
      s.onload = () => (window.naver?.maps ? resolve(window.naver.maps) : reject(new Error('네이버 지도를 불러오지 못했어요')))
      s.onerror = () => reject(new Error('네이버 지도 스크립트를 불러오지 못했어요'))
      document.head.appendChild(s)
    }).catch((e) => { loading = null; throw e })
  }
  return loading
}
