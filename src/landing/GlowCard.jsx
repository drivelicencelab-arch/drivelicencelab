import { useRef, useState } from 'react'

// ── GlowCard: radial glow follows mouse inside card ───────────────────────────
export function GlowCard({ icon, title, desc, color = '#00C9C8', style }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [hover, setHover] = useState(false)

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-cursor-hover
      style={{
        position: 'relative',
        padding: '28px 24px',
        background: 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'background .3s',
        ...style,
      }}
    >
      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(280px circle at ${pos.x}% ${pos.y}%, ${color}22, transparent 70%)`,
        opacity: hover ? 1 : 0,
        transition: 'opacity .3s',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `${color}18`, border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, marginBottom: 18,
        }}>{icon}</div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: '#fff', fontSize: 17, marginBottom: 8 }}>{title}</div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.65 }}>{desc}</div>
      </div>
    </div>
  )
}

// ── TestimonialTicker: infinite scroll, pauses on hover ───────────────────────
const TESTIMONIALS = [
  { name: 'Lerato M.', role: 'Student, Soweto', text: 'The AI tutor explained right-of-way better than my actual instructor. Passed first try.', avatar: '🎓' },
  { name: 'Mr. Khumalo', role: 'School Admin, Durban', text: 'Bulk upload saved me 6 hours of manual student capturing. Game changer.', avatar: '🏫' },
  { name: 'Sipho N.', role: 'Instructor, Cape Town', text: 'QR check-in + AI session notes means I spend more time teaching, less time on paperwork.', avatar: '👨‍🏫' },
  { name: 'Aisha P.', role: 'Student, Pretoria', text: 'Beat my friend in a duel and unlocked 50 DriveCoins. Didn\'t expect studying K53 to be fun.', avatar: '🎓' },
  { name: 'Mrs. van Wyk', role: 'Test Officer, Joburg', text: 'Pass rate tracking finally gives me real data instead of guesswork.', avatar: '📋' },
  { name: 'Thabo K.', role: 'Student, Bloemfontein', text: 'Goal Date Engine got me licenced 2 weeks before prom. Exactly on plan.', avatar: '🎓' },
]

export function TestimonialTicker() {
  const [paused, setPaused] = useState(false)
  const items = [...TESTIMONIALS, ...TESTIMONIALS] // duplicate for seamless loop

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ overflow: 'hidden', position: 'relative', width: '100%' }}
    >
      <style>{`
        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
      <div style={{
        display: 'flex', gap: 20, width: 'max-content',
        animation: `tickerScroll 40s linear infinite`,
        animationPlayState: paused ? 'paused' : 'running',
      }}>
        {items.map((t, i) => (
          <div key={i} style={{
            width: 320, flexShrink: 0,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18, padding: 22,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,201,200,0.15)', border: '1px solid rgba(0,201,200,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.avatar}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.role}</div>
              </div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13.5, lineHeight: 1.6 }}>"{t.text}"</div>
          </div>
        ))}
      </div>
    </div>
  )
}
