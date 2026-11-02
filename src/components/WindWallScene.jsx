import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// 돌담과 바람 모형: 1단위 = 약 1m. 돌담은 x=0 에 z 방향으로 길게 서 있고, 바람은 왼쪽(-x)에서 오른쪽(+x)으로 분다.
export const WALL = { h: 1.4, t: 0.6, len: 16 }
const R = 0.55 // 담 바로 뒤에서 바람이 줄어드는 비율 — 설명용 값 (실제는 담 높이·틈·바람 방향에 따라 다르다)

// 위치 (x, y) 의 바람 세기 비율 (1 = 그대로). 담 바로 뒤에서 가장 약하고, 담 높이의 몇 배 거리를 지나며 서서히 회복한다.
// 담 높이의 1.6배보다 높은 곳은 영향이 없고, 땅에 가까울수록 많이 줄어든다.
export function shelter(x, y, walls) {
  if (!walls) return 1
  const top = WALL.h * 1.6
  if (y >= top) return 1
  const v = Math.sqrt(1 - Math.max(0, y) / top)
  const half = WALL.t / 2
  if (x >= half) return 1 - R * v * Math.exp(-(x - half) / (WALL.h * 3)) // 담 뒤
  if (x >= -half) return 1 - R * v // 돌 틈을 지나는 중
  return 1 - 0.25 * R * v * Math.exp((x + half) / 0.6) // 담 앞: 부딪혀 살짝 느려진다
}

// 늘 같은 모양이 나오도록 하는 간단한 난수
const seeded = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647

// 현무암 돌담: 크기가 제각각인 돌을 틈을 두고 4단으로 쌓는다 (제주 돌담은 틈으로 바람을 흘려보내 무너지지 않는다)
function StoneWall() {
  const { geo, stones } = useMemo(() => {
    const rnd = seeded(7)
    const out = []
    ;[0.22, 0.6, 0.98, 1.3].forEach((y, layer) => {
      let z = -WALL.len / 2 + rnd() * 0.3
      while (z < WALL.len / 2 - 0.3) {
        const w = 0.45 + rnd() * 0.45, h = (layer === 3 ? 0.28 : 0.36) + rnd() * 0.1, t = WALL.t * (0.75 + rnd() * 0.3)
        out.push({
          pos: [(rnd() - 0.5) * 0.08, y + (rnd() - 0.5) * 0.05, z + w / 2],
          scale: [t / 2, h / 2, w / 2],
          rot: [(rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.3],
          color: new THREE.Color('#3d4247').multiplyScalar(0.75 + rnd() * 0.45),
        })
        z += w + 0.04 + rnd() * 0.08 // 돌과 돌 사이 틈
      }
    })
    return { geo: new THREE.DodecahedronGeometry(1, 0), stones: out }
  }, [])
  return stones.map((s, i) => (
    <mesh key={i} geometry={geo} position={s.pos} scale={s.scale} rotation={s.rot} castShadow receiveShadow>
      <meshStandardMaterial color={s.color} roughness={1} flatShading />
    </mesh>
  ))
}

// 밭: 연두색 바탕에 이랑 줄무늬
function Field() {
  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = 512; cv.height = 64
    const ctx = cv.getContext('2d')
    for (let i = 0; i < 32; i++) { ctx.fillStyle = i % 2 ? '#a9b97f' : '#9aad70'; ctx.fillRect(i * 16, 0, 16, 64) }
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 18]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  )
}

// 작물: 그 자리 바람이 셀수록 크게 흔들린다 (담 앞은 크게, 담 뒤는 작게)
const PLANT_X = [-8, -6, -4, -2, 2, 4, 6, 8, 10]
function Crops({ speed, walls }) {
  const refs = useRef([])
  const plants = useMemo(() => {
    const rnd = seeded(11), out = []
    for (const x of PLANT_X) for (let z = -6; z <= 6; z += 1.5) out.push({ x: x + (rnd() - 0.5) * 0.4, z: z + (rnd() - 0.5) * 0.4, phase: rnd() * 6, h: 0.5 + rnd() * 0.25 })
    return out
  }, [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    plants.forEach((p, i) => {
      const g = refs.current[i]
      if (!g) return
      const local = speed * shelter(p.x, 0.5, walls) // 그 자리 바람 (m/s)
      const lean = Math.min(0.5, local * 0.03), wobble = Math.min(0.25, local * 0.018)
      g.rotation.z = -(lean + wobble * Math.sin(t * (2 + local * 0.35) + p.phase)) // 바람이 부는 쪽(+x)으로 기운다
    })
  })
  return plants.map((p, i) => (
    <group key={i} position={[p.x, 0, p.z]} ref={(el) => { refs.current[i] = el }}>
      <mesh position={[0, p.h / 2, 0]} castShadow><cylinderGeometry args={[0.025, 0.035, p.h, 6]} /><meshStandardMaterial color="#4f7a32" /></mesh>
      <mesh position={[0, p.h + 0.08, 0]} castShadow><coneGeometry args={[0.12, 0.28, 7]} /><meshStandardMaterial color="#6f9a3d" flatShading /></mesh>
    </group>
  ))
}

// 바람 줄기: 빠르면 파란색·길게, 담을 지나 약해지면 주황색·짧게
const N = 1400, X0 = -13, X1 = 14, TOP = 3.4, ZH = 7.5
// 정점 색은 선형 색공간 값이라, 눈에 보이는 색(sRGB 16진수)을 변환해서 쓴다 (그냥 넣으면 색이 바래 보인다)
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b] }
const FAST = lin('#1d5a96'), SLOW = lin('#e8860c'), SKY = lin('#dbe8ed')
function WindStreaks({ speed, walls }) {
  const s = useMemo(() => {
    const rnd = seeded(3)
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(N * 6), col = new Float32Array(N * 6)
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const p = Array.from({ length: N }, () => ({ x: X0 + rnd() * (X1 - X0), y: 0.05 + TOP * rnd() ** 1.7, z: (rnd() - 0.5) * 2 * ZH }))
    return { geo, pos, col, p, still: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches }
  }, [])
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05), flow = speed * 0.55 // 화면에서 보기 좋은 흐름 속도
    for (let i = 0; i < N; i++) {
      const q = s.p[i]
      const f = shelter(q.x, q.y, walls)
      if (!s.still) {
        q.x += flow * f * dt
        if (walls && f < 0.95) { // 담 뒤 소용돌이: 위아래·옆으로 조금씩 흔들린다
          q.y = Math.max(0.05, q.y + (Math.random() - 0.5) * dt * (1 - f) * 3)
          q.z += (Math.random() - 0.5) * dt * (1 - f) * 2
        }
        if (q.x > X1) { q.x = X0; q.y = 0.05 + TOP * Math.random() ** 1.7; q.z = (Math.random() - 0.5) * 2 * ZH }
      }
      const len = 0.25 + speed * 0.07 * f, k = Math.min(1, (1 - f) / R), o = i * 6
      s.pos[o] = q.x; s.pos[o + 1] = q.y; s.pos[o + 2] = q.z
      s.pos[o + 3] = q.x - len; s.pos[o + 4] = q.y; s.pos[o + 5] = q.z
      for (let c = 0; c < 3; c++) {
        const head = FAST[c] + (SLOW[c] - FAST[c]) * k
        s.col[o + c] = head
        s.col[o + 3 + c] = head + (SKY[c] - head) * 0.3 // 꼬리는 하늘색 쪽으로 조금 흐려진다
      }
    }
    s.geo.attributes.position.needsUpdate = true
    s.geo.attributes.color.needsUpdate = true
  })
  return <lineSegments geometry={s.geo} frustumCulled={false}><lineBasicMaterial vertexColors transparent opacity={1} depthWrite={false} /></lineSegments>
}

export default function WindWallScene({ speed, walls }) {
  return (
    <div className="wind-canvas">
      <Canvas shadows camera={{ position: [-2.5, 5.2, 14], fov: 42 }}>
        <color attach="background" args={['#dbe8ed']} />
        <fog attach="fog" args={['#dbe8ed', 26, 46]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[-6, 10, 6]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={10} shadow-camera-bottom={-10} />
        <Html position={[0, -50, 0]}><span /></Html>
        <Field />
        {walls && <StoneWall />}
        <Crops speed={speed} walls={walls} />
        <WindStreaks speed={speed} walls={walls} />
        {walls && <Html position={[0, 1.9, 5.5]} center zIndexRange={[10, 0]}><div className="scene-tag">현무암 돌담 · 높이 약 {WALL.h}m</div></Html>}
        {walls && <Html position={[4.5, 2.3, 3]} center zIndexRange={[10, 0]}><div className="scene-tag amber">담 뒤: 바람이 약해져요</div></Html>}
        <Html position={[-4.5, 2.5, 3.5]} center zIndexRange={[10, 0]}><div className="scene-tag wind">바람 → {speed}m/s</div></Html>
        <OrbitControls makeDefault enablePan={false} target={[1, 0.8, 0]} minDistance={6} maxDistance={30} maxPolarAngle={Math.PI / 2.15} />
      </Canvas>
    </div>
  )
}
