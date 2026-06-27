import { useState, useEffect } from 'react'
import { supabase } from '../../supabase.js'
import { T, GlassCard, Badge } from '../../ui.jsx'

const MEDAL = ['🥇', '🥈', '🥉']
const TIER_COLOR = [T.yellow, '#C0C0C0', '#CD7F32', T.textSub]
const TIER_LABEL = ['Gold', 'Silver', 'Bronze', 'Participant']

export default function WeeklyLeaderboard({ currentUserId, schoolId }) {
  const [board, setBoard] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('xp') // xp | quiz | feedback

  useEffect(() => { loadLeaderboard() }, [tab])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      // Get this week's start
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)

      let entries = []

      if (tab === 'xp') {
        const { data } = await supabase
          .from('student_xp')
          .select('student_id, xp_points, streak_days, profiles!student_id(full_name)')
          .order('xp_points', { ascending: false })
          .limit(20)
        if (data) entries = data.map(d => ({
          id: d.student_id,
          name: d.profiles?.full_name || 'Student',
          score: d.xp_points,
          extra: `${d.streak_days}🔥 streak`,
          metric: 'XP',
        }))
      }

      if (tab === 'quiz') {
        const { data } = await supabase
          .from('quiz_scores')
          .select('student_id, percentage, profiles!student_id(full_name)')
          .gte('completed_at', weekStart.toISOString())
          .order('percentage', { ascending: false })
          .limit(20)
        if (data) {
          // Dedupe by student, take best
          const seen = new Set()
          entries = data.filter(d => {
            if (seen.has(d.student_id)) return false
            seen.add(d.student_id); return true
          }).map(d => ({
            id: d.student_id,
            name: d.profiles?.full_name || 'Student',
            score: Math.round(Number(d.percentage)),
            extra: 'This week',
            metric: '%',
          }))
        }
      }

      if (tab === 'feedback') {
        const { data } = await supabase
          .from('instructor_feedback')
          .select('student_id, rating, profiles!student_id(full_name)')
          .gte('created_at', weekStart.toISOString())
        if (data) {
          const map = {}
          data.forEach(d => {
            if (!map[d.student_id]) map[d.student_id] = { ratings: [], name: d.profiles?.full_name }
            map[d.student_id].ratings.push(d.rating)
          })
          entries = Object.entries(map).map(([id, v]) => ({
            id,
            name: v.name || 'Student',
            score: +(v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length).toFixed(1),
            extra: `${v.ratings.length} reviews`,
            metric: '⭐',
          })).sort((a, b) => b.score - a.score)
        }
      }

      setBoard(entries)
    } catch (e) {
      console.error('Leaderboard error:', e)
    }
    setLoading(false)
  }

  const myRank = board.findIndex(e => e.id === currentUserId)
  const myEntry = board[myRank]

  const getTierColor = (rank) => TIER_COLOR[Math.min(rank, 3)]
  const getTierLabel = (rank) => TIER_LABEL[Math.min(rank, 3)]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 18 }}>🏆 Weekly Leaderboard</div>
          <div style={{ fontSize: 12, color: T.textSub }}>Resets every Monday</div>
        </div>
        {myRank >= 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: T.textSub }}>Your rank</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 22, color: getTierColor(myRank) }}>#{myRank + 1}</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[{ id: 'xp', l: '⭐ XP Points' }, { id: 'quiz', l: '📝 Quiz Scores' }, { id: 'feedback', l: '⭐ Feedback' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 4px', background: tab === t.id ? T.teal : T.bgCard,
            border: `1px solid ${tab === t.id ? T.teal : T.border}`, borderRadius: 10,
            color: tab === t.id ? '#fff' : T.textSub, fontWeight: 700, cursor: 'pointer',
            fontSize: 11, fontFamily: "'Space Grotesk',sans-serif", transition: 'all .2s',
          }}>{t.l}</button>
        ))}
      </div>

      {/* Top 3 podium */}
      {!loading && board.length >= 3 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 20, padding: '0 8px' }}>
          {/* 2nd place */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🥈</div>
            <GlassCard glow="#C0C0C0" style={{ padding: '12px 8px', borderRadius: 12, height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C0C0C0', marginBottom: 4 }}>{board[1]?.name?.split(' ')[0]}</div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, color: '#C0C0C0', fontSize: 16 }}>{board[1]?.score}{board[1]?.metric}</div>
            </GlassCard>
          </div>
          {/* 1st place */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>🥇</div>
            <GlassCard glow={T.yellow} style={{ padding: '12px 8px', borderRadius: 12, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', border: `2px solid ${T.yellow}44` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.yellow, marginBottom: 4 }}>{board[0]?.name?.split(' ')[0]}</div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, color: T.yellow, fontSize: 20 }}>{board[0]?.score}{board[0]?.metric}</div>
              <div style={{ fontSize: 10, color: T.textSub, marginTop: 2 }}>{board[0]?.extra}</div>
            </GlassCard>
          </div>
          {/* 3rd place */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🥉</div>
            <GlassCard glow="#CD7F32" style={{ padding: '12px 8px', borderRadius: 12, height: 68, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#CD7F32', marginBottom: 4 }}>{board[2]?.name?.split(' ')[0]}</div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, color: '#CD7F32', fontSize: 16 }}>{board[2]?.score}{board[2]?.metric}</div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Full rankings */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: T.textSub }}>Loading rankings…</div>
      ) : board.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
          <div style={{ color: T.text, fontWeight: 700 }}>No rankings yet this week</div>
          <div style={{ color: T.textSub, fontSize: 13, marginTop: 4 }}>Take a quiz to get on the board!</div>
        </GlassCard>
      ) : (
        board.slice(0, 10).map((entry, i) => {
          const isMe = entry.id === currentUserId
          const tierColor = getTierColor(i)
          return (
            <GlassCard key={entry.id} glow={isMe ? T.teal : undefined} style={{
              marginBottom: 8,
              padding: '12px 16px',
              border: isMe ? `2px solid ${T.teal}44` : `1px solid ${T.border}`,
              background: isMe ? T.tealGlow : T.bgGlass,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}>
              {/* Rank */}
              <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                {i < 3
                  ? <span style={{ fontSize: 22 }}>{MEDAL[i]}</span>
                  : <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 16, color: tierColor }}>#{i + 1}</span>
                }
              </div>

              {/* Avatar */}
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: tierColor + '22', border: `2px solid ${tierColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {isMe ? '👤' : '🎓'}
              </div>

              {/* Name + extra */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: isMe ? T.teal : T.text, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.name}{isMe && ' (You)'}
                </div>
                <div style={{ fontSize: 11, color: T.textSub }}>{entry.extra}</div>
              </div>

              {/* Score */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 18, color: tierColor }}>
                  {entry.score}{entry.metric}
                </div>
                <Badge label={getTierLabel(i)} color={tierColor} />
              </div>
            </GlassCard>
          )
        })
      )}
    </div>
  )
}
