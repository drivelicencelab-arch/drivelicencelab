import { useState, useEffect } from 'react'
import { supabase } from '../../supabase.js'
import { T, GlassCard, NeuBtn, Input, Alert, ProgressBar } from '../../ui.jsx'

const GOAL_PRESETS = [
  { label: '🎓 Graduation', icon: '🎓' },
  { label: '🎉 Prom Night', icon: '🎉' },
  { label: '☀️ Summer Trip', icon: '☀️' },
  { label: '🎂 My Birthday', icon: '🎂' },
  { label: '📅 Custom Date', icon: '📅' },
]

// ── Calculate weekly plan ─────────────────────────────────────────────────────
function buildWeeklyPlan({ goalDate, currentReadiness, weeksNeeded }) {
  const today = new Date()
  const target = new Date(goalDate)
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksLeft = Math.max(1, Math.ceil((target - today) / msPerWeek))
  const readinessGap = Math.max(0, 85 - currentReadiness)
  const weeklyGainNeeded = readinessGap / weeksLeft

  const plan = []
  for (let w = 0; w < Math.min(weeksLeft, 8); w++) {
    const weekStart = new Date(today.getTime() + w * msPerWeek)
    const weekLabel = weekStart.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
    const targetReadiness = Math.min(85, currentReadiness + weeklyGainNeeded * (w + 1))

    plan.push({
      week: w + 1,
      label: `Week ${w + 1} — ${weekLabel}`,
      lessons: w < weeksLeft - 1 ? 2 : 1,
      quizzes: weeklyGainNeeded > 10 ? 3 : 2,
      sim: w % 2 === 0 ? 1 : 0,
      targetReadiness: Math.round(targetReadiness),
      isLast: w === weeksLeft - 1,
    })
  }
  return { plan, weeksLeft, weeklyGainNeeded: Math.round(weeklyGainNeeded), feasible: weeksLeft >= 2 }
}

// ── GoalDateEngine Component ──────────────────────────────────────────────────
export default function GoalDateEngine({ studentId, currentReadiness = 0, completedWeeks = 0 }) {
  const [goalDate, setGoalDate] = useState('')
  const [goalLabel, setGoalLabel] = useState('')
  const [savedGoal, setSavedGoal] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadGoal() }, [])

  const loadGoal = async () => {
    const { data } = await supabase.from('student_goals')
      .select('*').eq('student_id', studentId).single()
    if (data) {
      setSavedGoal(data)
      setGoalDate(data.goal_date)
      setGoalLabel(data.goal_label)
      const result = buildWeeklyPlan({ goalDate: data.goal_date, currentReadiness, weeksNeeded: 8 })
      setPlan(result)
    }
  }

  const saveGoal = async () => {
    if (!goalDate) return
    setLoading(true)
    const result = buildWeeklyPlan({ goalDate, currentReadiness, weeksNeeded: 8 })
    setPlan(result)

    await supabase.from('student_goals').upsert({
      student_id: studentId,
      goal_date: goalDate,
      goal_label: goalLabel || 'My Goal',
      plan: result.plan,
      created_at: new Date().toISOString(),
    }, { onConflict: 'student_id' })

    setSaved(true)
    setLoading(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const today = new Date()
  const daysLeft = savedGoal ? Math.max(0, Math.ceil((new Date(savedGoal.goal_date) - today) / (24*60*60*1000))) : 0
  const onTrack = plan ? completedWeeks >= plan.weeksLeft - Math.ceil(daysLeft / 7) : true

  return (
    <GlassCard glow={T.purple}>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 17, marginBottom: 4 }}>
        🎯 Licence Before
      </div>
      <div style={{ color: T.textSub, fontSize: 13, marginBottom: 20 }}>Set your goal date — get a personalised weekly plan</div>

      {/* Goal presets */}
      {!savedGoal && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {GOAL_PRESETS.map(p => (
              <button key={p.label} onClick={() => setGoalLabel(p.label)} style={{
                padding: '8px 14px', borderRadius: 20,
                background: goalLabel === p.label ? T.purple + '30' : T.bgCard,
                border: `1.5px solid ${goalLabel === p.label ? T.purple : T.border}`,
                color: goalLabel === p.label ? T.purple : T.textSub,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: "'Space Grotesk',sans-serif",
              }}>{p.label}</button>
            ))}
          </div>
          <Input label="Goal Date" value={goalDate} onChange={e => setGoalDate(e.target.value)} type="date" icon="📅" required />
          <NeuBtn full color={T.purple} onClick={saveGoal} disabled={loading || !goalDate} icon="🎯">
            {loading ? 'Building your plan…' : 'Build My Plan'}
          </NeuBtn>
        </>
      )}

      {/* Countdown & status */}
      {savedGoal && (
        <>
          <div style={{ background: T.purple + '15', border: `1px solid ${T.purple}44`, borderRadius: 14, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: T.text, fontSize: 16 }}>{savedGoal.goal_label}</div>
              <div style={{ color: T.textSub, fontSize: 13, marginTop: 2 }}>{new Date(savedGoal.goal_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 32, color: daysLeft < 14 ? T.red : T.purple }}>{daysLeft}</div>
              <div style={{ fontSize: 11, color: T.textSub }}>days left</div>
            </div>
          </div>

          {/* On track / behind */}
          {onTrack ? (
            <div style={{ background: T.green + '15', border: `1px solid ${T.green}44`, borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: T.green }}>
              🎯 {daysLeft} days to your goal — you're on track! Keep it up.
            </div>
          ) : (
            <div style={{ background: T.orange + '15', border: `1px solid ${T.orange}44`, borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: T.orange }}>
              ⚡ You're a few sessions behind. Here's your adjusted path — still totally doable.
            </div>
          )}
        </>
      )}

      {/* Weekly plan */}
      {plan && (
        <div>
          <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 12 }}>
            📅 Your Weekly Road Map
            {plan.weeklyGainNeeded > 0 && <span style={{ color: T.textSub, fontWeight: 400, fontSize: 12, marginLeft: 8 }}>+{plan.weeklyGainNeeded}% readiness/week needed</span>}
          </div>

          {!plan.feasible && (
            <Alert msg="Your goal date is very soon. We'll build the most intensive plan possible — let's go!" type="warning" />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
            {plan.plan.map((week, i) => {
              const done = i < completedWeeks
              const current = i === completedWeeks
              return (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: done ? T.green + '10' : current ? T.purple + '15' : T.bg,
                  border: `1px solid ${done ? T.green + '44' : current ? T.purple + '44' : T.border}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: done ? T.green : current ? T.purple : T.text, fontSize: 13 }}>
                      {done ? '✅' : current ? '👉' : '○'} {week.label}
                    </div>
                    <div style={{ fontSize: 11, color: T.textSub }}>Target: {week.targetReadiness}%</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[
                      { label: `${week.lessons} lessons`, icon: '🚗' },
                      { label: `${week.quizzes} quizzes`, icon: '📝' },
                      { label: `${week.sim} sim`, icon: '🎮' },
                    ].map((item, j) => (
                      <div key={j} style={{ background: T.bgCard, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: T.textSub }}>
                        {item.icon} {item.label}
                      </div>
                    ))}
                  </div>
                  {week.isLast && (
                    <div style={{ marginTop: 8, fontSize: 12, color: T.yellow, fontWeight: 700 }}>
                      🏆 Test booking week — aim for 85%+ before this!
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {savedGoal && (
            <div style={{ marginTop: 14 }}>
              <NeuBtn small outline color={T.textSub} onClick={() => { setSavedGoal(null); setPlan(null) }}>Change Goal Date</NeuBtn>
            </div>
          )}
          {saved && (
            <div style={{ marginTop: 10, fontSize: 13, color: T.green }}>✅ Goal saved!</div>
          )}
        </div>
      )}
    </GlassCard>
  )
}
