// ── Design Tokens ─────────────────────────────────────────────────────────────
export const T = {
  bg:        '#0D1117',
  bgCard:    '#161B22',
  bgGlass:   'rgba(22,27,34,0.92)',
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

// ── Responsive helper ─────────────────────────────────────────────────────────
export const useWindowSize = () => {
  if (typeof window === 'undefined') return { w: 480, isTablet: false, isDesktop: false }
  const w = window.innerWidth
  return { w, isTablet: w >= 768, isDesktop: w >= 1024 }
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
      whiteSpace: 'nowrap',
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
      {icon && <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: .6, pointerEvents: 'none' }}>{icon}</span>}
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
    <div style={{ background: c+'15', border: `1px solid ${c}44`, borderRadius: 12, padding: '12px 16px', color: c, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5 }}>
      <span style={{flexShrink:0}}>{type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
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
export const StatCard = ({ icon, value, label, color }) => (
  <GlassCard glow={color} style={{ flex: 1, textAlign: 'center', padding: '16px 12px', minWidth: 0 }}>
    <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 22, color: color || T.text, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 11, color: T.textSub, marginTop: 4 }}>{label}</div>
  </GlassCard>
)

// ── Badge ─────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color }) => (
  <span style={{ background: (color||T.teal)+'20', color: color||T.teal, border: `1px solid ${(color||T.teal)}44`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '.3px', whiteSpace: 'nowrap' }}>{label}</span>
)

// ── ProgressBar ───────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max, color, height = 6 }) => (
  <div style={{ height, background: T.border, borderRadius: height, overflow: 'hidden' }}>
    <div style={{ height, background: color || T.teal, borderRadius: height, width: `${Math.min((value/max)*100,100)}%`, transition: 'width .5s', boxShadow: `0 0 8px ${color||T.teal}88` }} />
  </div>
)

// ── Logo ──────────────────────────────────────────────────────────────────────
export const Logo = ({ size = 36 }) => (
  <img src="/logo.webp" alt="DriveLicenceLab" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
)

// ── TopBar ────────────────────────────────────────────────────────────────────
export const TopBar = ({ title, subtitle, onBack, action, actionLabel, actionColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, width: 40, height: 40, cursor: 'pointer', fontSize: 20, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>‹</button>
      )}
      <div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 'clamp(18px, 4vw, 24px)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: T.textSub, marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
    {action && <NeuBtn onClick={action} small color={actionColor || T.teal}>{actionLabel}</NeuBtn>}
  </div>
)

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
export const DesktopSidebar = ({ tabs, active, setActive, role, name, onSignOut }) => {
  const roleColors = { student: T.teal, instructor: T.green, admin: T.orange, test_officer: T.purple, system_admin: T.red }
  const roleLabels = { student: 'Student', instructor: 'Instructor', admin: 'School Admin', test_officer: 'Test Officer', system_admin: 'System Admin' }
  return (
    <div style={{
      background: T.bgCard,
      borderRight: `1px solid ${T.border}`,
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, padding: '0 8px' }}>
        <Logo size={40} />
        <div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, color: T.text, fontSize: 16, lineHeight: 1 }}>DriveLicenceLab</div>
          <div style={{ fontSize: 11, color: roleColors[role] || T.teal, fontWeight: 600, marginTop: 2 }}>{roleLabels[role]}</div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 12,
            background: active === t.id ? T.teal+'20' : 'transparent',
            border: `1px solid ${active === t.id ? T.teal+'44' : 'transparent'}`,
            color: active === t.id ? T.teal : T.textSub,
            fontWeight: active === t.id ? 700 : 500,
            fontSize: 14, cursor: 'pointer',
            fontFamily: "'Space Grotesk',sans-serif",
            transition: 'all .2s', textAlign: 'left', width: '100%',
          }}>
            <span style={{ fontSize: 20, width: 24, textAlign: 'center' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* User info + sign out */}
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, marginTop: 16 }}>
        <div style={{ padding: '8px 8px 12px', fontSize: 13, color: T.textSub, fontWeight: 600 }}>{name}</div>
        <button onClick={onSignOut} style={{ width: '100%', padding: '10px 16px', background: T.redGlow, border: `1px solid ${T.red}44`, borderRadius: 12, color: T.red, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif" }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────────
export const BottomNav = ({ tabs, active, setActive }) => (
  <div className="bottom-nav-mobile" style={{
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: T.bgGlass, borderTop: `1px solid ${T.border}`,
    backdropFilter: 'blur(20px)', display: 'flex', zIndex: 200,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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

// ── Responsive App Shell ──────────────────────────────────────────────────────
// Wraps each role app — shows sidebar on desktop, bottom nav on mobile
export const AppShell = ({ tabs, active, setActive, role, name, onSignOut, children }) => {
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Desktop sidebar */}
      {isDesktop && (
        <div style={{ width: 260, flexShrink: 0 }}>
          <DesktopSidebar tabs={tabs} active={active} setActive={setActive} role={role} name={name} onSignOut={onSignOut} />
        </div>
      )}

      {/* Main content */}
      <div style={{
        flex: 1,
        paddingBottom: isDesktop ? 0 : 80,
        background: T.bg,
        minHeight: '100vh',
        maxWidth: isDesktop ? '100%' : undefined,
        overflowX: 'hidden',
      }}>
        {/* Mobile header */}
        {!isDesktop && <AppHeader role={role} name={name} onSignOut={onSignOut} />}
        <div style={{ padding: isDesktop ? '32px 40px' : '20px 16px', maxWidth: isDesktop ? 900 : undefined }}>
          {children}
        </div>
      </div>

      {/* Mobile bottom nav */}
      {!isDesktop && <BottomNav tabs={tabs} active={active} setActive={setActive} />}
    </div>
  )
}

// ── App Header (mobile only) ──────────────────────────────────────────────────
export const AppHeader = ({ role, name, onSignOut }) => {
  const roleColors = { student: T.teal, instructor: T.green, admin: T.orange, test_officer: T.purple, system_admin: T.red }
  const roleLabels = { student: 'Student', instructor: 'Instructor', admin: 'School Admin', test_officer: 'Test Officer', system_admin: 'System Admin' }
  return (
    <div style={{ background: T.bgGlass, borderBottom: `1px solid ${T.border}`, backdropFilter: 'blur(20px)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Logo size={30} />
        <div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.text, fontSize: 14, lineHeight: 1 }}>DriveLicenceLab</div>
          <div style={{ fontSize: 11, color: roleColors[role] || T.teal, fontWeight: 600 }}>{roleLabels[role] || role}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: T.textSub, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        <button onClick={onSignOut} style={{ background: T.redGlow, border: `1px solid ${T.red}44`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: T.red, fontWeight: 700, whiteSpace: 'nowrap' }}>Sign Out</button>
      </div>
    </div>
  )
}
