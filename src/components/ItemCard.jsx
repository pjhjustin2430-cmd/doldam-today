import { Badge, Button, Card } from 'react-bootstrap'
import { creditText } from '../lib/photoCredit'

// 완주 수첩 등 목록의 한 칸을 표시하는 재사용 카드
export default function ItemCard({ title, subtitle, badge, photo, color, onRemove }) {
  return (
    <Card className="h-100 item-card" style={color ? { '--kc': color } : undefined}>
      {photo
        ? <div className="item-card-img has-photo" role="img" aria-label={photo.caption} style={{ backgroundImage: `linear-gradient(0deg, rgba(0,0,0,.4), rgba(0,0,0,0)), url(${photo.src})` }}><small className="head-credit">{creditText(photo)}</small></div>
        : <div className="item-card-img placeholder-img"><i className="bi bi-patch-check" /></div>}
      <Card.Body className="d-flex flex-column">
        {badge && <Badge bg="success" className="align-self-start mb-2">{badge}</Badge>}
        <Card.Title className="fs-6 fw-bold">{title}</Card.Title>
        {subtitle && <Card.Text className="small text-muted">{subtitle}</Card.Text>}
        {onRemove && (
          <Button size="sm" variant="outline-danger" className="mt-auto" onClick={onRemove}>
            <i className="bi bi-trash me-1" />도장 지우기
          </Button>
        )}
      </Card.Body>
    </Card>
  )
}
