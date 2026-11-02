// 돌담 오늘 데이터 만들기
//   node scripts/buildDoldam.mjs
// 입력: src/data/ 의 무장애여행정보 CSV 4개 (제주특별자치도, 공공데이터포털 파일데이터)
//   - 040-1.csv / 040-2.csv  돌문화공원: 실측 경로(위도·경도·고도) + 장소별 설명·사진
//   - 25-감수굴밭담길 무장애여행정보 / 관광지주변정보: 지점 좌표·접근성·주변 시설
// 출력: server/data/doldamSpots.json, public/doldam/stonepark/*.jpg (웹용으로 줄인 사진)
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const DATA = path.join(ROOT, 'src/data')

function readCsv(file) {
  const buf = fs.readFileSync(path.join(DATA, file))
  let text
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf) } catch { text = new TextDecoder('euc-kr').decode(buf) }
  const rows = []
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    if (!line.trim()) continue
    const cells = []
    let cur = '', q = false
    for (const ch of line) {
      if (ch === '"') q = !q
      else if (ch === ',' && !q) { cells.push(cur); cur = '' } else cur += ch
    }
    cells.push(cur)
    rows.push(cells.map((c) => c.trim()))
  }
  const [head, ...body] = rows
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}

const km = (a, b) => Math.hypot((a[0] - b[0]) * 111, (a[1] - b[1]) * 92.6)
const length = (pts) => pts.reduce((s, p, i) => (i ? s + km(pts[i - 1], p) : 0), 0)
const r5 = (n) => Math.round(n * 1e5) / 1e5
const unique = (list, key) => list.filter((x, i) => list.findIndex((y) => key(y) === key(x)) === i) // 같은 안내가 두 번 적힌 행 제거

// ── 돌문화공원 ─────────────────────────────────────────────
const track = readCsv('040-1.csv').map((r) => ({ lat: +r['위도'], lng: +r['경도'], ele: +r['고도'] })).filter((p) => p.lat && p.lng)
const stoneWay = readCsv('040-2.csv')
  .map((r) => ({
    lat: +r['위도'], lng: +r['경도'], ele: r['고도'] ? +r['고도'] : null,
    name: r['장소명'], desc: r['장소설명'], file: r['이미지파일명'],
  }))
  .filter((r) => r.lat && r.lng)

const photoDir = path.join(ROOT, 'public/doldam/stonepark')
fs.mkdirSync(photoDir, { recursive: true })
const photos = []
for (const w of stoneWay.filter((r) => r.file)) {
  const src = path.join(DATA, 'images', w.file)
  if (!fs.existsSync(src)) continue
  const out = `${w.file.replace(/^040_/, '').replace(/\.jpg$/i, '')}.jpg`
  await sharp(src).rotate().resize({ width: 960, withoutEnlargement: true }).jpeg({ quality: 72, mozjpeg: true }).toFile(path.join(photoDir, out))
  photos.push({
    src: `/doldam/stonepark/${out}`, caption: w.name || w.desc || '돌문화공원', lat: r5(w.lat), lng: r5(w.lng),
    credit: '제주특별자치도 무장애여행정보', license: '공공데이터',
  })
}
// 돌담이 잘 보이는 사진(돌조각상과 돌담길, 어머니의 방 돌집, 돌담 옆 관람로, 돌무더기)을 앞에 둔다. 나머지는 원래 순서
const STONE_FIRST = ['DSC00193', 'DSC00194', 'DSC00182', 'DSC00192', 'DSC00179', 'DSC00190', 'DSC00191']
const rank = (p) => { const i = STONE_FIRST.findIndex((f) => p.src.includes(f)); return i < 0 ? STONE_FIRST.length : i }
photos.sort((a, b) => rank(a) - rank(b))
// 앞쪽 사진은 무엇이 보이는지 알 수 있는 캡션으로 (원래 캡션은 접근성 조사용 안내 문구)
const NICE = {
  DSC00193: '돌조각상과 돌담이 이어진 관람로', DSC00194: '어머니의 방(돌집) 가는 길', DSC00182: '돌담과 돌조각상이 있는 관람로',
  DSC00192: '오백장군 갤러리 앞 돌담길', DSC00179: '돌담이 이어진 관람로', DSC00190: '돌무더기가 있는 관람로', DSC00191: '돌담 옆 관람로',
}
for (const p of photos) { const k = Object.keys(NICE).find((f) => p.src.includes(f)); if (k) p.caption = NICE[k] }
const stoneNotes = unique(stoneWay.filter((r) => !r.file && (r.name || r.desc))
  .map((r) => ({ name: r.name || r.desc, desc: r.name ? r.desc : '', lat: r5(r.lat), lng: r5(r.lng) })), (n) => `${n.name}|${n.desc}`)

// ── 감수굴밭담길 ─────────────────────────────────────────────
const wp = readCsv('제주특별자치도_무장애여행정보_25-감수굴밭담길_20201222.csv').map((r) => ({
  name: r['장소명칭'], detail: r['장소상세정보'], access: r['무장애관광정보'], course: r['추천코스여부'] === 'Y',
  lat: +r['위도'], lng: +r['경도'],
}))
const clean = (s) => (!s || s === '특이사항없음' ? '' : s)
const isToilet = (n) => /화장실/.test(n)
const gamPath = wp.filter((p) => p.course && !isToilet(p.name)).map((p) => [p.lat, p.lng])
  .filter((p, i, a) => !i || km(p, a[i - 1]) > 0.002) // 같은 지점 중복 제거
const gamPoints = unique(wp, (p) => `${p.name}|${p.detail}|${p.access}`).map((p) => ({ name: p.name, detail: clean(p.detail), access: clean(p.access), course: p.course, lat: r5(p.lat), lng: r5(p.lng) }))
const gamFacilities = readCsv('제주특별자치도_무장애여행관광지주변정보-25-감수굴밭담길_20201230.csv').map((r) => ({
  type: r['주변시설종류'], name: r['명칭'], radius: +r['반경(m)'], addr: r['주소'],
  tel: /^010-0000/.test(r['연락처']) ? '' : r['연락처'], info: r['이용정보'],
}))

// ── 돌담 종류(도감) ─────────────────────────────────────────────
const kinds = [
  { id: 'batdam', name: '밭담', color: '#6f8f3d', icon: 'grid-3x3', gist: '밭 둘레에 쌓은 돌담',
    text: '밭과 밭의 경계를 가르고, 거센 바람에 흙과 곡식이 날아가지 않도록 막아 주는 돌담이에요. 화산섬 밭에서 캐낸 돌로 쌓아서 구멍이 숭숭 뚫려 있고, 그 틈으로 바람이 빠져나가 담이 잘 무너지지 않아요. 제주의 밭담 농업은 2014년 세계중요농업유산(FAO)으로 등재됐어요.',
    tip: '밭담 길은 그늘이 적고 바람이 트여 있어요. 모자와 겉옷을 챙기세요.' },
  { id: 'hwanhae', name: '환해장성', color: '#3f6f8a', icon: 'bricks', gist: '해안을 따라 쌓은 방어 성벽',
    text: '고려 시대에 바다로 쳐들어오는 외적을 막으려고 제주 해안을 따라 쌓은 돌 성벽이에요. 지금은 곳곳에 끊어진 채 남아 있어요. 현무암을 그대로 쌓은 담이 바닷가를 따라 길게 이어지는 모습이 특징이에요.',
    tip: '바닷가라 바람과 파도의 영향을 크게 받아요. 풍속이 센 날에는 가까이 가지 마세요.' },
  { id: 'jinseong', name: '진성', color: '#8a5a3c', icon: 'shield', gist: '방어용 돌 성곽',
    text: '왜구 같은 외적을 막으려고 쌓은 돌 성곽이에요. 제주 바닷가 마을에는 진성이 여럿 있었고, 별방진은 그중 지금까지 성벽이 비교적 잘 남은 곳이에요.',
    tip: '성벽 위는 평평하지 않을 수 있어요. 비 온 뒤에는 미끄러우니 조심하세요.' },
  { id: 'village', name: '마을 돌담', color: '#a07f2e', icon: 'houses', gist: '집과 골목을 두른 돌담',
    text: '집 둘레와 골목(올레)을 따라 쌓은 돌담이에요. 담이 바람을 한 번 걸러 주어서 집 안까지 거센 바람이 들이치지 않아요. 초가와 돌담이 이어진 성읍민속마을이 대표적이에요.',
    tip: '사람이 사는 마을이라 조용히 걷고, 담이나 집 안쪽을 함부로 만지지 마세요.' },
  { id: 'bangsatap', name: '방사탑', color: '#7a5aa0', icon: 'triangle', gist: '마을을 지키는 돌탑',
    text: '마을의 기운이 허한 쪽을 막고 나쁜 기운을 물리치려고 돌을 원뿔형으로 쌓아 세운 탑이에요. 마을 입구나 바닷가 쪽에 세우는 경우가 많았어요.',
    tip: '돌탑은 무너지기 쉬워요. 올라가거나 돌을 빼지 마세요.' },
  { id: 'salt', name: '돌염전', color: '#2f9aa0', icon: 'droplet', gist: '바위 위에서 소금을 만들던 곳',
    text: '바닷가 평평한 현무암 바위 위에 바닷물을 가두고 햇볕에 말려 소금을 만들던 전통 염전이에요. 돌을 둘러 물이 고이게 한 흔적이 남아 있어요.',
    tip: '젖은 바위는 매우 미끄러워요. 물때와 파도를 확인하고 접근하세요.' },
  { id: 'park', name: '돌문화공원', color: '#4a4f55', icon: 'gem', gist: '제주 돌 문화를 모은 공원',
    text: '제주의 돌과 돌 문화, 설문대할망 설화를 주제로 만든 공원이에요. 공원 안을 걷는 관람로와 박물관이 있고, 휠체어가 다닐 수 있게 경사와 바닥 상태가 조사돼 있어요.',
    tip: '휠체어 대여와 장애인 화장실이 있어요. 관람로 일부에 오르막·내리막이 있어요.' },
]

// ── 돌담 명소 ─────────────────────────────────────────────
// 좌표: 감수굴·돌문화공원은 CSV 실측값, 나머지는 지오코딩(OpenStreetMap Nominatim)으로 확인한 마을·해안 단위의 근사 위치
const spots = [
  {
    id: 'gamsugul', name: '감수굴밭담길', label: '감수굴', kind: 'batdam', area: '제주시 구좌읍 평대리',
    lat: 33.53317, lng: 126.84211, approx: false, weather: '제주시',
    summary: '마을 안 밭담 사이로 걷는 무장애 산책길',
    story: '구좌읍 평대리 마을 안쪽에서 시작해 밭담 사이와 해안도로를 지나 다시 공영주차장으로 돌아오는 길이에요. 낮은 돌집과 퐁낭(팽나무) 그늘, 갯동산을 지나요. 일부 구간은 자갈길이라 휠체어나 유모차는 조심해야 해요.',
    path: gamPath.map(([a, b]) => [r5(a), r5(b)]), points: gamPoints, facilities: gamFacilities,
    source: '제주특별자치도 무장애여행정보 25 감수굴밭담길 (2020-12-22)',
  },
  {
    id: 'stonepark', name: '제주돌문화공원', label: '돌문화공원', kind: 'park', area: '제주시 조천읍 교래리',
    lat: 33.44873, lng: 126.66196, approx: false, weather: '제주시',
    summary: '돌 문화와 설문대할망 이야기를 걷는 공원',
    story: '주차장과 매표소에서 시작해 설문대할망 제단, 관람로, 박물관과 하늘 연못까지 이어지는 관람 경로예요. 휠체어 대여, 장애인 화장실, 경사·바닥 상태가 구간별로 조사돼 있어요.',
    path: track.map((p) => [r5(p.lat), r5(p.lng), Math.round(p.ele * 10) / 10]), notes: stoneNotes, photos,
    source: '제주특별자치도 무장애여행정보 40 돌문화공원',
  },
  { id: 'hwanhae-samyang', name: '삼양 환해장성', label: '삼양 환해장성', kind: 'hwanhae', area: '제주시 삼양동', lat: 33.5235, lng: 126.5878, approx: true, weather: '제주시',
    summary: '검은 모래 해변 곁에 남은 해안 성벽', story: '삼양동 바닷가를 따라 현무암 성벽이 이어져요. 해안을 지키던 환해장성이 마을 가까이에 남아 있는 곳이에요.' },
  { id: 'hwanhae-handam', name: '한담 환해장성', label: '한담', kind: 'hwanhae', area: '제주시 애월읍 애월리', lat: 33.4601, lng: 126.311, approx: true, weather: '제주시',
    summary: '한담 해안 산책로에서 만나는 돌 성벽', story: '한담공원에서 곽지 쪽으로 걷는 해안 산책로 옆으로 환해장성이 이어져요. 바다와 돌담이 함께 보이는 길이에요.' },
  { id: 'hwanhae-onpyeong', name: '온평 환해장성', label: '온평', kind: 'hwanhae', area: '서귀포시 성산읍 온평리', lat: 33.4026, lng: 126.9057, approx: true, weather: '서귀포시',
    summary: '온평 포구 옆으로 길게 이어진 성벽', story: '온평리 해안에 환해장성이 비교적 길게 남아 있어요. 도로 이름도 환해장성로예요.' },
  { id: 'byeolbangjin', name: '별방진', label: '별방진', kind: 'jinseong', area: '제주시 구좌읍 하도리', lat: 33.52621, lng: 126.88439, approx: false, weather: '제주시',
    summary: '하도리 마을 곁에 남은 돌 성곽', story: '왜구를 막으려고 쌓은 진성으로, 하도리에 둥글게 이어진 성벽이 남아 있어요. 성벽을 따라 한 바퀴 걸을 수 있어요.' },
  { id: 'seongeup', name: '성읍민속마을', label: '성읍', kind: 'village', area: '서귀포시 표선면 성읍리', lat: 33.3869, lng: 126.8016, approx: false, weather: '서귀포시',
    summary: '초가와 돌담 골목이 이어진 옛 마을', story: '돌담으로 둘러싸인 집과 골목, 초가가 이어진 마을이에요. 옛 정의현의 고을이 있던 곳으로, 지금도 사람이 사는 민속마을이에요.' },
  { id: 'bukchon', name: '북촌 방사탑', label: '북촌', kind: 'bangsatap', area: '제주시 조천읍 북촌리', lat: 33.5481, lng: 126.695, approx: true, weather: '제주시',
    summary: '마을을 지키려 쌓은 원뿔형 돌탑', story: '북촌리 마을과 포구 일대에서 방사탑을 볼 수 있어요. 마을 사람들이 액을 막으려고 돌을 쌓아 세운 탑이에요.' },
  { id: 'gapado', name: '가파도 밭담', label: '가파도', kind: 'batdam', island: true, area: '서귀포시 대정읍 가파리', lat: 33.1701, lng: 126.2716, approx: true, weather: '서귀포시',
    summary: '평평한 섬 전체를 두른 밭담', story: '우리나라 최남단 섬이에요. 평평한 섬 들판을 밭담이 구획하고 있어서 섬 둘레길을 걸으며 돌담을 볼 수 있어요. 배를 타고 들어가야 해요.' },
  { id: 'udo', name: '우도 밭담', label: '우도', kind: 'batdam', island: true, area: '제주시 우도면', lat: 33.5073, lng: 126.955, approx: true, weather: '제주시',
    summary: '검은 돌담과 푸른 바다가 맞닿은 섬', story: '우도의 밭과 마을 사이로 검은 돌담이 이어져요. 배를 타고 들어가야 하고, 섬 안에서는 걷거나 자전거로 둘러볼 수 있어요.' },
  { id: 'gueom', name: '구엄 돌염전', label: '구엄', kind: 'salt', area: '제주시 애월읍 구엄리', lat: 33.4788, lng: 126.3805, approx: true, weather: '제주시',
    summary: '바위 위에서 소금을 만들던 전통 염전', story: '구엄리 바닷가의 평평한 현무암 위에서 소금을 만들던 곳이에요. 돌로 둘러 바닷물을 가두던 흔적이 남아 있어요.' },
  { id: 'gimnyeong', name: '김녕 밭담', label: '김녕', kind: 'batdam', area: '제주시 구좌읍 김녕리', lat: 33.5501, lng: 126.7579, approx: true, weather: '제주시',
    summary: '바닷바람을 막는 구좌 해안의 밭담', story: '김녕과 월정 일대 구좌읍 들판은 밭담이 촘촘한 지역이에요. 바닷바람을 막으려 쌓은 낮은 돌담이 밭을 가로세로로 나눠요.' },
]

// 걷는 거리·시간: 실제 경로가 있으면 경로 길이로 계산
for (const s of spots) {
  if (s.path) {
    const pts = s.path.map((p) => [p[0], p[1]])
    s.dist = Math.round(length(pts) * 10) / 10
    s.minutes = Math.max(10, Math.round((s.dist / 3) * 60 / 5) * 5) // 시속 3km 기준
    s.hasTrack = true
  }
}

// 돌담 사진: scripts/fetchPhotos.mjs 가 받아 둔 위키미디어 커먼즈·공공누리 사진 (없는 명소는 사진 없이 둔다)
const photoFile = path.join(ROOT, 'server/data/spotPhotos.json')
const extraPhotos = fs.existsSync(photoFile) ? JSON.parse(fs.readFileSync(photoFile, 'utf8')) : {}
for (const s of spots) if (!s.photos && extraPhotos[s.id]) s.photos = extraPhotos[s.id]

fs.mkdirSync(path.join(ROOT, 'server/data'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'server/data/doldamSpots.json'), JSON.stringify({ kinds, spots }))
console.log('spots', spots.length, '| stonepark track', track.length, 'pts', spots[1].dist, 'km | photos', photos.length, '| gamsugul path', gamPath.length, 'pts', spots[0].dist, 'km')
