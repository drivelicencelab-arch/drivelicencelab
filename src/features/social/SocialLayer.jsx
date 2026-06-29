import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase.js'
import { T, GlassCard, NeuBtn, Alert, Badge, ProgressBar } from '../../ui.jsx'

// ── Friend Duel Component ─────────────────────────────────────────────────────
export function FriendDuel({ currentUser, onClose }) {
  const [mode, setMode] = useState('lobby') // lobby | active | result
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [opponentScore] = useState(Math.floor(Math.random() * 8) + 2) // simulated opponent
  const [timeLeft, setTimeLeft] = useState(15)
  const [sel, setSel] = useState(null)
  const [opponentName] = useState('Jordan M.')
  const timerRef = useRef(null)

  const DUEL_QS = [
    { q: 'What does a flashing amber light mean?', opts: ['Stop', 'Proceed with caution', 'No entry', 'Speed up'], ans: 1 },
    { q: 'Minimum following distance at 100km/h?', opts: ['50m', '100m', '3 seconds', '2 seconds'], ans: 2 },
    { q: 'When must you yield at a yield sign?', opts: ['Always stop first', 'Yield to traffic on main road', 'Flash lights', 'Hoot'], ans: 1 },
    { q: 'What colour are warning road signs?', opts: ['Red', 'Blue', 'Yellow', 'Green'], ans: 2 },
    { q: 'Maximum speed in a school zone?', opts: ['40km/h', '60km/h', '30km/h', '50km/h'], ans: 0 },
  ]

  useEffect(() => {
    if (mode === 'active') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current)
            nextQ()
            return 15
          }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [mode, qi])

  const nextQ = () => {
    if (qi + 1 >= DUEL_QS.length) { setMode('result'); return }
    setQi(i => i + 1); setSel(null); setTimeLeft(15)
  }

  const answer = (idx) => {
    if (sel !== null) return
    setSel(idx)
    if (idx === DUEL_QS[qi].ans) setScore(s => s + 1)
    clearInterval(timerRef.current)
    setTimeout(nextQ, 800)
  }

  const win = score > opponentScore

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <GlassCard style={{ width: '100%', maxWidth: 420 }} glow={T.purple}>

        {mode === 'lobby' && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚔️</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 22, marginBottom: 4 }}>Friend Duel</div>
            <div style={{ color: T.textSub, fontSize: 14, marginBottom: 24 }}>5 questions · 15 seconds each · winner takes bragging rights 🏆</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 28 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, background: T.tealGlow, borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>👤</div>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>You</div>
              </div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, color: T.purple, fontSize: 24 }}>VS</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, background: T.purpleGlow, borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>🎓</div>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{opponentName}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <NeuBtn outline color={T.textSub} onClick={onClose}>Cancel</NeuBtn>
              <NeuBtn full color={T.purple} onClick={() => setMode('active')} icon="⚡">Start Duel!</NeuBtn>
            </div>
          </div>
        )}

        {mode === 'active' && (
          <>
            {/* Score header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 28, color: T.teal }}>{score}</div>
                <div style={{ fontSize: 11, color: T.textSub }}>You</div>
              </div>
              {/* Timer */}
              <div style={{ textAlign: 'center' }}>
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke={T.border} strokeWidth="6"/>
                  <circle cx="28" cy="28" r="24" fill="none" stroke={timeLeft <= 5 ? T.red : T.purple} strokeWidth="6"
                    strokeDasharray={`${(timeLeft / 15) * 151} 151`} transform="rotate(-90 28 28)"
                    style={{ transition: 'stroke-dasharray 0.9s linear' }}/>
                  <text x="28" y="33" textAnchor="middle" fontSize="16" fontWeight="900" fill={timeLeft <= 5 ? T.red : T.text} fontFamily="Poppins">{timeLeft}</text>
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 28, color: T.purple }}>{opponentScore}</div>
                <div style={{ fontSize: 11, color: T.textSub }}>{opponentName}</div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16, textAlign: 'center' }}>Question {qi + 1} of {DUEL_QS.length}</div>
            <div style={{ fontWeight: 700, color: T.text, fontSize: 16, marginBottom: 16, lineHeight: 1.5 }}>{DUEL_QS[qi].q}</div>
            {DUEL_QS[qi].opts.map((opt, i) => {
              let bg = T.bgCard, border = T.border, color = T.text
              if (sel !== null) {
                if (i === DUEL_QS[qi].ans) { bg = T.greenGlow; border = T.green; color = T.green }
                else if (i === sel) { bg = T.redGlow; border = T.red; color = T.red }
              }
              return (
                <div key={i} onClick={() => answer(i)} style={{ border: `1.5px solid ${border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 8, cursor: 'pointer', background: bg, color, fontWeight: 600, fontSize: 14, transition: 'all .2s' }}>
                  {String.fromCharCode(65 + i)}. {opt}
                </div>
              )
            })}
          </>
        )}

        {mode === 'result' && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>{win ? '🏆' : '💪'}</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, color: win ? T.yellow : T.teal, fontSize: 26, marginBottom: 4 }}>
              {win ? 'You Won!' : 'Close one!'}
            </div>
            <div style={{ color: T.textSub, fontSize: 14, marginBottom: 20 }}>
              {win
                ? `${score}–${opponentScore} — ${opponentName} didn't see that coming 😤`
                : `${score}–${opponentScore} — Next time, that gap closes. Challenge them again?`}
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, background: T.teal + '15', borderRadius: 12, padding: 14 }}>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 24, color: T.teal }}>{score}</div>
                <div style={{ fontSize: 12, color: T.textSub }}>Your score</div>
              </div>
              <div style={{ flex: 1, background: T.purple + '15', borderRadius: 12, padding: 14 }}>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 24, color: T.purple }}>{opponentScore}</div>
                <div style={{ fontSize: 12, color: T.textSub }}>{opponentName}</div>
              </div>
            </div>
            {win && <div style={{ background: T.yellow + '15', border: `1px solid ${T.yellow}44`, borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: T.yellow, fontWeight: 700 }}>🪙 +50 DriveCoins for winning the duel!</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <NeuBtn outline color={T.textSub} onClick={onClose}>Close</NeuBtn>
              <NeuBtn full color={T.purple} onClick={() => { setMode('lobby'); setQi(0); setScore(0); setSel(null); setTimeLeft(15) }}>Rematch ⚡</NeuBtn>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

// ── Class of Year Licence Board ───────────────────────────────────────────────
export function ClassLicenceBoard({ currentUserId, gradeYear = new Date().getFullYear() }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadBoard() }, [])

  const loadBoard = async () => {
    const { data } = await supabase.from('profiles')
      .select('id, full_name, student_xp(xp_points, streak_days), quiz_scores(percentage)')
      .eq('role', 'student').limit(20)
    if (data) {
      const enriched = data.map(s => {
        const scores = s.quiz_scores || []
        const avg = scores.length ? scores.reduce((a, q) => a + Number(q.percentage), 0) / scores.length : 0
        return {
          ...s,
          xp: s.student_xp?.[0]?.xp_points || 0,
          streak: s.student_xp?.[0]?.streak_days || 0,
          readiness: Math.round(avg),
          status: avg >= 85 ? 'passed' : avg >= 70 ? 'close' : 'learning',
        }
      }).sort((a, b) => b.readiness - a.readiness)
      setStudents(enriched)
    }
    setLoading(false)
  }

  const statusConfig = {
    passed: { label: '✅ Licence Ready', color: T.green, icon: '🏆' },
    close: { label: '🔥 Almost There', color: T.yellow, icon: '🔥' },
    learning: { label: '📚 In Progress', color: T.teal, icon: '📚' },
  }

  const passed = students.filter(s => s.status === 'passed')
  const closest = students.filter(s => s.status === 'close')
  const longestStreak = [...students].sort((a, b) => b.streak - a.streak)[0]

  return (
    <GlassCard glow={T.yellow}>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 17, marginBottom: 4 }}>
        🎓 Class of {gradeYear} Licence Board
      </div>
      <div style={{ color: T.textSub, fontSize: 13, marginBottom: 20 }}>Who's passed, who's closest, who's on fire</div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, textAlign: 'center', background: T.green + '15', borderRadius: 12, padding: 12 }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 22, color: T.green }}>{passed.length}</div>
          <div style={{ fontSize: 11, color: T.textSub }}>Ready to test</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', background: T.yellow + '15', borderRadius: 12, padding: 12 }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 22, color: T.yellow }}>{closest.length}</div>
          <div style={{ fontSize: 11, color: T.textSub }}>Almost there</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', background: T.orange + '15', borderRadius: 12, padding: 12 }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 22, color: T.orange }}>{longestStreak?.streak || 0}🔥</div>
          <div style={{ fontSize: 11, color: T.textSub }}>Top streak</div>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', color: T.textSub, padding: 20 }}>Loading board…</div> :
        students.slice(0, 10).map((s, i) => {
          const cfg = statusConfig[s.status]
          const isMe = s.id === currentUserId
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < students.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ width: 28, fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.textMuted, fontSize: 14 }}>#{i + 1}</div>
              <div style={{ fontSize: 22 }}>{cfg.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: isMe ? T.teal : T.text, fontSize: 14 }}>{s.full_name?.split(' ')[0]}{isMe ? ' (You)' : ''}</div>
                <div style={{ fontSize: 11, color: T.textSub }}>{cfg.label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: cfg.color, fontSize: 16 }}>{s.readiness}%</div>
                <div style={{ fontSize: 10, color: T.textSub }}>{s.streak}🔥</div>
              </div>
            </div>
          )
        })
      }
    </GlassCard>
  )
}

// ── Rival Nudge Component ─────────────────────────────────────────────────────
export function RivalNudge({ currentUserXp = 0, students = [] }) {
  const rival = students
    .filter(s => s.xp > currentUserXp && s.xp - currentUserXp < 200)
    .sort((a, b) => a.xp - b.xp)[0]

  if (!rival) return null

  const gap = rival.xp - currentUserXp

  return (
    <GlassCard glow={T.orange} style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 28, background: T.orange + '22', borderRadius: 12, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 4 }}>
            {rival.full_name?.split(' ')[0]} just moved ahead of you by {gap} XP.
          </div>
          <div style={{ fontSize: 13, color: T.textSub }}>Quick 10-min quiz blitz to close the gap? 🔥</div>
        </div>
        <NeuBtn small color={T.orange} icon="⚡">Blitz!</NeuBtn>
      </div>
    </GlassCard>
  )
}

// ── Main SocialLayer export ───────────────────────────────────────────────────
export default function SocialLayer({ currentUser, quizHistory = [] }) {
  const [showDuel, setShowDuel] = useState(false)

  return (
    <div>
      {/* Duel CTA */}
      <GlassCard glow={T.purple} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 16 }}>⚔️ Challenge a Friend</div>
            <div style={{ fontSize: 13, color: T.textSub, marginTop: 2 }}>Head-to-head K53 quiz duel · 5 questions · 15s each</div>
          </div>
          <NeuBtn color={T.purple} small onClick={() => setShowDuel(true)} icon="⚔️">Duel!</NeuBtn>
        </div>
      </GlassCard>

      <ClassLicenceBoard currentUserId={currentUser?.id} />

      {showDuel && <FriendDuel currentUser={currentUser} onClose={() => setShowDuel(false)} />}
    </div>
  )
}
