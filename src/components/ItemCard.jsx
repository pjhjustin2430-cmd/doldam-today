import { Badge, Button, Card } from 'react-bootstrap'

// 완주 수첩 등 목록의 한 칸을 표시하는 재사용 카드
export default function ItemCard({ title, subtitle, badge, onRemove }) {
  return (
    <Card className="h-100 item-card">
      <div className="item-card-img placeholder-img"><i className="bi bi-patch-check" /></div>
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
