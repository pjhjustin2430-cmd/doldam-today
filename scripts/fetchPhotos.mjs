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
  'hwanhae-samyang': [HANDONG],
  'hwanhae-handam': [HANDONG],
  'hwanhae-onpyeong': [HANDONG],
  seongeup: [
    ['Seongeup Historic Village.jpg', '성읍민속마을 초가 골목', 'seongeup-1'],
    ['Seongeup Folk Village 01.jpg', '성읍민속마을 돌담 골목', 'seongeup-2'],
    ['Seongeup Historic Village Dol hareubang.jpg', '돌하르방과 돌담', 'seongeup-3'],
  ],
  gapado: [['Gapado scenery.JPG', '가파도 돌담길', 'gapado-1']],
  udo: [['Udo, Jeju Province, South Korea 02.jpg', '우도 해안과 마을', 'udo-1']],
  gimnyeong: [['13 사진 지질마을이야기 만장굴 둘러보기 밭담1.JPG', '김녕 만장굴 일대 밭담', 'gimnyeong-batdam']],
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
// ── 한국관광공사 TourAPI: 그 장소 자체의 사진 (contentId 의 detailImage2). 눈으로 확인해 고른 사진 이름 목록.
//    mode 'replace' = 이 사진들만, 'append' = 위의 커먼즈 사진 뒤에 덧붙임. 사진마다 공공누리 유형을 따로 기록한다.
//    (제3유형은 출처 표시 + 변경 금지: 크기만 줄이고 자르거나 합성하지 않는다)
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const KEY = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).filter((x) => x.startsWith('DATA_GO_KR_KEY=')).map((x) => x.slice(15).trim())[0] ?? env.DATA_GO_KR_KEY // 유효한 키가 둘째 줄에 있어도 첫 줄 우선
const KOGL = {
  Type1: ['공공누리 제1유형', 'https://www.kogl.or.kr/info/licenseType1.do'],
  Type3: ['공공누리 제3유형', 'https://www.kogl.or.kr/info/licenseType3.do'],
}
const TOUR = {
  gamsugul: { contentId: 3056401, mode: 'replace', caption: '감수굴밭담길', names: ['감수굴 밭담길 (6)', '감수굴 밭담길 (4)', '감수굴 밭담길 (14)', '감수굴 밭담길 (12)'] },
  gueom: { contentId: 2779527, mode: 'replace', caption: '구엄리 돌염전', names: ['제주_구엄리 돌염전 (6)', '제주_제주_구엄리 돌염전_외부_3.jpg', '제주_제주_구엄리 돌염전_외부_2.jpg', '제주_제주_구엄리 돌염전_외부_4.jpg'] },
  sinsan: { contentId: 3553902, mode: 'replace', caption: '신산환해장성', names: ['서귀포_신산환해장성 (1)', '서귀포_신산환해장성 (4)', '서귀포_신산환해장성 (2)'] },
  sinheung: { contentId: 129402, mode: 'replace', caption: '신흥리 방사탑', names: ['제주_제주_방사탑(제주)_외부_4.JPG', '제주_제주_방사탑(제주)_외부_2.JPG', '제주_제주_방사탑(제주) (1)', '제주_제주_방사탑(제주)_외부_1.JPG'] },
  sinpung: { contentId: 2661821, mode: 'replace', caption: '신풍리 밭담길', names: ['신풍리 밭담길_2', '제주_서귀포_신풍리 밭담길(11)', '제주_서귀포_신풍리 밭담길(12)'] },
  seongeup: { contentId: 126471, mode: 'append', caption: '성읍민속마을', names: ['돌담과 초가에 남은 삶, 제주 성읍마을 여행_제주_서귀포_성읍민속마을_5.jpg', '제주_성읍민속마을 (7)'] },
  gapado: { contentId: 126446, mode: 'append', caption: '밭이 돌담으로 나뉜 가파도', names: ['가파도 (1)'] },
  byeolbangjin: { contentId: 128796, mode: 'replace', caption: '별방진', names: ['별방진_6', '별방진_9'] },
}
const sharp = (await import('sharp')).default
for (const [id, t] of Object.entries(TOUR)) {
  const r = await (await fetch('https://apis.data.go.kr/B551011/KorService2/detailImage2?' + new URLSearchParams({
    serviceKey: KEY, MobileOS: 'ETC', MobileApp: 'DoldamToday', _type: 'json', contentId: String(t.contentId), imageYN: 'Y', numOfRows: '50', pageNo: '1',
  }))).json()
  const items = [].concat(r.response?.body?.items?.item ?? [])
  const list = []
  for (const [i, wanted] of t.names.entries()) {
    const it = items.find((x) => x.imgname === wanted)
    if (!it) throw new Error(`${id}: 사진 "${wanted}" 을 TourAPI 에서 못 찾음`)
    const name = `${id}-kto-${i + 1}`
    const file = path.join(OUT, `${name}.jpg`)
    if (!fs.existsSync(file)) {
      const buf = await download(it.originimgurl.replace('http://', 'https://'))
      await sharp(buf).rotate().resize({ width: 960, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(file) // 크기만 줄임
      console.log('받음', name, wanted, it.cpyrhtDivCd)
      await sleep(600)
    }
    const [license, licenseUrl] = KOGL[it.cpyrhtDivCd] ?? ['공공누리', 'https://www.kogl.or.kr']
    list.push({ src: `/doldam/spots/${name}.jpg`, caption: t.caption, credit: '한국관광공사', license, licenseUrl, source: 'TourAPI' })
  }
  result[id] = t.mode === 'append' ? [...(result[id] ?? []), ...list] : list
}

// 쓰지 않게 된 예전 사진 파일 정리
const used = new Set(Object.values(result).flat().map((p) => path.basename(p.src)))
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.jpg') && !used.has(f)) { fs.unlinkSync(path.join(OUT, f)); console.log('정리', f) }

fs.writeFileSync(jsonFile, JSON.stringify(result, null, 1))
console.log('명소', Object.keys(result).length, '곳 / 사진', Object.values(result).flat().length, '장')
