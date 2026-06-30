const RING_DATA = [
  { radius: 70, duration: 14, dir: 1, icons: ['⚛️', '🔷'], color: '#00C9C8' },
  { radius: 115, duration: 22, dir: -1, icons: ['🗄️', '🔐', '⚡'], color: '#7C3AED' },
  { radius: 160, duration: 30, dir: 1, icons: ['🤖', '📡', '🎯', '📊'], color: '#E3B341' },
]

export default function OrbitRings({ size = 360 }) {
  return (
    <div style={{
      position: 'relative',
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes orbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbitSpinRev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes counterSpin { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes counterSpinRev { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Center core */}
      <div style={{
        position: 'absolute', width: 64, height: 64, borderRadius: '50%',
        background: 'linear-gradient(135deg,#00C9C8,#009E9D)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, zIndex: 10,
        boxShadow: '0 0 40px rgba(0,201,200,0.6)',
      }}>🚗</div>

      {/* Orbit rings */}
      {RING_DATA.map((ring, ri) => (
        <div key={ri} style={{
          position: 'absolute',
          width: ring.radius * 2, height: ring.radius * 2,
          borderRadius: '50%',
          border: `1px solid ${ring.color}33`,
        }}>
          {/* Rotating container for icons */}
          <div style={{
            position: 'absolute', inset: 0,
            animation: `${ring.dir > 0 ? 'orbitSpin' : 'orbitSpinRev'} ${ring.duration}s linear infinite`,
          }}>
            {ring.icons.map((icon, ii) => {
              const angle = (ii / ring.icons.length) * 360
              const rad = (angle * Math.PI) / 180
              const x = ring.radius + ring.radius * Math.cos(rad)
              const y = ring.radius + ring.radius * Math.sin(rad)
              return (
                <div key={ii} style={{
                  position: 'absolute',
                  left: x, top: y,
                  transform: 'translate(-50%,-50%)',
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'rgba(13,17,23,0.9)',
                  border: `1.5px solid ${ring.color}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15,
                  boxShadow: `0 0 16px ${ring.color}44`,
                  // Counter-rotate so icons stay upright
                  animation: `${ring.dir > 0 ? 'counterSpin' : 'counterSpinRev'} ${ring.duration}s linear infinite`,
                }}>
                  {icon}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
