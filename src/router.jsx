import { useEffect } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import WindWall from './pages/WindWall'
import Spots from './pages/Spots'
import SpotDetail from './pages/SpotDetail'
import My from './pages/My'
import NotFound from './pages/NotFound'
import { useAppStore } from './store/useAppStore'

export const NAV_ITEMS = [
  { to: '/', label: '홈', icon: 'house' },
  { to: '/spots', label: '명소·도감', icon: 'bricks' },
  { to: '/wind', label: '바람과 돌담', icon: 'wind' },
  { to: '/my', label: '내 수첩', icon: 'patch-check' },
]

// 예전 돌담지기 주소(/agent): 오른쪽 대화창을 열고 홈으로
function OpenAgent() {
  const setAgentOpen = useAppStore((s) => s.setAgentOpen)
  useEffect(() => { setAgentOpen(true) }, [setAgentOpen])
  return <Navigate to="/" replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: 'wind', element: <WindWall /> },
      { path: 'map', element: <Navigate to="/wind" replace /> }, // 예전 3D 지도 주소
      { path: 'spots', element: <Spots /> },
      { path: 'spots/:id', element: <SpotDetail /> },
      { path: 'guide', element: <Navigate to="/spots" replace /> }, // 예전 도감 주소
      { path: 'agent', element: <OpenAgent /> },
      { path: 'my', element: <My /> },
      { path: '*', element: <NotFound /> }, // 없는 주소는 메뉴·푸터가 있는 레이아웃 안에서 안내
    ],
  },
])
