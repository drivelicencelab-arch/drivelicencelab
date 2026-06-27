import { useState } from 'react'
import { supabase } from '../supabase.js'
import { T, GlassCard, NeuBtn, Alert, ProgressBar } from '../ui.jsx'

// ── Parse CSV ─────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.')

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/['"]/g, ''))
  const required = ['full_name', 'email']
  const missing = required.filter(r => !headers.includes(r))
  if (missing.length > 0) throw new Error(`Missing required columns: ${missing.join(', ')}`)

  return lines.slice(1).filter(l => l.trim()).map((line, i) => {
    // Handle quoted fields with commas
    const vals = []
    let cur = '', inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { vals.push(cur.trim()); cur = '' }
      else cur += ch
    }
    vals.push(cur.trim())

    const row = {}
    headers.forEach((h, idx) => { row[h] = vals[idx]?.replace(/['"]/g, '').trim() || '' })

    if (!row.email || !row.email.includes('@')) throw new Error(`Row ${i + 2}: Invalid email "${row.email}"`)
    if (!row.full_name) throw new Error(`Row ${i + 2}: Missing full_name`)

    return {
      full_name: row.full_name,
      email: row.email,
      sa_id: row.sa_id || row.id_number || '',
      phone: row.phone || row.phone_number || '',
      date_of_birth: row.date_of_birth || row.dob || '',
      slot_name: row.slot || row.time_slot || '',
      role: 'student',
    }
  })
}

// ── Process one student ───────────────────────────────────────────────────────
async function processStudent(student, slotMap, schoolId) {
  try {
    // Check if user already exists in profiles
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', student.email)
      .single()

    let userId = existing?.id

    if (!userId) {
      // Create auth user via admin invite (uses supabase admin)
      // On free plan, we create a profile record; user can sign up later
      // We use a placeholder UUID based on email
      const fakeId = crypto.randomUUID()
      const { error: profileError } = await supabase.from('profiles').insert({
        id: fakeId,
        email: student.email,
        full_name: student.full_name,
        sa_id: student.sa_id,
        phone: student.phone,
        date_of_birth: student.date_of_birth || null,
        role: 'student',
      })
      if (profileError) throw new Error(`Profile error: ${profileError.message}`)

      // Create XP record
      await supabase.from('student_xp').insert({ student_id: fakeId, xp_points: 0, streak_days: 0 })
      userId = fakeId
    } else {
      // Update existing profile
      await supabase.from('profiles').update({
        sa_id: student.sa_id || undefined,
        phone: student.phone || undefined,
      }).eq('id', userId)
    }

    // Enrol in slot if specified
    if (student.slot_name && slotMap[student.slot_name.toLowerCase()]) {
      const slotId = slotMap[student.slot_name.toLowerCase()]
      await supabase.from('enrollments').upsert({
        student_id: userId,
        slot_id: slotId,
        status: 'active',
      }, { onConflict: 'student_id,slot_id' })
    }

    return { success: true, email: student.email, name: student.full_name }
  } catch (e) {
    return { success: false, email: student.email, name: student.full_name, error: e.message }
  }
}

// ── CSV Template download ─────────────────────────────────────────────────────
function downloadTemplate() {
  const csv = `full_name,email,sa_id,phone,date_of_birth,slot
John Smith,john@email.com,0012345678901,0721234567,2000-01-15,Slot A — Morning
Jane Doe,jane@email.com,0112345678902,0831234567,2001-03-22,Slot B — Midday
`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'drivelicencelab_students_template.csv'
  a.click(); URL.revokeObjectURL(url)
}

// ── Main BulkUpload component ─────────────────────────────────────────────────
export default function BulkUpload({ schoolId, slots = [], onDone }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // Build slot name → id map
  const slotMap = {}
  slots.forEach(s => { slotMap[s.name.toLowerCase()] = s.id })

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.csv')) { setError('Please upload a .csv file.'); return }
    setFile(f); setError(''); setResults(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result)
        setPreview(parsed)
      } catch (err) {
        setError(err.message)
        setPreview([])
      }
    }
    reader.readAsText(f)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const processAll = async () => {
    setProcessing(true); setProgress(0); setResults(null)
    const res = []
    for (let i = 0; i < preview.length; i++) {
      const r = await processStudent(preview[i], slotMap, schoolId)
      res.push(r)
      setProgress(Math.round(((i + 1) / preview.length) * 100))
    }
    setResults(res)
    setProcessing(false)
    const success = res.filter(r => r.success).length
    if (success > 0) onDone?.()
  }

  const succeeded = results?.filter(r => r.success) || []
  const failed = results?.filter(r => !r.success) || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 16 }}>📤 Bulk Upload Students</div>
        <NeuBtn small outline color={T.teal} onClick={downloadTemplate} icon="⬇️">Template CSV</NeuBtn>
      </div>

      <Alert msg={error} />

      {/* Instructions */}
      <GlassCard style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.8 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 6 }}>How it works:</div>
          <div>1. Download the CSV template above</div>
          <div>2. Fill in student details (full_name and email are required)</div>
          <div>3. Add slot name to auto-enrol students (must match exactly)</div>
          <div>4. Upload the completed CSV below</div>
        </div>
      </GlassCard>

      {/* Drop zone */}
      {!preview.length && !results && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? T.teal : T.border}`,
            borderRadius: 16,
            padding: 40,
            textAlign: 'center',
            background: dragOver ? T.tealGlow : T.bgCard,
            transition: 'all .2s',
            marginBottom: 16,
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('csv-input').click()}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>Drop CSV file here</div>
          <div style={{ color: T.textSub, fontSize: 13 }}>or click to browse</div>
          <input id="csv-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && !results && (
        <>
          <GlassCard style={{ marginBottom: 16 }} glow={T.green}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: T.text }}>✅ {preview.length} students ready to import</div>
              <NeuBtn small outline color={T.textSub} onClick={() => { setPreview([]); setFile(null) }}>Clear</NeuBtn>
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {preview.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < preview.length - 1 ? `1px solid ${T.border}` : 'none', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: T.text, fontSize: 14 }}>{s.full_name}</div>
                    <div style={{ fontSize: 12, color: T.textSub }}>{s.email} {s.slot_name && `· ${s.slot_name}`}</div>
                  </div>
                  <span style={{ fontSize: 11, color: T.teal }}>#{i + 1}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {processing ? (
            <GlassCard>
              <div style={{ fontWeight: 700, color: T.text, marginBottom: 12 }}>Importing students… {progress}%</div>
              <ProgressBar value={progress} max={100} color={T.teal} height={8} />
            </GlassCard>
          ) : (
            <NeuBtn full color={T.green} onClick={processAll} icon="🚀">
              Import {preview.length} Students
            </NeuBtn>
          )}
        </>
      )}

      {/* Results */}
      {results && (
        <GlassCard glow={failed.length === 0 ? T.green : T.orange}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: T.text, fontSize: 16, marginBottom: 14 }}>
            Import Complete
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, textAlign: 'center', background: T.greenGlow, borderRadius: 12, padding: 14 }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 24, color: T.green }}>{succeeded.length}</div>
              <div style={{ fontSize: 12, color: T.textSub }}>Imported</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: T.redGlow, borderRadius: 12, padding: 14 }}>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 24, color: T.red }}>{failed.length}</div>
              <div style={{ fontSize: 12, color: T.textSub }}>Failed</div>
            </div>
          </div>
          {failed.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 8 }}>Errors:</div>
              {failed.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>⚠️ {f.name} ({f.email}): {f.error}</div>
              ))}
            </div>
          )}
          <NeuBtn full color={T.teal} onClick={() => { setResults(null); setPreview([]); setFile(null) }}>Upload Another File</NeuBtn>
        </GlassCard>
      )}
    </div>
  )
}
