import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

// 디자인: Bootstrap 5 + Bootswatch 'sandstone' 위에 돌담 색을 덧입힘
import 'bootswatch/dist/sandstone/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/theme.css'

import { router } from './router'

createRoot(document.getElementById('root')).render(
  // StrictMode 는 drei <Html> 라벨이 개발 중 두 번 마운트되며 첫 라벨이 사라지는 문제가 있어 사용하지 않음
  <RouterProvider router={router} />,
)
