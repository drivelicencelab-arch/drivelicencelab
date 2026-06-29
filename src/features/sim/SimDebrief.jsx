import { useState } from 'react'
import { supabase } from '../../supabase.js'
import { T, GlassCard, NeuBtn, Alert, ProgressBar, Badge } from '../../ui.jsx'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY

// ── 5 Debrief dimensions ──────────────────────────────────────────────────────
const DIMENSIONS = [
  { id: 'lane', label: 'Lane Discipline', icon: '🛣️', color: T.teal },
  { id: 'speed', label: 'Speed Management', icon: '🏎️', color: T.orange },
  { id: 'hazard', label: 'Hazard Response', icon: '⚠️', color: T.red },
  { id: 'signs', label: 'Sign Compliance', icon: '🚦', color: T.green },
  { id: 'awareness', label: 'Situational Awareness', icon: '👁️', color: T.purple },
]

// ── Generate AI debrief ───────────────────────────────────────────────────────
async function generateAIDebrief(scores, studentName) {
  const scoreText = DIMENSIONS.map(d => `${d.label}: ${scores[d.id]}/10`).join(', ')
  const avgScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / DIMENSIONS.length * 10)
  const best = DIMENSIONS.reduce((a, b) => scores[a.id] > scores[b.id] ? a : b)
  const worst = DIMENSIONS.reduce((a, b) => scores[a.id] < scores[b.id] ? a : b)

  const prompt = `You are a K53 driving simulator coach for South African student ${studentName}. Their sim session scores: ${scoreText} (Average: ${avgScore}%). Best: ${best.label}. Needs work: ${worst.label}.

Generate a punchy debrief in EXACTLY this format (under 80 words total):
🏆 WIN: [One specific thing they nailed — be specific and celebratory]
🔧 FIX: [One critical issue with exact correction technique]
🎯 DRILL: [One specific drill for next session — name it clearly]

Tone: peer coach, direct, energetic. No fluff. Students should read this in under 20 seconds.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || null
}

// ── SimScoreInput ─────────────────────────────────────────────────────────────
function ScoreSlider({ dimension, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{dimension.icon}</span>
          <span style={{ fontWeight: 600, color: T.text, fontSize: 14 }}>{dimension.label}</span>
        </div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 18, color: dimension.color }}>
          {value}/10
        </div>
      </div>
      <input
        type="range" min="1" max="10" value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%', height: 6,
          appearance: 'none', background: `linear-gradient(to right, ${dimension.color} ${value * 10}%, ${T.border} ${value * 10}%)`,
          borderRadius: 4, outline: 'none', cursor: 'pointer',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted, marginTop: 4 }}>
        <span>Needs work</span><span>Perfect</span>
      </div>
    </div>
  )
}

// ── SimDebrief Main Component ─────────────────────────────────────────────────
export default function SimDebrief({ studentId, studentName = 'Student', sessionId, onComplete }) {
  const [scores, setScores] = useState({ lane: 5, speed: 5, hazard: 5, signs: 5, awareness: 5 })
  const [debrief, setDebrief] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [simHours, setSimHours] = useState(0)

  const avgScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / DIMENSIONS.length * 10)
  const best = DIMENSIONS.reduce((a, b) => scores[a.id] > scores[b.id] ? a : b)
  const worst = DIMENSIONS.reduce((a, b) => scores[a.id] < scores[b.id] ? a : b)
  const simHoursEarned = Math.round(avgScore / 100 * 2 * 10) / 10

  const generateDebrief = async () => {
    setLoading(true); setError('')
    try {
      const text = await generateAIDebrief(scores, studentName)
      setDebrief(text)

      // Save to DB
      await supabase.from('sim_sessions').upsert({
        student_id: studentId,
        session_id: sessionId,
        scores,
        avg_score: avgScore,
        debrief_text: text,
        sim_hours_earned: simHoursEarned,
        completed_at: new Date().toISOString(),
      })

      // Update total sim hours
      const { data: existing } = await supabase.from('student_xp')
        .select('sim_hours').eq('student_id', studentId).single()
      const newHours = (existing?.sim_hours || 0) + simHoursEarned
      await supabase.from('student_xp').update({ sim_hours: newHours }).eq('student_id', studentId)
      setSimHours(newHours)
      setSaved(true)
    } catch (e) {
      setError('Could not generate debrief. Try again.')
    }
    setLoading(false)
  }

  return (
    <GlassCard glow={T.teal}>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 17, marginBottom: 4 }}>
        🎮 Sim Session Debrief
      </div>
      <div style={{ color: T.textSub, fontSize: 13, marginBottom: 20 }}>Score your session across 5 dimensions</div>

      <Alert msg={error} />

      {!debrief ? (
        <>
          {/* Score sliders */}
          <div style={{ marginBottom: 20 }}>
            {DIMENSIONS.map(d => (
              <ScoreSlider key={d.id} dimension={d} value={scores[d.id]}
                onChange={val => setScores(s => ({ ...s, [d.id]: val }))} />
            ))}
          </div>

          {/* Overall preview */}
          <div style={{ background: T.bg, borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>Session Average</div>
                <div style={{ fontSize: 12, color: T.textSub }}>Best: {best.icon} {best.label} · Needs work: {worst.icon} {worst.label}</div>
              </div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 28, color: avgScore >= 70 ? T.green : avgScore >= 50 ? T.yellow : T.red }}>
                {avgScore}%
              </div>
            </div>
            <ProgressBar value={avgScore} max={100} color={avgScore >= 70 ? T.green : avgScore >= 50 ? T.yellow : T.red} height={8} />
            <div style={{ marginTop: 10, fontSize: 13, color: T.teal, fontWeight: 600 }}>
              ⏱️ Completing this session earns you {simHoursEarned}h of Sim Hours
            </div>
          </div>

          <NeuBtn full color={T.teal} onClick={generateDebrief} disabled={loading} icon="⚡">
            {loading ? 'Generating debrief…' : 'Generate AI Debrief'}
          </NeuBtn>
        </>
      ) : (
        <>
          {/* Score summary radar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {DIMENSIONS.map(d => (
              <div key={d.id} style={{ textAlign: 'center', background: T.bg, borderRadius: 10, padding: '10px 6px' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{d.icon}</div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 18, color: d.color }}>{scores[d.id]}</div>
                <div style={{ fontSize: 9, color: T.textSub, lineHeight: 1.3 }}>{d.label}</div>
              </div>
            ))}
            <div style={{ textAlign: 'center', background: T.teal + '15', borderRadius: 10, padding: '10px 6px', border: `1px solid ${T.teal}44` }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>⭐</div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 18, color: T.teal }}>{avgScore}%</div>
              <div style={{ fontSize: 9, color: T.textSub }}>Overall</div>
            </div>
          </div>

          {/* AI debrief text */}
          <div style={{ background: T.bg, borderRadius: 14, padding: 18, marginBottom: 16, border: `1px solid ${T.teal}44` }}>
            <div style={{ fontSize: 14, color: T.text, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{debrief}</div>
          </div>

          {/* Sim hours earned */}
          <div style={{ background: T.yellow + '15', border: `1px solid ${T.yellow}44`, borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.yellow, fontSize: 14 }}>
              ⏱️ +{simHoursEarned} Sim Hours earned!
            </div>
            <div style={{ fontSize: 13, color: T.textSub, marginTop: 4 }}>
              Total: {simHours.toFixed(1)}h — Sim Hours count toward lesson scheduling credit.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <NeuBtn outline color={T.textSub} onClick={() => setDebrief(null)}>Re-score</NeuBtn>
            <NeuBtn full color={T.green} onClick={() => onComplete?.({ scores, avgScore, debrief, simHoursEarned })} icon="✅">
              Done — Next Session!
            </NeuBtn>
          </div>
        </>
      )}
    </GlassCard>
  )
}
