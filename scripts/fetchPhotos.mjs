// 돌담 명소 사진 받기 (위키미디어 커먼즈의 자유 이용 사진 + 공공누리 사진)
//   node scripts/fetchPhotos.mjs   →   public/doldam/spots/*.jpg 와 server/data/spotPhotos.json
// 사진을 직접 눈으로 확인해 고른 목록이고, 작성자·라이선스·원본 링크를 함께 저장해 화면에 출처로 표시한다.
// 장소가 다른 사진은 caption 에 실제 장소를 적어 둔다 ("... (같은 방사탑)").
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'public/doldam/spots')
fs.mkdirSync(OUT, { recursive: true })

const H = { headers: { 'user-agent': 'doldam-today-student-project/1.0 (education)' } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const HANDONG = ['Handong Hwanhaejangseong.jpg', '구좌읍 한동리 환해장성 (같은 환해장성)', 'handong-hwanhae']
const PICKS = {
  gamsugul: [['Jeju traditional stone walls woljeongri jeju korea.jpg', '구좌읍 월정리 밭담 (이웃 마을)', 'woljeong-batdam']],
  'hwanhae-samyang': [HANDONG],
  'hwanhae-handam': [HANDONG],
  'hwanhae-onpyeong': [HANDONG],
  seongeup: [
    ['Seongeup Historic Village.jpg', '성읍민속마을 초가 골목', 'seongeup-1'],
    ['Seongeup Folk Village 01.jpg', '성읍민속마을 돌담 골목', 'seongeup-2'],
    ['Seongeup Historic Village Dol hareubang.jpg', '돌하르방과 돌담', 'seongeup-3'],
  ],
  bukchon: [
    ['Yongsu-ri bangsatap 01.jpg', '한경면 용수리 방사탑 (같은 방사탑)', 'yongsu-bangsatap-1'],
    ['Yongsu-ri bangsatap 02.jpg', '한경면 용수리 방사탑 (같은 방사탑)', 'yongsu-bangsatap-2'],
  ],
  gapado: [['Gapado scenery.JPG', '가파도 돌담길', 'gapado-1']],
  udo: [['Udo, Jeju Province, South Korea 02.jpg', '우도 해안과 마을', 'udo-1']],
  gimnyeong: [['13 사진 지질마을이야기 만장굴 둘러보기 밭담1.JPG', '김녕 만장굴 일대 밭담', 'gimnyeong-batdam']],
  gueom: [['Jeju Olle Route 16 (2).jpg', '구엄 돌염전', 'gueom-salt']],
}

const plain = (html = '') => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim()

async function fileInfo(title) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch('https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
      action: 'query', titles: `File:${title}`, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '960', format: 'json',
    }), H)
    try { return Object.values((await r.json()).query.pages)[0].imageinfo?.[0] } catch { await sleep(6000 * (i + 1)) }
  }
  throw new Error(`정보를 못 받음: ${title}`)
}
async function download(url) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url, H)
    if (r.ok) return Buffer.from(await r.arrayBuffer())
    await sleep(6000 * (i + 1))
  }
  throw new Error(`사진을 못 받음: ${url}`)
}

// 이미 받아 둔 사진은 다시 받지 않는다 (spotPhotos.json 의 출처 정보를 재사용)
const jsonFile = path.join(ROOT, 'server/data/spotPhotos.json')
const known = new Map()
if (fs.existsSync(jsonFile)) for (const list of Object.values(JSON.parse(fs.readFileSync(jsonFile, 'utf8')))) for (const p of list) known.set(p.src, p)

const done = new Map() // 같은 사진은 한 번만 받는다
const result = {}
for (const [id, picks] of Object.entries(PICKS)) {
  result[id] = []
  for (const [title, caption, name] of picks) {
    const old = known.get(`/doldam/spots/${name}.jpg`)
    if (!done.has(name) && old && fs.existsSync(path.join(OUT, `${name}.jpg`))) {
      const { src, caption: _c, ...meta } = old
      done.set(name, meta)
    }
    if (!done.has(name)) {
      const ii = await fileInfo(title); await sleep(1500)
      fs.writeFileSync(path.join(OUT, `${name}.jpg`), await download(ii.thumburl)); await sleep(1500)
      const m = ii.extmetadata ?? {}
      done.set(name, {
        credit: plain(m.Artist?.value) || '작성자 미상', license: m.LicenseShortName?.value ?? '', licenseUrl: m.LicenseUrl?.value ?? '',
        url: ii.descriptionurl, source: 'Wikimedia Commons',
      })
      console.log('받음', name, done.get(name).license, done.get(name).credit)
    }
    result[id].push({ src: `/doldam/spots/${name}.jpg`, caption, ...done.get(name) })
  }
}
// ── 한국관광공사 TourAPI: 별방진 (contentId 128796, 모든 사진이 공공누리 제1유형 = 출처 표시만 하면 이용 가능)
//    커먼즈에 별방진 사진이 없어서 관광공사에 등록된 같은 이름의 관광지 사진을 쓴다. 좌표는 buildDoldam.mjs 의 별방진 좌표(관광공사 등록 좌표)와 같다.
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
const TOUR = { 'byeolbangjin': { contentId: '128796', name: '별방진', count: 2, prefer: ['별방진_6', '별방진_9'] } }
const KOGL1 = 'https://www.kogl.or.kr/info/licenseType1.do'
const sharp = (await import('sharp')).default
for (const [id, t] of Object.entries(TOUR)) {
  result[id] = []
  const have = Array.from({ length: t.count }, (_, i) => `${id}-${i + 1}`)
  if (have.every((n) => fs.existsSync(path.join(OUT, `${n}.jpg`)) && known.has(`/doldam/spots/${n}.jpg`))) {
    for (const n of have) result[id].push(known.get(`/doldam/spots/${n}.jpg`))
    continue
  }
  const r = await fetch('https://apis.data.go.kr/B551011/KorService2/detailImage2?' + new URLSearchParams({
    serviceKey: env.DATA_GO_KR_KEY, MobileOS: 'ETC', MobileApp: 'DoldamToday', _type: 'json', contentId: t.contentId, imageYN: 'Y', numOfRows: '10', pageNo: '1',
  }))
  const imgs = [].concat((await r.json()).response?.body?.items?.item ?? []).filter((x) => x.cpyrhtDivCd === 'Type1' && (!t.prefer || t.prefer.includes(x.imgname))) // 성벽이 보이는 사진만 (포구 풍경은 제외)
    .sort((p, q) => (t.prefer ?? []).indexOf(p.imgname) - (t.prefer ?? []).indexOf(q.imgname)).slice(0, t.count) // 성벽이 잘 보이는 사진을 앞에
  for (const [i, x] of imgs.entries()) {
    const buf = await download(x.originimgurl.replace('http://', 'https://'))
    const name = `${id}-${i + 1}`
    await sharp(buf).rotate().resize({ width: 960, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(OUT, `${name}.jpg`))
    result[id].push({ src: `/doldam/spots/${name}.jpg`, caption: t.name, credit: '한국관광공사', license: '공공누리 제1유형', licenseUrl: KOGL1, source: 'TourAPI' })
    console.log('받음', name, x.imgname)
    await sleep(800)
  }
}

fs.writeFileSync(jsonFile, JSON.stringify(result, null, 1))
console.log('명소', Object.keys(result).length, '곳 / 사진', Object.values(result).flat().length, '장')
