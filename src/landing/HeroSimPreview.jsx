import { useEffect, useRef, useState } from 'react'

export default function HeroSimPreview({ height = 320 }) {
  const mountRef = useRef(null)
  const [speed, setSpeed] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let THREE, renderer, scene, camera, car, road, animId
    let speedVal = 0

    const init = async () => {
      try {
        THREE = await import('three')
        const el = mountRef.current
        if (!el) return

        scene = new THREE.Scene()
        scene.fog = new THREE.Fog(0x0D1117, 6, 26)

        camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 100)
        camera.position.set(0, 2.6, 5.5)
        camera.lookAt(0, 0.6, -4)

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(el.clientWidth, el.clientHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        el.appendChild(renderer.domElement)

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.5))
        const dir = new THREE.DirectionalLight(0x00C9C8, 0.9)
        dir.position.set(3, 6, 3)
        scene.add(dir)
        const rim = new THREE.PointLight(0x7C3AED, 1.2, 12)
        rim.position.set(-3, 2, -2)
        scene.add(rim)

        // Road (long plane moving toward camera to simulate driving)
        const roadGeo = new THREE.PlaneGeometry(6, 60)
        const roadMat = new THREE.MeshPhongMaterial({ color: 0x161B22 })
        road = new THREE.Mesh(roadGeo, roadMat)
        road.rotation.x = -Math.PI / 2
        road.position.set(0, 0, -20)
        scene.add(road)

        // Lane markings
        const markings = []
        for (let i = 0; i < 14; i++) {
          const geo = new THREE.PlaneGeometry(0.2, 1.2)
          const mat = new THREE.MeshBasicMaterial({ color: 0x00C9C8 })
          const m = new THREE.Mesh(geo, mat)
          m.rotation.x = -Math.PI / 2
          m.position.set(0, 0.01, -i * 4)
          scene.add(m)
          markings.push(m)
        }

        // Side barriers (glowing edge lines)
        ;[-3, 3].forEach(xPos => {
          const geo = new THREE.PlaneGeometry(0.15, 60)
          const mat = new THREE.MeshBasicMaterial({ color: 0x7C3AED })
          const m = new THREE.Mesh(geo, mat)
          m.rotation.x = -Math.PI / 2
          m.position.set(xPos, 0.02, -20)
          scene.add(m)
        })

        // Car (simple low-poly)
        const carGroup = new THREE.Group()
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0x00C9C8, shininess: 100 })
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 2.6), bodyMat)
        body.position.y = 0.4
        carGroup.add(body)
        const cabinMat = new THREE.MeshPhongMaterial({ color: 0x88ccdd, transparent: true, opacity: 0.7 })
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 1.3), cabinMat)
        cabin.position.set(0, 0.78, -0.1)
        carGroup.add(cabin)
        // wheels
        const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.2, 14)
        const wheelMat = new THREE.MeshPhongMaterial({ color: 0x111111 })
        ;[[-0.7, 0.26, 1], [0.7, 0.26, 1], [-0.7, 0.26, -1], [0.7, 0.26, -1]].forEach(p => {
          const w = new THREE.Mesh(wheelGeo, wheelMat)
          w.rotation.z = Math.PI / 2
          w.position.set(...p)
          carGroup.add(w)
        })
        carGroup.position.set(0, 0, 1.5)
        scene.add(carGroup)
        car = carGroup

        // Headlight glow
        const headGlow = new THREE.PointLight(0xffffff, 1.5, 5)
        headGlow.position.set(0, 0.5, 2.5)
        carGroup.add(headGlow)

        let t = 0
        const animate = () => {
          animId = requestAnimationFrame(animate)
          t += 0.016

          // Simulate fluctuating speed 40-100
          speedVal = 60 + Math.sin(t * 0.4) * 35 + Math.sin(t * 1.3) * 8
          setSpeed(Math.round(Math.max(speedVal, 20)))

          const speedFactor = speedVal / 60

          // Move lane markings toward camera
          markings.forEach(m => {
            m.position.z += 0.15 * speedFactor
            if (m.position.z > 6) m.position.z -= 56
          })

          // Subtle car bob + steering sway
          car.position.x = Math.sin(t * 0.5) * 0.3
          car.rotation.y = Math.sin(t * 0.5) * 0.05
          car.position.y = Math.sin(t * 4) * 0.02

          // Camera subtle follow
          camera.position.x = car.position.x * 0.3
          camera.lookAt(car.position.x * 0.5, 0.6, -4)

          renderer.render(scene, camera)
        }
        animate()
        setLoaded(true)
      } catch (e) {
        console.warn('Hero sim 3D failed:', e)
        setError(true)
      }
    }
    init()

    return () => {
      cancelAnimationFrame(animId)
      if (renderer) {
        renderer.dispose()
        try { mountRef.current?.removeChild(renderer.domElement) } catch {}
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(180deg, #0D1117, #0a0d12)', border: '1px solid rgba(0,201,200,0.25)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>🚗💨</div>
      )}

      {/* Speed HUD overlay */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16,
        background: 'rgba(10,14,20,0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0,201,200,0.4)', borderRadius: 16,
        padding: '12px 18px', textAlign: 'center',
        boxShadow: '0 0 24px rgba(0,201,200,0.2)',
      }}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 32, color: '#00F5D4', lineHeight: 1 }}>{speed}</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginTop: 2 }}>KM/H</div>
      </div>

      {/* Live badge */}
      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(10,14,20,0.85)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '6px 12px', border: '1px solid rgba(63,185,80,0.4)' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3FB950', animation: 'pulseLive 1.5s ease infinite' }} />
        <span style={{ fontSize: 11, color: '#3FB950', fontWeight: 700 }}>SIM PREVIEW · LIVE</span>
      </div>
      <style>{`@keyframes pulseLive { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
    </div>
  )
}
