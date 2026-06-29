import { useState } from 'react'
import { T, GlassCard, NeuBtn, Alert } from '../../ui.jsx'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY

// ── Topic cluster mapping ─────────────────────────────────────────────────────
const TOPIC_CLUSTERS = {
  0: 'Road markings & lane rules',
  1: 'Headlight & visibility rules',
  2: 'Speed limits by zone',
  3: 'Traffic light procedures',
  4: 'Night driving rules',
  5: 'Amber light decision-making',
  6: 'Following distance & highway',
  7: 'Right-of-way at intersections',
  8: 'Hazard light usage',
  9: 'Blood alcohol & legal limits',
}

const MICRO_DRILLS = {
  'Road markings & lane rules': 'Study the 6 white line types — solid, dashed, double. Draw each one and write what it means.',
  'Headlight & visibility rules': 'Flash card drill: for each weather condition, state which lights are required.',
  'Speed limits by zone': 'Memory map — write SA speed limits for residential, urban, rural, highway without looking.',
  'Traffic light procedures': 'Run the 4-light scenario drill: green, amber, red, flashing red. Time yourself under 10 seconds.',
  'Right-of-way at intersections': '4-way stop simulation — use 4 coins, place them at an intersection, practice yielding logic.',
  'Night driving rules': 'Distance drill — at what distance must you dip headlights? Oncoming: 150m. Following: 100m.',
  'Amber light decision-making': 'The amber rule: only proceed if stopping would be unsafe. Run 5 scenario cards.',
  'Following distance & highway': '3-second rule practice — count "one thousand one, one thousand two, one thousand three."',
  'Hazard light usage': 'List the 3 legal uses of hazard lights. Write them. Quiz yourself.',
  'Blood alcohol & legal limits': 'Memorise: Professional driver 0.02g. Normal driver 0.05g. Learner 0.00g.',
}

// ── Analyse quiz answers ──────────────────────────────────────────────────────
export function analyseWeaknesses(quizHistory) {
  if (!quizHistory || quizHistory.length === 0) return []

  // Build error frequency map per topic
  const topicErrors = {}
  quizHistory.forEach(session => {
    if (session.wrong_indices) {
      session.wrong_indices.forEach(idx => {
        const cluster = TOPIC_CLUSTERS[idx] || 'General K53'
        topicErrors[cluster] = (topicErrors[cluster] || 0) + 1
      })
    }
  })

  // Sort by error frequency
  return Object.entries(topicErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic, errors]) => ({
      topic,
      errors,
      drill: MICRO_DRILLS[topic] || 'Review this topic section in the K53 manual and attempt 5 practice questions.',
    }))
}

// ── AI Blind Spot Report generator ───────────────────────────────────────────
async function generateBlindSpotReport(weaknesses, studentName) {
  const weaknessText = weaknesses.map((w, i) =>
    `${i + 1}. ${w.topic} (missed ${w.errors} times)`
  ).join('\n')

  const prompt = `You are a K53 driving tutor for South Africa. A student named ${studentName} has these quiz weaknesses:\n${weaknessText}\n\nGenerate a "Blind Spot Report" with EXACTLY this structure for each weakness:\n- DIAGNOSIS: One sentence explaining WHY they're likely getting this wrong (the mental pattern, not just the topic)\n- FIX: One ultra-specific 10-minute drill they can do RIGHT NOW\n- ENCOURAGEMENT: One punchy sentence (peer tone, not teacher tone)\n\nKeep total output under 150 words. Be direct, specific, peer-like.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || null
}

// ── BlindSpotReport Component ─────────────────────────────────────────────────
export default function BlindSpotReport({ quizHistory = [], studentName = 'Student' }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const weaknesses = analyseWeaknesses(quizHistory)

  const generateReport = async () => {
    if (weaknesses.length === 0) return
    setLoading(true); setError('')
    try {
      const text = await generateBlindSpotReport(weaknesses, studentName)
      setReport(text)
    } catch (e) {
      setError('Could not generate report. Check your connection.')
    }
    setLoading(false)
  }

  if (quizHistory.length < 2) {
    return (
      <GlassCard glow={T.orange} style={{ textAlign: 'center', padding: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
        <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>Blind Spot Report</div>
        <div style={{ color: T.textSub, fontSize: 13, marginTop: 6 }}>Take 2+ quizzes to unlock your personalised weakness analysis.</div>
      </GlassCard>
    )
  }

  return (
    <GlassCard glow={T.orange}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 17 }}>🎯 Blind Spot Report</div>
          <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>Your 3 weakest areas — with exact fixes</div>
        </div>
        <NeuBtn small color={T.orange} onClick={generateReport} disabled={loading}>
          {loading ? '⚡ Analysing…' : '⚡ Generate'}
        </NeuBtn>
      </div>

      <Alert msg={error} />

      {/* Raw weakness list */}
      {!report && weaknesses.map((w, i) => (
        <div key={i} style={{ marginBottom: 14, padding: '14px 16px', background: T.bg, borderRadius: 14, borderLeft: `3px solid ${[T.red, T.orange, T.yellow][i]}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>#{i + 1} {w.topic}</div>
            <span style={{ fontSize: 12, color: [T.red, T.orange, T.yellow][i], fontWeight: 700 }}>{w.errors} misses</span>
          </div>
          <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6 }}>🔧 {w.drill}</div>
        </div>
      ))}

      {/* AI-generated report */}
      {report && (
        <div style={{ background: T.bg, borderRadius: 14, padding: 16, border: `1px solid ${T.orange}44` }}>
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{report}</div>
          <div style={{ marginTop: 14 }}>
            <NeuBtn small outline color={T.orange} onClick={() => setReport(null)}>← Back to list</NeuBtn>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
