import { createContext, useContext, useEffect, useState } from 'react'

const AmbientCtx = createContext({ score: 0, theme: 'guidance' })
export const useAmbient = () => useContext(AmbientCtx)

// ── Theme palettes ─────────────────────────────────────────────────────────────
const THEMES = {
  // 0–30%: Guidance — warm, calm, nurturing
  guidance: {
    name: 'guidance',
    '--dllab-primary':    '#FF8C42',
    '--dllab-primary-glow': 'rgba(255,140,66,0.18)',
    '--dllab-accent':     '#FFB347',
    '--dllab-bg':         '#0F0D0A',
    '--dllab-card':       '#1A1612',
    '--dllab-border':     '#2D2318',
    '--dllab-text':       '#F5EFE6',
    '--dllab-sub':        '#9E8E7E',
    '--dllab-hero-from':  '#1A0F00',
    '--dllab-hero-to':    '#0F0D0A',
    '--dllab-gradient':   'linear-gradient(135deg, #FF8C42, #FF6B2C)',
  },
  // 30–60%: Learning — transitional blue-teal
  learning: {
    name: 'learning',
    '--dllab-primary':    '#00C9C8',
    '--dllab-primary-glow': 'rgba(0,201,200,0.18)',
    '--dllab-accent':     '#4DC9C8',
    '--dllab-bg':         '#0D1117',
    '--dllab-card':       '#161B22',
    '--dllab-border':     '#21262D',
    '--dllab-text':       '#E6EDF3',
    '--dllab-sub':        '#8B949E',
    '--dllab-hero-from':  '#0D2137',
    '--dllab-hero-to':    '#0D1117',
    '--dllab-gradient':   'linear-gradient(135deg, #00C9C8, #009E9D)',
  },
  // 60–85%: Confidence — bold electric
  confidence: {
    name: 'confidence',
    '--dllab-primary':    '#00F5D4',
    '--dllab-primary-glow': 'rgba(0,245,212,0.22)',
    '--dllab-accent':     '#7C3AED',
    '--dllab-bg':         '#080D13',
    '--dllab-card':       '#0E1520',
    '--dllab-border':     '#1A2535',
    '--dllab-text':       '#FFFFFF',
    '--dllab-sub':        '#94A3B8',
    '--dllab-hero-from':  '#070B14',
    '--dllab-hero-to':    '#0E1A2E',
    '--dllab-gradient':   'linear-gradient(135deg, #00F5D4, #7C3AED)',
  },
  // 85–100%: Ready — gold prestige
  ready: {
    name: 'ready',
    '--dllab-primary':    '#E3B341',
    '--dllab-primary-glow': 'rgba(227,179,65,0.25)',
    '--dllab-accent':     '#FFD700',
    '--dllab-bg':         '#0A0900',
    '--dllab-card':       '#141100',
    '--dllab-border':     '#2D2600',
    '--dllab-text':       '#FFF8DC',
    '--dllab-sub':        '#A89860',
    '--dllab-hero-from':  '#1A1400',
    '--dllab-hero-to':    '#0A0900',
    '--dllab-gradient':   'linear-gradient(135deg, #E3B341, #FF8C00)',
  },
}

const getThemeForScore = (score) => {
  if (score >= 85) return THEMES.ready
  if (score >= 60) return THEMES.confidence
  if (score >= 30) return THEMES.learning
  return THEMES.guidance
}

// ── Inject CSS variables into :root ───────────────────────────────────────────
const injectTheme = (theme, prevTheme) => {
  const root = document.documentElement
  if (!prevTheme || prevTheme.name !== theme.name) {
    // Add transition class
    root.style.setProperty('transition', 'background-color 1.2s ease, color 0.8s ease')
  }
  Object.entries(theme).forEach(([key, val]) => {
    if (key.startsWith('--')) root.style.setProperty(key, val)
  })
}

// ── Provider ──────────────────────────────────────────────────────────────────
export default function AmbientThemeProvider({ children, score = 0 }) {
  const [currentTheme, setCurrentTheme] = useState(getThemeForScore(score))
  const [prevTheme, setPrevTheme] = useState(null)

  useEffect(() => {
    const newTheme = getThemeForScore(score)
    if (newTheme.name !== currentTheme.name) {
      setPrevTheme(currentTheme)
      setCurrentTheme(newTheme)
    }
  }, [score])

  useEffect(() => {
    injectTheme(currentTheme, prevTheme)
  }, [currentTheme])

  // Inject base CSS on mount
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'dllab-ambient'
    style.textContent = `
      :root {
        --dllab-primary: #00C9C8;
        --dllab-primary-glow: rgba(0,201,200,0.18);
        --dllab-accent: #4DC9C8;
        --dllab-bg: #0D1117;
        --dllab-card: #161B22;
        --dllab-border: #21262D;
        --dllab-text: #E6EDF3;
        --dllab-sub: #8B949E;
        --dllab-hero-from: #0D2137;
        --dllab-hero-to: #0D1117;
        --dllab-gradient: linear-gradient(135deg, #00C9C8, #009E9D);
        transition: background-color 1.2s ease;
      }
      .ambient-primary { color: var(--dllab-primary) !important; }
      .ambient-bg { background: var(--dllab-bg) !important; }
      .ambient-card { background: var(--dllab-card) !important; border-color: var(--dllab-border) !important; }
      .ambient-glow { box-shadow: 0 0 24px var(--dllab-primary-glow) !important; }
      .ambient-gradient { background: var(--dllab-gradient) !important; }
      .ambient-border { border-color: var(--dllab-border) !important; }
      .ambient-text { color: var(--dllab-text) !important; }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  return (
    <AmbientCtx.Provider value={{ score, theme: currentTheme.name, palette: currentTheme }}>
      {/* Theme transition indicator */}
      {prevTheme && prevTheme.name !== currentTheme.name && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          border: `1px solid ${currentTheme['--dllab-primary']}44`,
          borderRadius: 12, padding: '8px 16px',
          color: currentTheme['--dllab-primary'],
          fontSize: 13, fontWeight: 700,
          animation: 'fadeInOut 3s ease forwards',
        }}>
          ✨ Theme evolved: {currentTheme.name}
        </div>
      )}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      {children}
    </AmbientCtx.Provider>
  )
}
