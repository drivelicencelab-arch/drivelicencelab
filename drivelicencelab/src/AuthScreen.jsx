import { useState } from 'react'
import { supabase } from './supabase.js'
import { T, GlassCard, NeuBtn, Input, Alert, Logo } from './ui.jsx'

export default function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('student')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const login = async () => {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }
  const signup = async () => {
    if (!fullName || !email || !password) { setError('Please fill all required fields.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } })
    if (error) setError(error.message)
    else setSuccess('Account created! Check your email for a confirmation link, then log in.')
    setLoading(false)
  }
  const google = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    setLoading(false)
  }
  const sendOtp = async () => {
    if (!phone) { setError('Enter your phone number.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) setError(error.message)
    else { setOtpSent(true); setSuccess('OTP sent to your phone!') }
    setLoading(false)
  }
  const verifyOtp = async () => {
    setLoading(true); setError('')
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    if (error) setError(error.message)
    setLoading(false)
  }

  const roles = [
    { v: 'student', l: '🎓', label: 'Student' },
    { v: 'instructor', l: '👨‍🏫', label: 'Instructor' },
    { v: 'admin', l: '🏫', label: 'School Admin' },
    { v: 'test_officer', l: '📋', label: 'Test Officer' },
  ]

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768

  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: isDesktop ? 'row' : 'column' }}>

      {/* Left panel — hero (desktop only) */}
      {isDesktop && (
        <div style={{ flex: 1, background: `linear-gradient(160deg, #0D2137 0%, #0D1117 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(ellipse at 50% 30%, ${T.tealGlow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', textAlign: 'center', maxWidth: 480 }}>
            <img src="/logo.webp" alt="DriveLicenceLab" style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 24, filter: `drop-shadow(0 0 30px ${T.teal}88)` }} />
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 48, color: T.white, letterSpacing: '-2px', lineHeight: 1.1, marginBottom: 16 }}>DriveLicenceLab</div>
            <div style={{ color: T.teal, fontWeight: 600, fontSize: 18, marginBottom: 32 }}>SA K53 Driver Training Platform</div>
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 48 }}>
              {[{ v: '92%', l: 'Pass Rate' }, { v: '4 Wks', l: 'To Licence' }, { v: '24/7', l: 'AI Tutor' }].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 32, color: T.teal }}>{s.v}</div>
                  <div style={{ fontSize: 13, color: T.textSub }}>{s.l}</div>
                </div>
              ))}
            </div>
            {[
              { icon: '🎓', text: 'Students track K53 readiness & earn XP' },
              { icon: '👨‍🏫', text: 'Instructors manage sessions & attendance' },
              { icon: '🏫', text: 'Schools run driver programmes end-to-end' },
              { icon: '🤖', text: 'AI tutor available 24/7 for K53 questions' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, textAlign: 'left' }}>
                <div style={{ width: 40, height: 40, background: T.tealGlow, border: `1px solid ${T.teal}44`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{f.icon}</div>
                <div style={{ fontSize: 15, color: T.textSub }}>{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Right panel — form */}
      <div style={{ width: isDesktop ? 480 : '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Mobile hero */}
        {!isDesktop && (
          <div style={{ background: `linear-gradient(160deg, #0D2137 0%, ${T.bg} 100%)`, padding: isTablet ? '52px 40px 40px' : '40px 24px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(ellipse at 50% 0%, ${T.tealGlow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <img src="/logo.webp" alt="logo" style={{ width: isTablet ? 100 : 72, height: isTablet ? 100 : 72, objectFit: 'contain', filter: `drop-shadow(0 0 20px ${T.teal}88)` }} />
              </div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: isTablet ? 40 : 30, color: T.white, letterSpacing: '-1px' }}>DriveLicenceLab</div>
              <div style={{ color: T.teal, fontWeight: 600, marginTop: 6, fontSize: isTablet ? 17 : 14 }}>SA K53 Driver Training Platform</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: isTablet ? 40 : 24, marginTop: 20 }}>
                {[{ v: '92%', l: 'Pass Rate' }, { v: '4 Wks', l: 'To Licence' }, { v: '24/7', l: 'AI Tutor' }].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: isTablet ? 24 : 20, color: T.teal }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: T.textSub }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Form area */}
        <div style={{ flex: 1, padding: isDesktop ? '48px 40px' : isTablet ? '32px 40px' : '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: isDesktop ? 'center' : 'flex-start' }}>
          {isDesktop && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 28 }}>Welcome back</div>
              <div style={{ color: T.textSub, marginTop: 4 }}>Sign in to your DriveLicenceLab account</div>
            </div>
          )}

          {/* Mode tabs */}
          <div style={{ display: 'flex', background: T.bgCard, borderRadius: 14, padding: 4, marginBottom: 24, border: `1px solid ${T.border}` }}>
            {[{ id: 'login', l: 'Login' }, { id: 'signup', l: 'Sign Up' }, { id: 'phone', l: '📱 Phone' }].map(t => (
              <button key={t.id} onClick={() => { setMode(t.id); setError(''); setSuccess('') }} style={{ flex: 1, padding: '10px', background: mode === t.id ? T.teal : 'transparent', color: mode === t.id ? '#fff' : T.textSub, border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: "'Space Grotesk',sans-serif", transition: 'all .2s' }}>{t.l}</button>
            ))}
          </div>

          <Alert msg={error} type="error" />
          <Alert msg={success} type="success" />

          {/* Google */}
          <button onClick={google} disabled={loading} style={{ width: '100%', padding: '14px', border: `1.5px solid ${T.border}`, borderRadius: 14, background: T.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', fontWeight: 700, fontSize: 15, marginBottom: 20, color: T.text, fontFamily: "'Space Grotesk',sans-serif", transition: 'border-color .2s' }}
            onMouseOver={e => e.currentTarget.style.borderColor = T.teal}
            onMouseOut={e => e.currentTarget.style.borderColor = T.border}>
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.2 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-2.9-11.3-7L6 33.7C9.3 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.5 4.6-4.6 6l6.2 5.2C40.8 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ color: T.textMuted, fontSize: 13 }}>or</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          {mode === 'login' && (<>
            <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" required icon="✉️" />
            <Input label="Password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" type="password" required icon="🔒" />
            <NeuBtn full color={T.teal} onClick={login} disabled={loading}>{loading ? 'Logging in…' : 'Login'}</NeuBtn>
          </>)}

          {mode === 'signup' && (<>
            <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" required icon="👤" />
            <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" required icon="✉️" />
            <Input label="Password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" type="password" required icon="🔒" />
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, color: T.textSub, marginBottom: 8, fontSize: 13, letterSpacing: '.5px', textTransform: 'uppercase' }}>I am a <span style={{ color: T.red }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {roles.map(r => (
                  <button key={r.v} onClick={() => setRole(r.v)} style={{ padding: '12px 8px', border: `2px solid ${role === r.v ? T.teal : T.border}`, borderRadius: 12, background: role === r.v ? T.tealGlow : T.bgCard, color: role === r.v ? T.teal : T.textSub, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: "'Space Grotesk',sans-serif", transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18 }}>{r.l}</span>{r.label}
                  </button>
                ))}
              </div>
            </div>
            <NeuBtn full color={T.teal} onClick={signup} disabled={loading}>{loading ? 'Creating account…' : 'Create Account'}</NeuBtn>
            <p style={{ textAlign: 'center', fontSize: 12, color: T.textMuted, marginTop: 14, lineHeight: 1.6 }}>You'll receive a confirmation email.<br/>Click the link to activate your account.</p>
          </>)}

          {mode === 'phone' && (<>
            <Input label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 72 123 4567" type="tel" required icon="📱" />
            {otpSent && <Input label="OTP Code" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" required icon="🔑" />}
            {!otpSent
              ? <NeuBtn full color={T.teal} onClick={sendOtp} disabled={loading}>{loading ? 'Sending…' : 'Send OTP'}</NeuBtn>
              : <NeuBtn full color={T.teal} onClick={verifyOtp} disabled={loading}>{loading ? 'Verifying…' : 'Verify OTP'}</NeuBtn>
            }
          </>)}
        </div>
      </div>
    </div>
  )
}
