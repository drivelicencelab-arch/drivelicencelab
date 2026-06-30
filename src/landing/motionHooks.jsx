import { useEffect, useRef, useState } from 'react'

// ── useReveal: fade/slide up when entering viewport ──────────────────────────
export function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(el) }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, visible]
}

export const revealStyle = (visible, delay = 0) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(28px)',
  transition: `opacity .7s cubic-bezier(.16,1,.3,1) ${delay}s, transform .7s cubic-bezier(.16,1,.3,1) ${delay}s`,
})

// ── useCountUp: animate number from 0 to target when visible ─────────────────
export function useCountUp(target, { duration = 1400, decimals = 0, trigger = true } = {}) {
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!trigger || startedRef.current) return
    startedRef.current = true
    const start = performance.now()
    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) requestAnimationFrame(animate)
      else setValue(target)
    }
    requestAnimationFrame(animate)
  }, [trigger, target, duration])

  return decimals > 0 ? value.toFixed(decimals) : Math.round(value)
}

// ── StatCounter combined component ────────────────────────────────────────────
export function StatCounter({ value, suffix = '', decimals = 0, label, color = '#00C9C8' }) {
  const [ref, visible] = useReveal(0.5)
  const count = useCountUp(value, { trigger: visible, decimals })

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 'clamp(28px,5vw,44px)', color, lineHeight: 1 }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>{label}</div>
    </div>
  )
}
