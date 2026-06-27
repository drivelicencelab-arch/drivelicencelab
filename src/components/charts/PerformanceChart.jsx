import { T, GlassCard, ProgressBar } from '../../ui.jsx'

// ── Mini sparkline SVG ────────────────────────────────────────────────────────
function Sparkline({ data, color, width = 120, height = 40 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 6) - 3
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <polyline points={`0,${height} ${pts} ${width},${height}`} fill={`url(#sg-${color.replace('#','')})`}/>
    </svg>
  )
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, labels, color, height = 120 }) {
  if (!data || data.length === 0) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: 13 }}>No data yet</div>
  )
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, padding: '0 4px' }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 10, color: color, fontWeight: 700 }}>{v}%</div>
          <div style={{
            width: '100%',
            height: `${Math.max((v / max) * (height - 30), 4)}px`,
            background: `linear-gradient(to top, ${color}, ${color}88)`,
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.6s ease',
            boxShadow: `0 0 8px ${color}44`,
            minHeight: 4,
          }} />
          {labels && <div style={{ fontSize: 9, color: T.textMuted, textAlign: 'center', lineHeight: 1.2 }}>{labels[i]}</div>}
        </div>
      ))}
    </div>
  )
}

// ── Line chart ────────────────────────────────────────────────────────────────
function LineChart({ datasets, labels, height = 160 }) {
  if (!datasets || datasets.length === 0) return null
  const allVals = datasets.flatMap(d => d.data)
  const max = Math.max(...allVals, 100)
  const min = Math.min(...allVals, 0)
  const range = max - min || 1
  const w = 300, h = height - 30
  const xStep = labels.length > 1 ? w / (labels.length - 1) : w

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${w + 20} ${height}`} style={{ minWidth: 240 }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = h - ((v - min) / range) * h + 10
          return (
            <g key={v}>
              <line x1="0" y1={y} x2={w} y2={y} stroke={T.border} strokeWidth="1" strokeDasharray="4 4"/>
              <text x={w + 4} y={y + 4} fontSize="9" fill={T.textMuted}>{v}</text>
            </g>
          )
        })}
        {/* Dataset lines */}
        {datasets.map((ds, di) => {
          const pts = ds.data.map((v, i) => {
            const x = i * xStep
            const y = h - ((v - min) / range) * h + 10
            return `${x},${y}`
          }).join(' ')
          return (
            <g key={di}>
              <polyline points={pts} fill="none" stroke={ds.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              {ds.data.map((v, i) => (
                <circle key={i} cx={i * xStep} cy={h - ((v - min) / range) * h + 10} r="4" fill={ds.color} stroke={T.bg} strokeWidth="2"/>
              ))}
            </g>
          )
        })}
        {/* X labels */}
        {labels.map((l, i) => (
          <text key={i} x={i * xStep} y={h + 26} fontSize="9" fill={T.textMuted} textAnchor="middle">{l}</text>
        ))}
      </svg>
    </div>
  )
}

// ── Main PerformanceChart component ───────────────────────────────────────────
export default function PerformanceChart({ quizHistory = [], sessions = [], enrollmentReadiness = 0 }) {
  const quizScores = quizHistory.slice().reverse().slice(-8).map(q => Number(q.percentage))
  const quizLabels = quizHistory.slice().reverse().slice(-8).map(q =>
    new Date(q.completed_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
  )

  const avg = quizScores.length ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : 0
  const trend = quizScores.length >= 2 ? quizScores[quizScores.length - 1] - quizScores[0] : 0
  const best = quizScores.length ? Math.max(...quizScores) : 0

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Average', value: `${avg}%`, color: T.teal, icon: '📊' },
          { label: 'Best Score', value: `${best}%`, color: T.yellow, icon: '🏆' },
          { label: 'Trend', value: trend >= 0 ? `+${trend}%` : `${trend}%`, color: trend >= 0 ? T.green : T.red, icon: trend >= 0 ? '📈' : '📉' },
          { label: 'Readiness', value: `${enrollmentReadiness}%`, color: T.purple, icon: '🎯' },
        ].map((s, i) => (
          <GlassCard key={i} glow={s.color} style={{ flex: 1, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: T.textSub }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Quiz score trend */}
      <GlassCard style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 15 }}>Quiz Performance Trend</div>
            <div style={{ fontSize: 12, color: T.textSub }}>Last {quizScores.length} quizzes</div>
          </div>
          {quizScores.length > 1 && <Sparkline data={quizScores} color={T.teal} />}
        </div>
        {quizScores.length === 0
          ? <div style={{ textAlign: 'center', padding: '20px 0', color: T.textMuted, fontSize: 13 }}>Take quizzes to see your trend</div>
          : <LineChart
            datasets={[{ data: quizScores, color: T.teal, label: 'Quiz Score' }]}
            labels={quizLabels}
            height={160}
          />
        }
      </GlassCard>

      {/* Bar chart — score distribution */}
      {quizScores.length > 0 && (
        <GlassCard style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 15, marginBottom: 16 }}>Score Distribution</div>
          <BarChart data={quizScores} labels={quizLabels} color={T.purple} height={120} />
        </GlassCard>
      )}

      {/* Readiness gauge */}
      <GlassCard glow={enrollmentReadiness >= 80 ? T.green : T.teal}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 15, marginBottom: 12 }}>🎯 Licence Readiness</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Circular gauge */}
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
            <circle cx="40" cy="40" r="32" fill="none" stroke={T.border} strokeWidth="8"/>
            <circle cx="40" cy="40" r="32" fill="none"
              stroke={enrollmentReadiness >= 80 ? T.green : enrollmentReadiness >= 50 ? T.teal : T.orange}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(enrollmentReadiness / 100) * 201} 201`}
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <text x="40" y="44" textAnchor="middle" fontSize="16" fontWeight="900"
              fill={enrollmentReadiness >= 80 ? T.green : T.teal}
              fontFamily="Poppins">{enrollmentReadiness}%</text>
          </svg>
          <div style={{ flex: 1 }}>
            {[
              { label: 'Theory Knowledge', val: Math.min(enrollmentReadiness + 10, 100) },
              { label: 'Practical Skills', val: enrollmentReadiness },
              { label: 'Road Rules', val: Math.max(enrollmentReadiness - 5, 0) },
            ].map((r, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: T.textSub }}>{r.label}</span>
                  <span style={{ color: T.teal, fontWeight: 700 }}>{r.val}%</span>
                </div>
                <ProgressBar value={r.val} max={100} color={T.teal} height={5} />
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
