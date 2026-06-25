// ── Design Tokens ────────────────────────────────────────────────────────────
export const T = {
  // Palette — teal-on-dark, matching the logo's cyan-blue
  bg:        '#0D1117',
  bgCard:    '#161B22',
  bgGlass:   'rgba(22,27,34,0.85)',
  border:    '#21262D',
  borderHi:  '#30363D',
  teal:      '#00C9C8',
  tealDark:  '#009E9D',
  tealGlow:  'rgba(0,201,200,0.15)',
  green:     '#3FB950',
  greenGlow: 'rgba(63,185,80,0.15)',
  orange:    '#FF6B2C',
  orangeGlow:'rgba(255,107,44,0.15)',
  purple:    '#7C3AED',
  purpleGlow:'rgba(124,58,237,0.15)',
  red:       '#F85149',
  redGlow:   'rgba(248,81,73,0.15)',
  yellow:    '#E3B341',
  text:      '#E6EDF3',
  textSub:   '#8B949E',
  textMuted: '#484F58',
  white:     '#FFFFFF',
}

// ── GlassCard ─────────────────────────────────────────────────────────────────
export const GlassCard = ({ children, style, onClick, glow }) => (
  <div onClick={onClick} style={{
    background: T.bgGlass,
    border: `1px solid ${glow ? glow+'44' : T.border}`,
    borderRadius: 20,
    padding: 20,
    backdropFilter: 'blur(12px)',
    boxShadow: glow ? `0 0 24px ${glow}22` : '0 4px 24px rgba(0,0,0,0.4)',
    cursor: onClick ? 'pointer' : undefined,
    transition: 'all .2s',
    ...style,
  }}>{children}</div>
)

// ── NeuButton ─────────────────────────────────────────────────────────────────
export const NeuBtn = ({ children, onClick, color, outline, full, small, danger, disabled, icon }) => {
  const c = danger ? T.red : color || T.teal
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? T.bgCard : outline ? 'transparent' : `linear-gradient(135deg, ${c}, ${c}cc)`,
      color: disabled ? T.textMuted : outline ? c : '#fff',
      border: `1.5px solid ${disabled ? T.border : c}`,
      borderRadius: 12,
      padding: small ? '7px 16px' : '13px 24px',
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      fontSize: small ? 13 : 15,
      cursor: disabled ? 'not-allowed' : 'pointer',
      width: full ? '100%' : undefined,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      boxShadow: disabled || outline ? 'none' : `0 4px 16px ${c}44`,
      transition: 'all .2s',
    }}>
      {icon && <span style={{fontSize: small ? 14 : 18}}>{icon}</span>}
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = ({ label, value, onChange, placeholder, type = 'text', required, icon }) => (
  <div style={{ marginBottom: 18 }}>
    {label && (
      <label style={{ display: 'block', fontWeight: 600, color: T.textSub, marginBottom: 8, fontSize: 13, letterSpacing: '.5px', textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: T.red }}> *</span>}
      </label>
    )}
    <div style={{ position: 'relative' }}>
      {icon && <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: .6 }}>{icon}</span>}
      <input
        value={value} onChange={onChange} placeholder={placeholder} type={type}
        style={{
          width: '100%', background: T.bgCard, border: `1.5px solid ${T.border}`,
          borderRadius: 12, padding: icon ? '13px 14px 13px 42px' : '13px 14px',
          fontSize: 15, color: T.text, fontFamily: "'Space Grotesk', sans-serif",
          boxSizing: 'border-box', outline: 'none', transition: 'border-color .2s',
        }}
        onFocus={e => e.target.style.borderColor = T.teal}
        onBlur={e => e.target.style.borderColor = T.border}
      />
    </div>
  </div>
)

// ── Alert ─────────────────────────────────────────────────────────────────────
export const Alert = ({ msg, type = 'error' }) => {
  if (!msg) return null
  const c = type === 'error' ? T.red : type === 'success' ? T.green : T.yellow
  return (
    <div style={{ background: c+'15', border: `1px solid ${c}44`, borderRadius: 12, padding: '12px 16px', color: c, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span>{type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
      <span>{msg}</span>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '🚗', title, subtitle, action, actionLabel }) => (
  <GlassCard style={{ textAlign: 'center', padding: 48 }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 18 }}>{title}</div>
    <div style={{ color: T.textSub, marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>{subtitle}</div>
    {action && <div style={{ marginTop: 20 }}><NeuBtn onClick={action} color={T.teal}>{actionLabel}</NeuBtn></div>}
  </GlassCard>
)

// ── StatCard ──────────────────────────────────────────────────────────────────
export const StatCard = ({ icon, value, label, color, sub }) => (
  <GlassCard glow={color} style={{ flex: 1, textAlign: 'center', padding: 16, minWidth: 0 }}>
    <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 22, color: color || T.text }}>{value}</div>
    <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: color, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
  </GlassCard>
)

// ── BottomNav ─────────────────────────────────────────────────────────────────
export const BottomNav = ({ tabs, active, setActive }) => (
  <div style={{
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480,
    background: T.bgGlass, borderTop: `1px solid ${T.border}`,
    backdropFilter: 'blur(20px)', display: 'flex', zIndex: 200,
  }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => setActive(t.id)} style={{
        flex: 1, padding: '10px 4px 8px', background: 'none', border: 'none',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        color: active === t.id ? T.teal : T.textMuted,
        fontFamily: "'Space Grotesk',sans-serif",
        fontWeight: active === t.id ? 700 : 400, fontSize: 10,
        transition: 'color .2s',
      }}>
        <span style={{ fontSize: 22, filter: active === t.id ? `drop-shadow(0 0 6px ${T.teal})` : 'none', transition: 'filter .2s' }}>{t.icon}</span>
        {t.label}
      </button>
    ))}
  </div>
)

// ── TopBar ────────────────────────────────────────────────────────────────────
export const TopBar = ({ title, subtitle, onBack, action, actionLabel, actionColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, width: 40, height: 40, cursor: 'pointer', fontSize: 20, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
      )}
      <div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 22 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: T.textSub, marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
    {action && <NeuBtn onClick={action} small color={actionColor || T.teal}>{actionLabel}</NeuBtn>}
  </div>
)

// ── Badge ─────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color }) => (
  <span style={{ background: (color||T.teal)+'20', color: color||T.teal, border: `1px solid ${(color||T.teal)}44`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '.3px' }}>{label}</span>
)

// ── ProgressBar ───────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max, color, height = 6 }) => (
  <div style={{ height, background: T.border, borderRadius: height, overflow: 'hidden' }}>
    <div style={{ height, background: color || T.teal, borderRadius: height, width: `${Math.min((value/max)*100,100)}%`, transition: 'width .5s', boxShadow: `0 0 8px ${color||T.teal}88` }} />
  </div>
)

// ── Logo ──────────────────────────────────────────────────────────────────────
export const Logo = ({ size = 36 }) => (
  <img src="/logo.webp" alt="DriveLicenceLab" style={{ width: size, height: size, objectFit: 'contain' }} />
)

// ── AppHeader ─────────────────────────────────────────────────────────────────
export const AppHeader = ({ role, name, onSignOut }) => {
  const roleColors = { student: T.teal, instructor: T.green, admin: T.orange, test_officer: T.purple, system_admin: T.red }
  const roleLabels = { student: 'Student', instructor: 'Instructor', admin: 'School Admin', test_officer: 'Test Officer', system_admin: 'System Admin' }
  return (
    <div style={{ background: T.bgGlass, borderBottom: `1px solid ${T.border}`, backdropFilter: 'blur(20px)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Logo size={32} />
        <div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 15, lineHeight: 1 }}>DriveLicenceLab</div>
          <div style={{ fontSize: 11, color: roleColors[role] || T.teal, fontWeight: 600 }}>{roleLabels[role] || role}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</div>
        </div>
        <button onClick={onSignOut} style={{ background: T.redGlow, border: `1px solid ${T.red}44`, borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: T.red, fontWeight: 600 }}>Sign Out</button>
      </div>
    </div>
  )
}
