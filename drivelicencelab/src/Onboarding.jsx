import { useState } from 'react'
import { supabase } from './supabase.js'
import { T, GlassCard, NeuBtn, Input, Alert, Logo, ProgressBar } from './ui.jsx'

export default function Onboarding({ user, onDone }) {
  const [step, setStep] = useState(0)
  const [saId, setSaId] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const features = [
    { icon: '🏫', title: 'School-Based Training', sub: 'Train with DLTC-certified instructors at your school.' },
    { icon: '📅', title: '4-Week Programme', sub: 'Theory, practical & assessment — all structured and tracked.' },
    { icon: '🎓', title: 'K53 Curriculum', sub: 'Live progress tracking aligned with the official K53 syllabus.' },
    { icon: '✅', title: 'Licence-Ready', sub: 'Graduate prepared to pass your official DLTC road test.' },
    { icon: '🤖', title: 'AI Study Assistant', sub: 'Ask anything about K53 theory 24/7.' },
    { icon: '📊', title: 'Readiness Score', sub: 'Know exactly where you stand before test day.' },
  ]

  const save = async () => {
    if (!saId || !dob) { setError('SA ID and Date of Birth are required.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.from('profiles').update({ sa_id: saId, date_of_birth: dob, phone }).eq('id', user.id)
    if (error) setError(error.message)
    else onDone()
    setLoading(false)
  }

  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", minHeight: '100vh', background: T.bg }}>
      <div style={{ background: T.bgCard, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={32} />
          <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 17 }}>DriveLicenceLab</span>
        </div>
        <span style={{ fontSize: 13, color: T.textSub }}>Step {step + 1} of 2</span>
      </div>
      <div style={{ padding: '4px 0' }}>
        <ProgressBar value={step + 1} max={2} color={T.teal} height={3} />
      </div>

      <div style={{ padding: 24 }}>
        {step === 0 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <img src="/logo.webp" alt="logo" style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 16, filter: `drop-shadow(0 0 16px ${T.teal}66)` }} />
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, color: T.text, fontSize: 26, letterSpacing: '-0.5px' }}>Welcome to<br/>DriveLicenceLab</div>
              <div style={{ color: T.textSub, marginTop: 8, fontSize: 14 }}>Your journey to your SA driver's licence starts here.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
              {features.map((f, i) => (
                <GlassCard key={i} style={{ padding: 16 }} glow={T.teal}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: T.textSub, marginTop: 4, lineHeight: 1.5 }}>{f.sub}</div>
                </GlassCard>
              ))}
            </div>
            <NeuBtn full color={T.teal} onClick={() => setStep(1)} icon="→">Get Started</NeuBtn>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{ background: T.tealGlow, border: `1px solid ${T.teal}44`, borderRadius: 14, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>👤</div>
              <div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 20 }}>Personal Details</div>
                <div style={{ color: T.textSub, fontSize: 13 }}>Needed to set up your training profile.</div>
              </div>
            </div>
            <Alert msg={error} />
            <GlassCard>
              <Input label="SA ID Number" value={saId} onChange={e => setSaId(e.target.value)} placeholder="e.g. 0612156123084" required icon="🪪" />
              <Input label="Date of Birth" value={dob} onChange={e => setDob(e.target.value)} type="date" required icon="📅" />
              <Input label="Phone Number (optional)" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 072 123 4567" icon="📱" />
            </GlassCard>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <NeuBtn outline color={T.teal} onClick={() => setStep(0)}>‹ Back</NeuBtn>
              <NeuBtn full color={T.teal} onClick={save} disabled={loading} icon="→">{loading ? 'Saving…' : 'Continue'}</NeuBtn>
            </div>
            <p style={{ textAlign: 'center', fontSize: 12, color: T.textMuted, marginTop: 14, lineHeight: 1.6 }}>🔒 Your information is secure and only used for training management.</p>
          </>
        )}
      </div>
    </div>
  )
}
