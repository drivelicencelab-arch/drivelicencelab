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
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured')

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0D1117;color:#E6EDF3;border-radius:16px;overflow:hidden;border:1px solid #21262D;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#009E9D,#00C9C8);padding:28px 24px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">🚗</div>
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900;letter-spacing:-0.5px;">DriveLicenceLab</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Lesson Reminder</p>
        </div>

        <!-- Body -->
        <div style="padding:28px 24px;">
          <h2 style="color:#E6EDF3;font-size:20px;margin:0 0 8px;">⏰ Your lesson starts in 1 hour!</h2>
          <p style="color:#8B949E;line-height:1.7;margin:0 0 24px;">
            Hi <strong style="color:#E6EDF3">${studentName}</strong>, this is a friendly reminder that your driving lesson is coming up very soon. Make sure you're ready!
          </p>

          <!-- Lesson card -->
          <div style="background:#161B22;border:1px solid #21262D;border-radius:14px;padding:20px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="color:#8B949E;font-size:13px;padding:6px 0;">📚 Lesson</td>
                <td style="color:#00C9C8;font-weight:700;font-size:13px;text-align:right;">${slotName}</td>
              </tr>
              <tr>
                <td style="color:#8B949E;font-size:13px;padding:6px 0;">📅 Day</td>
                <td style="color:#E6EDF3;font-weight:700;font-size:13px;text-align:right;">${slotDay}</td>
              </tr>
              <tr>
                <td style="color:#8B949E;font-size:13px;padding:6px 0;">🕐 Time</td>
                <td style="color:#E6EDF3;font-weight:700;font-size:13px;text-align:right;">${slotTime}</td>
              </tr>
            </table>
          </div>

          <!-- Tips -->
          <div style="background:rgba(0,201,200,0.08);border:1px solid rgba(0,201,200,0.2);border-radius:12px;padding:16px;margin-bottom:24px;">
            <p style="color:#00C9C8;font-weight:700;font-size:13px;margin:0 0 8px;">✅ Quick checklist:</p>
            <p style="color:#8B949E;font-size:13px;margin:0;line-height:1.8;">
              • Bring your learner's licence<br/>
              • Bring your SA ID document<br/>
              • Wear comfortable clothing<br/>
              • Arrive 5 minutes early
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align:center;">
            <a href="https://drivelicencelab.co.za" style="background:linear-gradient(135deg,#00C9C8,#009E9D);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 16px rgba(0,201,200,0.3);">
              View My Schedule →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#161B22;padding:20px 24px;text-align:center;border-top:1px solid #21262D;">
          <p style="color:#484F58;font-size:12px;margin:0;">© 2025 DriveLicenceLab · drivelicencelab.co.za</p>
          <p style="color:#484F58;font-size:11px;margin:6px 0 0;">You're receiving this because you're enrolled in a driving programme.</p>
        </div>
      </div>
    `

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'DriveLicenceLab <noreply@drivelicencelab.co.za>',
        to: [studentEmail],
        subject: `⏰ Reminder: Your ${slotName} lesson starts in 1 hour`,
        html,
      }),
    })

    if (!emailRes.ok) {
      const errText = await emailRes.text()
      throw new Error(`Resend API error: ${errText}`)
    }

    const emailData = await emailRes.json()

    return new Response(
      JSON.stringify({ success: true, messageId: emailData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-lesson-reminder error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
