import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase.js'
import { T, GlassCard, NeuBtn, Badge, ProgressBar } from '../../ui.jsx'

const CLEAN_SESSION_REWARD = 5 // sessions needed for reward

// ── Distraction detection hook ────────────────────────────────────────────────
export function useDistractionDetection({ sessionActive, studentId, onStrike }) {
  const strikeRef = useRef(0)

  useEffect(() => {
    if (!sessionActive) return

    // Detect page visibility change (phone pickup proxy)
    const handleVisibility = () => {
      if (document.hidden) {
        strikeRef.current += 1
        onStrike?.(strikeRef.current)
        logStrike(studentId, strikeRef.current)
      }
    }

    // Detect device motion (phone pickup)
    const handleMotion = (e) => {
      const { acceleration } = e
      if (acceleration && Math.abs(acceleration.x) > 12) {
        strikeRef.current += 1
        onStrike?.(strikeRef.current)
        logStrike(studentId, strikeRef.current)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('devicemotion', handleMotion)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('devicemotion', handleMotion)
    }
  }, [sessionActive])

  return { strikes: strikeRef.current }
}

// ── Log strike to Supabase ─────────────────────────────────────────────────────
async function logStrike(studentId, strikeCount) {
  try {
    await supabase.from('distraction_strikes').insert({
      student_id: studentId,
      strike_number: strikeCount,
      detected_at: new Date().toISOString(),
    })
  } catch (e) {
    console.warn('Strike log error:', e)
  }
}

// ── Strike messages (peer tone, never shame) ──────────────────────────────────
const STRIKE_MESSAGES = [
  { icon: '📵', msg: 'Phones down = faster licence. You\'ve got this 💪', color: T.yellow },
  { icon: '⚠️', msg: 'Eyes on the road, not the screen. Two more clean minutes and you\'re golden.', color: T.orange },
  { icon: '🛑', msg: 'Third pick-up flagged. Your instructor will see this — let\'s turn it around right now.', color: T.red },
]

const CLEAN_MESSAGES = [
  'Solid focus so far — keep it locked in! 🔒',
  'No distractions detected. You\'re building real road discipline. 🏆',
  'Phone stays down, skills go up. This is how it\'s done. 🚗',
]

// ── DistractionMonitor Component ─────────────────────────────────────────────
export function DistractionMonitor({ studentId, sessionId, onSessionEnd }) {
  const [sessionActive, setSessionActive] = useState(false)
  const [strikes, setStrikes] = useState(0)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMsg, setAlertMsg] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const alertTimeout = useRef(null)

  useEffect(() => {
    if (!sessionActive) return
    timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [sessionActive])

  const handleStrike = (count) => {
    setStrikes(count)
    const msgConfig = STRIKE_MESSAGES[Math.min(count - 1, 2)]
    setAlertMsg(msgConfig)
    setShowAlert(true)
    clearTimeout(alertTimeout.current)
    alertTimeout.current = setTimeout(() => setShowAlert(false), 5000)
  }

  useDistractionDetection({ sessionActive, studentId, onStrike: handleStrike })

  const startSession = () => {
    setSessionActive(true)
    setStrikes(0)
    setElapsed(0)
  }

  const endSession = async () => {
    clearInterval(timerRef.current)
    setSessionActive(false)
    const isClean = strikes === 0
    await supabase.from('sessions').update({
      distraction_strikes: strikes,
      clean_session: isClean,
      duration_minutes: Math.floor(elapsed / 60),
    }).eq('id', sessionId)
    onSessionEnd?.({ strikes, isClean, duration: elapsed })
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div>
      {/* Strike alert popup */}
      {showAlert && alertMsg && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, width: 'calc(100% - 32px)', maxWidth: 440,
          background: alertMsg.color + '22',
          border: `2px solid ${alertMsg.color}`,
          borderRadius: 16, padding: '14px 18px',
          backdropFilter: 'blur(12px)',
          boxShadow: `0 8px 32px ${alertMsg.color}44`,
          animation: 'slideDown 0.3s ease',
        }}>
          <style>{`@keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-20px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 28 }}>{alertMsg.icon}</span>
            <div style={{ fontSize: 14, color: alertMsg.color, fontWeight: 700, lineHeight: 1.5 }}>{alertMsg.msg}</div>
          </div>
        </div>
      )}

      <GlassCard glow={sessionActive ? (strikes === 0 ? T.green : T.orange) : T.teal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 17 }}>📵 Distraction Monitor</div>
            <div style={{ fontSize: 12, color: T.textSub }}>5 clean sessions = reward unlock 🏆</div>
          </div>
          {sessionActive && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 22, color: T.teal }}>{formatTime(elapsed)}</div>
              <div style={{ fontSize: 11, color: T.textSub }}>session time</div>
            </div>
          )}
        </div>

        {!sessionActive ? (
          <>
            <div style={{ background: T.bg, borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📱</div>
              <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>Start In-Car Session Monitor</div>
              <div style={{ color: T.textSub, fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>Place your phone face-down. Any pickup during the session gets flagged — your instructor sees it too.</div>
            </div>
            <NeuBtn full color={T.teal} onClick={startSession} icon="🚗">Start Session</NeuBtn>
          </>
        ) : (
          <>
            {/* Live status */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, textAlign: 'center', background: strikes === 0 ? T.green + '15' : T.red + '15', borderRadius: 12, padding: 14, border: `1px solid ${strikes === 0 ? T.green : T.red}44` }}>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 28, color: strikes === 0 ? T.green : T.red }}>{strikes}</div>
                <div style={{ fontSize: 11, color: T.textSub }}>Distraction strikes</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', background: T.teal + '15', borderRadius: 12, padding: 14, border: `1px solid ${T.teal}44` }}>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 28, color: T.teal }}>
                  {strikes === 0 ? '🔒' : '⚠️'}
                </div>
                <div style={{ fontSize: 11, color: T.textSub }}>{strikes === 0 ? 'Clean so far!' : 'Strikes logged'}</div>
              </div>
            </div>

            {/* Motivational message */}
            <div style={{ background: T.bg, borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>
              {strikes === 0 ? CLEAN_MESSAGES[Math.floor(elapsed / 60) % 3] : `📋 Instructor will see ${strikes} distraction${strikes > 1 ? 's' : ''} in session notes.`}
            </div>

            <NeuBtn full danger onClick={endSession}>End Session</NeuBtn>
          </>
        )}
      </GlassCard>
    </div>
  )
}

// ── Clean Session Tracker ─────────────────────────────────────────────────────
export function CleanSessionTracker({ studentId }) {
  const [cleanCount, setCleanCount] = useState(0)
  const [rewardUnlocked, setRewardUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCleanSessions()
  }, [])

  const loadCleanSessions = async () => {
    const { data } = await supabase.from('sessions')
      .select('clean_session')
      .eq('instructor_id', studentId)
      .eq('clean_session', true)
    if (data) {
      setCleanCount(data.length)
      setRewardUnlocked(data.length >= CLEAN_SESSION_REWARD)
    }
    setLoading(false)
  }

  if (loading) return null

  return (
    <GlassCard glow={rewardUnlocked ? T.yellow : T.green} style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>📵 Clean Sessions</div>
          <div style={{ fontSize: 12, color: T.textSub }}>No distractions = faster licence</div>
        </div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 24, color: rewardUnlocked ? T.yellow : T.green }}>
          {cleanCount}/{CLEAN_SESSION_REWARD}
        </div>
      </div>
      <ProgressBar value={cleanCount} max={CLEAN_SESSION_REWARD} color={rewardUnlocked ? T.yellow : T.green} height={8} />
      {rewardUnlocked ? (
        <div style={{ marginTop: 12, background: T.yellow + '15', border: `1px solid ${T.yellow}44`, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: T.yellow, fontWeight: 700, textAlign: 'center' }}>
          🎉 REWARD UNLOCKED! You've earned 500 DriveCoins for 5 distraction-free sessions!
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: T.textSub }}>
          {CLEAN_SESSION_REWARD - cleanCount} more clean sessions to unlock your reward 🏆
        </div>
      )}
    </GlassCard>
  )
}
