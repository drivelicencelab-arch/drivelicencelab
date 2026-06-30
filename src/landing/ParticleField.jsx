import { useEffect, useRef } from 'react'

export default function ParticleField({ color = '#00C9C8', density = 90 }) {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let w = canvas.width = canvas.offsetWidth
    let h = canvas.height = canvas.offsetHeight

    const PARTICLE_COUNT = Math.min(density, Math.floor((w * h) / 9000))
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.6,
    }))

    const handleMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const handleLeave = () => { mouseRef.current = { x: -9999, y: -9999 } }
    const handleResize = () => {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseleave', handleLeave)
    window.addEventListener('resize', handleResize)

    const REPULSE_RADIUS = 140
    const LINK_DIST = 120

    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      const { x: mx, y: my } = mouseRef.current

      // Update + draw particles
      particles.forEach(p => {
        // Mouse repulsion
        const dx = p.x - mx, dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < REPULSE_RADIUS) {
          const force = (REPULSE_RADIUS - dist) / REPULSE_RADIUS
          const angle = Math.atan2(dy, dx)
          p.vx += Math.cos(angle) * force * 0.6
          p.vy += Math.sin(angle) * force * 0.6
        }

        // Drift + damping
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.96
        p.vy *= 0.96

        // Gentle ambient drift if too slow
        if (Math.abs(p.vx) < 0.05) p.vx += (Math.random() - 0.5) * 0.02
        if (Math.abs(p.vy) < 0.05) p.vy += (Math.random() - 0.5) * 0.02

        // Wrap edges
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.globalAlpha = 0.7
        ctx.fill()
      })
      ctx.globalAlpha = 1

      // Draw connecting lines (glow)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DIST) {
            const opacity = (1 - dist / LINK_DIST) * 0.35
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = color
            ctx.globalAlpha = opacity
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
        // Lines from mouse to nearby particles
        const dx = particles[i].x - mx, dy = particles[i].y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < REPULSE_RADIUS) {
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(mx, my)
          ctx.strokeStyle = color
          ctx.globalAlpha = (1 - dist / REPULSE_RADIUS) * 0.5
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1

      rafRef.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseleave', handleLeave)
      window.removeEventListener('resize', handleResize)
    }
  }, [color, density])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  )
}
