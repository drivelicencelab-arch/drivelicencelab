import { supabase } from '../supabase.js'

// ── Supabase Edge Function caller ─────────────────────────────────────────────
async function callEdgeFunction(name, payload) {
  const { data, error } = await supabase.functions.invoke(name, { body: payload })
  if (error) throw error
  return data
}

// ── Schedule a 1-hour reminder for a lesson ───────────────────────────────────
export async function scheduleLesson1HourReminder({ studentId, studentEmail, studentName, slotName, slotDay, slotTime, sessionDate }) {
  try {
    // Store the reminder in the notifications table
    await supabase.from('notifications').insert({
      user_id: studentId,
      title: `⏰ Lesson in 1 hour — ${slotName}`,
      body: `Your ${slotName} driving lesson starts at ${slotTime} today. Make sure you're ready!`,
      type: 'reminder',
      read: false,
    })

    // Call edge function to send actual email
    // (Edge function handles the timing and Resend/SMTP email)
    await callEdgeFunction('send-lesson-reminder', {
      studentEmail,
      studentName,
      slotName,
      slotDay,
      slotTime,
      sessionDate,
    })

    return { success: true }
  } catch (e) {
    console.warn('Reminder scheduling error:', e)
    return { success: false, error: e.message }
  }
}

// ── Get unread notifications for a user ───────────────────────────────────────
export async function getNotifications(userId) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data || []
}

// ── Mark notification as read ─────────────────────────────────────────────────
export async function markRead(notificationId) {
  await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
}

// ── Mark all read ─────────────────────────────────────────────────────────────
export async function markAllRead(userId) {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
}

// ── Edge function code to deploy (exported as string for admin to copy) ───────
export const EDGE_FUNCTION_CODE = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { studentEmail, studentName, slotName, slotDay, slotTime, sessionDate } = await req.json()

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')

    const html = \`
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0D1117;color:#E6EDF3;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#009E9D,#00C9C8);padding:28px 24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900;">DriveLicenceLab</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Lesson Reminder</p>
        </div>
        <div style="padding:28px 24px;">
          <h2 style="color:#E6EDF3;font-size:18px;margin:0 0 8px;">⏰ Your lesson starts in 1 hour!</h2>
          <p style="color:#8B949E;line-height:1.7;margin:0 0 20px;">Hi <strong style="color:#E6EDF3">\${studentName}</strong>, just a friendly reminder that your driving lesson is coming up soon.</p>
          <div style="background:#161B22;border:1px solid #21262D;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:#8B949E;font-size:13px;">Lesson</span>
              <span style="color:#00C9C8;font-weight:700;font-size:13px;">\${slotName}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:#8B949E;font-size:13px;">Day</span>
              <span style="color:#E6EDF3;font-weight:700;font-size:13px;">\${slotDay}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#8B949E;font-size:13px;">Time</span>
              <span style="color:#E6EDF3;font-weight:700;font-size:13px;">\${slotTime}</span>
            </div>
          </div>
          <div style="text-align:center;">
            <a href="https://drivelicencelab.co.za" style="background:linear-gradient(135deg,#00C9C8,#009E9D);color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:700;font-size:14px;display:inline-block;">View My Schedule</a>
          </div>
        </div>
        <div style="background:#161B22;padding:16px 24px;text-align:center;border-top:1px solid #21262D;">
          <p style="color:#484F58;font-size:11px;margin:0;">© 2025 DriveLicenceLab · drivelicencelab.co.za</p>
        </div>
      </div>
    \`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${RESEND_API_KEY}\` },
      body: JSON.stringify({
        from: 'DriveLicenceLab <noreply@drivelicencelab.co.za>',
        to: [studentEmail],
        subject: \`⏰ Reminder: Your \${slotName} lesson is in 1 hour\`,
        html,
      })
    })

    if (!res.ok) throw new Error(\`Resend error: \${await res.text()}\`)

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
`
