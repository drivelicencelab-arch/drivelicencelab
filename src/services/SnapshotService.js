import { supabase } from '../supabase.js'

// ── Generate a stylized SVG snapshot from session notes ───────────────────────
export function generateSessionSnapshot({ sessionDate, instructorName, skillsTaught = [], notes = '', studentName = '', score = null }) {
  const date = new Date(sessionDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
  const skills = skillsTaught.slice(0, 4)
  const skillColors = ['#00C9C8', '#3FB950', '#E3B341', '#7C3AED']
  const shortNotes = notes.length > 80 ? notes.substring(0, 80) + '…' : notes

  // Wrap text helper for SVG
  const wrapText = (text, maxChars) => {
    const words = text.split(' ')
    const lines = []
    let line = ''
    words.forEach(word => {
      if ((line + word).length > maxChars) { lines.push(line.trim()); line = '' }
      line += word + ' '
    })
    if (line.trim()) lines.push(line.trim())
    return lines.slice(0, 3)
  }

  const noteLines = wrapText(shortNotes, 38)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0D2137"/>
      <stop offset="100%" style="stop-color:#0D1117"/>
    </linearGradient>
    <linearGradient id="header" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#009E9D"/>
      <stop offset="100%" style="stop-color:#00C9C8"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="round"><rect width="400" height="280" rx="16"/></clipPath>
  </defs>

  <!-- Background -->
  <rect width="400" height="280" fill="url(#bg)" rx="16"/>
  
  <!-- Border glow -->
  <rect width="398" height="278" x="1" y="1" fill="none" stroke="#00C9C8" stroke-width="1" rx="15" opacity="0.4"/>

  <!-- Header bar -->
  <rect x="0" y="0" width="400" height="56" fill="url(#header)" rx="16"/>
  <rect x="0" y="40" width="400" height="16" fill="url(#header)"/>

  <!-- Logo circle -->
  <circle cx="32" cy="28" r="18" fill="rgba(0,0,0,0.3)"/>
  <text x="32" y="34" font-size="18" text-anchor="middle">🚗</text>

  <!-- Session title -->
  <text x="58" y="22" font-family="Arial" font-weight="900" font-size="15" fill="white">DriveLicenceLab</text>
  <text x="58" y="40" font-family="Arial" font-size="11" fill="rgba(255,255,255,0.8)">Session Snapshot</text>

  <!-- Date badge -->
  <rect x="295" y="10" width="95" height="24" rx="12" fill="rgba(0,0,0,0.3)"/>
  <text x="342" y="26" font-family="Arial" font-weight="700" font-size="11" fill="white" text-anchor="middle">${date}</text>

  <!-- Student name -->
  <text x="24" y="84" font-family="Arial" font-weight="700" font-size="16" fill="white">${studentName}</text>
  <text x="24" y="100" font-family="Arial" font-size="11" fill="#8B949E">Instructor: ${instructorName}</text>

  ${score !== null ? `
  <!-- Score badge -->
  <rect x="300" y="68" width="80" height="40" rx="12" fill="rgba(0,201,200,0.15)" stroke="#00C9C8" stroke-width="1"/>
  <text x="340" y="86" font-family="Arial" font-weight="900" font-size="20" fill="#00C9C8" text-anchor="middle">${score}%</text>
  <text x="340" y="100" font-family="Arial" font-size="10" fill="#8B949E" text-anchor="middle">Score</text>
  ` : ''}

  <!-- Divider -->
  <line x1="24" y1="112" x2="376" y2="112" stroke="#21262D" stroke-width="1"/>

  <!-- Skills covered -->
  <text x="24" y="132" font-family="Arial" font-weight="700" font-size="12" fill="#8B949E">SKILLS COVERED</text>
  ${skills.map((skill, i) => `
  <rect x="${24 + i * 92}" y="140" width="86" height="26" rx="13" fill="${skillColors[i]}20" stroke="${skillColors[i]}" stroke-width="1"/>
  <text x="${67 + i * 92}" y="157" font-family="Arial" font-weight="700" font-size="11" fill="${skillColors[i]}" text-anchor="middle">${skill.length > 10 ? skill.substring(0, 10) + '..' : skill}</text>
  `).join('')}

  <!-- Notes section -->
  ${shortNotes ? `
  <text x="24" y="188" font-family="Arial" font-weight="700" font-size="12" fill="#8B949E">SESSION NOTES</text>
  ${noteLines.map((line, i) => `
  <text x="24" y="${204 + i * 16}" font-family="Arial" font-size="12" fill="#E6EDF3">${line}</text>
  `).join('')}
  ` : ''}

  <!-- Footer -->
  <text x="200" y="268" font-family="Arial" font-size="10" fill="#484F58" text-anchor="middle">drivelicencelab.co.za</text>
</svg>`

  return svg
}

// ── Convert SVG to data URL ────────────────────────────────────────────────────
export function svgToDataUrl(svgString) {
  const encoded = encodeURIComponent(svgString)
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}

// ── Store snapshot in Supabase storage ────────────────────────────────────────
export async function saveSessionSnapshot({ sessionId, svgString, studentId }) {
  try {
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const path = `snapshots/${studentId}/${sessionId}.svg`

    const { data, error } = await supabase.storage
      .from('session-snapshots')
      .upload(path, blob, { upsert: true, contentType: 'image/svg+xml' })

    if (error) throw error

    const { data: urlData } = supabase.storage.from('session-snapshots').getPublicUrl(path)
    const publicUrl = urlData?.publicUrl

    // Update session record
    await supabase.from('sessions').update({ snapshot_url: publicUrl }).eq('id', sessionId)

    return publicUrl
  } catch (e) {
    console.error('Snapshot save error:', e)
    // Return data URL as fallback
    return svgToDataUrl(svgString)
  }
}

// ── Snapshot Card component ───────────────────────────────────────────────────
export function SnapshotCard({ snapshot, style }) {
  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #21262D',
      background: '#161B22',
      ...style,
    }}>
      <img
        src={snapshot.snapshot_url || svgToDataUrl(generateSessionSnapshot({
          sessionDate: snapshot.session_date,
          instructorName: snapshot.instructor_name || 'Instructor',
          skillsTaught: snapshot.skills_taught || [],
          notes: snapshot.notes || '',
          studentName: snapshot.student_name || 'Student',
        }))}
        alt={`Session ${new Date(snapshot.session_date).toLocaleDateString('en-ZA')}`}
        style={{ width: '100%', display: 'block' }}
        loading="lazy"
      />
    </div>
  )
}
