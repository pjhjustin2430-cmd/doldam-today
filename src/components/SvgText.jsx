// 단위가 km 같은 작은 SVG 좌표계에서는 font-size 가 1px 미만이 되어 브라우저가 최소 글자 크기를 적용하고 가운데 정렬이 어긋난다.
// 그래서 글자는 font-size 10 으로 그리고 transform 으로 원하는 크기만큼 줄여 배치한다.
export default function SvgText({ x, y, size, children, ...rest }) {
  return <text transform={`translate(${x} ${y}) scale(${size / 10})`} fontSize="10" textAnchor="middle" {...rest}>{children}</text>
}
