import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const [isTouch] = useState(typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches)
  const pos = useRef({ x: 0, y: 0 })
  const ring = useRef({ x: 0, y: 0 })
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    if (isTouch) return

    const handleMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      }
    }

    const handleOver = (e) => {
      const target = e.target.closest('button, a, [data-cursor-hover], input, select, .GlassCard')
      setHovering(!!target)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseover', handleOver)

    let raf
    const animateRing = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.15
      ring.current.y += (pos.current.y - ring.current.y) * 0.15
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%) scale(${hovering ? 2.2 : 1})`
      }
      raf = requestAnimationFrame(animateRing)
    }
    animateRing()

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseover', handleOver)
      cancelAnimationFrame(raf)
    }
  }, [hovering, isTouch])

  if (isTouch) return null

  return (
    <>
      <style>{`
        body, button, a { cursor: none !important; }
      `}</style>
      <div
        ref={dotRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: 6, height: 6, borderRadius: '50%',
          background: '#00C9C8',
          pointerEvents: 'none', zIndex: 99999,
          transform: 'translate(-9999px,-9999px)',
          marginLeft: -3, marginTop: -3,
          boxShadow: '0 0 8px #00C9C8',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: 36, height: 36, borderRadius: '50%',
          border: `1.5px solid ${hovering ? '#00C9C8' : 'rgba(0,201,200,0.5)'}`,
          background: hovering ? 'rgba(0,201,200,0.08)' : 'transparent',
          pointerEvents: 'none', zIndex: 99998,
          transform: 'translate(-9999px,-9999px) translate(-50%,-50%)',
          transition: 'border-color .2s, background .2s, width .3s, height .3s',
          backdropFilter: hovering ? 'blur(2px)' : 'none',
        }}
      />
    </>
  )
}
