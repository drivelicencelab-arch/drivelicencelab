# DriveLicenceLab v3 — Deployment Guide

## 🚀 What's New in v3

### Visual Features
- **3D Digital Twin** — Interactive car model that morphs based on student readiness score
- **Ambient Theme System** — UI color palette shifts dynamically with student progress
- **Interactive Skill Graph** — Road map of K53 skills with AI-suggested next steps
- **Session Snapshots** — Auto-generated SVG cards after each lesson

### Student Features
- **Performance Charts** — Quiz score trends, bar charts, readiness gauge
- **Weekly Leaderboard** — XP, quiz scores, instructor feedback rankings
- **Google Calendar Sync** — Download .ics file or sync directly to Google Calendar
- **Notification Bell** — In-app lesson reminders

### Admin Features
- **Bulk CSV Upload** — Import 100s of students at once
- **Report Export** — Download student, quiz, attendance data as CSV spreadsheets

### Infrastructure
- **Lesson Reminder Emails** — Automated 1-hour-before reminders via Resend
- **SEO Optimized** — Meta tags, sitemap, robots.txt, structured data
- **Fully Responsive** — Mobile, tablet, desktop with sidebar nav on desktop

---

## 📋 Deployment Steps

### 1. Run Database Schema
Supabase → SQL Editor → New Query → paste `schema_v3.sql` → Run

### 2. Upload Code to GitHub
Upload all files from this zip to your GitHub repo (replace existing files)

### 3. Deploy Edge Function (for email reminders)
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref zndagpsolooxqqvuegam

# Deploy the function
supabase functions deploy send-lesson-reminder
```

### 4. Add Secrets to Supabase
Supabase → Settings → Edge Functions → Add:
- `RESEND_API_KEY` = your Resend API key

### 5. Vercel Environment Variables
Add in Vercel → Settings → Environment Variables:
- `VITE_SUPABASE_URL` = https://zndagpsolooxqqvuegam.supabase.co
- `VITE_SUPABASE_ANON_KEY` = your anon key
- `VITE_GROQ_API_KEY` = your Groq API key (from console.groq.com)
- `VITE_GOOGLE_CLIENT_ID` = (optional) for direct Google Calendar sync

### 6. Redeploy on Vercel
Vercel → Deployments → Redeploy

---

## 🔑 Free Services Used
| Service | Purpose | Cost |
|---------|---------|------|
| Supabase | Database + Auth + Storage | Free |
| Vercel | Hosting | Free |
| Groq | AI Tutor (llama-3.3-70b) | Free |
| Resend | Emails (3000/month) | Free |
| Google Fonts | Poppins + Space Grotesk | Free |

---

## 📁 File Structure
```
src/
├── App.jsx                    — Root router + auth
├── AuthScreen.jsx             — Login/signup (all methods)
├── Onboarding.jsx             — Student setup flow
├── StudentApp.jsx             — Full student dashboard
├── InstructorApp.jsx          — Instructor portal
├── AdminApp.jsx               — School admin portal
├── TestOfficerApp.jsx         — Test officer portal
├── SystemAdminApp.jsx         — System admin portal
├── supabase.js                — Supabase client
├── ui.jsx                     — Design system + responsive shell
├── providers/
│   └── AmbientThemeProvider.jsx — Dynamic theme engine
├── components/
│   ├── visuals/
│   │   ├── DigitalTwin.jsx    — 3D/2D car model
│   │   └── SkillGraph.jsx     — Interactive skill road map
│   ├── charts/
│   │   └── PerformanceChart.jsx — Quiz trend charts
│   └── leaderboard/
│       └── WeeklyLeaderboard.jsx — Weekly rankings
└── services/
    ├── SnapshotService.js     — SVG session snapshots
    ├── NotificationService.js — Push + email notifications
    ├── BulkUpload.jsx         — CSV student import
    ├── ReportExport.js        — CSV report downloads
    └── GoogleCalendarSync.js  — Calendar integration (.ics)
supabase/
└── functions/
    └── send-lesson-reminder/
        └── index.ts           — Email reminder edge function
```
