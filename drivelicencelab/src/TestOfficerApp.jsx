import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { T, GlassCard, NeuBtn, Input, Alert, EmptyState, StatCard, BottomNav, AppHeader, Badge, ProgressBar, TopBar } from './ui.jsx'

export default function TestOfficerApp({ profile, onSignOut }) {
  const [tab, setTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [students, setStudents] = useState([])
  const [showAddBooking, setShowAddBooking] = useState(false)
  const [bForm, setBForm] = useState({ student_email: '', test_date: '', test_time: '', test_center: '', category: 'Code 8' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadBookings(); loadStudents() }, [])

  const loadBookings = async () => {
    const { data } = await supabase.from('test_bookings')
      .select('*, profiles!student_id(full_name, email, sa_id)')
      .order('test_date', { ascending: true })
    if (data) setBookings(data)
  }

  const loadStudents = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student')
    if (data) setStudents(data)
  }

  const addBooking = async () => {
    if (!bForm.student_email || !bForm.test_date || !bForm.test_center) { setError('Fill all required fields.'); return }
    setLoading(true); setError('')
    const { data: student } = await supabase.from('profiles').select('id').eq('email', bForm.student_email).single()
    if (!student) { setError('Student not found.'); setLoading(false); return }
    const { error } = await supabase.from('test_bookings').insert({
      student_id: student.id, test_officer_id: profile.id,
      test_date: bForm.test_date, test_time: bForm.test_time,
      test_center: bForm.test_center, category: bForm.category, status: 'scheduled'
    })
    if (error) setError(error.message)
    else { setSuccess('Test booking created!'); setBForm({ student_email: '', test_date: '', test_time: '', test_center: '', category: 'Code 8' }); setShowAddBooking(false); loadBookings() }
    setLoading(false)
  }

  const updateResult = async (id, result) => {
    await supabase.from('test_bookings').update({ status: result, completed_at: new Date().toISOString() }).eq('id', id)
    loadBookings()
  }

  const scheduled = bookings.filter(b => b.status === 'scheduled').length
  const passed = bookings.filter(b => b.status === 'passed').length
  const failed = bookings.filter(b => b.status === 'failed').length
  const passRate = bookings.length > 0 ? Math.round((passed / (passed + failed || 1)) * 100) : 0

  const TABS = [
    { id: 'bookings', icon: '📋', label: 'Bookings' },
    { id: 'results', icon: '🏆', label: 'Results' },
    { id: 'analytics', icon: '📊', label: 'Analytics' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ]

  const statusColor = { scheduled: T.teal, passed: T.green, failed: T.red, cancelled: T.textMuted }

  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", background: T.bg, minHeight: '100vh', paddingBottom: 80 }}>
      <AppHeader role="test_officer" name={profile.full_name || 'Test Officer'} onSignOut={onSignOut} />
      <div style={{ padding: '20px 16px' }}>

        {tab === 'bookings' && (<>
          <TopBar title="Test Bookings" subtitle={`${scheduled} scheduled`} action={() => setShowAddBooking(true)} actionLabel="+ Book Test" actionColor={T.purple} />
          <Alert msg={error} /><Alert msg={success} type="success" />

          {showAddBooking && (
            <GlassCard style={{ marginBottom: 16, border: `2px solid ${T.purple}44` }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 14 }}>📋 New Test Booking</div>
              <Input label="Student Email" value={bForm.student_email} onChange={e => setBForm({ ...bForm, student_email: e.target.value })} placeholder="student@email.com" required icon="✉️" />
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontWeight: 600, color: T.textSub, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.5px' }}>Licence Category</label>
                <select value={bForm.category} onChange={e => setBForm({ ...bForm, category: e.target.value })}
                  style={{ width: '100%', background: T.bgCard, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '13px 14px', fontSize: 15, color: T.text, outline: 'none' }}>
                  {['Code 8', 'Code 10', 'Code 14'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <Input label="Test Date" value={bForm.test_date} onChange={e => setBForm({ ...bForm, test_date: e.target.value })} type="date" required icon="📅" />
              <Input label="Test Time" value={bForm.test_time} onChange={e => setBForm({ ...bForm, test_time: e.target.value })} type="time" icon="🕐" />
              <Input label="Test Centre / DLTC" value={bForm.test_center} onChange={e => setBForm({ ...bForm, test_center: e.target.value })} placeholder="e.g. Johannesburg DLTC" required icon="🏢" />
              <div style={{ display: 'flex', gap: 10 }}>
                <NeuBtn outline color={T.textSub} onClick={() => setShowAddBooking(false)}>Cancel</NeuBtn>
                <NeuBtn full color={T.purple} onClick={addBooking} disabled={loading}>{loading ? 'Booking…' : 'Create Booking'}</NeuBtn>
              </div>
            </GlassCard>
          )}

          {bookings.filter(b => b.status === 'scheduled').length === 0
            ? <EmptyState icon="📋" title="No upcoming tests" subtitle="Create a test booking for a student." action={() => setShowAddBooking(true)} actionLabel="Book First Test" />
            : bookings.filter(b => b.status === 'scheduled').map((b, i) => (
              <GlassCard key={i} style={{ marginBottom: 14 }} glow={T.purple}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.text, fontSize: 16 }}>{b.profiles?.full_name}</div>
                    <div style={{ fontSize: 13, color: T.textSub }}>{b.profiles?.email}</div>
                    <div style={{ fontSize: 13, color: T.textSub }}>SA ID: {b.profiles?.sa_id || 'Not set'}</div>
                  </div>
                  <Badge label={b.category} color={T.purple} />
                </div>
                <div style={{ background: T.bg, borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div><div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Date</div><div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{new Date(b.test_date).toLocaleDateString('en-ZA')}</div></div>
                    <div><div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Time</div><div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{b.test_time || 'TBD'}</div></div>
                    <div><div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Centre</div><div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{b.test_center}</div></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <NeuBtn full color={T.green} small onClick={() => updateResult(b.id, 'passed')} icon="✅">Pass</NeuBtn>
                  <NeuBtn full danger small onClick={() => updateResult(b.id, 'failed')} icon="❌">Fail</NeuBtn>
                  <NeuBtn outline color={T.textSub} small onClick={() => updateResult(b.id, 'cancelled')}>Cancel</NeuBtn>
                </div>
              </GlassCard>
            ))
          }
        </>)}

        {tab === 'results' && (<>
          <TopBar title="Test Results" subtitle="Completed tests" />
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <StatCard icon="✅" value={passed} label="Passed" color={T.green} />
            <StatCard icon="❌" value={failed} label="Failed" color={T.red} />
            <StatCard icon="📊" value={`${passRate}%`} label="Pass Rate" color={T.teal} />
          </div>
          {bookings.filter(b => b.status !== 'scheduled').length === 0
            ? <EmptyState icon="🏆" title="No results yet" subtitle="Completed test results will appear here." />
            : bookings.filter(b => b.status !== 'scheduled').map((b, i) => (
              <GlassCard key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.text }}>{b.profiles?.full_name}</div>
                    <div style={{ fontSize: 13, color: T.textSub }}>{b.category} · {b.test_center}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{new Date(b.test_date).toLocaleDateString('en-ZA')}</div>
                  </div>
                  <Badge label={b.status.toUpperCase()} color={statusColor[b.status]} />
                </div>
              </GlassCard>
            ))
          }
        </>)}

        {tab === 'analytics' && (<>
          <TopBar title="Analytics" subtitle="Test performance overview" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <StatCard icon="📋" value={bookings.length} label="Total Tests" color={T.teal} />
            <StatCard icon="📅" value={scheduled} label="Upcoming" color={T.purple} />
            <StatCard icon="✅" value={passed} label="Passed" color={T.green} />
            <StatCard icon="📊" value={`${passRate}%`} label="Pass Rate" color={T.yellow} />
          </div>
          <GlassCard style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 14 }}>Pass Rate Overview</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: T.green }}>Passed</span>
                <span style={{ color: T.green, fontWeight: 700 }}>{passed}</span>
              </div>
              <ProgressBar value={passed} max={bookings.length || 1} color={T.green} height={10} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: T.red }}>Failed</span>
                <span style={{ color: T.red, fontWeight: 700 }}>{failed}</span>
              </div>
              <ProgressBar value={failed} max={bookings.length || 1} color={T.red} height={10} />
            </div>
          </GlassCard>
          <GlassCard>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 14 }}>By Licence Category</div>
            {['Code 8', 'Code 10', 'Code 14'].map(cat => {
              const catBookings = bookings.filter(b => b.category === cat)
              const catPassed = catBookings.filter(b => b.status === 'passed').length
              return (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: T.text, fontWeight: 600 }}>{cat}</span>
                    <span style={{ color: T.textSub }}>{catPassed}/{catBookings.length} passed</span>
                  </div>
                  <ProgressBar value={catPassed} max={catBookings.length || 1} color={T.purple} height={8} />
                </div>
              )
            })}
          </GlassCard>
        </>)}

        {tab === 'profile' && (<>
          <TopBar title="My Profile" />
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 64, background: T.purpleGlow, borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: `2px solid ${T.purple}44` }}>📋</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 22 }}>{profile.full_name}</div>
            <div style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>{profile.email}</div>
            <div style={{ marginTop: 8 }}><Badge label="DLTC Test Officer" color={T.purple} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <StatCard icon="📋" value={bookings.length} label="Total Tests" color={T.purple} />
            <StatCard icon="✅" value={passed} label="Passed" color={T.green} />
            <StatCard icon="📊" value={`${passRate}%`} label="Pass Rate" color={T.teal} />
          </div>
          <NeuBtn full danger onClick={onSignOut}>Sign Out</NeuBtn>
        </>)}
      </div>
      <BottomNav tabs={TABS} active={tab} setActive={setTab} />
    </div>
  )
}
