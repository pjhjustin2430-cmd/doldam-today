import { useEffect } from 'react'

const BASE = '돌담 오늘'

// 페이지마다 탭 제목을 바꾼다 (예: "돌문화공원 · 돌담 오늘")
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : `${BASE} · 제주 돌담 3D`
  }, [title])
}
