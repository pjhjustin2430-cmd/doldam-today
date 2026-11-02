import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

import { LAND_Y, buildIslands, buildTerrain, elevation, heightAt, toXZ } from '../lib/terrain'
import { layoutLabels } from '../lib/mapGeom'

const HOME = { target: new THREE.Vector3(0, 0, 0), pos: new THREE.Vector3(0, 9.2, 7.4) }
const LAND = '#7b8187'
const SEA = '#c9dad6'

// 한라산 방패 모양 지형. 색(음영·등고선·밭담 격자·해안선)은 텍스처에 그려 두었다
function Terrain() {
  const { geometry, texture } = useMemo(() => buildTerrain(), [])
  return <mesh geometry={geometry}><meshBasicMaterial map={texture} /></mesh>
}

// 우도·가파도·비양도 등 부속섬: 실제 해안선 모양 + 흰 테두리
function Islets() {
  const items = useMemo(() => buildIslands(), [])
  return items.map(({ slab, xz }, i) => (
    <group key={i}>
      <mesh geometry={slab} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}><meshBasicMaterial color={LAND} /></mesh>
      <Line points={[...xz, xz[0]].map(([x, z]) => [x, 0.062, z])} color="#ffffff" lineWidth={1.4} transparent opacity={0.9} />
    </group>
  ))
}

// 위·경도 → 지형 표면 3D 점. 해안선 가장자리에서 살짝 안쪽(한라산 쪽)으로 당겨 지도와 겹쳐 보이게 한다
function surfacePoint(lat, lng, island) {
  const [x, z] = toXZ(lat, lng)
  if (island) return [x, 0.075, z] // 부속섬은 섬 윗면 위
  const [px, pz] = toXZ(33.362, 126.529), d = Math.hypot(px - x, pz - z) || 1
  const k = 0.035 / d // 해안에서 0.035단위(약 350m) 안쪽으로
  const ix = x + (px - x) * k, iz = z + (pz - z) * k
  return [ix, heightAt(33.38 - iz / 11.1, 126.55 + ix / 9.26) + 0.03, iz]
}
const spotPoint = (s) => surfacePoint(s.lat, s.lng, s.island)

// 명소를 고르면 그곳으로 확대하고, 선택을 풀면 전체 보기로 돌아간다. 사용자가 직접 돌리기 시작하면 멈춘다
function CameraRig({ focus }) {
  const controls = useThree((s) => s.controls)
  const camera = useThree((s) => s.camera)
  const goal = useRef(null)
  useEffect(() => {
    if (!controls) return
    if (!focus) { goal.current = HOME; return }
    const { pts } = focus
    const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[2])
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs))
    const d = Math.min(14, Math.max(2.6, span * 4.5 + 0.7))
    const target = new THREE.Vector3(cx, 0, cz)
    goal.current = { target, pos: target.clone().add(new THREE.Vector3(0, d * 0.75, d * 0.66)) }
  }, [focus, controls])
  useEffect(() => {
    if (!controls) return undefined
    const stop = () => { goal.current = null }
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls])
  useFrame((_, dt) => {
    const g = goal.current
    if (!g || !controls) return
    const k = 1 - Math.exp(-dt * 4)
    camera.position.lerp(g.pos, k)
    controls.target.lerp(g.target, k)
    controls.update()
    if (camera.position.distanceTo(g.pos) < 0.02 && controls.target.distanceTo(g.target) < 0.02) goal.current = null
  })
  return null
}

// 정확한 위치를 알려 주는 땅 위의 작은 점: 흰 테두리 원 + 종류 색 점. 선택하면 주황 고리가 생긴다
function GroundMark({ position, color, on }) {
  return (
    <group position={[position[0], position[1] + 0.012, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh><circleGeometry args={[on ? 0.075 : 0.055, 28]} /><meshBasicMaterial color="#ffffff" /></mesh>
      <mesh position={[0, 0, 0.002]}><circleGeometry args={[on ? 0.05 : 0.036, 28]} /><meshBasicMaterial color={color} /></mesh>
      {on && <mesh position={[0, 0, 0.001]}><ringGeometry args={[0.1, 0.125, 36]} /><meshBasicMaterial color="#f0b23a" /></mesh>}
    </group>
  )
}

// 섬 둘레에 명소 이름표를 두르고 가는 선으로 지도 위 핀과 잇는다
function Tags({ spots, kinds, selectedId, onPick }) {
  const items = useMemo(() => layoutLabels(spots), [spots])
  const color = (s) => kinds.find((k) => k.id === s.kind)?.color ?? '#888'
  return items.map(({ s, pos }) => {
    const on = s.id === selectedId
    const p = spotPoint(s), [lx, lz] = [pos[0] / 10, pos[1] / 10]
    return (
      <group key={s.id}>
        <GroundMark position={p} color={color(s)} on={on} />
        <Html position={p} center zIndexRange={[20, 10]}>
          <button type="button" className={`pin3d ${on ? 'on' : ''}`} style={{ '--kc': color(s) }} aria-label={s.name} onClick={() => onPick(s.id)}>
            <i className={`bi bi-${kinds.find((k) => k.id === s.kind)?.icon ?? 'geo-alt'}`} />
          </button>
        </Html>
        {!selectedId && <Line points={[[p[0], p[1] + 0.02, p[2]], [lx, 0.04, lz]]} color="#aab2b8" lineWidth={1} />}
        <Html position={[lx, 0.05, lz]} center zIndexRange={[40, 30]}>
          <button type="button" className={`pill3d ${on ? 'on' : ''}`} style={{ '--kc': color(s) }} onClick={() => onPick(s.id)}>{s.label}</button>
        </Html>
      </group>
    )
  })
}

// 바람 줄기: 오늘 풍속·풍향대로 지도 위를 흐르는 가는 줄 900개.
// 저지대 밭(고도 350m 이하의 땅)은 밭담으로 나뉜 곳이라, walls 가 켜져 있으면 그 구역에서 바람이 느려지고 주황색으로 바뀐다 (설명용 표현).
// wind.from 은 바람이 불어오는 방향 각도(북 0°, 시계방향)라서 줄기는 반대쪽(+180°)으로 흐른다.
const N_WIND = 1500
const AMBER = [0.94, 0.7, 0.23]
const PAPER = '#eceeea' // 지형을 끈 배경색
function WindField({ wind, walls, dark }) {
  const base = dark ? [0.22, 0.26, 0.31] : [1, 1, 1], bg = [0.925, 0.933, 0.918] // 지형을 끄면 슬레이트색 줄기가 섬 위에서만 보인다
  const s = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(N_WIND * 6), col = new Float32Array(N_WIND * 6)
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const p = Array.from({ length: N_WIND }, () => ({ x: (Math.random() - 0.5) * 8, z: (Math.random() - 0.5) * 4.8, slow: 1, vis: 0 }))
    return { geo, pos, col, p, still: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches }
  }, [])
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const phi = ((wind.from + 180) * Math.PI) / 180
    const dx = Math.sin(phi), dz = -Math.cos(phi) // 북쪽이 -z
    const step = wind.speed * 0.07, len = 0.1 + wind.speed * 0.018 // step: 보기 좋은 흐름 속도(단위/초)
    for (let i = 0; i < N_WIND; i++) {
      const q = s.p[i]
      const lat = 33.38 - q.z / 11.1, lng = 126.55 + q.x / 9.26
      const m = elevation(lat, lng)
      const target = walls && m > 0.5 && m < 350 ? 0.4 : 1 // 밭담 구역(저지대 땅)에서는 40% 속도
      q.slow += (target - q.slow) * Math.min(1, dt * 6)
      q.vis += ((m > 0.5 ? 1 : 0) - q.vis) * Math.min(1, dt * 8) // 섬 위에 들어오면 서서히 보이고, 벗어나면 사라진다 (지형을 끈 경우)
      if (!s.still) { q.x += dx * step * q.slow * dt; q.z += dz * step * q.slow * dt }
      if (q.x < -4) q.x = 4; else if (q.x > 4) q.x = -4
      if (q.z < -2.5) q.z = 2.5; else if (q.z > 2.5) q.z = -2.5
      const y = Math.max(0.05, LAND_Y + m / 2000 + 0.05) // 땅 위 0.05 (한라산 비탈을 타고 오른다)
      const o = i * 6, tail = len * (0.55 + 0.45 * q.slow), k = clamp01((1 - q.slow) / 0.6)
      s.pos[o] = q.x; s.pos[o + 1] = y; s.pos[o + 2] = q.z
      s.pos[o + 3] = q.x - dx * tail; s.pos[o + 4] = y; s.pos[o + 5] = q.z - dz * tail
      // 기본색 → 주황(#f0b23a): 앞(머리)은 진하게, 꼬리는 흐리게
      for (let c = 0; c < 3; c++) {
        let head = base[c] + (AMBER[c] - base[c]) * k
        if (dark) head += (bg[c] - head) * (1 - q.vis) // 섬 밖에서는 배경색이 되어 안 보인다
        s.col[o + c] = head
        s.col[o + 3 + c] = dark ? head + (bg[c] - head) * 0.55 : head * 0.35 // 꼬리: 배경으로 흐려지거나(지형 끔) 어두워진다
      }
    }
    s.geo.attributes.position.needsUpdate = true
    s.geo.attributes.color.needsUpdate = true
  })
  return <lineSegments geometry={s.geo} frustumCulled={false}><lineBasicMaterial vertexColors transparent opacity={0.85} depthWrite={false} /></lineSegments>
}
const clamp01 = (v) => Math.min(1, Math.max(0, v))

export default function DoldamMap3D({ spots, kinds, selectedId, onPick, wind = null, walls = false, terrain = false }) {
  const geo = useMemo(() => Object.fromEntries(spots.map((s) => [s.id, { pt: spotPoint(s) }])), [spots])
  const sel = selectedId ? spots.find((s) => s.id === selectedId) : null
  const focus = useMemo(() => {
    if (!sel) return null
    return { pts: [geo[sel.id].pt] }
  }, [sel, geo])

  return (
    <div className="map-canvas">
      <Canvas flat camera={{ position: [0, 9.2, 7.4], fov: 45 }}>
        <color attach="background" args={[terrain ? SEA : PAPER]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
          <planeGeometry args={[60, 40]} />
          <meshBasicMaterial color={terrain ? SEA : PAPER} />
        </mesh>
        {terrain && <Terrain />}
        {terrain && <Islets />}
        {wind && <WindField wind={wind} walls={walls} dark={!terrain} />}
        <Tags spots={spots} kinds={kinds} selectedId={selectedId} onPick={onPick} />
        <OrbitControls makeDefault enablePan={false} minDistance={1.6} maxDistance={24} maxPolarAngle={Math.PI / 2.2} />
        <CameraRig focus={focus} />
      </Canvas>
    </div>
  )
}
