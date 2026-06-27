import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { T } from './ui.jsx'
import AuthScreen from './AuthScreen.jsx'
import Onboarding from './Onboarding.jsx'
import StudentApp from './StudentApp.jsx'
import InstructorApp from './InstructorApp.jsx'
import AdminApp from './AdminApp.jsx'
import TestOfficerApp from './TestOfficerApp.jsx'
import SystemAdminApp from './SystemAdminApp.jsx'
import AmbientThemeProvider from './providers/AmbientThemeProvider.jsx'

const Loader = () => (
  <div style={{
    fontFamily: "'Space Grotesk',sans-serif",
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', flexDirection: 'column', gap: 20, background: T.bg,
  }}>
    <img src="/logo.webp" alt="logo" style={{
      width: 80, height: 80, objectFit: 'contain',
      filter: `drop-shadow(0 0 20px ${T.teal}88)`,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 18 }}>DriveLicenceLab</div>
    <div style={{ color: T.textSub, fontSize: 14 }}>Loading your dashboard…</div>
    <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(0.95)} }`}</style>
  </div>
)

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboarded, setOnboarded] = useState(false)
  const [readinessScore, setReadinessScore] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (uid) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single()
      if (data) {
        setProfile(data)
        setOnboarded(!!data.sa_id || data.role !== 'student')
        // Load readiness score for ambient theme
        if (data.role === 'student') {
          const { data: scores } = await supabase
            .from('quiz_scores')
            .select('percentage')
            .eq('student_id', uid)
            .order('completed_at', { ascending: false })
            .limit(3)
          if (scores?.length) {
            const avg = scores.reduce((a, q) => a + Number(q.percentage), 0) / scores.length
            setReadinessScore(Math.round(avg))
          }
        }
      } else if (error) {
        const { data: userData } = await supabase.auth.getUser()
        const meta = userData?.user?.user_metadata || {}
        const { data: newProfile } = await supabase.from('profiles').insert({
          id: uid,
          email: userData?.user?.email,
          full_name: meta.full_name || meta.name || userData?.user?.email?.split('@')[0],
          role: meta.role || 'student',
        }).select().single()
        if (newProfile) {
          setProfile(newProfile)
          setOnboarded(newProfile.role !== 'student')
          await supabase.from('student_xp').insert({ student_id: uid, xp_points: 0, streak_days: 0 })
        }
      }
    } catch (e) {
      console.error('Profile load error:', e)
    }
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null); setSession(null); setOnboarded(false); setReadinessScore(0)
  }

  if (loading) return <Loader />
  if (!session) return <AuthScreen />
  if (profile && !onboarded && profile.role === 'student') {
    return <Onboarding user={session.user} onDone={() => { setOnboarded(true); loadProfile(session.user.id) }} />
  }
  if (!profile) return <Loader />

  const props = { profile, onSignOut: signOut }

  // Wrap only student app with ambient theme (role-specific)
  const roleApp = () => {
    if (profile.role === 'system_admin') return <SystemAdminApp {...props} />
    if (profile.role === 'admin') return <AdminApp {...props} />
    if (profile.role === 'instructor') return <InstructorApp {...props} />
    if (profile.role === 'test_officer') return <TestOfficerApp {...props} />
    return (
      <AmbientThemeProvider score={readinessScore}>
        <StudentApp {...props} />
      </AmbientThemeProvider>
    )
  }

  return roleApp()
}
