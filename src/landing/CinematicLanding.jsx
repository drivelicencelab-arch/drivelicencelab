import { useState, useEffect, lazy, Suspense } from 'react'
import ParticleField from './ParticleField.jsx'
import CustomCursor from './CustomCursor.jsx'
import AITerminal from './AITerminal.jsx'
import OrbitRings from './OrbitRings.jsx'
import { useReveal, revealStyle, StatCounter } from './motionHooks.jsx'
import { GlowCard, TestimonialTicker } from './GlowCard.jsx'

const HeroSimPreview = lazy(() => import('./HeroSimPreview.jsx'))

const C = {
  bg: '#05070A', teal: '#00C9C8', tealDeep: '#009E9D',
  plasma: '#7C3AED', danger: '#F85149', gold: '#E3B341',
  text: '#fff', sub: 'rgba(255,255,255,0.6)', border: 'rgba(255,255,255,0.08)',
}

const ROLES = [
  { icon: '🎓', label: 'Student', desc: 'Track readiness, duel friends, earn DriveCoins, study with AI.', color: C.teal },
  { icon: '👨‍🏫', label: 'Instructor', desc: 'QR check-ins, session notes, surge availability, live feedback.', color: '#3FB950' },
  { icon: '🏫', label: 'School Admin', desc: 'Bulk upload, slot allocation, full reporting, instructor assignment.', color: '#FF8C42' },
  { icon: '📋', label: 'Test Officer', desc: 'Book DLTC tests, track pass rates, manage results.', color: C.plasma },
  { icon: '⚙️', label: 'System Admin', desc: 'Platform health, school verification, issue tracking.', color: C.danger },
]

const FEATURES = [
  { icon: '🎯', title: 'Pass Predictor Engine', desc: 'Live probability of passing your DLTC test — gated at 85% with the 3 fastest moves to get there.', color: C.teal },
  { icon: '🧠', title: 'Blind Spot Diagnosis', desc: 'AI doesn\'t just flag wrong answers — it diagnoses the pattern and prescribes an exact micro-drill.', color: C.plasma },
  { icon: '📅', title: 'Goal Date Engine', desc: 'Set prom, graduation, or a birthday — get a reverse-engineered weekly plan to be licenced in time.', color: C.gold },
  { icon: '⚔️', title: 'Friend Duels & Rivalry', desc: 'Live leaderboards by school, homeroom, and friend group. Challenge anyone to a head-to-head quiz.', color: '#3FB950' },
  { icon: '🎮', title: '3D Sim Debrief', desc: 'Five-dimension scoring after every sim session — lane discipline, hazard response, awareness, more.', color: C.teal },
  { icon: '⚡', title: 'On-Demand Matching', desc: 'Uber-style last-minute lesson requests. Instructors opt into surge windows, matched in real time.', color: '#FF8C42' },
  { icon: '🪙', title: 'DriveCoin Economy', desc: 'Earn coins for milestones, redeem for lesson discounts, fuel vouchers, and exclusive cosmetics.', color: C.gold },
  { icon: '📵', title: 'Distraction Detection', desc: 'Phone-pickup monitoring during sessions — celebrated streaks unlock real rewards.', color: C.danger },
  { icon: '🚀', title: 'Viral Share Cards', desc: 'Auto-generated milestone cards, one-tap share to Instagram & TikTok. Organic growth, built in.', color: C.plasma },
]

const NAV_LINKS = ['Features', 'Roles', 'How it Works', 'Reviews']

export default function CinematicLanding({ onEnterApp }) {
  const [scrolled, setScrolled] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    const t = setTimeout(() => setHeroVisible(true), 100)
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(t) }
  }, [])

  const [featuresRef, featuresVisible] = useReveal(0.1)
  const [rolesRef, rolesVisible] = useReveal(0.1)
  const [howRef, howVisible] = useReveal(0.1)
  const [statsRef, statsVisible] = useReveal(0.3)
  const [ctaRef, ctaVisible] = useReveal(0.2)

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Space Grotesk',sans-serif", minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <CustomCursor />

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        padding: scrolled ? '14px 24px' : '22px 24px',
        background: scrolled ? 'rgba(5,7,10,0.75)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all .35s cubic-bezier(.16,1,.3,1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} data-cursor-hover>
          <img src="/logo.webp" alt="logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 16 }}>DriveLicenceLab</span>
        </div>

        <div className="dl-nav-links" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} data-cursor-hover
              style={{ color: C.sub, fontSize: 14, textDecoration: 'none', fontWeight: 500, transition: 'color .2s' }}
              onMouseOver={e => e.target.style.color = C.text}
              onMouseOut={e => e.target.style.color = C.sub}>{l}</a>
          ))}
          <button onClick={onEnterApp} data-cursor-hover style={{
            background: `linear-gradient(135deg,${C.teal},${C.tealDeep})`, color: '#fff',
            border: 'none', borderRadius: 10, padding: '10px 22px',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            boxShadow: `0 4px 20px ${C.teal}44`,
          }}>Launch App →</button>
        </div>

        <button className="dl-nav-burger" onClick={() => setNavOpen(!navOpen)} style={{
          display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer',
        }}>{navOpen ? '✕' : '☰'}</button>
      </nav>

      {navOpen && (
        <div className="dl-mobile-drawer" style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 499,
          background: 'rgba(5,7,10,0.97)', backdropFilter: 'blur(20px)',
          padding: '24px', display: 'flex', flexDirection: 'column', gap: 18,
          borderBottom: `1px solid ${C.border}`,
        }}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setNavOpen(false)}
              style={{ color: '#fff', fontSize: 17, textDecoration: 'none', fontWeight: 600 }}>{l}</a>
          ))}
          <button onClick={onEnterApp} style={{
            background: `linear-gradient(135deg,${C.teal},${C.tealDeep})`, color: '#fff',
            border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8,
          }}>Launch App →</button>
        </div>
      )}

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 100, overflow: 'hidden' }}>
        <ParticleField color={C.teal} density={80} />

        <div style={{
          position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: "'Poppins',sans-serif", fontWeight: 900,
          fontSize: 'clamp(60px, 14vw, 220px)',
          color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.05)',
          whiteSpace: 'nowrap', zIndex: 0, pointerEvents: 'none', userSelect: 'none',
          letterSpacing: '-4px',
        }}>DRIVE THE FUTURE</div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%' }}>
          <div className="dl-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 50, alignItems: 'center' }}>

            <div>
              <div style={{ ...revealStyle(heroVisible, 0.1), display: 'inline-flex', alignItems: 'center', gap: 8, background: `${C.teal}15`, border: `1px solid ${C.teal}44`, borderRadius: 30, padding: '7px 16px', marginBottom: 24 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.teal, boxShadow: `0 0 8px ${C.teal}` }} />
                <span style={{ fontSize: 12.5, color: C.teal, fontWeight: 700, letterSpacing: 0.5 }}>AI-POWERED K53 TRAINING</span>
              </div>

              <h1 style={{ ...revealStyle(heroVisible, 0.25), fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 'clamp(34px,5.5vw,62px)', lineHeight: 1.05, letterSpacing: '-1.5px', margin: '0 0 22px' }}>
                Your licence,<br/>
                <span style={{ background: `linear-gradient(135deg,${C.teal},${C.plasma})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>engineered</span> by AI.
              </h1>

              <p style={{ ...revealStyle(heroVisible, 0.4), fontSize: 'clamp(15px,2vw,18px)', color: C.sub, lineHeight: 1.7, maxWidth: 480, marginBottom: 36 }}>
                DriveLicenceLab predicts your pass probability, diagnoses your blind spots, and builds a personalised path to your South African driver's licence — all in real time.
              </p>

              <div style={{ ...revealStyle(heroVisible, 0.55), display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={onEnterApp} data-cursor-hover style={{
                  background: `linear-gradient(135deg,${C.teal},${C.tealDeep})`, color: '#fff',
                  border: 'none', borderRadius: 14, padding: '16px 32px',
                  fontWeight: 700, fontSize: 16, cursor: 'pointer',
                  boxShadow: `0 8px 32px ${C.teal}44`,
                }}>Start My Journey →</button>
                <a href="#how-it-works" data-cursor-hover style={{
                  background: 'rgba(255,255,255,0.05)', color: '#fff', textDecoration: 'none',
                  border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 28px',
                  fontWeight: 600, fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>▶ See How It Works</a>
              </div>

              <div style={{ ...revealStyle(heroVisible, 0.7), display: 'flex', gap: 32, marginTop: 44 }}>
                {[{ v: '92%', l: 'Pass Rate' }, { v: '1,847', l: 'Students' }, { v: '24/7', l: 'AI Tutor' }].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 22, color: C.teal }}>{s.v}</div>
                    <div style={{ fontSize: 12, color: C.sub }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dl-hero-visuals" style={{ ...revealStyle(heroVisible, 0.5), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <AITerminal />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <OrbitRings size={260} />
              </div>
            </div>
          </div>

          <div style={{ ...revealStyle(heroVisible, 0.85), marginTop: 60 }}>
            <Suspense fallback={<div style={{ height: 320, borderRadius: 24, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub }}>Loading simulation…</div>}>
              <HeroSimPreview height={320} />
            </Suspense>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 2, opacity: 0.5, animation: 'bounceDown 2s ease infinite' }}>
          <div style={{ width: 24, height: 38, border: `2px solid ${C.sub}`, borderRadius: 14, display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
            <div style={{ width: 4, height: 8, background: C.teal, borderRadius: 2 }} />
          </div>
        </div>
        <style>{`@keyframes bounceDown { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(8px)} }`}</style>
      </section>

      {/* STATS BAND */}
      <section ref={statsRef} style={{ padding: '60px 24px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }} className="dl-stats-grid">
          <StatCounter value={1847} suffix="+" label="Active Students" color={C.teal} />
          <StatCounter value={92} suffix="%" label="DLTC Pass Rate" color="#3FB950" />
          <StatCounter value={340} suffix="+" label="Schools Onboard" color={C.gold} />
          <StatCounter value={50000} suffix="+" label="Quizzes Completed" color={C.plasma} />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" ref={featuresRef} style={{ padding: '110px 24px 100px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ ...revealStyle(featuresVisible, 0), textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12.5, color: C.teal, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>NET-NEW AI LAYER</div>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 'clamp(28px,4.5vw,46px)', letterSpacing: '-1px', margin: 0 }}>Beyond basic coaching.</h2>
        </div>
        <div className="dl-features-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          border: `1px solid ${C.border}`,
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              borderRight: (i + 1) % 3 !== 0 ? `1px solid ${C.border}` : 'none',
              borderBottom: i < FEATURES.length - 3 ? `1px solid ${C.border}` : 'none',
              ...revealStyle(featuresVisible, 0.05 * (i % 3)),
            }}>
              <GlowCard {...f} style={{ height: '100%', minHeight: 220 }} />
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" ref={rolesRef} style={{ padding: '40px 24px 110px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ ...revealStyle(rolesVisible, 0), textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12.5, color: C.plasma, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>ONE PLATFORM, FIVE ROLES</div>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 'clamp(28px,4.5vw,46px)', letterSpacing: '-1px', margin: 0 }}>Built for everyone in the room.</h2>
        </div>
        <div className="dl-roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {ROLES.map((r, i) => (
            <div key={i} data-cursor-hover style={{
              ...revealStyle(rolesVisible, 0.06 * i),
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${r.color}33`,
              borderRadius: 20, padding: '28px 20px',
              transition: 'transform .3s, border-color .3s',
              cursor: 'pointer',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = r.color + '88' }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = r.color + '33' }}
            >
              <div style={{ fontSize: 30, marginBottom: 14 }}>{r.icon}</div>
              <div style={{
                display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: 1,
                color: r.color, background: `${r.color}18`, border: `1px solid ${r.color}44`,
                borderRadius: 20, padding: '3px 10px', marginBottom: 12,
              }}>{r.label.toUpperCase()}</div>
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" ref={howRef} style={{ padding: '60px 24px 110px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ ...revealStyle(howVisible, 0), textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12.5, color: C.gold, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>THE PATH</div>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 'clamp(28px,4.5vw,46px)', letterSpacing: '-1px', margin: 0 }}>From sign-up to licenced.</h2>
        </div>
        {[
          { n: '01', t: 'Sign up & set your goal', d: 'Choose your role, set a licence-by date — prom, graduation, summer. We build your plan.' },
          { n: '02', t: 'Train with AI guidance', d: 'Quizzes diagnose blind spots. Sim sessions get 5-dimension debriefs. Lessons sync to your calendar.' },
          { n: '03', t: 'Track your pass probability', d: 'Watch your readiness score climb in real time, gated at the 85% DLTC-ready threshold.' },
          { n: '04', t: 'Book your test & pass', d: 'When you cross 85%, book your DLTC test directly in-app. Share your win when you pass.' },
        ].map((step, i) => (
          <div key={i} style={{ ...revealStyle(howVisible, 0.1 * i), display: 'flex', gap: 24, marginBottom: 36, alignItems: 'flex-start' }}>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 42, color: 'rgba(255,255,255,0.1)', flexShrink: 0, width: 70 }}>{step.n}</div>
            <div style={{ paddingTop: 8 }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 19, marginBottom: 6 }}>{step.t}</div>
              <div style={{ color: C.sub, fontSize: 14.5, lineHeight: 1.7 }}>{step.d}</div>
            </div>
          </div>
        ))}
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" style={{ padding: '40px 0 110px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 24px' }}>
          <div style={{ fontSize: 12.5, color: '#3FB950', fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>REAL RESULTS</div>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 'clamp(28px,4.5vw,46px)', letterSpacing: '-1px', margin: 0 }}>What the road says.</h2>
        </div>
        <TestimonialTicker />
      </section>

      {/* FINAL CTA */}
      <section ref={ctaRef} style={{ position: 'relative', padding: '100px 24px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, ${C.teal}15, transparent 70%)` }} />
        <div style={{ ...revealStyle(ctaVisible, 0), position: 'relative', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 'clamp(28px,5vw,48px)', letterSpacing: '-1px', marginBottom: 18 }}>
            Your licence is closer than you think.
          </h2>
          <p style={{ color: C.sub, fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
            Join 1,847+ South African students already training smarter with DriveLicenceLab.
          </p>
          <button onClick={onEnterApp} data-cursor-hover style={{
            background: `linear-gradient(135deg,${C.teal},${C.plasma})`, color: '#fff',
            border: 'none', borderRadius: 16, padding: '18px 44px',
            fontWeight: 800, fontSize: 17, cursor: 'pointer',
            boxShadow: `0 12px 40px ${C.teal}44`,
          }}>Get Started Free →</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
          <img src="/logo.webp" alt="logo" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14 }}>DriveLicenceLab</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2026 DriveLicenceLab · drivelicencelab.co.za</div>
      </footer>

      <style>{`
        @media (max-width: 1023px) {
          .dl-nav-links { display: none !important; }
          .dl-nav-burger { display: block !important; }
          .dl-hero-grid { grid-template-columns: 1fr !important; }
          .dl-hero-visuals { order: -1; }
          .dl-features-grid { grid-template-columns: repeat(2,1fr) !important; }
          .dl-roles-grid { grid-template-columns: repeat(2,1fr) !important; }
          .dl-stats-grid { grid-template-columns: repeat(2,1fr) !important; gap: 32px !important; }
        }
        @media (max-width: 640px) {
          .dl-features-grid { grid-template-columns: 1fr !important; }
          .dl-roles-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
