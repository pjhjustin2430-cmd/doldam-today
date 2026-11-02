import LeafletSpotMap from './LeafletSpotMap'

// 명소 지도: OpenStreetMap(+위성) 실제 지도 (키가 필요 없다)
export default function SpotMap(props) {
  return <LeafletSpotMap {...props} />
}
