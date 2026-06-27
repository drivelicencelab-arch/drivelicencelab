import { useState, useEffect, useRef } from 'react'
import { T } from '../../ui.jsx'

// ── Skill nodes definition ────────────────────────────────────────────────────
const SKILL_NODES = [
  { id: 'theory',     label: 'K53 Theory',      icon: '📖', x: 50,  y: 15,  requires: [] },
  { id: 'signs',      label: 'Road Signs',       icon: '🚦', x: 20,  y: 35,  requires: ['theory'] },
  { id: 'controls',   label: 'Vehicle Controls', icon: '🎮', x: 80,  y: 35,  requires: ['theory'] },
  { id: 'parking',    label: 'Parking',          icon: '🅿️', x: 10,  y: 60,  requires: ['controls'] },
  { id: 'manoeuvres', label: 'Manoeuvres',       icon: '🔄', x: 40,  y: 60,  requires: ['controls', 'signs'] },
  { id: 'highway',    label: 'Highway Driving',  icon: '🛣️', x: 70,  y: 60,  requires: ['controls'] },
  { id: 'emergency',  label: 'Emergency Stop',   icon: '🛑', x: 90,  y: 60,  requires: ['controls'] },
  { id: 'parallel',   label: 'Parallel Park',    icon: '📐', x: 25,  y: 82,  requires: ['parking', 'manoeuvres'] },
  { id: 'alley',      label: 'Alley Docking',    icon: '🏁', x: 55,  y: 82,  requires: ['manoeuvres'] },
  { id: 'dltc',       label: 'DLTC Ready',       icon: '🏆', x: 50,  y: 96,  requires: ['parallel', 'alley', 'highway', 'emergency'] },
]

// ── Node state computer ────────────────────────────────────────────────────────
const getNodeState = (node, unlockedSkills) => {
  const completed = unlockedSkills.includes(node.id)
  const available = !completed && node.requires.every(r => unlockedSkills.includes(r))
  const locked = !completed && !available
  return { completed, available, locked }
}

// ── Animated connection line ───────────────────────────────────────────────────
function Connection({ from, to, unlocked }) {
  return (
    <line
      x1={`${from.x}%`} y1={`${from.y}%`}
      x2={`${to.x}%`} y2={`${to.y}%`}
      stroke={unlocked ? T.teal : T.border}
      strokeWidth={unlocked ? 2 : 1}
      strokeDasharray={unlocked ? '0' : '4 4'}
      opacity={unlocked ? 0.8 : 0.3}
      style={{ transition: 'all 0.6s ease' }}
    />
  )
}

// ── Single skill node ─────────────────────────────────────────────────────────
function SkillNode({ node, state, onClick, aiReady, animating }) {
  const [hovered, setHovered] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (state.available || aiReady) {
      const interval = setInterval(() => setPulse(p => !p), 1200)
      return () => clearInterval(interval)
    }
  }, [state.available, aiReady])

  const bgColor = state.completed ? T.teal
    : state.available ? (aiReady ? T.yellow : T.orange + 'cc')
    : T.bgCard

  const borderColor = state.completed ? T.teal
    : state.available ? (aiReady ? T.yellow : T.orange)
    : T.border

  const glowColor = state.completed ? T.teal
    : aiReady ? T.yellow
    : state.available ? T.orange
    : 'transparent'

  const size = state.completed ? 52 : state.available ? 48 : 42

  return (
    <div
      onClick={() => !state.locked && onClick(node)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: `translate(-50%, -50%) scale(${hovered && !state.locked ? 1.15 : animating ? 1.2 : 1})`,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
        cursor: state.locked ? 'default' : 'pointer',
        zIndex: hovered ? 10 : 1,
      }}
    >
      {/* Pulse ring for available/AI-ready nodes */}
      {(state.available || aiReady) && (
        <div style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          border: `2px solid ${glowColor}`,
          opacity: pulse ? 0.8 : 0.2,
          transition: 'opacity 1.2s ease',
          animation: 'none',
        }} />
      )}

      {/* Node circle */}
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bgColor,
        border: `2px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: state.completed ? 22 : 18,
        boxShadow: state.completed || state.available
          ? `0 0 ${(hovered ? 20 : 12) + (aiReady ? 10 : 0)}px ${glowColor}88`
          : 'none',
        transition: 'all 0.4s ease',
        opacity: state.locked ? 0.35 : 1,
        position: 'relative',
      }}>
        {state.locked ? '🔒' : node.icon}
        {state.completed && (
          <div style={{
            position: 'absolute',
            top: -4, right: -4,
            width: 16, height: 16,
            background: T.green,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            border: `1px solid ${T.bg}`,
          }}>✓</div>
        )}
        {aiReady && !state.completed && (
          <div style={{
            position: 'absolute',
            top: -6, right: -6,
            width: 18, height: 18,
            background: T.yellow,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            border: `1px solid ${T.bg}`,
          }}>✨</div>
        )}
      </div>

      {/* Label tooltip */}
      {(hovered || state.completed) && (
        <div style={{
          position: 'absolute',
          top: size + 6,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${borderColor}44`,
          borderRadius: 8,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 700,
          color: borderColor,
          whiteSpace: 'nowrap',
          zIndex: 20,
          boxShadow: `0 4px 12px rgba(0,0,0,0.5)`,
        }}>
          {node.label}
        </div>
      )}
    </div>
  )
}

// ── Main SkillGraph component ─────────────────────────────────────────────────
export default function SkillGraph({ unlockedSkills = [], aiReadyNodes = [], onNodeClick, height = 420 }) {
  const [animatingNode, setAnimatingNode] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const prevUnlocked = useRef(unlockedSkills)

  // Detect newly unlocked nodes for animation
  useEffect(() => {
    const newlyUnlocked = unlockedSkills.filter(s => !prevUnlocked.current.includes(s))
    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach(nodeId => {
        setAnimatingNode(nodeId)
        setTimeout(() => setAnimatingNode(null), 800)
      })
    }
    prevUnlocked.current = unlockedSkills
  }, [unlockedSkills])

  const handleNodeClick = (node) => {
    const state = getNodeState(node, unlockedSkills)
    if (state.locked) return
    setAnimatingNode(node.id)
    setTimeout(() => setAnimatingNode(null), 600)
    onNodeClick?.(node, state)
  }

  const completedCount = SKILL_NODES.filter(n => unlockedSkills.includes(n.id)).length
  const progressPct = Math.round((completedCount / SKILL_NODES.length) * 100)

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 16 }}>
          🗺️ Skill Road Map
        </div>
        <div style={{ fontSize: 13, color: T.teal, fontWeight: 700 }}>
          {completedCount}/{SKILL_NODES.length} skills
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { color: T.teal, label: 'Completed' },
          { color: T.orange, label: 'Available' },
          { color: T.yellow, label: 'AI Ready ✨' },
          { color: T.border, label: 'Locked' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textSub }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Graph canvas */}
      <div style={{
        position: 'relative',
        width: '100%',
        height,
        background: `radial-gradient(ellipse at 50% 0%, ${T.tealGlow}, transparent 70%), ${T.bgCard}`,
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        overflow: 'hidden',
      }}>
        {/* SVG connections */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
          {SKILL_NODES.map(node =>
            node.requires.map(reqId => {
              const reqNode = SKILL_NODES.find(n => n.id === reqId)
              if (!reqNode) return null
              const unlocked = unlockedSkills.includes(reqId)
              return (
                <Connection key={`${reqId}-${node.id}`} from={reqNode} to={node} unlocked={unlocked} />
              )
            })
          )}
        </svg>

        {/* Nodes */}
        {SKILL_NODES.map(node => {
          const state = getNodeState(node, unlockedSkills)
          const isAiReady = aiReadyNodes.includes(node.id)
          return (
            <SkillNode
              key={node.id}
              node={node}
              state={state}
              onClick={handleNodeClick}
              aiReady={isAiReady}
              animating={animatingNode === node.id}
            />
          )
        })}

        {/* Progress bar at bottom */}
        <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSub, marginBottom: 4 }}>
            <span>Overall Progress</span>
            <span style={{ color: T.teal, fontWeight: 700 }}>{progressPct}%</span>
          </div>
          <div style={{ height: 4, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: 4, background: T.teal, borderRadius: 4, width: `${progressPct}%`, transition: 'width 0.8s ease', boxShadow: `0 0 8px ${T.teal}88` }} />
          </div>
        </div>
      </div>

      {/* AI suggestion banner */}
      {aiReadyNodes.length > 0 && (
        <div style={{ marginTop: 12, background: T.yellow + '15', border: `1px solid ${T.yellow}44`, borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div style={{ fontSize: 13, color: T.yellow }}>
            <strong>AI Tutor suggests:</strong> You're ready to unlock{' '}
            {aiReadyNodes.map(id => SKILL_NODES.find(n => n.id === id)?.label).join(', ')}!
          </div>
        </div>
      )}
    </div>
  )
}
