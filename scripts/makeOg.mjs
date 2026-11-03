// 공유 미리보기(og.png 1200x630)와 홈 화면 아이콘(icon-180.png)을 만든다. 사진: 한국관광공사(공공누리 제1유형) — 출처를 이미지에 함께 적는다.
import sharp from 'sharp'
const FONT = "'Malgun Gothic','Pretendard','Noto Sans KR',sans-serif"
const photo = await sharp('public/doldam/spots/sinsan-kto-1.jpg').resize(1200, 790, { fit: 'cover' }).extract({ left: 0, top: 0, width: 1200, height: 630 }).toBuffer()
const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#1b2a2f" stop-opacity=".92"/><stop offset=".6" stop-color="#1b2a2f" stop-opacity=".6"/><stop offset="1" stop-color="#1b2a2f" stop-opacity=".05"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="72" y="150" width="72" height="72" rx="16" fill="#5f7f3e"/>
  <g fill="#e9efdd"><rect x="86" y="166" width="24" height="14" rx="3"/><rect x="114" y="166" width="16" height="14" rx="3"/><rect x="86" y="184" width="14" height="14" rx="3"/><rect x="104" y="184" width="26" height="14" rx="3"/></g>
  <text x="72" y="320" font-family="${FONT}" font-size="104" font-weight="800" fill="#fff">돌담 오늘</text>
  <text x="76" y="392" font-family="${FONT}" font-size="40" font-weight="600" fill="#e3ecd2">오늘 날씨에 맞는 제주 돌담 14곳</text>
  <text x="76" y="446" font-family="${FONT}" font-size="30" fill="#c9d6cc">밭담 · 환해장성 · 방사탑 · 돌염전 · 돌문화공원</text>
  <text x="1188" y="612" text-anchor="end" font-family="${FONT}" font-size="18" fill="#ffffff" fill-opacity=".85">사진: 한국관광공사 · 공공누리 제1유형</text>
</svg>`)
await sharp(photo).composite([{ input: overlay }]).png().toFile('public/images/og.png')

const icon = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="#3a3f44"/>
  <g fill="#5d646a"><rect x="14" y="30" width="74" height="34" rx="8"/><rect x="96" y="30" width="70" height="34" rx="8"/><rect x="14" y="72" width="40" height="34" rx="8"/><rect x="62" y="72" width="74" height="34" rx="8"/><rect x="144" y="72" width="22" height="34" rx="8"/><rect x="14" y="114" width="74" height="34" rx="8"/><rect x="96" y="114" width="70" height="34" rx="8"/></g>
  <rect x="14" y="150" width="152" height="6" rx="3" fill="#7fa24f"/>
</svg>`)
await sharp(icon).png().toFile('public/images/icon-180.png')
console.log('og.png, icon-180.png 생성')
