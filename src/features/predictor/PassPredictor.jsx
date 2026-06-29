import { useState, useEffect } from 'react'
import { T, GlassCard, NeuBtn, ProgressBar } from '../../ui.jsx'

const GATE_THRESHOLD = 85

// ── Calculate pass probability ────────────────────────────────────────────────
export function calculatePassProbability({
  quizScores = [],
  attendanceRate = 0,
  streakDays = 0,
  simScores = [],
}) {
  if (quizScores.length === 0) return { probability: 0, actions: [], breakdown: {} }

  // 1. Quiz accuracy trend (40% weight)
  const recent = quizScores.slice(0, 5).map(q => Number(q.percentage))
  const avgQuiz = recent.reduce((a, b) => a + b, 0) / recent.length
  // Trend bonus — improving scores
  const trend = recent.length >= 2 ? recent[0] - recent[recent.length - 1] : 0
  const quizScore = Math.min(avgQuiz + trend * 0.3, 100)

  // 2. Response consistency proxy (15% weight)
  const variance = recent.length >= 2
    ? Math.sqrt(recent.reduce((sum, v) => sum + Math.pow(v - avgQuiz, 2), 0) / recent.length)
    : 50
  const consistencyScore = Math.max(0, 100 - variance * 1.5)

  // 3. Attendance rate (25% weight)
  const attendScore = attendanceRate * 100

  // 4. Streak consistency (10% weight)
  const streakScore = Math.min(streakDays * 5, 100)

  // 5. Sim sessions (10% weight)
  const simAvg = simScores.length
    ? simScores.reduce((a, b) => a + b, 0) / simScores.length
    : avgQuiz * 0.8

  const probability = Math.round(
    quizScore * 0.40 +
    consistencyScore * 0.15 +
    attendScore * 0.25 +
    streakScore * 0.10 +
    simAvg * 0.10
  )

  const capped = Math.min(Math.max(probability, 5), 99)

  // Build top 3 actions
  const actions = []
  const gaps = [
    { score: quizScore, label: 'Quiz accuracy', action: 'Take 3 more quizzes this week — aim for 80%+ each.', impact: 40 - quizScore * 0.4 },
    { score: attendScore, label: 'Lesson attendance', action: 'Attend your next 2 scheduled lessons without missing.', impact: 25 - attendScore * 0.25 },
    { score: consistencyScore, label: 'Score consistency', action: 'Focus on weak topics from your Blind Spot Report before quizzing again.', impact: 15 - consistencyScore * 0.15 },
    { score: streakScore, label: 'Daily streak', action: 'Log in daily — even 5 min of practice builds momentum.', impact: 10 - streakScore * 0.10 },
    { score: simAvg, label: 'Simulator sessions', action: 'Complete 2 simulator sessions to build confidence for the road test.', impact: 10 - simAvg * 0.10 },
  ].sort((a, b) => b.impact - a.impact)

  gaps.slice(0, 3).forEach(g => actions.push(g.action))

  return {
    probability: capped,
    actions,
    breakdown: {
      quiz: Math.round(quizScore),
      consistency: Math.round(consistencyScore),
      attendance: Math.round(attendScore),
      streak: Math.round(streakScore),
      sim: Math.round(simAvg),
    },
    gated: capped < GATE_THRESHOLD,
  }
}

// ── Probability colour ────────────────────────────────────────────────────────
const probColor = (p) => p >= 85 ? T.green : p >= 70 ? T.teal : p >= 50 ? T.yellow : T.orange

// ── PassPredictor Component ───────────────────────────────────────────────────
export default function PassPredictor({ quizScores = [], attendanceRate = 0, streakDays = 0, simScores = [], onBookTest }) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const { probability, actions, breakdown, gated } = calculatePassProbability({
    quizScores, attendanceRate, streakDays, simScores,
  })
  const color = probColor(probability)
  const toThreshold = Math.max(0, GATE_THRESHOLD - probability)

  return (
    <GlassCard glow={color}>
      {/* Big probability display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        {/* Circular gauge */}
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke={T.border} strokeWidth="10"/>
          <circle cx="50" cy="50" r="42" fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${(probability / 100) * 264} 264`}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dasharray 1.2s ease' }}
          />
          <text x="50" y="44" textAnchor="middle" fontSize="22" fontWeight="900" fill={color} fontFamily="Poppins">{probability}%</text>
          <text x="50" y="60" textAnchor="middle" fontSize="9" fill={T.textSub}>pass chance</text>
        </svg>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 18, lineHeight: 1.2 }}>
            Pass Predictor
          </div>
          <div style={{ color, fontWeight: 700, fontSize: 13, marginTop: 4 }}>
            {probability >= 85 ? '🎉 You\'re ready to book your test!' :
              probability >= 70 ? `📈 ${toThreshold}% away from the 85% threshold` :
              probability >= 50 ? `💪 You're ${toThreshold}% away from test-ready` :
              `🔥 Let's close that ${toThreshold}% gap — here's how`}
          </div>
          <div style={{ marginTop: 10 }}>
            <ProgressBar value={probability} max={100} color={color} height={8} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted, marginTop: 4 }}>
              <span>0%</span>
              <span style={{ color: T.yellow }}>85% gate</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gate indicator */}
      {gated ? (
        <div style={{ background: T.orange + '15', border: `1px solid ${T.orange}44`, borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: T.orange }}>
          🔒 <strong>Test booking unlocks at 85%.</strong> You're at {probability}% — {toThreshold}% to go. You've got this.
        </div>
      ) : (
        <div style={{ background: T.green + '15', border: `1px solid ${T.green}44`, borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: T.green }}>
          ✅ <strong>You're test-ready!</strong> Your pass probability is above the 85% threshold.
          <div style={{ marginTop: 10 }}>
            <NeuBtn color={T.green} small onClick={onBookTest} icon="📋">Book My DLTC Test</NeuBtn>
          </div>
        </div>
      )}

      {/* Top 3 actions */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 10 }}>
          ⚡ Your 3 fastest moves to {probability < 85 ? '85%' : '100%'}:
        </div>
        {actions.map((action, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '10px 14px', background: T.bg, borderRadius: 12 }}>
            <div style={{ width: 24, height: 24, background: [T.red, T.orange, T.yellow][i] + '22', border: `1px solid ${[T.red, T.orange, T.yellow][i]}44`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: [T.red, T.orange, T.yellow][i], flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{action}</div>
          </div>
        ))}
      </div>

      {/* Breakdown toggle */}
      <button onClick={() => setShowBreakdown(!showBreakdown)} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: 13, cursor: 'pointer', textDecoration: 'underline', fontFamily: "'Space Grotesk',sans-serif" }}>
        {showBreakdown ? '▲ Hide breakdown' : '▼ See how this is calculated'}
      </button>

      {showBreakdown && (
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Quiz accuracy', val: breakdown.quiz, weight: '40%', color: T.teal },
            { label: 'Attendance', val: breakdown.attendance, weight: '25%', color: T.green },
            { label: 'Consistency', val: breakdown.consistency, weight: '15%', color: T.purple },
            { label: 'Daily streak', val: breakdown.streak, weight: '10%', color: T.yellow },
            { label: 'Sim sessions', val: breakdown.sim, weight: '10%', color: T.orange },
          ].map((b, i) => (
            <div key={i} style={{ background: T.bg, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: T.textSub }}>{b.label}</span>
                <span style={{ color: b.color, fontWeight: 700 }}>{b.val}%</span>
              </div>
              <ProgressBar value={b.val} max={100} color={b.color} height={4} />
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Weight: {b.weight}</div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
