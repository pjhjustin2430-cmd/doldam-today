import { NavLink, Outlet } from 'react-router-dom'
import { Container, Nav, Navbar, Toast, ToastContainer } from 'react-bootstrap'
import { NAV_ITEMS } from '../router'
import AgentDock from '../components/AgentDock'
import SafetyBar from '../components/SafetyBar'
import { useAppStore } from '../store/useAppStore'

export default function RootLayout() {
  const toasts = useAppStore((s) => s.toasts)
  const nickname = useAppStore((s) => s.nickname)
  const agentOpen = useAppStore((s) => s.agentOpen)

  return (
    <div className={`d-flex flex-column min-vh-100 ${agentOpen ? 'dock-open' : ''}`}>
      <a href="#main" className="skip-link">본문 바로가기</a>
      <Navbar expand="md" className="olle-nav" collapseOnSelect sticky="top">
        <Container>
          <Navbar.Brand as={NavLink} to="/" className="brand">
            <span className="mark"><i className="bi bi-bricks" /></span>돌담 오늘
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              {NAV_ITEMS.map((item) => (
                <Nav.Link key={item.to} as={NavLink} to={item.to} end={item.to === '/'} eventKey={item.to}>
                  <i className={`bi bi-${item.icon} me-1`} />{item.label}
                </Nav.Link>
              ))}
            </Nav>
            {nickname && <Navbar.Text><i className="bi bi-person-circle me-1" />{nickname}</Navbar.Text>}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main id="main" className="flex-grow-1 py-4" tabIndex={-1}>
        <Container>
          <SafetyBar />
          <Outlet />
        </Container>
      </main>

      <footer className="py-4 olle-footer">
        <Container className="small">
          <div className="foot-title"><i className="bi bi-bricks me-2" />돌담 오늘 <span>제주 돌담을 날씨와 함께 고르는 학습용 프로젝트</span></div>
          <div className="foot-cols">
            <div>
              <h6>공공데이터</h6>
              <ul>
                <li>제주특별자치도 무장애여행정보 (감수굴밭담길·돌문화공원)</li>
                <li>제주특별자치도청 제주돌문화공원 전시 정보 API</li>
                <li>한국관광공사 TourAPI (주변 장소·사진)</li>
                <li>기상청 단기예보 · 한국환경공단 에어코리아</li>
              </ul>
            </div>
            <div>
              <h6>지도·보조 데이터</h6>
              <ul>
                <li>돌담 사진 Wikimedia Commons (CC BY-SA 등)·공공누리 1유형, 작성자는 사진 아래 표시</li>
                <li>고도 Open-Meteo (Copernicus DEM 90m) · 미세먼지 대체값 Open-Meteo 대기질(CAMS 모델 추정)</li>
                <li>위치 확인 OpenStreetMap Nominatim (© OpenStreetMap contributors)</li>
                <li>행정구역 경계 southkorea-maps (통계청 2013)</li>
              </ul>
            </div>
            <div>
              <h6>알아두세요</h6>
              <ul>
                <li>실측 경로 2곳, 관광공사 등록 좌표 7곳, 나머지는 마을·해안 단위의 근사 위치예요.</li>
                <li>사진이 없는 명소는 사진 칸을 두지 않아요. 장소가 다른 사진은 실제 장소를 밝혀요.</li>
                <li>날씨는 예보라 실제와 다를 수 있어요.</li>
              </ul>
            </div>
          </div>
        </Container>
      </footer>

      <AgentDock />

      <ToastContainer position="bottom-end" className="p-3 position-fixed toast-wrap">
        {toasts.map((t) => (
          <Toast key={t.id} bg={t.variant}><Toast.Body className="text-white">{t.message}</Toast.Body></Toast>
        ))}
      </ToastContainer>
    </div>
  )
}
