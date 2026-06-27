import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { T, GlassCard, NeuBtn, Alert, EmptyState, StatCard, BottomNav, AppHeader, Badge, ProgressBar, TopBar } from './ui.jsx'

export default function SystemAdminApp({ profile, onSignOut }) {
  const [tab, setTab] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [schools, setSchools] = useState([])
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadUsers(); loadSchools(); loadIssues() }, [])

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
  }

  const loadSchools = async () => {
    const { data } = await supabase.from('schools').select('*, profiles!admin_id(full_name, email)')
    if (data) setSchools(data)
  }

  const loadIssues = async () => {
    const { data } = await supabase.from('issue_tracker').select('*, profiles!reporter_id(full_name)').order('created_at', { ascending: false })
    if (data) setIssues(data)
  }

  const updateUserRole = async (userId, newRole) => {
    setLoading(true)
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) setError(error.message)
    else { setSuccess('User role updated!'); loadUsers() }
    setLoading(false)
    setTimeout(() => { setError(''); setSuccess('') }, 3000)
  }

  const verifySchool = async (schoolId) => {
    await supabase.from('schools').update({ verified: true }).eq('id', schoolId)
    loadSchools()
    setSuccess('School verified!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const resolveIssue = async (issueId) => {
    await supabase.from('issue_tracker').update({ status: 'resolved' }).eq('id', issueId)
    loadIssues()
  }

  const roleColors = { student: T.teal, instructor: T.green, admin: T.orange, test_officer: T.purple, system_admin: T.red }
  const totalStudents = users.filter(u => u.role === 'student').length
  const totalInstructors = users.filter(u => u.role === 'instructor').length
  const openIssues = issues.filter(i => i.status !== 'resolved').length

  const TABS = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'schools', icon: '🏫', label: 'Schools' },
    { id: 'issues', icon: '🐛', label: 'Issues' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ]

  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", background: T.bg, minHeight: '100vh', paddingBottom: 80 }}>
      <AppHeader role="system_admin" name={profile.full_name || 'System Admin'} onSignOut={onSignOut} />
      <div style={{ padding: '20px 16px' }}>

        {tab === 'dashboard' && (<>
          <TopBar title="System Dashboard" subtitle="Platform health overview" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <StatCard icon="👥" value={users.length} label="Total Users" color={T.teal} />
            <StatCard icon="🏫" value={schools.length} label="Schools" color={T.orange} />
            <StatCard icon="🎓" value={totalStudents} label="Students" color={T.green} />
            <StatCard icon="🐛" value={openIssues} label="Open Issues" color={openIssues > 0 ? T.red : T.textMuted} />
          </div>

          {/* Platform health */}
          <GlassCard style={{ marginBottom: 16 }} glow={T.green}>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 16 }}>🟢 Platform Health</div>
            {[
              { label: 'Database', status: 'Operational', color: T.green },
              { label: 'Authentication', status: 'Operational', color: T.green },
              { label: 'Storage', status: 'Operational', color: T.green },
              { label: 'AI Tutor', status: 'Active', color: T.teal },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
                <span style={{ color: T.text, fontSize: 14 }}>{s.label}</span>
                <Badge label={s.status} color={s.color} />
              </div>
            ))}
          </GlassCard>

          {/* User breakdown */}
          <GlassCard>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, marginBottom: 14 }}>User Breakdown</div>
            {[
              { role: 'student', label: 'Students', count: totalStudents, color: T.teal },
              { role: 'instructor', label: 'Instructors', count: totalInstructors, color: T.green },
              { role: 'admin', label: 'School Admins', count: users.filter(u => u.role === 'admin').length, color: T.orange },
              { role: 'test_officer', label: 'Test Officers', count: users.filter(u => u.role === 'test_officer').length, color: T.purple },
            ].map((r, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: T.text, fontWeight: 600 }}>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 700 }}>{r.count}</span>
                </div>
                <ProgressBar value={r.count} max={users.length || 1} color={r.color} height={6} />
              </div>
            ))}
          </GlassCard>
        </>)}

        {tab === 'users' && (<>
          <TopBar title="All Users" subtitle={`${users.length} registered users`} />
          <Alert msg={error} /><Alert msg={success} type="success" />

          {/* Search / filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
            {['all', 'student', 'instructor', 'admin', 'test_officer'].map(r => (
              <button key={r} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, padding: '6px 14px', color: T.textSub, fontWeight: 600, cursor: 'pointer', fontSize: 12, fontFamily: "'Space Grotesk',sans-serif", whiteSpace: 'nowrap' }}>
                {r === 'all' ? 'All' : r.replace('_', ' ')}
              </button>
            ))}
          </div>

          {users.map((u, i) => (
            <GlassCard key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: T.text }}>{u.full_name || 'Unnamed User'}</div>
                  <div style={{ fontSize: 13, color: T.textSub }}>{u.email}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{new Date(u.created_at).toLocaleDateString('en-ZA')}</div>
                </div>
                <Badge label={u.role} color={roleColors[u.role] || T.textSub} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['student', 'instructor', 'admin', 'test_officer'].filter(r => r !== u.role).map(r => (
                  <NeuBtn key={r} small outline color={roleColors[r]} onClick={() => updateUserRole(u.id, r)} disabled={loading}>
                    → {r.replace('_', ' ')}
                  </NeuBtn>
                ))}
              </div>
            </GlassCard>
          ))}
        </>)}

        {tab === 'schools' && (<>
          <TopBar title="Schools" subtitle={`${schools.length} registered schools`} />
          <Alert msg={success} type="success" />
          {schools.length === 0
            ? <EmptyState icon="🏫" title="No schools registered" subtitle="Schools will appear here when admins sign up." />
            : schools.map((s, i) => (
              <GlassCard key={i} style={{ marginBottom: 14 }} glow={s.verified ? T.green : T.yellow}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 16 }}>{s.name}</div>
                    <div style={{ fontSize: 13, color: T.textSub }}>Admin: {s.profiles?.full_name}</div>
                    <div style={{ fontSize: 13, color: T.textSub }}>{s.profiles?.email}</div>
                  </div>
                  <Badge label={s.verified ? 'Verified ✓' : 'Pending'} color={s.verified ? T.green : T.yellow} />
                </div>
                {!s.verified && (
                  <NeuBtn color={T.green} small onClick={() => verifySchool(s.id)} icon="✅">Verify School</NeuBtn>
                )}
              </GlassCard>
            ))
          }
        </>)}

        {tab === 'issues' && (<>
          <TopBar title="Issue Tracker" subtitle={`${openIssues} open issues`} />
          {issues.length === 0
            ? <EmptyState icon="🐛" title="No issues reported" subtitle="User-reported bugs and support requests appear here." />
            : issues.map((issue, i) => (
              <GlassCard key={i} style={{ marginBottom: 12 }} glow={issue.status !== 'resolved' ? T.red : T.green}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, marginRight: 10 }}>
                    <div style={{ fontWeight: 700, color: T.text }}>{issue.title}</div>
                    <div style={{ fontSize: 13, color: T.textSub, marginTop: 4, lineHeight: 1.5 }}>{issue.description}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>Reported by: {issue.profiles?.full_name} · {new Date(issue.created_at).toLocaleDateString('en-ZA')}</div>
                  </div>
                  <Badge label={issue.status} color={issue.status === 'resolved' ? T.green : issue.status === 'in_progress' ? T.yellow : T.red} />
                </div>
                {issue.status !== 'resolved' && (
                  <NeuBtn small color={T.green} onClick={() => resolveIssue(issue.id)} icon="✅">Mark Resolved</NeuBtn>
                )}
              </GlassCard>
            ))
          }
        </>)}

        {tab === 'profile' && (<>
          <TopBar title="System Admin" />
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 64, background: T.redGlow, borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: `2px solid ${T.red}44` }}>⚙️</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 22 }}>{profile.full_name}</div>
            <div style={{ color: T.textSub, fontSize: 14, marginTop: 4 }}>{profile.email}</div>
            <div style={{ marginTop: 8 }}><Badge label="System Administrator" color={T.red} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <StatCard icon="👥" value={users.length} label="Users" color={T.teal} />
            <StatCard icon="🏫" value={schools.length} label="Schools" color={T.orange} />
            <StatCard icon="🐛" value={openIssues} label="Issues" color={openIssues > 0 ? T.red : T.green} />
          </div>
          <NeuBtn full danger onClick={onSignOut}>Sign Out</NeuBtn>
        </>)}
      </div>
      <BottomNav tabs={TABS} active={tab} setActive={setTab} />
    </div>
  )
}
