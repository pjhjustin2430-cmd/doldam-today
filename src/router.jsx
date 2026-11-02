import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import DoldamMap from './pages/DoldamMap'
import Spots from './pages/Spots'
import SpotDetail from './pages/SpotDetail'
import Guide from './pages/Guide'
import Agent from './pages/Agent'
import My from './pages/My'
import NotFound from './pages/NotFound'

export const NAV_ITEMS = [
  { to: '/', label: '홈', icon: 'house' },
  { to: '/map', label: '3D 지도', icon: 'map' },
  { to: '/spots', label: '명소', icon: 'list-ul' },
  { to: '/guide', label: '돌담 도감', icon: 'journal-bookmark' },
  { to: '/agent', label: '돌담지기', icon: 'chat-dots' },
  { to: '/my', label: '내 수첩', icon: 'patch-check' },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: 'map', element: <DoldamMap /> },
      { path: 'spots', element: <Spots /> },
      { path: 'spots/:id', element: <SpotDetail /> },
      { path: 'guide', element: <Guide /> },
      { path: 'agent', element: <Agent /> },
      { path: 'my', element: <My /> },
      { path: '*', element: <NotFound /> }, // 없는 주소는 메뉴·푸터가 있는 레이아웃 안에서 안내
    ],
  },
])
