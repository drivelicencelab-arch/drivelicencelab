import { useState, useRef } from 'react'
import { T, GlassCard, NeuBtn } from '../../ui.jsx'

// ── Milestone definitions ─────────────────────────────────────────────────────
export const MILESTONES = {
  FIRST_LESSON: {
    id: 'FIRST_LESSON',
    title: 'First Lesson Done! 🚗',
    subtitle: 'The journey to my licence has officially started.',
    icon: '🚗',
    gradient: ['#009E9D', '#00C9C8'],
    accent: '#00C9C8',
    hashtags: '#DriveLicenceLab #FirstLesson #LicenceJourney',
  },
  PERFECT_QUIZ: {
    id: 'PERFECT_QUIZ',
    title: 'Perfect Quiz Score! 💯',
    subtitle: 'Got every single K53 question right. Let\'s go!',
    icon: '💯',
    gradient: ['#E3B341', '#FF8C00'],
    accent: '#E3B341',
    hashtags: '#DriveLicenceLab #PerfectScore #K53',
  },
  FIRST_SIM_PASS: {
    id: 'FIRST_SIM_PASS',
    title: 'First Sim Session Passed! 🎮',
    subtitle: 'Crushed it in the driving simulator. Road test, watch out.',
    icon: '🎮',
    gradient: ['#7C3AED', '#A855F7'],
    accent: '#A855F7',
    hashtags: '#DriveLicenceLab #SimSession #K53Ready',
  },
  PASS_PREDICTOR_85: {
    id: 'PASS_PREDICTOR_85',
    title: '85% Pass Ready! 🎯',
    subtitle: 'The predictor says I\'m ready for my DLTC test. Booking time.',
    icon: '🎯',
    gradient: ['#3FB950', '#22C55E'],
    accent: '#3FB950',
    hashtags: '#DriveLicenceLab #TestReady #DLTC',
  },
  LICENCE_ACHIEVED: {
    id: 'LICENCE_ACHIEVED',
    title: 'I Passed! Licence Achieved! 🏆',
    subtitle: 'DLTC test passed. Official licence in hand. Dreams unlocked.',
    icon: '🏆',
    gradient: ['#E3B341', '#FF6B2C'],
    accent: '#E3B341',
    hashtags: '#DriveLicenceLab #LicenceAchieved #DLTC #Passed',
  },
  LEVEL_UP: {
    id: 'LEVEL_UP',
    title: 'Level Up! 🔥',
    subtitle: 'Just ranked up on the DriveLicenceLab leaderboard.',
    icon: '🔥',
    gradient: ['#FF6B2C', '#FF4500'],
    accent: '#FF6B2C',
    hashtags: '#DriveLicenceLab #LevelUp #K53Grind',
  },
  STREAK_10: {
    id: 'STREAK_10',
    title: '10-Day Streak! 🔥',
    subtitle: '10 days straight on DriveLicenceLab. Pure consistency.',
    icon: '🔥',
    gradient: ['#FF6B2C', '#E3B341'],
    accent: '#FF8C42',
    hashtags: '#DriveLicenceLab #Streak #Consistent',
  },
}

// ── Generate SVG share card ───────────────────────────────────────────────────
function generateShareCardSVG({ milestone, studentName, score, date }) {
  const m = MILESTONES[milestone] || MILESTONES.FIRST_LESSON
  const [c1, c2] = m.gradient
  const displayDate = date || new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
  const nameDisplay = studentName || 'Student'
  const scoreText = score ? `${score}%` : ''

  // Truncate long names
  const shortName = nameDisplay.length > 18 ? nameDisplay.split(' ')[0] : nameDisplay

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0D1117"/>
      <stop offset="100%" style="stop-color:#0D2137"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${c1}"/>
      <stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}22"/>
      <stop offset="100%" style="stop-color:${c2}11"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softglow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="round"><rect width="1080" height="1080" rx="60"/></clipPath>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#bg)" rx="60"/>

  <!-- Subtle grid pattern -->
  <g opacity="0.04">
    ${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 56}" y1="0" x2="${i * 56}" y2="1080" stroke="white" stroke-width="1"/>`).join('')}
    ${Array.from({ length: 20 }, (_, i) => `<line x1="0" y1="${i * 56}" x2="1080" y2="${i * 56}" stroke="white" stroke-width="1"/>`).join('')}
  </g>

  <!-- Glow orb top -->
  <ellipse cx="540" cy="200" rx="400" ry="280" fill="${c1}" opacity="0.12" filter="url(#glow)"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="1080" height="8" fill="url(#accent)" rx="4"/>

  <!-- Logo area -->
  <circle cx="540" cy="160" r="70" fill="url(#card)" stroke="${m.accent}" stroke-width="2" opacity="0.8"/>
  <text x="540" y="185" font-size="64" text-anchor="middle">${m.icon}</text>

  <!-- Brand name -->
  <text x="540" y="280" font-family="Arial" font-weight="900" font-size="28" fill="${m.accent}" text-anchor="middle" letter-spacing="4" opacity="0.9">DRIVELICENCELAB</text>

  <!-- Divider -->
  <rect x="440" y="300" width="200" height="2" fill="url(#accent)" rx="1" opacity="0.6"/>

  <!-- Student name -->
  <text x="540" y="400" font-family="Arial" font-weight="900" font-size="72" fill="white" text-anchor="middle" filter="url(#softglow)">${shortName}</text>

  <!-- Milestone title -->
  <text x="540" y="500" font-family="Arial" font-weight="900" font-size="52" fill="url(#accent)" text-anchor="middle">${m.title}</text>

  <!-- Card background for subtitle -->
  <rect x="80" y="530" width="920" height="140" rx="24" fill="url(#card)" stroke="${m.accent}" stroke-width="1" opacity="0.6"/>
  <text x="540" y="595" font-family="Arial" font-size="32" fill="rgba(255,255,255,0.85)" text-anchor="middle">"${m.subtitle}"</text>

  ${scoreText ? `
  <!-- Score badge -->
  <rect x="380" y="700" width="320" height="100" rx="50" fill="url(#accent)"/>
  <text x="540" y="762" font-family="Arial" font-weight="900" font-size="52" fill="white" text-anchor="middle">${scoreText} Ready</text>
  ` : `
  <!-- Date display -->
  <text x="540" y="740" font-family="Arial" font-size="28" fill="rgba(255,255,255,0.5)" text-anchor="middle">${displayDate}</text>
  `}

  <!-- Hashtags -->
  <text x="540" y="860" font-family="Arial" font-size="26" fill="${m.accent}" text-anchor="middle" opacity="0.7">${m.hashtags}</text>

  <!-- Bottom section -->
  <rect x="0" y="940" width="1080" height="140" fill="${c1}18"/>
  <text x="540" y="995" font-family="Arial" font-weight="700" font-size="24" fill="rgba(255,255,255,0.6)" text-anchor="middle">Join the journey at</text>
  <text x="540" y="1035" font-family="Arial" font-weight="900" font-size="32" fill="${m.accent}" text-anchor="middle">drivelicencelab.co.za</text>

  <!-- Bottom accent bar -->
  <rect x="0" y="1072" width="1080" height="8" fill="url(#accent)" rx="4"/>
</svg>`
}

// ── ShareCard Component ───────────────────────────────────────────────────────
function ShareCardPreview({ milestone, studentName, score, size = 280 }) {
  const m = MILESTONES[milestone] || MILESTONES.FIRST_LESSON
  const [c1, c2] = m.gradient
  const displayDate = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
  const shortName = (studentName || 'Student').length > 16
    ? (studentName || 'Student').split(' ')[0]
    : studentName || 'Student'

  return (
    <div style={{
      width: size, height: size,
      background: `linear-gradient(145deg, #0D1117, #0D2137)`,
      borderRadius: 20, overflow: 'hidden', position: 'relative',
      border: `2px solid ${m.accent}44`,
      boxShadow: `0 8px 32px ${m.accent}33`,
      flexShrink: 0,
    }}>
      {/* Grid pattern */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${m.accent}08 1px, transparent 1px), linear-gradient(90deg, ${m.accent}08 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

      {/* Top glow */}
      <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: size * 0.8, height: size * 0.5, background: `radial-gradient(ellipse, ${c1}30, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Top bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${c1}, ${c2})` }} />

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', boxSizing: 'border-box' }}>
        {/* Logo */}
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${c1}22`, border: `1px solid ${m.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 8 }}>{m.icon}</div>

        {/* Brand */}
        <div style={{ fontSize: 10, fontWeight: 700, color: m.accent, letterSpacing: 2, marginBottom: 6 }}>DRIVELICENCELAB</div>

        {/* Name */}
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, color: '#fff', fontSize: size * 0.065, marginBottom: 4, textAlign: 'center' }}>{shortName}</div>

        {/* Milestone */}
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: m.accent, fontSize: size * 0.05, textAlign: 'center', marginBottom: 8, lineHeight: 1.2 }}>{m.title}</div>

        {/* Subtitle card */}
        <div style={{ background: `${c1}15`, border: `1px solid ${m.accent}33`, borderRadius: 10, padding: '8px 12px', textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: size * 0.033, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>"{m.subtitle}"</div>
        </div>

        {/* Date/Score */}
        {score
          ? <div style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, borderRadius: 20, padding: '4px 16px', fontSize: size * 0.04, fontWeight: 800, color: '#fff' }}>{score}% Ready</div>
          : <div style={{ fontSize: size * 0.033, color: 'rgba(255,255,255,0.4)' }}>{displayDate}</div>
        }

        {/* Hashtags */}
        <div style={{ marginTop: 'auto', fontSize: size * 0.028, color: m.accent, opacity: 0.7, textAlign: 'center' }}>{m.hashtags}</div>
      </div>
    </div>
  )
}

// ── Main MilestoneShare Component ─────────────────────────────────────────────
export default function MilestoneShare({ milestone, studentName, score, onClose, autoShow = false }) {
  const [shared, setShared] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const m = MILESTONES[milestone] || MILESTONES.FIRST_LESSON

  const downloadCard = () => {
    const svg = generateShareCardSVG({ milestone, studentName, score })
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DriveLicenceLab_${milestone}_${(studentName || 'student').replace(/\s+/g, '_')}.svg`
    a.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  const shareToInstagram = () => {
    // Download the card first, then open Instagram
    downloadCard()
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank')
      setShared(true)
    }, 1000)
  }

  const shareToTikTok = () => {
    downloadCard()
    setTimeout(() => {
      window.open('https://www.tiktok.com/upload', '_blank')
      setShared(true)
    }, 1000)
  }

  const shareNative = async () => {
    const svg = generateShareCardSVG({ milestone, studentName, score })
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const file = new File([blob], 'DriveLicenceLab_milestone.svg', { type: 'image/svg+xml' })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: `${m.title} — DriveLicenceLab`,
          text: `${m.subtitle} ${m.hashtags}`,
          files: [file],
        })
        setShared(true)
      } catch (e) {
        downloadCard()
      }
    } else {
      downloadCard()
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, flexDirection: 'column', gap: 20,
    }}>
      {/* Celebration header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 8, animation: 'bounce 0.6s ease' }}>🎉</div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, color: m.accent, fontSize: 26, marginBottom: 4 }}>
          {m.title}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>
          Share your win — let your school know you're on your way 🚗🔥
        </div>
        <style>{`@keyframes bounce { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }`}</style>
      </div>

      {/* Card preview */}
      <ShareCardPreview milestone={milestone} studentName={studentName} score={score} size={280} />

      {/* Share buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        <NeuBtn full color={m.accent} onClick={shareNative} icon="📲">
          Share Now
        </NeuBtn>
        <div style={{ display: 'flex', gap: 10 }}>
          <NeuBtn full color="#E1306C" onClick={shareToInstagram} icon="📸">Instagram</NeuBtn>
          <NeuBtn full color="#010101" onClick={shareToTikTok} icon="🎵">TikTok</NeuBtn>
        </div>
        <NeuBtn full outline color={T.textSub} onClick={downloadCard} icon="⬇️">
          Download Card
        </NeuBtn>
      </div>

      {(shared || downloaded) && (
        <div style={{ background: T.green + '15', border: `1px solid ${T.green}44`, borderRadius: 12, padding: '10px 20px', fontSize: 13, color: T.green, textAlign: 'center' }}>
          {shared ? '✅ Shared! Every share = real organic reach for your school.' : '✅ Card downloaded! Open it to share on Instagram or TikTok.'}
        </div>
      )}

      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif" }}>
        Skip for now
      </button>
    </div>
  )
}

// ── Auto-trigger hook ─────────────────────────────────────────────────────────
export function useMilestoneDetector({ quizHistory, xpPoints, streakDays, readiness }) {
  const [pendingMilestone, setPendingMilestone] = useState(null)
  const triggered = useRef(new Set())

  const checkMilestones = () => {
    // Perfect quiz
    if (quizHistory.some(q => Number(q.percentage) === 100) && !triggered.current.has('PERFECT_QUIZ')) {
      triggered.current.add('PERFECT_QUIZ')
      setPendingMilestone('PERFECT_QUIZ')
      return
    }
    // Pass ready
    if (readiness >= 85 && !triggered.current.has('PASS_PREDICTOR_85')) {
      triggered.current.add('PASS_PREDICTOR_85')
      setPendingMilestone('PASS_PREDICTOR_85')
      return
    }
    // Streak 10
    if (streakDays >= 10 && !triggered.current.has('STREAK_10')) {
      triggered.current.add('STREAK_10')
      setPendingMilestone('STREAK_10')
      return
    }
  }

  return { pendingMilestone, setPendingMilestone, checkMilestones }
}

// Re-export for external use
export { ShareCardPreview, generateShareCardSVG }
