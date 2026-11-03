import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// 내 돌담: 명소 한 곳을 다녀올 때마다 돌담에 한 줄(돌 5개)이 쌓인다. 아직 안 간 곳은 점선 틀로 비워 둔다.
// 칸 하나 = 명소 하나 (명소 순서대로 왼쪽부터). 돌 색은 그 돌담 종류의 색을 현무암색과 섞은 것.
const LAYERS = 5, COL_W = 1, WALL_T = 0.72, LAYER_H = 0.4
const seeded = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647
const basalt = new THREE.Color('#3d4247')
const easeOutBack = (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2) }

function Column({ x, color, filled, order, geo }) {
  const g = useRef(null)
  const t0 = useRef(null)
  const stones = useMemo(() => {
    const rnd = seeded(41 + Math.round(x * 13))
    const base = basalt.clone().lerp(new THREE.Color(color), 0.55)
    return Array.from({ length: LAYERS }, (_, k) => ({
      y: 0.2 + k * LAYER_H + (rnd() - 0.5) * 0.04,
      pos: [x + (k % 2 ? 0.14 : -0.14) + (rnd() - 0.5) * 0.08, 0, (rnd() - 0.5) * 0.08],
      scale: [(COL_W * 0.8) * (0.92 + rnd() * 0.12), 0.27 + rnd() * 0.04, (WALL_T / 2) * (0.85 + rnd() * 0.15)],
      rot: [(rnd() - 0.5) * 0.35, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.25],
      color: base.clone().multiplyScalar(0.78 + rnd() * 0.42),
    }))
  }, [x, color])

  useFrame(({ clock }) => {
    if (!g.current || !filled) { t0.current = null; return }
    const now = clock.elapsedTime
    if (t0.current == null) t0.current = now + order * 0.07 // 처음엔 왼쪽부터 차례로, 새로 찍은 칸은 바로
    g.current.children.forEach((m, k) => {
      const p = Math.min(1, Math.max(0, (now - t0.current - k * 0.09) / 0.55))
      m.position.y = stones[k].y + (1 - easeOutBack(p)) * 2.2
      m.visible = p > 0
    })
  })

  if (!filled) {
    return (
      <mesh position={[x, (LAYERS * LAYER_H + 0.1) / 2, 0]}>
        <boxGeometry args={[COL_W * 0.94, LAYERS * LAYER_H + 0.1, WALL_T]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.28} depthWrite={false} />
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(COL_W * 0.94, LAYERS * LAYER_H + 0.1, WALL_T)]} />
          <lineBasicMaterial color="#8ea0a6" />
        </lineSegments>
      </mesh>
    )
  }
  return (
    <group ref={g}>
      {stones.map((s, k) => (
        <mesh key={k} geometry={geo} position={[s.pos[0], s.y, s.pos[2]]} scale={s.scale} rotation={s.rot} castShadow receiveShadow>
          <meshStandardMaterial color={s.color} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function Field() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 20]} />
      <meshStandardMaterial color="#a9b97f" roughness={1} />
    </mesh>
  )
}

export default function MyWallScene({ spots, kinds, visited, onCanvas }) {
  const geo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), [])
  const n = spots.length
  const x0 = -((n - 1) * COL_W) / 2
  const colorOf = (s) => kinds.find((k) => k.id === s.kind)?.color ?? '#5f7f3e'
  const order = useMemo(() => { let c = 0; return spots.map((s) => (visited.has(s.id) ? c++ : 0)) }, [spots, visited])
  return (
    <div className="wind-canvas mywall-canvas">
      <Canvas shadows gl={{ preserveDrawingBuffer: true }} camera={{ position: [0, 3.0, 9.6], fov: 40 }}
        onCreated={({ gl }) => onCanvas?.(gl.domElement)}>
        <color attach="background" args={['#dbe8ed']} />
        <fog attach="fog" args={['#dbe8ed', 22, 40]} />
        <ambientLight intensity={1.25} />
        <directionalLight position={[-5, 9, 7]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={8} shadow-camera-bottom={-8} />
        <Html position={[0, -50, 0]}><span /></Html>
        <Field />
        {spots.map((s, i) => (
          <Column key={s.id} x={x0 + i * COL_W} color={colorOf(s)} filled={visited.has(s.id)} order={order[i]} geo={geo} />
        ))}
        {spots.map((s, i) => (
          <Html key={`n${s.id}`} position={[x0 + i * COL_W, 0.02, 0.75]} center zIndexRange={[10, 0]}>
            <div className={`wall-no ${visited.has(s.id) ? 'on' : ''}`} style={{ '--kc': colorOf(s) }}>{i + 1}</div>
          </Html>
        ))}
        <OrbitControls makeDefault enablePan={false} target={[0, 1, 0]} minDistance={6} maxDistance={18}
          minAzimuthAngle={-Math.PI / 2.6} maxAzimuthAngle={Math.PI / 2.6} maxPolarAngle={Math.PI / 2.15} />
      </Canvas>
    </div>
  )
}
