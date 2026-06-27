-- ================================================================
-- DriveLicenceLab v3 Schema Update
-- Run in Supabase SQL Editor
-- ================================================================

-- ── Snapshot URL on sessions ──────────────────────────────────────
alter table sessions add column if not exists snapshot_url text;
alter table sessions add column if not exists skills_taught text[];
alter table sessions add column if not exists notes text;
alter table sessions add column if not exists session_date date;
alter table sessions add column if not exists student_name text;
alter table sessions add column if not exists instructor_name text;

-- ── Enrollment readiness + payment ───────────────────────────────
alter table enrollments add column if not exists readiness_score int default 0;
alter table enrollments add column if not exists payment_status text default 'pending';
alter table enrollments add column if not exists test_result text;

-- ── Profiles extra fields ─────────────────────────────────────────
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists licence_category text default 'Code 8';

-- ── Notifications ─────────────────────────────────────────────────
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  body text,
  read boolean default false,
  type text default 'info',
  created_at timestamptz default now()
);
alter table notifications enable row level security;
drop policy if exists "Users manage own notifications" on notifications;
create policy "Users manage own notifications" on notifications
  for all using (auth.uid() = user_id);

-- ── Issue tracker ─────────────────────────────────────────────────
create table if not exists issue_tracker (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references profiles(id) on delete set null,
  title text not null,
  description text,
  status text check (status in ('open','in_progress','resolved')) default 'open',
  priority text check (priority in ('low','medium','high','critical')) default 'medium',
  created_at timestamptz default now(),
  resolved_at timestamptz
);
alter table issue_tracker enable row level security;
drop policy if exists "Anyone can report issues" on issue_tracker;
drop policy if exists "System admins manage issues" on issue_tracker;
drop policy if exists "Reporters view own issues" on issue_tracker;
create policy "Anyone can report issues" on issue_tracker for insert with check (auth.uid() = reporter_id);
create policy "System admins manage issues" on issue_tracker for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'system_admin')
);
create policy "Reporters view own issues" on issue_tracker for select using (auth.uid() = reporter_id);

-- ── Test bookings ─────────────────────────────────────────────────
create table if not exists test_bookings (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade,
  test_officer_id uuid references profiles(id),
  test_date date not null,
  test_time time,
  test_center text not null,
  category text default 'Code 8',
  status text check (status in ('scheduled','passed','failed','cancelled')) default 'scheduled',
  notes text,
  completed_at timestamptz,
  created_at timestamptz default now()
);
alter table test_bookings enable row level security;
drop policy if exists "Test officers manage bookings" on test_bookings;
drop policy if exists "Students view own bookings" on test_bookings;
create policy "Test officers manage bookings" on test_bookings for all using (auth.uid() = test_officer_id);
create policy "Students view own bookings" on test_bookings for select using (auth.uid() = student_id);

-- ── Schools verified + region ─────────────────────────────────────
alter table schools add column if not exists verified boolean default false;
alter table schools add column if not exists region text;
alter table schools add column if not exists phone text;

-- ── Storage bucket for snapshots ──────────────────────────────────
insert into storage.buckets (id, name, public)
values ('session-snapshots', 'session-snapshots', true)
on conflict (id) do nothing;

create policy "Public read snapshots" on storage.objects
  for select using (bucket_id = 'session-snapshots');
create policy "Auth users upload snapshots" on storage.objects
  for insert with check (bucket_id = 'session-snapshots' and auth.role() = 'authenticated');

-- ── Leaderboard view ──────────────────────────────────────────────
create or replace view weekly_leaderboard as
select
  p.id as student_id,
  p.full_name,
  coalesce(x.xp_points, 0) as xp_points,
  coalesce(x.streak_days, 0) as streak_days,
  count(q.id) as quiz_count,
  coalesce(avg(q.percentage::numeric), 0)::numeric(5,2) as avg_quiz_score
from profiles p
left join student_xp x on x.student_id = p.id
left join quiz_scores q on q.student_id = p.id
  and q.completed_at >= date_trunc('week', now())
where p.role = 'student'
group by p.id, p.full_name, x.xp_points, x.streak_days
order by xp_points desc;

-- ── Attendance extra ──────────────────────────────────────────────
alter table attendance add column if not exists notes text;

-- Done
select 'DriveLicenceLab v3 schema applied!' as result;
