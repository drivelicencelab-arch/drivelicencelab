import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { T, GlassCard, NeuBtn, Input, Alert, EmptyState, StatCard, BottomNav, AppHeader, Badge, ProgressBar, TopBar } from './ui.jsx'

export default function InstructorApp({ profile, onSignOut }) {
  const [tab, setTab] = useState('students')
  const [students, setStudents] = useState([])
  const [feedback, setFeedback] = useState([])
  const [attendance, setAttendance] = useState([])
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState('')
  const [feedbackForm, setFeedbackForm] = useState({ student_id: '', rating: 5, comment: '' })
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadStudents(); loadFeedback(); loadAttendance() }, [])

  const loadStudents = async () => {
    const { data } = await supabase.from('enrollments')
      .select('*, profiles!student_id(full_name, email, sa_id), time_slots(name, day, start_time, end_time)')
      .eq('instructor_id', profile.id)
    if (data) setStudents(data)
  }

  const loadFeedback = async () => {
    const { data } = await supabase.from('instructor_feedback').select('*').eq('instructor_id', profile.id).order('created_at', { ascending: false })
    if (data) setFeedback(data)
  }

  const loadAttendance = async () => {
    const { data } = await supabase.from('attendance').select('*, profiles!student_id(full_name)').eq('instructor_id', profile.id).order('attended_at', { ascending: false }).limit(20)
    if (data) setAttendance(data)
  }

  const markAttendance = async (studentId, slotId) => {
    setLoading(true)
    const { error } = await supabase.from('attendance').insert({
      student_id: studentId, slot_id: slotId,
      instructor_id: profile.id, method: 'manual'
    })
    if (error) setError(error.message)
    else { setSuccess('Attendance marked!'); loadAttendance() }
    setLoading(false)
    setTimeout(() => { setError(''); setSuccess('') }, 3000)
  }

  const submitFeedback = async () => {
    if (!feedbackForm.student_id) { setError('Select a student.'); return }
    setLoading(true)
    const { error } = await supabase.from('instructor_feedback').insert({
      instructor_id: profile.id,
      student_id: feedbackForm.student_id,
      rating: feedbackForm.rating,
      comment: feedbackForm.comment
    })
    if (error) setError(error.message)
    else { setSuccess('Feedback submitted!'); setShowFeedbackForm(false); loadFeedback() }
    setLoading(false)
  }

  const avg = feedback.length ? (feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(1) : null

  const TABS = [
    { id: 'students', icon: '👥', label: 'Students' },
    { id: 'checkin', icon: '📷', label: 'Check-In' },
    { id: 'feedback', icon: '⭐', label: 'Feedback' },
    { id: 'analytics', icon: '📊', label: 'Analytics' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ]

  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", background: T.bg, minHeight: '100vh', paddingBottom: 80 }}>
      <AppHeader role="instructor" name={profile.full_name || 'Instructor'} onSignOut={onSignOut} />
      <div style={{ padding: '20px 16px' }}>

        {tab === 'students' && (<>
          <TopBar title="My Students" subtitle={`${students.length} students assigned`} action={() => setShowFeedbackForm(true)} actionLabel="+ Feedback" />
          <Alert msg={error} /><Alert msg={success} type="success" />
          {showFeedbackForm && (
            <GlassCard style={{ marginBottom: 16, border: `2px solid ${T.teal}44` }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 14 }}>Add Session Feedback</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontWeight: 600, color: T.textSub, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.5px' }}>Student</label>
                <select value={feedbackForm.student_id} onChange={e => setFeedbackForm({ ...feedbackForm, student_id: e.target.value })}
                  style={{ width: '100%', background: T.bgCard, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '13px 14px', fontSize: 15, color: T.text, outline: 'none' }}>
                  <option value="">Select student…</option>
                  {students.map(s => <option key={s.id} value={s.student_id}>{s.profiles?.full_name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontWeight: 600, color: T.textSub, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.5px' }}>Rating</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} onClick={() => setFeedbackForm({ ...feedbackForm, rating: r })}
                      style={{ flex: 1, padding: '10px', border: `2px solid ${feedbackForm.rating >= r ? T.yellow : T.border}`, borderRadius: 10, background: feedbackForm.rating >= r ? T.yellow + '22' : T.bgCard, color: feedbackForm.rating >= r ? T.yellow : T.textSub, fontWeight: 700, cursor: 'pointer', fontSize: 18 }}>★</button>
                  ))}
                </div>
              </div>
              <Input label="Comment (optional)" value={feedbackForm.comment} onChange={e => setFeedbackForm({ ...feedbackForm, comment: e.target.value })} placeholder="Session notes, areas to improve…" />
              <div style={{ display: 'flex', gap: 10 }}>
                <NeuBtn outline color={T.textSub} onClick={() => setShowFeedbackForm(false)}>Cancel</NeuBtn>
                <NeuBtn full color={T.teal} onClick={submitFeedback} disabled={loading}>{loading ? 'Submitting…' : 'Submit Feedback'}</NeuBtn>
              </div>
            </GlassCard>
          )}
          {students.length === 0
            ? <EmptyState icon="👥" title="No students assigned" subtitle="The school admin will assign students to you." />
            : students.map((s, i) => (
              <GlassCard key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.text, fontSize: 16 }}>{s.profiles?.full_name}</div>
                    <div style={{ fontSize: 13, color: T.textSub }}>{s.profiles?.email}</div>
                    <div style={{ fontSize: 13, color: T.teal, marginTop: 4 }}>📅 {s.time_slots?.name} · {s.time_slots?.day}</div>
                    <div style={{ fontSize: 12, color: T.textSub }}>{s.time_slots?.start_time} — {s.time_slots?.end_time}</div>
                  </div>
                  <Badge label={s.status} color={s.status === 'active' ? T.green : T.textSub} />
                </div>
                <NeuBtn small outline color={T.teal} onClick={() => markAttendance(s.student_id, s.slot_id)} disabled={loading}>✅ Mark Present</NeuBtn>
              </GlassCard>
            ))
          }
        </>)}

        {tab === 'checkin' && (<>
          <TopBar title="QR Check-In" subtitle="Scan student QR codes to mark attendance" />
          <GlassCard style={{ textAlign: 'center', padding: 40, marginBottom: 20 }} glow={scanning ? T.green : T.teal}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{scanning ? '🔍' : '📷'}</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 20, marginBottom: 8 }}>{scanning ? 'Scanner Active' : 'Ready to Scan'}</div>
            <div style={{ color: T.textSub, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              {scanning ? 'Point your camera at a student QR code' : 'Tap Start Scanning to open the camera and mark attendance automatically.'}
            </div>
            {!scanning
              ? <NeuBtn full color={T.teal} onClick={() => setScanning(true)} icon="📷">Start Scanning</NeuBtn>
              : <NeuBtn full danger onClick={() => setScanning(false)}>Stop Scanning</NeuBtn>
            }
          </GlassCard>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 12 }}>Recent Attendance</div>
          {attendance.length === 0
            ? <EmptyState icon="📋" title="No attendance records" subtitle="Attendance will appear here after check-ins." />
            : attendance.map((a, i) => (
              <GlassCard key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.text }}>{a.profiles?.full_name}</div>
                    <div style={{ fontSize: 12, color: T.textSub }}>{new Date(a.attended_at).toLocaleString('en-ZA')}</div>
                  </div>
                  <Badge label={a.method === 'qr' ? 'QR Scan' : 'Manual'} color={a.method === 'qr' ? T.teal : T.green} />
                </div>
              </GlassCard>
            ))
          }
        </>)}

        {tab === 'feedback' && (<>
          <TopBar title="My Feedback" subtitle="Student ratings & comments" />
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <StatCard icon="⭐" value={avg ? `${avg}` : '—'} label="Avg Rating" color={T.yellow} />
            <StatCard icon="💬" value={feedback.length} label="Reviews" color={T.teal} />
            <StatCard icon="🚩" value={feedback.filter(f => f.flagged).length} label="Flagged" color={T.red} />
          </div>
          <GlassCard style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 14 }}>Rating Distribution</div>
            {[5, 4, 3, 2, 1].map(star => {
              const cnt = feedback.filter(f => f.rating === star).length
              const pct = feedback.length ? cnt / feedback.length * 100 : 0
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: T.textSub, width: 12 }}>{star}</span>
                  <span style={{ color: T.yellow }}>★</span>
                  <div style={{ flex: 1 }}><ProgressBar value={pct} max={100} color={T.yellow} height={8} /></div>
                  <span style={{ fontSize: 13, color: T.textSub, width: 20, textAlign: 'right' }}>{cnt}</span>
                </div>
              )
            })}
          </GlassCard>
          {feedback.length === 0
            ? <EmptyState icon="💬" title="No feedback yet" subtitle="Student reviews will appear here." />
            : feedback.map((f, i) => (
              <GlassCard key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, color: T.text }}>Student Feedback</div>
                  <span style={{ color: T.yellow }}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                </div>
                {f.comment && <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6 }}>{f.comment}</div>}
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 8 }}>{new Date(f.created_at).toLocaleDateString('en-ZA')}</div>
              </GlassCard>
            ))
          }
        </>)}

        {tab === 'analytics' && (<>
          <TopBar title="Analytics" subtitle="Your teaching performance" />
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <StatCard icon="👥" value={students.length} label="Students" color={T.teal} />
            <StatCard icon="✅" value={attendance.length} label="Check-ins" color={T.green} />
            <StatCard icon="⭐" value={avg || '—'} label="Rating" color={T.yellow} />
          </div>
          <GlassCard style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 14 }}>📈 Student Retention</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', border: `4px solid ${T.teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins',sans-serif", fontWeight: 900, color: T.teal, fontSize: 20, flexShrink: 0, boxShadow: `0 0 20px ${T.teal}44` }}>100%</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: T.text, marginBottom: 8 }}>Retained Students</div>
                <ProgressBar value={100} max={100} color={T.teal} height={8} />
                <div style={{ fontSize: 12, color: T.textSub, marginTop: 6 }}>{students.length} total students tracked</div>
              </div>
            </div>
          </GlassCard>
          <GlassCard>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 14 }}>📊 Teaching Hours</div>
            <div style={{ textAlign: 'center', padding: '20px 0', color: T.textSub }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
              <div>{attendance.length * 2}h total recorded sessions</div>
            </div>
          </GlassCard>
        </>)}

        {tab === 'profile' && (<>
          <TopBar title="My Profile" />
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 64, background: T.greenGlow, borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: `2px solid ${T.green}44` }}>👨‍🏫</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 22 }}>{profile.full_name}</div>
            <div style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>{profile.email}</div>
            <div style={{ marginTop: 8 }}><Badge label="DLTC Instructor" color={T.green} /></div>
          </div>
          <GlassCard style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text }}>Performance Overview</div>
              <NeuBtn small outline color={T.teal}>↓ Export PDF</NeuBtn>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ v: avg || '—', l: 'Avg Rating', c: T.yellow }, { v: feedback.length, l: 'Reviews', c: T.teal }, { v: students.length, l: 'Students', c: T.green }].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: s.c, fontSize: 22 }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: T.textSub }}>{s.l}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <NeuBtn full danger onClick={onSignOut}>Sign Out</NeuBtn>
        </>)}
      </div>
      <BottomNav tabs={TABS} active={tab} setActive={setTab} />
    </div>
  )
}
