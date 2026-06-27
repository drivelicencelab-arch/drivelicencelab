import { supabase } from '../supabase.js'
import { T, GlassCard, NeuBtn } from '../ui.jsx'
import { useState } from 'react'

// ── Convert data to CSV string ────────────────────────────────────────────────
function toCSV(headers, rows) {
  const escape = (val) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  const headerRow = headers.map(escape).join(',')
  const dataRows = rows.map(row => headers.map(h => escape(row[h])).join(','))
  return [headerRow, ...dataRows].join('\n')
}

// ── Download CSV file ─────────────────────────────────────────────────────────
function downloadCSV(filename, csvString) {
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Fetch full report data ─────────────────────────────────────────────────────
async function fetchReportData(schoolId) {
  const [slotsRes, enrollsRes, quizRes, attendRes, feedbackRes] = await Promise.all([
    supabase.from('time_slots').select('*').eq('school_id', schoolId),
    supabase.from('enrollments').select('*, profiles!student_id(full_name, email, sa_id, phone, date_of_birth), time_slots(name, day, start_time, end_time), profiles!instructor_id(full_name)').in('slot_id',
      (await supabase.from('time_slots').select('id').eq('school_id', schoolId)).data?.map(s => s.id) || []
    ),
    supabase.from('quiz_scores').select('*, profiles!student_id(full_name, email)').order('completed_at', { ascending: false }),
    supabase.from('attendance').select('*, profiles!student_id(full_name, email)').order('attended_at', { ascending: false }),
    supabase.from('instructor_feedback').select('*, profiles!student_id(full_name), profiles!instructor_id(full_name)'),
  ])

  return {
    slots: slotsRes.data || [],
    enrollments: enrollsRes.data || [],
    quizScores: quizRes.data || [],
    attendance: attendRes.data || [],
    feedback: feedbackRes.data || [],
  }
}

// ── Generate student summary report ──────────────────────────────────────────
function buildStudentReport(data) {
  const { enrollments, quizScores, attendance, feedback } = data

  return enrollments.map(enroll => {
    const sid = enroll.student_id
    const studentQuizzes = quizScores.filter(q => q.student_id === sid)
    const studentAttendance = attendance.filter(a => a.student_id === sid)
    const studentFeedback = feedback.filter(f => f.student_id === sid)

    const avgQuiz = studentQuizzes.length
      ? (studentQuizzes.reduce((a, q) => a + Number(q.percentage), 0) / studentQuizzes.length).toFixed(1)
      : 'N/A'

    const avgRating = studentFeedback.length
      ? (studentFeedback.reduce((a, f) => a + f.rating, 0) / studentFeedback.length).toFixed(1)
      : 'N/A'

    return {
      'Full Name': enroll.profiles?.full_name || '',
      'Email': enroll.profiles?.email || '',
      'SA ID': enroll.profiles?.sa_id || '',
      'Phone': enroll.profiles?.phone || '',
      'Date of Birth': enroll.profiles?.date_of_birth || '',
      'Time Slot': enroll.time_slots?.name || '',
      'Day': enroll.time_slots?.day || '',
      'Start Time': enroll.time_slots?.start_time || '',
      'End Time': enroll.time_slots?.end_time || '',
      'Instructor': enroll.instructor_id ? (enroll['profiles!instructor_id']?.full_name || 'Assigned') : 'Not Assigned',
      'Enrolment Status': enroll.status || '',
      'Payment Status': enroll.payment_status || 'pending',
      'Total Quizzes': studentQuizzes.length,
      'Avg Quiz Score (%)': avgQuiz,
      'Best Quiz Score (%)': studentQuizzes.length ? Math.max(...studentQuizzes.map(q => Number(q.percentage))).toFixed(1) : 'N/A',
      'Attendance Sessions': studentAttendance.length,
      'Avg Instructor Rating': avgRating,
      'Readiness Score (%)': enroll.readiness_score || 0,
      'Test Result': enroll.test_result || 'Pending',
    }
  })
}

// ── Build quiz detail report ──────────────────────────────────────────────────
function buildQuizReport(data) {
  return data.quizScores.map(q => ({
    'Student Name': q.profiles?.full_name || '',
    'Email': q.profiles?.email || '',
    'Score': q.score,
    'Total Questions': q.total,
    'Percentage (%)': Number(q.percentage).toFixed(1),
    'Result': Number(q.percentage) >= 70 ? 'PASS' : 'FAIL',
    'Date': new Date(q.completed_at).toLocaleDateString('en-ZA'),
    'Time': new Date(q.completed_at).toLocaleTimeString('en-ZA'),
  }))
}

// ── Build attendance report ───────────────────────────────────────────────────
function buildAttendanceReport(data) {
  return data.attendance.map(a => ({
    'Student Name': a.profiles?.full_name || '',
    'Email': a.profiles?.email || '',
    'Date': new Date(a.attended_at).toLocaleDateString('en-ZA'),
    'Time': new Date(a.attended_at).toLocaleTimeString('en-ZA'),
    'Method': a.method || 'manual',
    'Notes': a.notes || '',
  }))
}

// ── Build full multi-sheet report as ZIP of CSVs ──────────────────────────────
export async function downloadFullReport(schoolId, schoolName = 'School') {
  const data = await fetchReportData(schoolId)
  const date = new Date().toISOString().split('T')[0]

  // Student summary
  const studentRows = buildStudentReport(data)
  if (studentRows.length > 0) {
    downloadCSV(
      `${schoolName}_Students_${date}.csv`,
      toCSV(Object.keys(studentRows[0]), studentRows)
    )
  }

  // Small delay between downloads
  await new Promise(r => setTimeout(r, 500))

  // Quiz detail
  const quizRows = buildQuizReport(data)
  if (quizRows.length > 0) {
    downloadCSV(
      `${schoolName}_QuizScores_${date}.csv`,
      toCSV(Object.keys(quizRows[0]), quizRows)
    )
  }

  await new Promise(r => setTimeout(r, 500))

  // Attendance
  const attendRows = buildAttendanceReport(data)
  if (attendRows.length > 0) {
    downloadCSV(
      `${schoolName}_Attendance_${date}.csv`,
      toCSV(Object.keys(attendRows[0]), attendRows)
    )
  }

  return {
    students: studentRows.length,
    quizzes: quizRows.length,
    attendance: attendRows.length,
  }
}

// ── Report Export Button Component ────────────────────────────────────────────
export function ReportExportButton({ schoolId, schoolName }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleExport = async () => {
    setLoading(true); setResult(null)
    try {
      const res = await downloadFullReport(schoolId, schoolName || 'DriveLicenceLab')
      setResult(res)
    } catch (e) {
      console.error('Export error:', e)
    }
    setLoading(false)
  }

  return (
    <div>
      <NeuBtn
        color={T.green}
        onClick={handleExport}
        disabled={loading}
        icon={loading ? undefined : '📊'}
        full
      >
        {loading ? 'Generating Reports…' : 'Download Performance Reports (CSV)'}
      </NeuBtn>

      {result && (
        <div style={{ marginTop: 12, background: T.greenGlow, border: `1px solid ${T.green}44`, borderRadius: 12, padding: '12px 16px', fontSize: 13, color: T.green }}>
          ✅ Downloaded {result.students} student records, {result.quizzes} quiz scores, {result.attendance} attendance records across 3 CSV files.
          <div style={{ color: T.textSub, fontSize: 12, marginTop: 4 }}>Open in Excel, Google Sheets, or Numbers for full analysis.</div>
        </div>
      )}
    </div>
  )
}
