import { useEffect, useRef, useState, Suspense, lazy } from 'react'
import { T } from '../../ui.jsx'

// ── useProgressMorph hook ─────────────────────────────────────────────────────
export function useProgressMorph(readinessScore = 0, skillsCovered = []) {
  const totalSkills = 10
  const pct = Math.min(readinessScore / 100, 1)
  const skillPct = skillsCovered.length / totalSkills

  // Color shifts from warm amber (beginner) → teal (confident) → gold (ready)
  const getColor = () => {
    if (pct < 0.3) return { r: 1.0, g: 0.6, b: 0.2 }      // warm amber
    if (pct < 0.6) return { r: 0.2, g: 0.7, b: 0.8 }      // teal
    if (pct < 0.85) return { r: 0.1, g: 0.85, b: 0.78 }   // bright teal
    return { r: 1.0, g: 0.85, b: 0.2 }                     // gold — ready!
  }

  const getGlowIntensity = () => pct * 2.5
  const getScale = () => 0.85 + pct * 0.3
  const getBadgeCount = () => Math.floor(skillPct * 5)
  const getCleanlinessAlpha = () => 0.3 + pct * 0.7

  return {
    color: getColor(),
    glowIntensity: getGlowIntensity(),
    scale: getScale(),
    badgeCount: getBadgeCount(),
    cleanlinessAlpha: getCleanlinessAlpha(),
    pct,
    label: pct < 0.3 ? 'Beginner' : pct < 0.6 ? 'Developing' : pct < 0.85 ? 'Confident' : '🏆 Ready!',
    labelColor: pct < 0.3 ? T.orange : pct < 0.6 ? T.teal : pct < 0.85 ? T.teal : T.yellow,
  }
}

// ── Three.js Car Twin (loaded lazily) ────────────────────────────────────────
function ThreeTwin({ morph }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const animRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let THREE, renderer, scene, camera, car, wheels = [], badges = []

    const init = async () => {
      try {
        THREE = (await import('three')).default || await import('three')
        if (!THREE || !THREE.WebGLRenderer) throw new Error('Three.js unavailable')

        const el = mountRef.current
        if (!el) return

        // Scene
        scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0D1117)
        scene.fog = new THREE.Fog(0x0D1117, 8, 20)

        // Camera
        camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100)
        camera.position.set(3, 2, 4)
        camera.lookAt(0, 0, 0)

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(el.clientWidth, el.clientHeight)
        renderer.shadowMap.enabled = true
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        el.appendChild(renderer.domElement)

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.4)
        scene.add(ambient)
        const dir = new THREE.DirectionalLight(0xffffff, 0.8)
        dir.position.set(5, 8, 5)
        dir.castShadow = true
        scene.add(dir)

        // Point light (glow effect)
        const pointLight = new THREE.PointLight(0x00C9C8, morph.glowIntensity, 6)
        pointLight.position.set(0, 1, 0)
        scene.add(pointLight)
        sceneRef.current = { pointLight, THREE }

        // ── Build car from primitives ──────────────────────────────────────
        const { r, g, b } = morph.color
        const carColor = new THREE.Color(r, g, b)
        const carMat = new THREE.MeshPhongMaterial({ color: carColor, shininess: 80 + morph.pct * 80 })

        // Car body
        const bodyGeo = new THREE.BoxGeometry(2, 0.6, 1)
        const body = new THREE.Mesh(bodyGeo, carMat)
        body.position.y = 0.55
        body.castShadow = true
        scene.add(body)
        car = body

        // Cabin
        const cabinGeo = new THREE.BoxGeometry(1.1, 0.5, 0.85)
        const cabinMat = new THREE.MeshPhongMaterial({ color: 0x88ccdd, transparent: true, opacity: 0.7, shininess: 120 })
        const cabin = new THREE.Mesh(cabinGeo, cabinMat)
        cabin.position.set(-0.1, 1.1, 0)
        scene.add(cabin)

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 16)
        const wheelMat = new THREE.MeshPhongMaterial({ color: 0x222222 })
        const wheelPositions = [[-0.7, 0.28, 0.55], [0.7, 0.28, 0.55], [-0.7, 0.28, -0.55], [0.7, 0.28, -0.55]]
        wheelPositions.forEach(pos => {
          const w = new THREE.Mesh(wheelGeo, wheelMat)
          w.rotation.x = Math.PI / 2
          w.position.set(...pos)
          w.castShadow = true
          scene.add(w)
          wheels.push(w)
        })

        // Ground
        const groundGeo = new THREE.PlaneGeometry(12, 12)
        const groundMat = new THREE.MeshPhongMaterial({ color: 0x161B22 })
        const ground = new THREE.Mesh(groundGeo, groundMat)
        ground.rotation.x = -Math.PI / 2
        ground.receiveShadow = true
        scene.add(ground)

        // Badges (stars that appear as skills unlock)
        const badgeGeo = new THREE.OctahedronGeometry(0.12)
        const badgeMat = new THREE.MeshPhongMaterial({ color: 0xE3B341, emissive: 0xE3B341, emissiveIntensity: 0.5 })
        for (let i = 0; i < morph.badgeCount; i++) {
          const badge = new THREE.Mesh(badgeGeo, badgeMat)
          const angle = (i / 5) * Math.PI * 2
          badge.position.set(Math.cos(angle) * 1.2, 1.4, Math.sin(angle) * 0.6)
          scene.add(badge)
          badges.push(badge)
        }

        // Scale car
        const s = morph.scale
        body.scale.set(s, s, s)
        cabin.scale.set(s, s, s)

        // Animation loop
        let t = 0
        const animate = () => {
          animRef.current = requestAnimationFrame(animate)
          t += 0.01
          // Rotate car slowly
          if (car) car.rotation.y = t * 0.3
          if (cabin) cabin.rotation.y = t * 0.3
          wheels.forEach(w => { w.rotation.y = t * 0.3; w.rotation.z += 0.05 })
          badges.forEach((b, i) => {
            b.rotation.y = t * 0.3
            b.rotation.x = t * 0.5 + i
            b.position.y = 1.4 + Math.sin(t * 2 + i) * 0.08
          })
          // Pulse glow
          if (sceneRef.current?.pointLight) {
            sceneRef.current.pointLight.intensity = morph.glowIntensity + Math.sin(t * 3) * 0.3
          }
          renderer.render(scene, camera)
        }
        animate()
        setLoaded(true)
      } catch (e) {
        console.warn('Three.js failed:', e)
        setError(true)
      }
    }

    init()
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (renderer) { renderer.dispose(); mountRef.current?.removeChild(renderer.domElement) }
    }
  }, [])

  // Update colors when morph changes
  useEffect(() => {
    if (sceneRef.current?.pointLight) {
      sceneRef.current.pointLight.intensity = morph.glowIntensity
    }
  }, [morph])

  if (error) return null // fallback handled by parent

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }} />
  )
}

// ── 2D SVG Fallback Car ───────────────────────────────────────────────────────
function FallbackTwin({ morph }) {
  const { r, g, b } = morph.color
  const hex = `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`
  return (
    <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation={3 * morph.pct} result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="bodyGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={hex} stopOpacity="1"/>
          <stop offset="100%" stopColor={hex} stopOpacity="0.7"/>
        </radialGradient>
      </defs>
      {/* Road */}
      <rect x="0" y="75" width="200" height="25" fill="#161B22"/>
      <rect x="0" y="83" width="200" height="4" fill="#21262D"/>
      {/* Car body */}
      <rect x="30" y="45" width="140" height="35" rx="8" fill="url(#bodyGrad)" filter="url(#glow)"/>
      {/* Cabin */}
      <rect x="60" y="28" width="80" height="25" rx="6" fill={hex} opacity="0.8" filter="url(#glow)"/>
      {/* Windows */}
      <rect x="65" y="31" width="30" height="18" rx="3" fill="#88ccdd" opacity="0.6"/>
      <rect x="103" y="31" width="32" height="18" rx="3" fill="#88ccdd" opacity="0.6"/>
      {/* Wheels */}
      <circle cx="60" cy="80" r="12" fill="#222"/>
      <circle cx="60" cy="80" r="6" fill="#444"/>
      <circle cx="140" cy="80" r="12" fill="#222"/>
      <circle cx="140" cy="80" r="6" fill="#444"/>
      {/* Headlights */}
      <ellipse cx="170" cy="58" rx="6" ry="4" fill="#ffffcc" opacity={0.5 + morph.pct * 0.5}/>
      {/* Badges */}
      {Array.from({ length: morph.badgeCount }).map((_, i) => (
        <text key={i} x={80 + i * 12} y={22} fontSize="12" textAnchor="middle">⭐</text>
      ))}
    </svg>
  )
}

// ── Main DigitalTwin component ────────────────────────────────────────────────
export default function DigitalTwin({ readinessScore = 0, skillsCovered = [], height = 220 }) {
  const morph = useProgressMorph(readinessScore, skillsCovered)
  const [use3D, setUse3D] = useState(true)

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 20, overflow: 'hidden', background: `linear-gradient(160deg, #0D2137, ${T.bg})`, border: `1px solid ${morph.labelColor}44` }}>
      {/* Glow overlay */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 100%, ${morph.labelColor}22, transparent 70%)`, pointerEvents: 'none', zIndex: 1 }} />

      {/* 3D or 2D twin */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {use3D
          ? <Suspense fallback={<FallbackTwin morph={morph} />}>
            <ThreeTwin morph={morph} onError={() => setUse3D(false)} />
          </Suspense>
          : <FallbackTwin morph={morph} />
        }
      </div>

      {/* Status overlay */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '6px 12px', border: `1px solid ${morph.labelColor}44` }}>
          <div style={{ fontSize: 11, color: morph.labelColor, fontWeight: 700, letterSpacing: 1 }}>{morph.label}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: morph.labelColor, fontFamily: "'Poppins',sans-serif" }}>{readinessScore}%</div>
        </div>
      </div>

      {/* Skills pills */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, zIndex: 2, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {skillsCovered.slice(0, 4).map((sk, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: T.teal, border: `1px solid ${T.teal}44` }}>✓ {sk}</div>
        ))}
      </div>
    </div>
  )
}
