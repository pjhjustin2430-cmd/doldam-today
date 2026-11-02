import * as THREE from 'three'
import coast from '../data/jejuCoast.json'
import islands from '../data/jejuIslands.json'

// 위·경도 → km 비례 3D 좌표 (제주 중심 북위 33.38, 동경 126.55, 1단위 = 약 10km)
export const KX = 9.26, KZ = 11.1
export const toXZ = (lat, lng) => [(lng - 126.55) * KX, (33.38 - lat) * KZ]

const EXAG = 5 // 높이 과장 배수 (실제 한라산은 가로 대비 너무 낮아 5배)
const M = (meters) => (meters / 10000) * EXAG // 미터 → 3D 단위
export const LAND_Y = 0.05, SEA_Y = -0.02 // 해안(0m)의 땅 높이와 바다면 높이

// 한라산(1,947m) 백록담 위치. 오름·산은 넣지 않고 한라산 방패 모양과 분화구만 둔다
const PEAK = { lat: 33.3617, lng: 126.5292, h: 1947 }

// 높이(미터): 백록담에서 해안까지 동 38km · 서 34km · 북 18km · 남 13km 인 타원형 방패 + 백록담 분화구 + 완만한 골짜기 결
export function elevation(lat, lng) {
  const dx = (lng - PEAK.lng) * 92.6, dy = (lat - PEAK.lat) * 111
  const d = Math.hypot(dx / (dx > 0 ? 38 : 34), dy / (dy > 0 ? 18 : 13))
  let h = d < 1 ? PEAK.h * Math.pow(1 - d, 1.9) : 0
  const crater = Math.hypot(dx, dy)
  if (crater < 1.1) h -= (1 - crater / 1.1) * 130 // 백록담 분화구
  if (d > 0.1 && d < 1) { // 산비탈을 따라 흐르는 골짜기 결
    const ang = Math.atan2(dy, dx)
    h += (Math.sin(dx * 1.7) * Math.cos(dy * 2.1) * 9 + h * 0.04 * Math.sin(ang * 9 + d * 8)) * (1 - d)
  }
  return Math.max(0, h)
}

const ringXZ = (ring) => ring.map(([lng, lat]) => toXZ(lat, lng))

// 해안선 폴리곤을 캔버스에 칠해 두고 픽셀로 안팎을 판정한다 (점마다 다각형 검사를 하면 수십 초 걸림)
function maskCanvas(pts, x0, x1, z0, z1, nx, nz) {
  const cv = document.createElement('canvas')
  cv.width = nx + 1; cv.height = nz + 1
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  ctx.beginPath()
  pts.forEach(([x, z], i) => {
    const px = ((x - x0) / (x1 - x0)) * nx + 0.5, py = ((z - z0) / (z1 - z0)) * nz + 0.5
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
  })
  ctx.closePath(); ctx.fillStyle = '#000'; ctx.fill()
  return { cv, ctx }
}
function coastMask(pts, x0, x1, z0, z1, nx, nz) {
  const { ctx } = maskCanvas(pts, x0, x1, z0, z1, nx, nz)
  const data = ctx.getImageData(0, 0, nx + 1, nz + 1).data
  return (ix, iz) => data[(iz * (nx + 1) + ix) * 4 + 3] > 127
}

const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
const RAMP = [[0, '#929a9f'], [150, '#8c949a'], [500, '#818a91'], [900, '#939d98'], [1400, '#aab4ad'], [1800, '#c8cfc9']].map(([m, c]) => [m, hex(c)])
function rampColor(m) {
  let k = 0
  while (k < RAMP.length - 2 && m > RAMP[k + 1][0]) k++
  const [a, ca] = RAMP[k], [b, cb] = RAMP[k + 1], t = Math.min(1, Math.max(0, (m - a) / (b - a)))
  return [ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]
}
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const hash2 = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x) }

// 지형 색 텍스처: 높이별 현무암색 + 그림자(언덕 음영) + 등고선 + 저지대 밭담 격자 + 해안선·얕은 바다·파도 띠
function buildTexture(pts, x0, x1, z0, z1) {
  const W = 1600, H = Math.round((W * (z1 - z0)) / (x1 - x0))
  const { cv: mcv, ctx: mctx } = maskCanvas(pts, x0, x1, z0, z1, W - 1, H - 1)
  const land = mctx.getImageData(0, 0, W, H).data
  const isLand = (ix, iz) => ix >= 0 && iz >= 0 && ix < W && iz < H && land[(iz * W + ix) * 4 + 3] > 127
  const bcv = document.createElement('canvas')
  bcv.width = W; bcv.height = H
  const bctx = bcv.getContext('2d', { willReadFrequently: true })
  bctx.filter = 'blur(16px)' // 육지 마스크를 흐려서 바다가 해안에서 멀어질수록 진해지게
  bctx.drawImage(mcv, 0, 0)
  const blur = bctx.getImageData(0, 0, W, H).data

  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')
  const img = ctx.createImageData(W, H), out = img.data
  const t = (x1 - x0) / W, tz = (z1 - z0) / H // 한 픽셀의 3D 크기
  const L = [-0.55, 0.7, -0.45], lenL = Math.hypot(...L), flat = L[1] / lenL // 북서쪽 위에서 비추는 빛
  const DEEP = [201, 218, 214], SHALLOW = [232, 242, 239]

  for (let iz = 0; iz < H; iz++) {
    for (let ix = 0; ix < W; ix++) {
      const i4 = (iz * W + ix) * 4
      let r, g, b
      if (!isLand(ix, iz)) {
        const s = clamp((blur[i4 + 3] / 255) * 1.7)
        r = DEEP[0] + (SHALLOW[0] - DEEP[0]) * s; g = DEEP[1] + (SHALLOW[1] - DEEP[1]) * s; b = DEEP[2] + (SHALLOW[2] - DEEP[2]) * s
        // 해안에 바로 붙은 바다 픽셀은 파도 거품처럼 하얗게
        const near = isLand(ix + 1, iz) || isLand(ix - 1, iz) || isLand(ix, iz + 1) || isLand(ix, iz - 1)
        const near2 = near || isLand(ix + 2, iz) || isLand(ix - 2, iz) || isLand(ix, iz + 2) || isLand(ix, iz - 2)
        if (near2) { const a = near ? 0.9 : 0.45; r += (255 - r) * a; g += (255 - g) * a; b += (255 - b) * a }
      } else {
        const x = x0 + (ix + 0.5) * t, z = z0 + (iz + 0.5) * tz
        const lat = 33.38 - z / KZ, lng = 126.55 + x / KX
        const m = elevation(lat, lng), mx = elevation(lat, lng + t / KX), mz = elevation(lat - tz / KZ, lng)
        // 언덕 음영
        const hx = M(mx - m) / t, hz = M(mz - m) / tz, nl = Math.hypot(hx, 1, hz)
        const shade = (-hx * L[0] + L[1] - hz * L[2]) / (nl * lenL)
        const light = clamp(0.98 + (shade - flat) * 2.0, 0.7, 1.22)
        ;[r, g, b] = rampColor(m)

        // 저지대는 밭담으로 나뉜 밭 모양: 흔들리는 격자선 + 밭마다 살짝 다른 색
        const low = clamp(1 - (m - 120) / 330)
        if (low > 0) {
          const wx = x * 11 + 0.55 * Math.sin(z * 6.3 + 1.3) + 0.25 * Math.sin(z * 15 + 0.4) + 0.15 * Math.sin(x * 9)
          const wz = z * 13 + 0.55 * Math.sin(x * 5.1 + 2.1) + 0.25 * Math.sin(x * 17 + 1.1) + 0.15 * Math.sin(z * 8)
          const cx = Math.round(wx), cz = Math.round(wz)
          const tint = hash2(cx, cz)
          const mixG = low * 0.16 * (tint > 0.45 ? 1 : 0.35)
          r += (104 - r) * mixG; g += (132 - g) * mixG; b += (88 - b) * mixG // 이끼빛 밭
          const bright = 1 + (tint - 0.5) * 0.07 * low
          r *= bright; g *= bright; b *= bright
          const line = clamp(1 - Math.min(Math.abs(wx - cx) / (t * 11 * 0.7), Math.abs(wz - cz) / (tz * 13 * 0.7)))
          const k = line * 0.3 * low
          r += (44 - r) * k; g += (50 - g) * k; b += (54 - b) * k // 밭담 선
        }
        // 등고선: 100m 마다 흐리게, 500m 마다 진하게 (경사가 있는 곳에서만)
        const slope = Math.abs(mx - m) + Math.abs(mz - m)
        if (m > 40 && slope > 0.08) {
          const f = m % 100, major = Math.abs((m % 500) - 250) > 249.2 || (m % 500) < 1
          const width = Math.max(slope * 1.1, 0.05)
          const a = clamp(1 - f / width) * clamp(slope / 0.3) * (major ? 0.38 : 0.16)
          r += (36 - r) * a; g += (44 - g) * a; b += (50 - b) * a
        }
        r *= light; g *= light; b *= light
        // 해안선 바로 안쪽은 진하게 테두리
        if (!isLand(ix + 1, iz) || !isLand(ix - 1, iz) || !isLand(ix, iz + 1) || !isLand(ix, iz - 1)) { r *= 0.55; g *= 0.58; b *= 0.6 }
      }
      out[i4] = r; out[i4 + 1] = g; out[i4 + 2] = b; out[i4 + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

// 지형 메쉬: 해안선 안쪽 격자점만 높이를 주고 바깥은 바다면에 둔다. 색은 위 텍스처가 입힌다
export function buildTerrain() {
  const pts = ringXZ(coast)
  const x0 = -3.8, x1 = 3.8, z0 = -2.3, z1 = 2.3 // 제주 본섬 범위 (3D 단위)
  const nx = 380, nz = 190
  const geometry = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz)
  geometry.rotateX(-Math.PI / 2)
  const pos = geometry.attributes.position
  const isLand = coastMask(pts, x0, x1, z0, z1, nx, nz)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + (x0 + x1) / 2, z = pos.getZ(i) + (z0 + z1) / 2
    pos.setX(i, x); pos.setZ(i, z)
    const lat = 33.38 - z / KZ, lng = 126.55 + x / KX
    pos.setY(i, isLand(i % (nx + 1), Math.floor(i / (nx + 1))) ? LAND_Y + M(elevation(lat, lng)) : SEA_Y)
  }
  geometry.computeVertexNormals()
  return { geometry, texture: buildTexture(pts, x0, x1, z0, z1) }
}

// 부속섬(우도·가파도·비양도 등): 해안선 모양 그대로 압출. 추자도는 본섬에서 너무 멀어 지도에서 뺀다
export function buildIslands() {
  return islands.filter((it) => it.ring[0][1] < 33.7).map(({ name, ring }) => {
    const xz = ringXZ(ring)
    const shape = new THREE.Shape()
    xz.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)))
    const slab = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false })
    return { name, slab, xz }
  })
}

export const heightAt = (lat, lng) => LAND_Y + M(elevation(lat, lng))
