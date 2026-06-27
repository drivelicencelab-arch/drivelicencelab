import { T, GlassCard, NeuBtn, Alert } from '../ui.jsx'
import { useState } from 'react'

// ── Google Calendar API config ─────────────────────────────────────────────────
const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const GCAL_DISCOVERY = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'

// ── Load Google API script ────────────────────────────────────────────────────
function loadGapiScript() {
  return new Promise((resolve) => {
    if (window.gapi) { resolve(window.gapi); return }
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => resolve(window.gapi)
    document.head.appendChild(script)
  })
}

// ── Initialize GAPI client ────────────────────────────────────────────────────
async function initGapiClient(clientId) {
  const gapi = await loadGapiScript()
  await new Promise((resolve, reject) => {
    gapi.load('client:auth2', { callback: resolve, onerror: reject })
  })
  await gapi.client.init({
    clientId,
    scope: GCAL_SCOPE,
    discoveryDocs: [GCAL_DISCOVERY],
  })
  return gapi
}

// ── Add lesson event to Google Calendar ───────────────────────────────────────
export async function addLessonToGoogleCalendar({ clientId, lesson }) {
  try {
    const gapi = await initGapiClient(clientId)

    // Sign in if not already
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
      await gapi.auth2.getAuthInstance().signIn()
    }

    // Build event datetime
    const [year, month, day] = lesson.date.split('-').map(Number)
    const [startH, startM] = (lesson.startTime || '08:00').split(':').map(Number)
    const [endH, endM] = (lesson.endTime || '10:00').split(':').map(Number)

    const startDateTime = new Date(year, month - 1, day, startH, startM).toISOString()
    const endDateTime = new Date(year, month - 1, day, endH, endM).toISOString()

    const event = {
      summary: `🚗 DriveLicenceLab — ${lesson.slotName}`,
      description: `Your driving lesson with DriveLicenceLab.\n\nInstructor: ${lesson.instructorName || 'TBA'}\nSlot: ${lesson.slotName}\n\nPrepare: Bring your learner's licence and SA ID.\n\nView on DriveLicenceLab: https://drivelicencelab.co.za`,
      location: lesson.location || 'DriveLicenceLab Training Centre',
      start: { dateTime: startDateTime, timeZone: 'Africa/Johannesburg' },
      end: { dateTime: endDateTime, timeZone: 'Africa/Johannesburg' },
      colorId: '7', // Teal/Peacock
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 60 },
        ],
      },
      source: {
        title: 'DriveLicenceLab',
        url: 'https://drivelicencelab.co.za',
      },
    }

    const response = await gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    })

    return { success: true, eventId: response.result.id, eventLink: response.result.htmlLink }
  } catch (e) {
    console.error('Google Calendar error:', e)
    return { success: false, error: e.message || 'Google Calendar sync failed.' }
  }
}

// ── Add all lessons for an enrollment ────────────────────────────────────────
export async function syncAllLessonsToCalendar({ clientId, enrollments }) {
  const results = []
  for (const enrollment of enrollments) {
    if (!enrollment.time_slots) continue
    const slot = enrollment.time_slots

    // Generate next 4 lesson dates based on slot day
    const dayMap = { MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 0 }
    const targetDay = dayMap[slot.day] ?? 1
    const dates = []
    const today = new Date()
    let d = new Date(today)
    while (dates.length < 4) {
      if (d.getDay() === targetDay) dates.push(new Date(d))
      d.setDate(d.getDate() + 1)
    }

    for (const date of dates) {
      const r = await addLessonToGoogleCalendar({
        clientId,
        lesson: {
          date: date.toISOString().split('T')[0],
          startTime: slot.start_time,
          endTime: slot.end_time,
          slotName: slot.name,
          instructorName: enrollment.instructor_name || 'TBA',
        },
      })
      results.push({ date: date.toLocaleDateString('en-ZA'), ...r })
    }
  }
  return results
}

// ── Google Calendar Sync Button Component ─────────────────────────────────────
export function GoogleCalendarSync({ enrollments = [] }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Google Client ID — must be set by the admin in Google Cloud Console
  // For now we use a ICS file fallback which works without any API key
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  const handleSync = async () => {
    if (!GOOGLE_CLIENT_ID) {
      // Fallback: generate ICS file
      generateICSFile(enrollments)
      return
    }
    setLoading(true); setError('')
    const results = await syncAllLessonsToCalendar({ clientId: GOOGLE_CLIENT_ID, enrollments })
    const success = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    setResult({ success, failed, total: results.length })
    setLoading(false)
  }

  const generateICSFile = (enrollments) => {
    // ICS (iCalendar) works with Google Calendar, Outlook, Apple Calendar — no API needed
    const dayMap = { MONDAY: 'MO', TUESDAY: 'TU', WEDNESDAY: 'WE', THURSDAY: 'TH', FRIDAY: 'FR', SATURDAY: 'SA', SUNDAY: 'SU' }
    const dayNumMap = { MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 0 }

    const formatDate = (date, time) => {
      const [h, m] = (time || '08:00').split(':')
      const d = new Date(date)
      d.setHours(parseInt(h), parseInt(m), 0)
      return d.toISOString().replace(/[-:]/g, '').replace('.000', '')
    }

    const getNextDate = (dayName) => {
      const target = dayNumMap[dayName] ?? 1
      const today = new Date()
      const diff = (target - today.getDay() + 7) % 7 || 7
      const next = new Date(today)
      next.setDate(today.getDate() + diff)
      return next
    }

    let ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//DriveLicenceLab//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n`

    enrollments.forEach((enroll, i) => {
      if (!enroll.time_slots) return
      const slot = enroll.time_slots
      const startDate = getNextDate(slot.day)

      // Create 8 weekly recurring events
      for (let w = 0; w < 8; w++) {
        const eventDate = new Date(startDate)
        eventDate.setDate(startDate.getDate() + w * 7)
        const dateStr = eventDate.toISOString().split('T')[0]

        const dtStart = formatDate(dateStr, slot.start_time)
        const dtEnd = formatDate(dateStr, slot.end_time)
        const uid = `dllab-${i}-${w}-${Date.now()}@drivelicencelab.co.za`

        ics += `BEGIN:VEVENT\r\n`
        ics += `UID:${uid}\r\n`
        ics += `DTSTART;TZID=Africa/Johannesburg:${dtStart}\r\n`
        ics += `DTEND;TZID=Africa/Johannesburg:${dtEnd}\r\n`
        ics += `SUMMARY:🚗 DriveLicenceLab — ${slot.name}\r\n`
        ics += `DESCRIPTION:Driving lesson with DriveLicenceLab.\\nBring your learner's licence and SA ID.\\nView schedule: https://drivelicencelab.co.za\r\n`
        ics += `LOCATION:DriveLicenceLab Training Centre\r\n`
        ics += `BEGIN:VALARM\r\nTRIGGER:-PT60M\r\nACTION:DISPLAY\r\nDESCRIPTION:Driving lesson in 1 hour!\r\nEND:VALARM\r\n`
        ics += `BEGIN:VALARM\r\nTRIGGER:-PT15M\r\nACTION:DISPLAY\r\nDESCRIPTION:Driving lesson in 15 minutes!\r\nEND:VALARM\r\n`
        ics += `END:VEVENT\r\n`
      }
    })

    ics += `END:VCALENDAR`

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'drivelicencelab-lessons.ics'
    a.click()
    URL.revokeObjectURL(url)
    setResult({ success: enrollments.length, failed: 0, total: enrollments.length, ics: true })
  }

  if (enrollments.length === 0) return null

  return (
    <GlassCard glow={T.green} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>📅 Sync to Google Calendar</div>
          <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>Add your lessons to your calendar with reminders</div>
        </div>
      </div>

      <Alert msg={error} />

      {result ? (
        <div style={{ background: T.greenGlow, border: `1px solid ${T.green}44`, borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ color: T.green, fontWeight: 700, fontSize: 14 }}>
            {result.ics
              ? `✅ Calendar file downloaded! Open it to add ${result.success * 8} lessons to Google Calendar, Outlook or Apple Calendar.`
              : `✅ ${result.success} lessons synced to Google Calendar!`
            }
          </div>
          {result.ics && (
            <div style={{ color: T.textSub, fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>
              In Google Calendar: Click the + button → "Import" → select the downloaded .ics file
            </div>
          )}
        </div>
      ) : (
        <NeuBtn
          full
          color={T.green}
          onClick={handleSync}
          disabled={loading}
          icon={loading ? undefined : '📅'}
        >
          {loading ? 'Syncing…' : GOOGLE_CLIENT_ID ? 'Sync to Google Calendar' : 'Download Calendar File (.ics)'}
        </NeuBtn>
      )}
    </GlassCard>
  )
}
