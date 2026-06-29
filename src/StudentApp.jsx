import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { supabase } from './supabase.js'
import { T, GlassCard, NeuBtn, Alert, EmptyState, StatCard, BottomNav, AppHeader, Badge, ProgressBar, TopBar, AppShell } from './ui.jsx'
import { GoogleCalendarSync } from './services/GoogleCalendarSync.js'
import { getNotifications, markAllRead } from './services/NotificationService.js'
import { awardCoins, COIN_EVENTS } from './features/drivecoin/DriveCoins.jsx'
import { MILESTONES } from './features/share/MilestoneShare.jsx'

// Lazy-load all heavy feature components
const DigitalTwin      = lazy(() => import('./components/visuals/DigitalTwin.jsx'))
const SkillGraph       = lazy(() => import('./components/visuals/SkillGraph.jsx'))
const PerformanceChart = lazy(() => import('./components/charts/PerformanceChart.jsx'))
const WeeklyLeaderboard= lazy(() => import('./components/leaderboard/WeeklyLeaderboard.jsx'))
const BlindSpotReport  = lazy(() => import('./features/adaptive/BlindSpotReport.jsx'))
const PassPredictor    = lazy(() => import('./features/predictor/PassPredictor.jsx'))
const GoalDateEngine   = lazy(() => import('./features/goaldate/GoalDateEngine.jsx'))
const SocialLayer      = lazy(() => import('./features/social/SocialLayer.jsx'))
const DistractionMonitor = lazy(() => import('./features/distraction/DistractionMonitor.jsx'))
const SimDebrief       = lazy(() => import('./features/sim/SimDebrief.jsx'))
const LessonMatchRequest = lazy(() => import('./features/matching/LessonMatcher.jsx').then(m => ({ default: m.LessonMatchRequest })))
const DriveCoinsWallet = lazy(() => import('./features/drivecoin/DriveCoins.jsx'))
const MilestoneShare   = lazy(() => import('./features/share/MilestoneShare.jsx'))

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY

const QZ = [
  { q: 'What does a solid white line on the left edge of a road indicate?', opts: ['The edge of the roadway','A bicycle lane','Parking is allowed','No overtaking zone'], ans: 0 },
  { q: 'When must you use your headlights?', opts: ['Only at night','From sunset to sunrise and when visibility is poor','Only in rain','Whenever you want'], ans: 1 },
  { q: 'Speed limit in a residential area?', opts: ['80 km/h','100 km/h','60 km/h','40 km/h'], ans: 2 },
  { q: 'A flashing red traffic light means?', opts: ['Slow down','Stop, then proceed when safe','Stop permanently','Yield'], ans: 1 },
  { q: 'Following vehicle at night — use?', opts: ['High beam','Hazard lights','Low beam','No lights'], ans: 2 },
  { q: 'Amber traffic light means?', opts: ['Speed up','Stop if safe to do so','Proceed normally','Yield to pedestrians'], ans: 1 },
  { q: 'Minimum following distance on a highway?', opts: ['1 second','2 seconds','3 seconds','4 seconds'], ans: 2 },
  { q: 'What to do at a 4-way stop?', opts: ['Yield to right','First to stop, first to go','Yield to left','Largest goes first'], ans: 1 },
  { q: 'Legal use of hazard lights?', opts: ['Never','When vehicle is a hazard to others','In heavy traffic','When reversing'], ans: 1 },
  { q: 'Blood alcohol limit for learner driver?', opts: ['0.05g/100ml','0.02g/100ml','0.00g/100ml','0.08g/100ml'], ans: 2 },
]

const ROAD_SIGNS = [
  { s:'🛑', n:'Stop Sign', d:'Come to a complete stop.', cat:'Regulatory' },
  { s:'⚠️', n:'Warning Sign', d:'Hazard ahead.', cat:'Warning' },
  { s:'🚫', n:'No Entry', d:'Do not enter.', cat:'Regulatory' },
  { s:'🔄', n:'Roundabout', d:'Give way to traffic in roundabout.', cat:'Regulatory' },
  { s:'🚶', n:'Pedestrian', d:'Yield to pedestrians.', cat:'Warning' },
  { s:'🅿️', n:'Parking', d:'Parking permitted here.', cat:'Information' },
  { s:'⛽', n:'Fuel Station', d:'Fuel available ahead.', cat:'Information' },
  { s:'🚧', n:'Road Works', d:'Construction zone. Reduce speed.', cat:'Warning' },
]

const DLTC = [
  { section:'Before the Test', icon:'📋', items:["Valid learner's licence",'Roadworthy vehicle','Proof of booking','Valid SA ID','Test fee paid'] },
  { section:'Vehicle Check', icon:'🔍', items:['Lights & indicators','Brakes & handbrake','Tyres & mirrors','Horn','Wipers','Seatbelts'] },
  { section:'K53 Manoeuvres', icon:'🚗', items:['Alley docking','Parallel parking','3-point turn','Emergency stop','Uphill & downhill starts'] },
]

const Spinner = ({ label='Loading…' }) => (
  <div style={{ textAlign:'center', padding:32, color:T.textSub, fontSize:14 }}>
    <div style={{ fontSize:28, marginBottom:8 }}>⏳</div>{label}
  </div>
)

const TABS = [
  { id:'home',     icon:'🏠', label:'Home' },
  { id:'study',    icon:'📚', label:'Study' },
  { id:'features', icon:'⚡', label:'Features' },
  { id:'ai',       icon:'🤖', label:'AI Tutor' },
  { id:'profile',  icon:'👤', label:'Profile' },
]

export default function StudentApp({ profile, onSignOut }) {
  const [tab, setTab] = useState('home')
  const [subTab, setSubTab] = useState('resources') // within features tab

  // Quiz state
  const [qi, setQi] = useState(0)
  const [qs, setQs] = useState(0)
  const [qd, setQd] = useState(false)
  const [sel, setSel] = useState(null)
  const [rt, setRt] = useState('quiz')

  // AI state
  const [aiMsg, setAiMsg] = useState('')
  const [aiChat, setAiChat] = useState([])
  const [aiLoad, setAiLoad] = useState(false)
  const [aiError, setAiError] = useState('')
  const chatEndRef = useRef(null)

  // Data
  const [xp, setXp] = useState({ xp_points:0, streak_days:0, drivecoin_balance:0, sim_hours:0 })
  const [badges, setBadges] = useState([])
  const [hist, setHist] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const [unlockedSkills, setUnlockedSkills] = useState(['theory'])
  const [aiReadyNodes, setAiReadyNodes] = useState([])

  // Milestone share
  const [pendingMilestone, setPendingMilestone] = useState(null)
  const triggeredMilestones = useRef(new Set())

  useEffect(() => { loadAll() }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [aiChat])

  const loadAll = async () => {
    await Promise.all([loadXp(), loadBadges(), loadHist(), loadEnrollments(), loadNotifications()])
  }

  const loadXp = async () => {
    const { data } = await supabase.from('student_xp').select('*').eq('student_id', profile.id).single()
    if (data) setXp(data)
  }
  const loadBadges = async () => {
    const { data } = await supabase.from('badges').select('*').eq('student_id', profile.id)
    if (data) setBadges(data)
  }
  const loadHist = async () => {
    const { data } = await supabase.from('quiz_scores').select('*').eq('student_id', profile.id).order('completed_at', { ascending:false }).limit(15)
    if (data) {
      setHist(data)
      const avg = data.length ? data.slice(0,3).reduce((a,q) => a + Number(q.percentage), 0) / Math.min(data.length,3) : 0
      const skills = ['theory']
      if (avg >= 40) skills.push('signs','controls')
      if (avg >= 55) skills.push('parking','manoeuvres','highway')
      if (avg >= 65) skills.push('emergency','parallel')
      if (avg >= 75) skills.push('alley')
      if (avg >= 85) skills.push('dltc')
      setUnlockedSkills(skills)
      if (avg >= 50 && !skills.includes('manoeuvres')) setAiReadyNodes(['manoeuvres'])
      else if (avg >= 70 && !skills.includes('parallel')) setAiReadyNodes(['parallel'])
      else setAiReadyNodes([])
      // Check milestones
      checkMilestones(data, avg)
    }
  }
  const loadEnrollments = async () => {
    const { data } = await supabase.from('enrollments').select('*, time_slots(name,day,start_time,end_time)').eq('student_id', profile.id)
    if (data) setEnrollments(data)
  }
  const loadNotifications = async () => {
    const data = await getNotifications(profile.id)
    setNotifications(data)
  }

  const checkMilestones = (history, avg) => {
    if (history.some(q => Number(q.percentage) === 100) && !triggeredMilestones.current.has('PERFECT_QUIZ')) {
      triggeredMilestones.current.add('PERFECT_QUIZ')
      setPendingMilestone('PERFECT_QUIZ')
      awardCoins(profile.id, 'PERFECT_QUIZ')
    } else if (avg >= 85 && !triggeredMilestones.current.has('PASS_PREDICTOR_85')) {
      triggeredMilestones.current.add('PASS_PREDICTOR_85')
      setPendingMilestone('PASS_PREDICTOR_85')
      awardCoins(profile.id, 'PASS_PREDICTOR_85')
    }
  }

  const answer = async (idx) => {
    if (sel !== null) return
    setSel(idx)
    const ok = idx === QZ[qi].ans
    if (ok) setQs(s => s + 1)
    setTimeout(async () => {
      if (qi + 1 < QZ.length) { setQi(i => i + 1); setSel(null) }
      else {
        const fs = qs + (ok ? 1 : 0); setQd(true)
        await supabase.from('quiz_scores').insert({ student_id:profile.id, score:fs, total:QZ.length, percentage:(fs/QZ.length*100).toFixed(2) })
        const nx = (xp.xp_points || 0) + fs * 10
        await supabase.from('student_xp').update({ xp_points:nx, last_activity:new Date().toISOString().split('T')[0] }).eq('student_id', profile.id)
        setXp(x => ({ ...x, xp_points:nx }))
        if (hist.length === 0) {
          await supabase.from('badges').insert({ student_id:profile.id, badge_name:'First Quiz', badge_icon:'📝' })
          setPendingMilestone('FIRST_LESSON')
          awardCoins(profile.id, 'FIRST_LESSON')
          loadBadges()
        }
        if (fs === QZ.length) {
          await supabase.from('badges').insert({ student_id:profile.id, badge_name:'Perfect Score', badge_icon:'🏆' })
          loadBadges()
        }
        loadHist()
      }
    }, 900)
  }
  const resetQ = () => { setQi(0); setQs(0); setQd(false); setSel(null) }

  const sendAi = async () => {
    if (!aiMsg.trim()) return
    const um = aiMsg; setAiMsg(''); setAiError('')
    setAiChat(c => [...c, { role:'user', text:um }]); setAiLoad(true)
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', max_tokens: 400,
          messages: [
            { role:'system', content:'You are an expert K53 driving tutor for South Africa. Answer questions about road signs, K53 theory, manoeuvres and DLTC tips. Be direct, peer-like, under 150 words.' },
            ...aiChat.map(m => ({ role:m.role, content:m.text })),
            { role:'user', content:um }
          ]
        })
      })
      const data = await res.json()
      if (data.error) { setAiError('AI error: ' + data.error.message); setAiLoad(false); return }
      setAiChat(c => [...c, { role:'assistant', text:data.choices?.[0]?.message?.content || 'Sorry, try again.' }])
    } catch { setAiError('Network error. Check your connection.') }
    setAiLoad(false)
  }

  const readiness = hist.length
    ? Math.round(hist.slice(0,3).reduce((a,q) => a + Number(q.percentage), 0) / Math.min(hist.length,3))
    : 0
  const readinessColor = readiness >= 80 ? T.green : readiness >= 60 ? T.yellow : T.red
  const unreadCount = notifications.filter(n => !n.read).length

  const featureTabs = [
    { id:'resources', l:'📖 Resources' },
    { id:'predictor', l:'🎯 Pass Predictor' },
    { id:'goaldate',  l:'📅 Goal Date' },
    { id:'social',    l:'⚔️ Social' },
    { id:'sim',       l:'🎮 Sim' },
    { id:'matching',  l:'⚡ On-Demand' },
    { id:'drivecoin', l:'🪙 DriveCoins' },
    { id:'distract',  l:'📵 Focus' },
  ]

  return (
    <AppShell tabs={TABS} active={tab} setActive={setTab} role="student" name={profile.full_name || 'Student'} onSignOut={onSignOut}>

      {/* Milestone share modal */}
      {pendingMilestone && (
        <Suspense fallback={null}>
          <MilestoneShare
            milestone={pendingMilestone}
            studentName={profile.full_name}
            onClose={() => setPendingMilestone(null)}
          />
        </Suspense>
      )}

      {/* Notification bell */}
      {unreadCount > 0 && (
        <div onClick={() => { setShowNotif(!showNotif); markAllRead(profile.id).then(loadNotifications) }}
          style={{ position:'fixed', top:14, right:90, zIndex:300, cursor:'pointer', background:T.red, borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>
          {unreadCount}
        </div>
      )}
      {showNotif && (
        <div style={{ position:'fixed', top:56, right:16, zIndex:500, width:300, maxHeight:320, overflowY:'auto' }}>
          <GlassCard style={{ padding:12 }}>
            <div style={{ fontWeight:700, color:T.text, marginBottom:10, fontSize:14 }}>🔔 Notifications</div>
            {notifications.length === 0 ? <div style={{ color:T.textSub, fontSize:13 }}>No notifications</div> :
              notifications.map((n,i) => (
                <div key={i} style={{ padding:'8px 0', borderBottom:i < notifications.length-1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ fontWeight:600, color:T.text, fontSize:13 }}>{n.title}</div>
                  <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>{n.body}</div>
                </div>
              ))
            }
          </GlassCard>
        </div>
      )}

      {/* ── HOME ── */}
      {tab === 'home' && (<>
        {/* Hero */}
        <div style={{ background:`linear-gradient(135deg,${T.tealDark},#005f5f)`, borderRadius:24, padding:24, marginBottom:20, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, background:'rgba(255,255,255,0.05)', borderRadius:'50%' }}/>
          <div style={{ color:'rgba(255,255,255,0.8)', fontSize:13 }}>Welcome back 👋</div>
          <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:800, fontSize:22, color:'#fff', marginBottom:20 }}>{profile.full_name || 'Student'}</div>
          <div style={{ display:'flex', gap:8 }}>
            {[
              { v:xp.xp_points||0, l:'XP' },
              { v:`${xp.streak_days||0}🔥`, l:'Streak' },
              { v:xp.drivecoin_balance||0, l:'🪙 Coins' },
              { v:`${(xp.sim_hours||0).toFixed(1)}h`, l:'Sim Hrs' },
            ].map((s,i) => (
              <div key={i} style={{ flex:1, background:'rgba(0,0,0,0.2)', borderRadius:14, padding:'8px 4px', textAlign:'center' }}>
                <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:800, fontSize:17, color:'#fff' }}>{s.v}</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.7)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3D Digital Twin */}
        <Suspense fallback={<Spinner label="Loading your vehicle twin…"/>}>
          <div style={{ marginBottom:20 }}>
            <DigitalTwin readinessScore={readiness} skillsCovered={unlockedSkills} height={200}/>
          </div>
        </Suspense>

        {/* Readiness */}
        <GlassCard style={{ marginBottom:16 }} glow={readinessColor}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, color:T.text }}>Licence Readiness</div>
              <div style={{ fontSize:12, color:T.textSub }}>Based on recent quiz scores</div>
            </div>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:900, fontSize:32, color:readinessColor }}>{readiness}%</div>
          </div>
          <ProgressBar value={readiness} max={100} color={readinessColor} height={8}/>
          <div style={{ fontSize:12, color:readinessColor, marginTop:8, fontWeight:600 }}>
            {readiness >= 80 ? '✅ Ready for your DLTC test!' : readiness >= 60 ? '📈 Getting close — keep going!' : '📚 More practice will get you there.'}
          </div>
        </GlassCard>

        {/* Google Calendar sync */}
        <GoogleCalendarSync enrollments={enrollments}/>

        {/* Schedule */}
        <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, color:T.text, marginBottom:12 }}>📅 My Schedule</div>
        {enrollments.length === 0
          ? <EmptyState icon="📅" title="No active enrolment" subtitle="Your school admin will enrol you in a time slot."/>
          : enrollments.map((e,i) => (
            <GlassCard key={i} style={{ marginBottom:12 }} glow={T.teal}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700, color:T.text }}>{e.time_slots?.name}</div>
                  <div style={{ fontSize:13, color:T.textSub }}>{e.time_slots?.day} · {e.time_slots?.start_time} — {e.time_slots?.end_time}</div>
                </div>
                <Badge label={e.status} color={e.status==='active'?T.green:T.textSub}/>
              </div>
            </GlassCard>
          ))
        }

        {/* Quick actions grid */}
        <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, color:T.text, margin:'20px 0 12px' }}>Quick Actions</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            { icon:'📝', label:'Practice Quiz', sub:'Earn XP', color:T.teal, action:()=>{ setTab('features'); setSubTab('resources'); setRt('quiz') } },
            { icon:'🤖', label:'AI Tutor', sub:'Ask anything', color:T.purple, action:()=>setTab('ai') },
            { icon:'🎯', label:'Pass Predictor', sub:'Check readiness', color:T.green, action:()=>{ setTab('features'); setSubTab('predictor') } },
            { icon:'⚔️', label:'Friend Duel', sub:'Challenge someone', color:T.orange, action:()=>{ setTab('features'); setSubTab('social') } },
            { icon:'🪙', label:'DriveCoins', sub:`${xp.drivecoin_balance||0} coins`, color:T.yellow, action:()=>{ setTab('features'); setSubTab('drivecoin') } },
            { icon:'⚡', label:'On-Demand Lesson', sub:'Get a lesson now', color:T.red, action:()=>{ setTab('features'); setSubTab('matching') } },
          ].map((a,i) => (
            <GlassCard key={i} onClick={a.action} glow={a.color} style={{ padding:16, cursor:'pointer' }}>
              <div style={{ fontSize:26, marginBottom:6 }}>{a.icon}</div>
              <div style={{ fontWeight:700, color:T.text, fontSize:13 }}>{a.label}</div>
              <div style={{ fontSize:11, color:T.textSub }}>{a.sub}</div>
            </GlassCard>
          ))}
        </div>
      </>)}

      {/* ── STUDY ── */}
      {tab === 'study' && (<>
        <TopBar title="Study & Progress"/>
        <Suspense fallback={<Spinner label="Loading charts…"/>}>
          <GlassCard style={{ marginBottom:20 }}>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, color:T.text, fontSize:16, marginBottom:16 }}>📊 Performance Dashboard</div>
            <PerformanceChart quizHistory={hist} enrollmentReadiness={readiness}/>
          </GlassCard>
        </Suspense>
        <Suspense fallback={<Spinner label="Loading skill map…"/>}>
          <GlassCard style={{ marginBottom:20 }}>
            <SkillGraph unlockedSkills={unlockedSkills} aiReadyNodes={aiReadyNodes}
              onNodeClick={(node, state) => { if (state.available) setUnlockedSkills(p => [...p, node.id]) }}
              height={360}/>
          </GlassCard>
        </Suspense>
        <Suspense fallback={<Spinner label="Loading leaderboard…"/>}>
          <GlassCard>
            <WeeklyLeaderboard currentUserId={profile.id}/>
          </GlassCard>
        </Suspense>
      </>)}

      {/* ── FEATURES TAB ── */}
      {tab === 'features' && (<>
        {/* Sub-tab scroll */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:8, marginBottom:20, scrollbarWidth:'none' }}>
          {featureTabs.map(ft => (
            <button key={ft.id} onClick={() => setSubTab(ft.id)} style={{
              background: subTab === ft.id ? T.teal : T.bgCard,
              border:`1.5px solid ${subTab===ft.id?T.teal:T.border}`,
              color: subTab===ft.id?'#fff':T.textSub,
              borderRadius:20, padding:'8px 14px',
              fontWeight:700, cursor:'pointer', fontSize:12,
              fontFamily:"'Space Grotesk',sans-serif", whiteSpace:'nowrap',
              transition:'all .2s',
            }}>{ft.l}</button>
          ))}
        </div>

        {/* Resources */}
        {subTab === 'resources' && (<>
          <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto' }}>
            {[{id:'quiz',l:'📝 Quiz'},{id:'signs',l:'🚦 Signs'},{id:'dltc',l:'📋 DLTC'}].map(t=>(
              <button key={t.id} onClick={()=>setRt(t.id)} style={{ background:rt===t.id?T.teal:T.bgCard, border:`1.5px solid ${rt===t.id?T.teal:T.border}`, color:rt===t.id?'#fff':T.textSub, borderRadius:20, padding:'7px 14px', fontWeight:700, cursor:'pointer', fontSize:12, fontFamily:"'Space Grotesk',sans-serif", whiteSpace:'nowrap' }}>{t.l}</button>
            ))}
          </div>
          {rt==='quiz' && (qd
            ? <GlassCard style={{ textAlign:'center', padding:40 }} glow={qs/QZ.length>=0.7?T.green:T.red}>
                <div style={{ fontSize:56 }}>{qs/QZ.length>=0.8?'🏆':qs/QZ.length>=0.6?'👍':'📚'}</div>
                <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:800, color:T.text, fontSize:22, marginTop:12 }}>Quiz Complete!</div>
                <div style={{ color:T.textSub, marginTop:8 }}>Score: <strong style={{ color:T.teal }}>{qs}/{QZ.length}</strong> · +{qs*10} XP!</div>
                <div style={{ marginTop:12 }}><ProgressBar value={qs} max={QZ.length} color={qs/QZ.length>=0.7?T.green:T.red} height={8}/></div>
                <div style={{ marginTop:20 }}><NeuBtn color={T.teal} onClick={resetQ} icon="🔄">Try Again</NeuBtn></div>
              </GlassCard>
            : <GlassCard>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                  <span style={{ color:T.textSub, fontSize:14 }}>Q {qi+1}/{QZ.length}</span>
                  <span style={{ color:T.teal, fontWeight:700, fontSize:14 }}>{qs} correct</span>
                </div>
                <ProgressBar value={qi} max={QZ.length} color={T.teal}/>
                <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, color:T.text, fontSize:16, margin:'20px 0' }}>{QZ[qi].q}</div>
                {QZ[qi].opts.map((opt,i) => {
                  let bg=T.bgCard, border=T.border, color=T.text
                  if (sel!==null) {
                    if (i===QZ[qi].ans) { bg=T.greenGlow; border=T.green; color=T.green }
                    else if (i===sel) { bg=T.redGlow; border=T.red; color=T.red }
                  }
                  return <div key={i} onClick={()=>answer(i)} style={{ border:`1.5px solid ${border}`, borderRadius:14, padding:'13px 16px', marginBottom:10, cursor:'pointer', background:bg, color, fontWeight:600, fontSize:14, transition:'all .2s' }}><strong style={{ marginRight:8 }}>{String.fromCharCode(65+i)}.</strong>{opt}</div>
                })}
              </GlassCard>
          )}
          {rt==='signs' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
              {ROAD_SIGNS.map((s,i)=>(
                <GlassCard key={i} style={{ textAlign:'center', padding:14 }}>
                  <div style={{ fontSize:36, marginBottom:6 }}>{s.s}</div>
                  <Badge label={s.cat} color={s.cat==='Regulatory'?T.red:s.cat==='Warning'?T.yellow:T.teal}/>
                  <div style={{ fontWeight:700, color:T.text, fontSize:12, marginTop:6 }}>{s.n}</div>
                  <div style={{ color:T.textSub, fontSize:11, marginTop:3 }}>{s.d}</div>
                </GlassCard>
              ))}
            </div>
          )}
          {rt==='dltc' && DLTC.map((s,i)=>(
            <GlassCard key={i} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <span style={{ fontSize:22 }}>{s.icon}</span>
                <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, color:T.text }}>{s.section}</div>
              </div>
              {s.items.map((item,j)=>(
                <div key={j} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:j<s.items.length-1?`1px solid ${T.border}`:'none' }}>
                  <div style={{ width:24, height:24, background:T.tealGlow, border:`1px solid ${T.teal}44`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:T.teal, flexShrink:0 }}>✓</div>
                  <span style={{ fontSize:14, color:T.text }}>{item}</span>
                </div>
              ))}
            </GlassCard>
          ))}
        </>)}

        {/* Pass Predictor */}
        {subTab === 'predictor' && (
          <Suspense fallback={<Spinner label="Loading predictor…"/>}>
            <PassPredictor
              quizScores={hist}
              attendanceRate={enrollments.length > 0 ? 0.8 : 0}
              streakDays={xp.streak_days || 0}
              simScores={[]}
              onBookTest={() => { setTab('features'); setSubTab('matching') }}
            />
          </Suspense>
        )}

        {/* Blind Spot Report */}
        {subTab === 'predictor' && (
          <div style={{ marginTop:16 }}>
            <Suspense fallback={<Spinner/>}>
              <BlindSpotReport quizHistory={hist} studentName={profile.full_name}/>
            </Suspense>
          </div>
        )}

        {/* Goal Date Engine */}
        {subTab === 'goaldate' && (
          <Suspense fallback={<Spinner label="Loading goal engine…"/>}>
            <GoalDateEngine studentId={profile.id} currentReadiness={readiness}/>
          </Suspense>
        )}

        {/* Social Layer */}
        {subTab === 'social' && (
          <Suspense fallback={<Spinner label="Loading social…"/>}>
            <SocialLayer currentUser={profile} quizHistory={hist}/>
          </Suspense>
        )}

        {/* Simulator */}
        {subTab === 'sim' && (
          <Suspense fallback={<Spinner label="Loading sim…"/>}>
            <SimDebrief
              studentId={profile.id}
              studentName={profile.full_name}
              onComplete={async ({ avgScore, simHoursEarned }) => {
                if (avgScore >= 70) await awardCoins(profile.id, 'SIM_SESSION_COMPLETE')
                loadXp()
              }}
            />
          </Suspense>
        )}

        {/* On-Demand Lesson */}
        {subTab === 'matching' && (
          <Suspense fallback={<Spinner label="Loading matcher…"/>}>
            <LessonMatchRequest
              studentId={profile.id}
              studentName={profile.full_name}
              onMatched={() => loadEnrollments()}
            />
          </Suspense>
        )}

        {/* DriveCoins */}
        {subTab === 'drivecoin' && (
          <Suspense fallback={<Spinner label="Loading wallet…"/>}>
            <DriveCoinsWallet studentId={profile.id}/>
          </Suspense>
        )}

        {/* Distraction Monitor */}
        {subTab === 'distract' && (
          <Suspense fallback={<Spinner label="Loading focus monitor…"/>}>
            <DistractionMonitor
              studentId={profile.id}
              sessionId={null}
              onSessionEnd={async ({ isClean }) => {
                if (isClean) {
                  const { data } = await supabase.from('sessions').select('clean_session').eq('instructor_id', profile.id).eq('clean_session', true)
                  if ((data?.length || 0) >= 5) await awardCoins(profile.id, 'CLEAN_SESSION_STREAK')
                }
                loadXp()
              }}
            />
          </Suspense>
        )}
      </>)}

      {/* ── AI TUTOR ── */}
      {tab === 'ai' && (<>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:800, color:T.text, fontSize:22, marginBottom:4 }}>AI Driving Assistant</div>
        <div style={{ color:T.textSub, marginBottom:16 }}>Your personal K53 tutor — available 24/7</div>
        <GlassCard style={{ background:`linear-gradient(135deg,${T.tealDark}33,${T.purpleGlow})`, marginBottom:16, border:`1px solid ${T.teal}44` }}>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <div style={{ fontSize:36, background:T.tealGlow, borderRadius:14, width:56, height:56, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>🧠</div>
            <div>
              <div style={{ fontWeight:700, fontSize:16, color:T.text }}>AI Driving Assistant</div>
              <div style={{ fontSize:13, color:T.teal, marginTop:2 }}>K53 Specialist · Available 24/7</div>
              <div style={{ fontSize:12, color:T.textSub, marginTop:4 }}>Ask about road signs, manoeuvres, K53 theory & test tips.</div>
            </div>
          </div>
        </GlassCard>
        <Alert msg={aiError} type="error"/>
        {aiChat.length === 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
            {['K53 Road Signs','Parallel Parking','Emergency Stop','4-Way Stop','Speed Limits SA','DLTC Test Tips'].map(t=>(
              <button key={t} onClick={()=>setAiMsg(t)} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:12, padding:'10px 12px', color:T.teal, fontWeight:600, fontSize:12, cursor:'pointer', textAlign:'left', fontFamily:"'Space Grotesk',sans-serif" }}>📖 {t}</button>
            ))}
          </div>
        )}
        <div style={{ maxHeight:340, overflowY:'auto', marginBottom:16, display:'flex', flexDirection:'column', gap:10 }}>
          {aiChat.map((m,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
              <div style={{ maxWidth:'82%', background:m.role==='user'?T.teal:T.bgCard, color:m.role==='user'?'#fff':T.text, border:m.role==='assistant'?`1px solid ${T.border}`:'none', borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px', padding:'12px 16px', fontSize:14, lineHeight:1.6 }}>{m.text}</div>
            </div>
          ))}
          {aiLoad && <div style={{ color:T.textSub, fontSize:13 }}>🧠 Thinking…</div>}
          <div ref={chatEndRef}/>
        </div>
        <GlassCard style={{ padding:12 }}>
          <div style={{ display:'flex', gap:10 }}>
            <input value={aiMsg} onChange={e=>setAiMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAi()} placeholder="Ask a K53 question…"
              style={{ flex:1, background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:12, padding:'12px 14px', fontSize:14, color:T.text, fontFamily:"'Space Grotesk',sans-serif", outline:'none' }}
              onFocus={e=>e.target.style.borderColor=T.teal}
              onBlur={e=>e.target.style.borderColor=T.border}
            />
            <NeuBtn color={T.teal} onClick={sendAi} disabled={aiLoad||!aiMsg.trim()} small>Send</NeuBtn>
          </div>
        </GlassCard>
      </>)}

      {/* ── PROFILE ── */}
      {tab === 'profile' && (<>
        <TopBar title="My Profile"/>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:64, background:T.tealGlow, borderRadius:'50%', width:90, height:90, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', border:`2px solid ${T.teal}44` }}>🎓</div>
          <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:800, color:T.text, fontSize:22 }}>{profile.full_name}</div>
          <div style={{ color:T.textSub, fontSize:14, marginTop:4 }}>{profile.email}</div>
          <div style={{ marginTop:8 }}><Badge label="Active Learner" color={T.teal}/></div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {[
            { v:xp.xp_points||0, l:'XP', c:T.yellow, i:'⭐' },
            { v:badges.length, l:'Badges', c:T.teal, i:'🏅' },
            { v:hist.length, l:'Quizzes', c:T.purple, i:'📝' },
            { v:xp.drivecoin_balance||0, l:'Coins', c:T.orange, i:'🪙' },
          ].map((s,i)=>(
            <div key={i} style={{ flex:'1 1 40%', textAlign:'center', background:s.c+'15', border:`1px solid ${s.c}44`, borderRadius:14, padding:14 }}>
              <div style={{ fontSize:22 }}>{s.i}</div>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:800, color:s.c, fontSize:20 }}>{s.v}</div>
              <div style={{ fontSize:11, color:T.textSub }}>{s.l}</div>
            </div>
          ))}
        </div>
        <GlassCard style={{ marginBottom:16 }}>
          <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, color:T.text, marginBottom:14 }}>Account Details</div>
          {[
            { l:'Email', v:profile.email },
            { l:'SA ID', v:profile.sa_id||'Not set' },
            { l:'Date of Birth', v:profile.date_of_birth||'Not set' },
            { l:'Phone', v:profile.phone||'Not set' },
          ].map((r,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:i<3?`1px solid ${T.border}`:'none' }}>
              <span style={{ color:T.textSub, fontSize:14 }}>{r.l}</span>
              <span style={{ color:T.text, fontSize:14, fontWeight:600 }}>{r.v}</span>
            </div>
          ))}
        </GlassCard>
        <NeuBtn full danger onClick={onSignOut}>Sign Out</NeuBtn>
      </>)}

    </AppShell>
  )
}
