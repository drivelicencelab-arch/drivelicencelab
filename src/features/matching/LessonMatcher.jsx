import { useState, useEffect } from 'react'
import { supabase } from '../../supabase.js'
import { T, GlassCard, NeuBtn, Alert, Badge } from '../../ui.jsx'

const MATCH_WINDOW_SECONDS = 120 // 2 minutes to confirm

// ── Last-Minute Lesson Request (Student side) ─────────────────────────────────
export function LessonMatchRequest({ studentId, studentName, onMatched }) {
  const [requested, setRequested] = useState(false)
  const [matched, setMatched] = useState(null)
  const [countdown, setCountdown] = useState(MATCH_WINDOW_SECONDS)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!requested || matched) return
    // Poll for instructor match every 5 seconds
    const poll = setInterval(async () => {
      const { data } = await supabase.from('lesson_match_requests')
        .select('*, profiles!instructor_id(full_name, phone)')
        .eq('student_id', studentId)
        .eq('status', 'matched')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (data?.instructor_id) {
        setMatched(data)
        clearInterval(poll)
      }
    }, 5000)

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          clearInterval(poll)
          cancelRequest()
          return 0
        }
        return c - 1
      })
    }, 1000)

    return () => { clearInterval(poll); clearInterval(timer) }
  }, [requested])

  const sendRequest = async () => {
    setLoading(true); setError('')
    const now = new Date()
    const slotTime = new Date(now.getTime() + 30 * 60 * 1000) // 30 min from now

    const { error: err } = await supabase.from('lesson_match_requests').insert({
      student_id: studentId,
      student_name: studentName,
      requested_time: slotTime.toISOString(),
      expires_at: new Date(now.getTime() + MATCH_WINDOW_SECONDS * 1000).toISOString(),
      status: 'pending',
    })
    if (err) { setError(err.message); setLoading(false); return }
    setRequested(true)
    setCountdown(MATCH_WINDOW_SECONDS)
    setLoading(false)
  }

  const cancelRequest = async () => {
    await supabase.from('lesson_match_requests').update({ status: 'cancelled' })
      .eq('student_id', studentId).eq('status', 'pending')
    setRequested(false)
    setMatched(null)
    setCountdown(MATCH_WINDOW_SECONDS)
  }

  const confirmLesson = async () => {
    await supabase.from('lesson_match_requests').update({ status: 'confirmed' }).eq('id', matched.id)
    setConfirmed(true)
    onMatched?.(matched)
  }

  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60

  if (confirmed && matched) {
    return (
      <GlassCard glow={T.green}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🚗✅</div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 22, marginBottom: 8 }}>Lesson Confirmed!</div>
          <div style={{ color: T.textSub, fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
            Your instructor <strong style={{ color: T.teal }}>{matched.profiles?.full_name}</strong> is on the way.
            Lesson starts in approximately 30 minutes.
          </div>
          <div style={{ background: T.green + '15', border: `1px solid ${T.green}44`, borderRadius: 12, padding: 14, fontSize: 13, color: T.green }}>
            📱 Don't forget: bring your learner's licence and SA ID!
          </div>
        </div>
      </GlassCard>
    )
  }

  if (matched) {
    return (
      <GlassCard glow={T.teal}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 20 }}>Instructor Found!</div>
          <div style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>Confirm within 2 minutes or the slot releases</div>
        </div>
        <div style={{ background: T.tealGlow, border: `1px solid ${T.teal}44`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: T.textSub, fontSize: 13 }}>Instructor</span>
            <span style={{ fontWeight: 700, color: T.text }}>{matched.profiles?.full_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: T.textSub, fontSize: 13 }}>Lesson time</span>
            <span style={{ fontWeight: 700, color: T.teal }}>In ~30 minutes</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: T.textSub, fontSize: 13 }}>Duration</span>
            <span style={{ fontWeight: 700, color: T.text }}>2 hours</span>
          </div>
        </div>
        {/* Confirm countdown */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 28, color: countdown < 30 ? T.red : T.yellow }}>
            {mins}:{String(secs).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 12, color: T.textSub }}>to confirm or slot releases</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <NeuBtn outline color={T.red} onClick={cancelRequest}>Decline</NeuBtn>
          <NeuBtn full color={T.green} onClick={confirmLesson} icon="✅">Confirm Lesson!</NeuBtn>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard glow={T.orange}>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 17, marginBottom: 4 }}>
        ⚡ Last-Minute Lesson
      </div>
      <div style={{ color: T.textSub, fontSize: 13, marginBottom: 20 }}>Get an instructor now — evenings, weekends, last-minute gaps</div>

      <Alert msg={error} />

      {!requested ? (
        <>
          <div style={{ background: T.bg, borderRadius: 12, padding: 16, marginBottom: 20 }}>
            {[
              { icon: '🕐', label: 'Lesson time', val: 'Within 30–60 minutes' },
              { icon: '⏱️', label: 'Duration', val: '2 hours (standard)' },
              { icon: '👨‍🏫', label: 'Instructor', val: 'Nearest available in your area' },
              { icon: '✅', label: 'Confirm window', val: '2 minutes to accept match' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
                <span style={{ color: T.textSub, fontSize: 13 }}>{r.icon} {r.label}</span>
                <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{r.val}</span>
              </div>
            ))}
          </div>
          <NeuBtn full color={T.orange} onClick={sendRequest} disabled={loading} icon="⚡">
            {loading ? 'Searching…' : 'Request On-Demand Lesson'}
          </NeuBtn>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 20 }}>
          {/* Pulsing search indicator */}
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 20px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${T.orange}`, animation: 'ripple 1.5s ease-out infinite' }} />
            <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: `3px solid ${T.orange}`, animation: 'ripple 1.5s ease-out infinite 0.5s' }} />
            <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', background: T.orange + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🚗</div>
          </div>
          <style>{`@keyframes ripple { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }`}</style>
          <div style={{ fontWeight: 700, color: T.text, fontSize: 16, marginBottom: 8 }}>Finding your instructor…</div>
          <div style={{ color: T.textSub, fontSize: 13, marginBottom: 20 }}>Matching with available instructors in your area</div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 32, color: T.orange }}>
            {mins}:{String(secs).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 12, color: T.textSub, marginBottom: 20 }}>request expires in</div>
          <NeuBtn outline color={T.red} onClick={cancelRequest}>Cancel Request</NeuBtn>
        </div>
      )}
    </GlassCard>
  )
}

// ── Instructor Surge Availability (Instructor side) ───────────────────────────
export function InstructorSurgePanel({ instructorId }) {
  const [available, setAvailable] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAvailability()
    if (available) pollRequests()
  }, [available])

  const checkAvailability = async () => {
    const { data } = await supabase.from('instructor_surge_availability')
      .select('*').eq('instructor_id', instructorId)
      .eq('active', true).single()
    setAvailable(!!data)
  }

  const pollRequests = async () => {
    const { data } = await supabase.from('lesson_match_requests')
      .select('*, profiles!student_id(full_name)')
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (data) setPendingRequests(data)
  }

  const toggleAvailability = async () => {
    setLoading(true)
    if (available) {
      await supabase.from('instructor_surge_availability').delete().eq('instructor_id', instructorId)
      setAvailable(false)
    } else {
      await supabase.from('instructor_surge_availability').upsert({
        instructor_id: instructorId,
        active: true,
        available_until: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      })
      setAvailable(true)
      pollRequests()
    }
    setLoading(false)
  }

  const acceptRequest = async (request) => {
    await supabase.from('lesson_match_requests').update({
      instructor_id: instructorId,
      status: 'matched',
    }).eq('id', request.id)
    pollRequests()
  }

  return (
    <GlassCard glow={available ? T.green : T.border}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 16 }}>⚡ Surge Availability</div>
          <div style={{ fontSize: 12, color: T.textSub }}>Opt in to receive on-demand lesson requests</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge label={available ? '🟢 Available' : '⚫ Offline'} color={available ? T.green : T.textMuted} />
          <NeuBtn small color={available ? T.red : T.green} onClick={toggleAvailability} disabled={loading} outline={available}>
            {loading ? '…' : available ? 'Go Offline' : 'Go Live'}
          </NeuBtn>
        </div>
      </div>

      {available && (
        <>
          <div style={{ background: T.green + '15', border: `1px solid ${T.green}44`, borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: T.green }}>
            ✅ You're live! Student requests will appear here. You have 2 minutes to accept each one.
          </div>

          {pendingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: T.textSub, fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👁️</div>
              Watching for student requests…
            </div>
          ) : (
            pendingRequests.map((req, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${T.orange}44` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.text }}>{req.profiles?.full_name || req.student_name}</div>
                    <div style={{ fontSize: 12, color: T.textSub }}>
                      Wants lesson at {new Date(req.requested_time).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <Badge label="Pending" color={T.orange} />
                </div>
                <NeuBtn full color={T.green} small onClick={() => acceptRequest(req)} icon="✅">Accept Request</NeuBtn>
              </div>
            ))
          )}
        </>
      )}
    </GlassCard>
  )
}
