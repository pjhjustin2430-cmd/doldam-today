# 돌담 오늘 · 제주 돌담 3D 지도

바람 많은 섬이 쌓은 제주 돌담(밭담·환해장성·진성·마을 돌담·방사탑·돌염전)을 3D 지도에서 고르고, 오늘 날씨(바람·비·미세먼지)에 맞는 곳을 추천받는 웹앱.
공공데이터 5종(제주 무장애여행정보 CSV · 제주도청 돌문화공원 전시 API · 기상청 단기예보 · 에어코리아 · 관광공사 TourAPI) + AI 에이전트(돌담지기, 도구 6개) + Supabase 돌담 수첩.

## 실행
- 더블클릭: `start.bat` (처음이면 `npm install` 후 http://localhost:5173 을 열고 개발 서버 실행)
- 직접: `.env.example` 을 `.env.local` 로 복사해 값 채우기 → `npm install` → `npm run dev` (개발 서버가 `/api/*` 도 함께 처리)
- Supabase SQL Editor 에서 아래 실행 (돌담 수첩은 `source = 'doldam'` 으로 구분)

```sql
create table favorites (
  id bigint generated always as identity primary key,
  nickname text not null, source text not null, item_id text not null, title text not null,
  created_at timestamptz default now()
);
alter table favorites enable row level security;
create policy "read all" on favorites for select using (true);
create policy "insert all" on favorites for insert with check (true);
create policy "delete all" on favorites for delete using (true);
```

## 데이터
| 출처 | 쓰는 곳 |
|---|---|
| 제주특별자치도 무장애여행정보 40 돌문화공원 (CSV 2개 + 사진) | 실측 경로 170점·고도·구간별 접근성·사진 → 돌문화공원 상세 |
| 제주특별자치도 무장애여행정보 25 감수굴밭담길 + 관광지주변정보 (CSV 2개) | 경로·접근성·주변 시설 → 감수굴밭담길 상세 |
| 제주특별자치도청 오픈API 제주돌문화공원 전시 정보 (F06, 키 없음·XML) | 돌문화공원 상세의 "전시·행사", 에이전트 도구 |
| 한국관광공사 TourAPI KorService2 (`locationBasedList2`) | 명소 주변 관광지·식당·숙박·사진 |
| 기상청 단기예보 / 한국환경공단 에어코리아 | 바람·비·미세먼지 → 걷기 적합도, 오늘의 추천 |
| Open-Meteo Elevation (Copernicus DEM 90m, 키 없음) | 경로 파일에 고도가 없는 감수굴밭담길의 고도 프로필 |
| southkorea-maps (kostat 2013) | 해안선 → `src/data/jejuCoast.json` |

- 명소 데이터 만들기: `node scripts/buildDoldam.mjs` → `server/data/doldamSpots.json` 과 `public/doldam/stonepark/*.jpg`(사진을 960px 로 줄임)
- 감수굴밭담길·돌문화공원은 CSV 의 실측 좌표입니다. 나머지 10곳(환해장성 3·별방진·성읍·방사탑·가파도·우도·구엄 돌염전·김녕)은 직접 정리한 대표 명소이고, 좌표는 OpenStreetMap Nominatim 으로 확인한 마을·해안 단위의 근사 위치입니다. 화면에도 "근사"로 표시하고 지도 앱 검색 링크를 둡니다.
- 서버 함수: `api/spots.js`(명소·종류) · `api/nearby.js` · `api/weather.js` · `api/air.js` · `api/agent.js`(도구: search_doldam_spots, get_spot_detail, get_weather, find_nearby_places, get_air_quality, get_stonepark_exhibitions) · `api/exhibitions.js`

## 네이버 지도 (선택)
명소 상세의 지도는 `VITE_NAVER_MAP_CLIENT_ID` 가 있으면 네이버 지도(일반·위성), 없으면 직접 그린 SVG 지도로 나옵니다.
1. [NAVER Cloud Platform 콘솔](https://console.ncloud.com) → AI·NAVER API → Application 등록 → **Maps > Dynamic Map** 선택
2. **Web 서비스 URL** 에 `http://localhost:5173` 과 배포 주소(Vercel)를 등록
3. 발급된 Client ID 를 `.env.local` 의 `VITE_NAVER_MAP_CLIENT_ID` 에 넣고 개발 서버를 다시 시작 (Vercel 은 환경변수에도 추가)

## 배포 (Vercel)
GitHub 연결 후 Import → Environment Variables 에 `.env.example` 의 4개 값 입력(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `DATA_GO_KR_KEY`, `ANTHROPIC_API_KEY`, 선택: `VITE_NAVER_MAP_CLIENT_ID`).

## 알려진 한계와 실서비스라면
- Supabase `favorites` 의 RLS 정책이 누구나 읽기·쓰기·삭제 가능(실습용)입니다. 실서비스라면 Supabase Auth 로 로그인하게 하고 `auth.uid() = user_id` 로 본인 행만 다루도록 정책을 바꿔야 합니다.
- `/api/agent` 는 IP당 10분 20회·질문 500자 제한이 있지만 서버리스 인스턴스별 메모리 기준이라 최소한의 방어입니다. 실서비스라면 Upstash 같은 외부 저장소로 세어야 합니다.
- 근사 위치 10곳은 지도 앱에서 이름으로 확인하세요.
- 돌담 사진은 `node scripts/fetchPhotos.mjs` 가 위키미디어 커먼즈(CC BY-SA)·공공누리 1유형 사진을 받아 `public/doldam/spots/` 에 저장하고, 작성자·라이선스·원본 링크를 `server/data/spotPhotos.json` 에 기록합니다. 사진이 없는 명소(별방진)는 사진 칸을 만들지 않고, 장소가 다른 사진은 캡션에 실제 장소를 밝힙니다. 반영은 `node scripts/buildDoldam.mjs`.
