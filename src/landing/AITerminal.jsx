import { useState, useEffect, useRef } from 'react'

const LOG_SCRIPT = [
  { t: 1200, text: '$ initializing drivelicencelab.ai_engine v4.2.0', cls: 'cmd' },
  { t: 600, text: '> connecting to student database...', cls: 'sys' },
  { t: 500, text: '✓ connected — 1,847 active students found', cls: 'ok' },
  { t: 900, text: '> fetching student_id: 8821a3f... readiness_score', cls: 'sys' },
  { t: 700, text: '✓ readiness_score: 68% → analyzing weak topics', cls: 'ok' },
  { t: 800, text: '> running adaptive_path_generator(student_8821a3f)', cls: 'sys' },
  { t: 600, text: '✓ blind spot detected: right-of-way @ uncontrolled intersections', cls: 'warn' },
  { t: 700, text: '> prescribing micro-drill: "4-way-stop-simulation.drill"', cls: 'sys' },
  { t: 900, text: '> predict_pass_probability(quiz_trend, attendance, sim_score)', cls: 'sys' },
  { t: 700, text: '✓ pass_probability: 82% — 3% below DLTC gate threshold', cls: 'ok' },
  { t: 800, text: '> sending whatsapp_quiz to +27 82*** ***91', cls: 'sys' },
  { t: 600, text: '✓ WhatsApp delivered — 5 questions, 15s timer', cls: 'ok' },
  { t: 900, text: '> scanning class_of_2026 leaderboard for rivalries...', cls: 'sys' },
  { t: 700, text: '✓ nudge queued: "Jordan M. is 40xp ahead — duel available"', cls: 'ok' },
  { t: 800, text: '> compiling weekly_goal_plan(target=2026-08-14)', cls: 'sys' },
  { t: 600, text: '✓ plan generated — 6 weeks, 2 lessons/week, on track', cls: 'ok' },
  { t: 1000, text: '> session complete — 1,847 students synced in 0.84s', cls: 'cmd' },
]

export default function AITerminal() {
  const [lines, setLines] = useState([])
  const [currentText, setCurrentText] = useState('')
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (lineIdx >= LOG_SCRIPT.length) {
      // Restart loop after a pause
      const t = setTimeout(() => {
        setLines([])
        setLineIdx(0)
        setCharIdx(0)
        setCurrentText('')
      }, 2500)
      return () => clearTimeout(t)
    }

    const entry = LOG_SCRIPT[lineIdx]
    if (charIdx < entry.text.length) {
      const t = setTimeout(() => {
        setCurrentText(entry.text.slice(0, charIdx + 1))
        setCharIdx(c => c + 1)
      }, 14)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setLines(prev => [...prev, entry].slice(-9))
        setCurrentText('')
        setCharIdx(0)
        setLineIdx(i => i + 1)
      }, entry.t)
      return () => clearTimeout(t)
    }
  }, [lineIdx, charIdx])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [lines, currentText])

  const colorFor = (cls) => ({
    cmd: '#00F5D4', sys: '#8B949E', ok: '#3FB950', warn: '#E3B341',
  }[cls] || '#E6EDF3')

  return (
    <div style={{
      background: 'rgba(10,14,20,0.92)',
      border: '1px solid rgba(0,201,200,0.25)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,201,200,0.08)',
      backdropFilter: 'blur(12px)',
      fontFamily: "'Space Grotesk', monospace",
      width: '100%',
      maxWidth: 460,
    }}>
      {/* Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F' }} />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>ai_engine — live session</div>
      </div>

      {/* Body */}
      <div ref={bodyRef} style={{ padding: '16px 18px', height: 220, overflowY: 'hidden', fontSize: 12.5, lineHeight: 1.8 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: colorFor(l.cls), opacity: 0.5 + (i / lines.length) * 0.5, whiteSpace: 'pre-wrap' }}>
            {l.text}
          </div>
        ))}
        {lineIdx < LOG_SCRIPT.length && (
          <div style={{ color: colorFor(LOG_SCRIPT[lineIdx]?.cls), whiteSpace: 'pre-wrap' }}>
            {currentText}<span style={{ opacity: 0.8, animation: 'blink 1s step-end infinite' }}>▋</span>
          </div>
        )}
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  )
}
