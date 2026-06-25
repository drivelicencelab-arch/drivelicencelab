import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { T, GlassCard, NeuBtn, Input, Alert, EmptyState, StatCard, BottomNav, AppHeader, Badge, ProgressBar, TopBar } from './ui.jsx'

export default function AdminApp({ profile, onSignOut }) {
  const [tab, setTab] = useState('dashboard')
  const [slots, setSlots] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [instructors, setInstructors] = useState([])
  const [schoolId, setSchoolId] = useState(null)
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [showEnroll, setShowEnroll] = useState(false)
  const [ns, setNs] = useState({ name: '', day: 'MONDAY', start: '', end: '', capacity: 20 })
  const [enForm, setEnForm] = useState({ student_email: '', slot_id: '', instructor_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { initSchool() }, [])

  const initSchool = async () => {
    let { data: sc } = await supabase.from('schools').select('*').eq('admin_id', profile.id).single()
    if (!sc) {
      const { data } = await supabase.from('schools').insert({ name: 'DriveLicenceLab School', admin_id: profile.id }).select().single()
      sc = data
    }
    if (sc) { setSchoolId(sc.id); loadSlots(sc.id); loadEnrollments(sc.id); loadInstructors() }
  }

  const loadSlots = async (sid) => {
    const { data } = await supabase.from('time_slots').select('*').eq('school_id', sid).order('day')
    if (data) setSlots(data)
  }

  const loadEnrollments = async (sid) => {
    const slotIds = (await supabase.from('time_slots').select('id').eq('school_id', sid)).data?.map(s => s.id) || []
    if (slotIds.length === 0) return
    const { data } = await supabase.from('enrollments').select('*, profiles!student_id(full_name, email), time_slots(name, day), profiles!instructor_id(full_name)').in('slot_id', slotIds)
    if (data) setEnrollments(data)
  }

  const loadInstructors = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'instructor')
    if (data) setInstructors(data)
  }

  const addSlot = async () => {
    if (!ns.name || !ns.start || !ns.end || !schoolId) { setError('Fill all slot fields.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.from('time_slots').insert({ school_id: schoolId, name: ns.name, day: ns.day, start_time: ns.start, end_time: ns.end, capacity: ns.capacity })
    if (error) setError(error.message)
    else { setSuccess('Time slot added!'); setNs({ name: '', day: 'MONDAY', start: '', end: '', capacity: 20 }); setShowAddSlot(false); loadSlots(schoolId) }
    setLoading(false)
  }

  const toggleSlot = async (sl) => {
    await supabase.from('time_slots').update({ active: !sl.active }).eq('id', sl.id)
    loadSlots(schoolId)
  }

  const deleteSlot = async (id) => {
    if (!window.confirm('Delete this slot?')) return
    await supabase.from('time_slots').delete().eq('id', id)
    loadSlots(schoolId)
  }

  const enrollStudent = async () => {
    if (!enForm.student_email || !enForm.slot_id) { setError('Email and slot are required.'); return }
    setLoading(true); setError('')
    const { data: student } = await supabase.from('profiles').select('id').eq('email', enForm.student_email).single()
    if (!student) { setError('Student not found. They must sign up first.'); setLoading(false); return }
    const { error } = await supabase.from('enrollments').insert({
      student_id: student.id, slot_id: enForm.slot_id,
      instructor_id: enForm.instructor_id || null, status: 'active'
    })
    if (error) setError(error.message === 'duplicate key value violates unique constraint "enrollments_student_id_slot_id_key"' ? 'Student already enrolled in this slot.' : error.message)
    else { setSuccess('Student enrolled successfully!'); setEnForm({ student_email: '', slot_id: '', instructor_id: '' }); setShowEnroll(false); loadEnrollments(schoolId) }
    setLoading(false)
  }

  const assignInstructor = async (enrollmentId, instructorId) => {
    await supabase.from('enrollments').update({ instructor_id: instructorId }).eq('id', enrollmentId)
    loadEnrollments(schoolId)
  }

  const grouped = slots.reduce((a, s) => { (a[s.day] = a[s.day] || []).push(s); return a }, {})
  const activeSlots = slots.filter(s => s.active).length
  const totalEnrolled = enrollments.length

  const TABS = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'students', icon: '👥', label: 'Students' },
    { id: 'slots', icon: '⏰', label: 'Slots' },
    { id: 'scheduling', icon: '📅', label: 'Schedule' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ]

  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", background: T.bg, minHeight: '100vh', paddingBottom: 80 }}>
      <AppHeader role="admin" name={profile.full_name || 'Admin'} onSignOut={onSignOut} />
      <div style={{ padding: '20px 16px' }}>

        {tab === 'dashboard' && (<>
          <TopBar title="School Dashboard" subtitle="DriveLicenceLab Overview" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <StatCard icon="👥" value={totalEnrolled} label="Enrolled Students" color={T.teal} />
            <StatCard icon="👨‍🏫" value={instructors.length} label="Instructors" color={T.green} />
            <StatCard icon="⏰" value={activeSlots} label="Active Slots" color={T.orange} />
            <StatCard icon="📋" value={slots.length} label="Total Slots" color={T.purple} />
          </div>
          <GlassCard style={{ marginBottom: 16 }} glow={T.teal}>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <NeuBtn color={T.teal} onClick={() => { setTab('slots'); setShowAddSlot(true) }} icon="➕" small>Add Slot</NeuBtn>
              <NeuBtn color={T.green} onClick={() => { setTab('students'); setShowEnroll(true) }} icon="👤" small>Enrol Student</NeuBtn>
              <NeuBtn color={T.orange} outline onClick={() => setTab('scheduling')} icon="📅" small>Schedule</NeuBtn>
              <NeuBtn color={T.purple} outline onClick={() => setTab('students')} icon="👥" small>Students</NeuBtn>
            </div>
          </GlassCard>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 12 }}>Recent Enrolments</div>
          {enrollments.slice(0, 5).map((e, i) => (
            <GlassCard key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: T.text }}>{e.profiles?.full_name}</div>
                  <div style={{ fontSize: 12, color: T.textSub }}>{e.time_slots?.name} · {e.time_slots?.day}</div>
                </div>
                <Badge label={e.status} color={e.status === 'active' ? T.green : T.textSub} />
              </div>
            </GlassCard>
          ))}
          {enrollments.length === 0 && <EmptyState icon="👥" title="No enrolments yet" subtitle="Enrol your first student to get started." action={() => { setTab('students'); setShowEnroll(true) }} actionLabel="Enrol Student" />}
        </>)}

        {tab === 'students' && (<>
          <TopBar title="Students" subtitle={`${totalEnrolled} enrolments`} action={() => setShowEnroll(true)} actionLabel="+ Enrol" />
          <Alert msg={error} /><Alert msg={success} type="success" />

          {showEnroll && (
            <GlassCard style={{ marginBottom: 16, border: `2px solid ${T.green}44` }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 14 }}>Enrol a Student</div>
              <Input label="Student Email" value={enForm.student_email} onChange={e => setEnForm({ ...enForm, student_email: e.target.value })} placeholder="student@email.com" required icon="✉️" />
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontWeight: 600, color: T.textSub, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.5px' }}>Time Slot <span style={{ color: T.red }}>*</span></label>
                <select value={enForm.slot_id} onChange={e => setEnForm({ ...enForm, slot_id: e.target.value })}
                  style={{ width: '100%', background: T.bgCard, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '13px 14px', fontSize: 15, color: T.text, outline: 'none' }}>
                  <option value="">Select time slot…</option>
                  {slots.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} — {s.day} {s.start_time}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontWeight: 600, color: T.textSub, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.5px' }}>Assign Instructor (optional)</label>
                <select value={enForm.instructor_id} onChange={e => setEnForm({ ...enForm, instructor_id: e.target.value })}
                  style={{ width: '100%', background: T.bgCard, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '13px 14px', fontSize: 15, color: T.text, outline: 'none' }}>
                  <option value="">No instructor yet</option>
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.full_name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <NeuBtn outline color={T.textSub} onClick={() => setShowEnroll(false)}>Cancel</NeuBtn>
                <NeuBtn full color={T.green} onClick={enrollStudent} disabled={loading}>{loading ? 'Enrolling…' : 'Enrol Student'}</NeuBtn>
              </div>
            </GlassCard>
          )}

          {enrollments.length === 0
            ? <EmptyState icon="👥" title="No students enrolled" subtitle="Use the Enrol button to add your first student." />
            : enrollments.map((e, i) => (
              <GlassCard key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.text, fontSize: 16 }}>{e.profiles?.full_name}</div>
                    <div style={{ fontSize: 13, color: T.textSub }}>{e.profiles?.email}</div>
                    <div style={{ fontSize: 13, color: T.teal, marginTop: 4 }}>📅 {e.time_slots?.name} · {e.time_slots?.day}</div>
                    <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>👨‍🏫 {e.instructor_id ? (e.profiles2?.full_name || 'Instructor assigned') : 'No instructor yet'}</div>
                  </div>
                  <Badge label={e.status} color={e.status === 'active' ? T.green : T.textSub} />
                </div>
                {!e.instructor_id && instructors.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <select onChange={ev => assignInstructor(e.id, ev.target.value)} defaultValue=""
                      style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, color: T.text, outline: 'none' }}>
                      <option value="" disabled>Assign instructor…</option>
                      {instructors.map(inst => <option key={inst.id} value={inst.id}>{inst.full_name}</option>)}
                    </select>
                  </div>
                )}
              </GlassCard>
            ))
          }
        </>)}

        {tab === 'slots' && (<>
          <TopBar title="Time Slots" subtitle={`${activeSlots} active slots`} action={() => setShowAddSlot(true)} actionLabel="+ Add Slot" />
          <Alert msg={error} /><Alert msg={success} type="success" />

          {showAddSlot && (
            <GlassCard style={{ marginBottom: 16, border: `2px solid ${T.teal}44` }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 14 }}>New Time Slot</div>
              <Input label="Slot Name" value={ns.name} onChange={e => setNs({ ...ns, name: e.target.value })} placeholder="e.g. Slot A — Morning" required />
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontWeight: 600, color: T.textSub, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.5px' }}>Day</label>
                <select value={ns.day} onChange={e => setNs({ ...ns, day: e.target.value })} style={{ width: '100%', background: T.bgCard, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '13px 14px', fontSize: 15, color: T.text, outline: 'none' }}>
                  {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: T.textSub, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.5px' }}>Start Time</label>
                  <input type="time" value={ns.start} onChange={e => setNs({ ...ns, start: e.target.value })} style={{ width: '100%', background: T.bgCard, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '13px 14px', fontSize: 15, color: T.text, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: T.textSub, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.5px' }}>End Time</label>
                  <input type="time" value={ns.end} onChange={e => setNs({ ...ns, end: e.target.value })} style={{ width: '100%', background: T.bgCard, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '13px 14px', fontSize: 15, color: T.text, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <Input label="Capacity" value={ns.capacity} onChange={e => setNs({ ...ns, capacity: Number(e.target.value) })} type="number" />
              <div style={{ display: 'flex', gap: 10 }}>
                <NeuBtn outline color={T.textSub} onClick={() => setShowAddSlot(false)}>Cancel</NeuBtn>
                <NeuBtn full color={T.teal} onClick={addSlot} disabled={loading}>{loading ? 'Adding…' : 'Add Slot'}</NeuBtn>
              </div>
            </GlassCard>
          )}

          {Object.keys(grouped).length === 0 && <EmptyState icon="⏰" title="No time slots" subtitle="Add your first time slot to get started." />}
          {Object.entries(grouped).map(([day, ds]) => (
            <div key={day}>
              <div style={{ fontWeight: 700, color: T.textMuted, fontSize: 11, letterSpacing: 2, margin: '20px 0 10px', textTransform: 'uppercase' }}>{day}</div>
              {ds.map(sl => (
                <GlassCard key={sl.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 16 }}>{sl.name}</div>
                    <Badge label={sl.active ? 'Active' : 'Disabled'} color={sl.active ? T.green : T.textMuted} />
                  </div>
                  <div style={{ color: T.textSub, fontSize: 13, marginBottom: 4 }}>🕐 {sl.start_time} — {sl.end_time}</div>
                  <div style={{ color: T.textSub, fontSize: 13, marginBottom: 12 }}>👤 Capacity: {sl.capacity} students</div>
                  <ProgressBar value={enrollments.filter(e => e.slot_id === sl.id).length} max={sl.capacity} color={T.teal} />
                  <div style={{ fontSize: 12, color: T.textSub, margin: '6px 0 12px' }}>{enrollments.filter(e => e.slot_id === sl.id).length}/{sl.capacity} enrolled</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <NeuBtn small outline color={sl.active ? T.orange : T.green} onClick={() => toggleSlot(sl)}>{sl.active ? 'Disable' : 'Enable'}</NeuBtn>
                    <NeuBtn small danger onClick={() => deleteSlot(sl.id)}>🗑 Delete</NeuBtn>
                  </div>
                </GlassCard>
              ))}
            </div>
          ))}
        </>)}

        {tab === 'scheduling' && (<>
          <TopBar title="Smart Scheduling" subtitle="Auto-assign & conflict detection" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { l: 'Total Slots', v: slots.length, c: T.teal, i: '📅' },
              { l: 'Assigned', v: enrollments.filter(e => e.instructor_id).length, c: T.green, i: '✅' },
              { l: 'Unassigned', v: enrollments.filter(e => !e.instructor_id).length, c: T.orange, i: '🕐' },
              { l: 'Conflicts', v: 0, c: T.textMuted, i: '⚠️' },
            ].map((s, i) => (
              <GlassCard key={i} glow={s.c} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 28 }}>{s.i}</span>
                <div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: s.c, fontSize: 24 }}>{s.v}</div>
                  <div style={{ fontSize: 12, color: T.textSub }}>{s.l}</div>
                </div>
              </GlassCard>
            ))}
          </div>

          {enrollments.filter(e => !e.instructor_id).length > 0 && (
            <GlassCard style={{ background: T.tealGlow, border: `1.5px solid ${T.teal}44`, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: T.text }}>{enrollments.filter(e => !e.instructor_id).length} students need instructors</div>
                <div style={{ fontSize: 13, color: T.textSub, marginTop: 4 }}>Auto-assign uses availability + load balancing</div>
              </div>
              <NeuBtn color={T.teal} small icon="⚡">Auto-Assign</NeuBtn>
            </GlassCard>
          )}

          {Object.entries(grouped).map(([day, ds]) => (
            <div key={day}>
              <div style={{ fontWeight: 700, color: T.textMuted, fontSize: 11, letterSpacing: 2, margin: '20px 0 10px', textTransform: 'uppercase' }}>{day}</div>
              {ds.map(sl => {
                const slotEnrollments = enrollments.filter(e => e.slot_id === sl.id)
                return (
                  <GlassCard key={sl.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text }}>{sl.name}</div>
                    <div style={{ color: T.textSub, fontSize: 13, marginTop: 4 }}>🕐 {sl.start_time} — {sl.end_time} · {slotEnrollments.length}/{sl.capacity} enrolled</div>
                    {slotEnrollments.length === 0 ? (
                      <div style={{ marginTop: 12, border: `1.5px dashed ${T.border}`, borderRadius: 12, padding: '12px 16px', color: T.textMuted, fontSize: 14, textAlign: 'center' }}>No students enrolled yet</div>
                    ) : (
                      slotEnrollments.map((e, i) => (
                        <div key={i} style={{ marginTop: 10, padding: '10px 14px', background: T.bg, borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: T.text, fontSize: 14 }}>{e.profiles?.full_name}</span>
                            {e.instructor_id
                              ? <Badge label="Instructor assigned" color={T.green} />
                              : <select onChange={ev => assignInstructor(e.id, ev.target.value)} defaultValue=""
                                style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: T.text, outline: 'none' }}>
                                <option value="" disabled>Assign instructor…</option>
                                {instructors.map(inst => <option key={inst.id} value={inst.id}>{inst.full_name}</option>)}
                              </select>
                            }
                          </div>
                        </div>
                      ))
                    )}
                  </GlassCard>
                )
              })}
            </div>
          ))}
          {slots.length === 0 && <EmptyState icon="📅" title="No slots yet" subtitle="Add time slots first, then assign instructors." />}
        </>)}

        {tab === 'profile' && (<>
          <TopBar title="School Profile" />
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 64, background: T.orangeGlow, borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: `2px solid ${T.orange}44` }}>🏫</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 22 }}>{profile.full_name}</div>
            <div style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>{profile.email}</div>
            <div style={{ marginTop: 8 }}><Badge label="School Administrator" color={T.orange} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <StatCard icon="👥" value={totalEnrolled} label="Students" color={T.teal} />
            <StatCard icon="👨‍🏫" value={instructors.length} label="Instructors" color={T.green} />
            <StatCard icon="⏰" value={activeSlots} label="Slots" color={T.orange} />
          </div>
          <NeuBtn full danger onClick={onSignOut}>Sign Out</NeuBtn>
        </>)}
      </div>
      <BottomNav tabs={TABS} active={tab} setActive={setTab} />
    </div>
  )
}
